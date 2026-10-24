/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness transpiles TypeScript without adding a runner. */
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
// The production module is server-only; this Node harness runs outside React.
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function(request, ...args) { return request === 'server-only' ? {} : originalLoad.call(this, request, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { validateMaterialUrl, materialSourceKey, downloadUrl, extractText, importExternalMaterial, chunksOf } = require('../lib/external-material.ts');
const JSZip = require('jszip');
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

test('rejects invalid, insecure and deceptive hosts', () => {
  for (const url of ['bad', 'http://drive.google.com/a', 'https://localhost/a', 'https://drive.google.com.evil.test/a', 'https://user:pass@drive.google.com/a', 'https://drive.google.com:444/a']) assert.throws(() => validateMaterialUrl(url));
});
test('normalizes Google Slides and Drive file links', () => {
  assert.equal(downloadUrl(validateMaterialUrl('https://docs.google.com/presentation/d/abc/edit')).href, 'https://docs.google.com/presentation/d/abc/export?format=pptx');
  assert.equal(downloadUrl(validateMaterialUrl('https://drive.google.com/file/d/abc/view')).searchParams.get('id'), 'abc');
});
test('accepts S3 bucket, regional and path endpoints while rejecting deceptive hosts', () => {
  for (const host of ['fiapupdown.s3.amazonaws.com', 'bucket.s3.us-east-1.amazonaws.com', 'bucket.s3-us-west-2.amazonaws.com', 's3.amazonaws.com', 'bucket.s3.dualstack.us-east-1.amazonaws.com']) assert.equal(validateMaterialUrl(`https://${host}/material.pdf`).hostname, host);
  for (const host of ['s3.amazonaws.com.evil.test', 'evilamazonaws.com', 's3.evil.test', 'amazonaws.com', 'ec2.us-east-1.amazonaws.com']) assert.throws(() => validateMaterialUrl(`https://${host}/material.pdf`));
});
test('accepts FIAP PDF links with analytics parameters and preserves the download URL', async () => {
  const url = 'https://on1.fiap.com.br/updown/upload_fiap/alunos/apostilas/AIE_AMI_06_Multimodal_HITL-Paulo_Caixeta.pdf?_gl=1*test*_ga*analytics';
  assert.equal(downloadUrl(validateMaterialUrl(url)).href, url);
  assert.equal(materialSourceKey(new URL(url)), url.split('?')[0]);
  global.fetch = async (target) => {
    assert.equal(target.href, url);
    return new Response('Conteúdo público da apostila com texto suficiente para processamento. '.repeat(3), { headers: { 'content-type': 'text/plain' } });
  };
  assert.match(await importExternalMaterial(url), /Conteúdo público/);
});
test('FIAP support does not allow login pages, other paths or lookalike domains', () => {
  for (const url of ['https://on1.fiap.com.br/login', 'https://on1.fiap.com.br/other/test.pdf', 'https://on1.fiap.com.br/updown/upload_fiap/login.html', 'https://on1.fiap.com.br.evil.test/updown/upload_fiap/test.pdf', 'http://on1.fiap.com.br/updown/upload_fiap/test.pdf']) assert.throws(() => validateMaterialUrl(url));
});
test('preserves signed URL path, parameter encoding and signature when downloading', async () => {
  const signed = 'https://fiapupdown.s3.amazonaws.com/apostila%20%281%29.pdf?X-Amz-Credential=example%2F20261021%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=example&X-Amz-Security-Token=a%2Bb%2Fc%3D&X-Amz-Expires=2400';
  assert.equal(downloadUrl(validateMaterialUrl(signed)).href, signed);
  global.fetch = async (url) => {
    assert.equal(url.href, signed);
    return new Response('Material de estudo com texto selecionável e suficiente para indexar no chat. '.repeat(3), { headers: { 'content-type': 'text/plain' } });
  };
  assert.match(await importExternalMaterial(signed), /Material de estudo/);
});
test('renewed S3 signatures reuse the material key without changing the download URL', () => {
  const first = new URL('https://fiapupdown.s3.amazonaws.com/a.pdf?versionId=1&X-Amz-Signature=old&X-Amz-Date=20261021T000000Z');
  const renewed = new URL('https://fiapupdown.s3.amazonaws.com/a.pdf?X-Amz-Signature=new&versionId=1&X-Amz-Date=20261022T000000Z');
  assert.equal(materialSourceKey(first), materialSourceKey(renewed));
  assert.equal(first.searchParams.get('X-Amz-Signature'), 'old');
  assert.notEqual(materialSourceKey(first), materialSourceKey(new URL('https://fiapupdown.s3.amazonaws.com/a.pdf?versionId=2')));
});
test('denied or expired S3 links explain how to obtain a new link', async () => {
  global.fetch = async () => new Response('<Error><Code>AccessDenied</Code></Error>', { status: 403 });
  await assert.rejects(importExternalMaterial('https://fiapupdown.s3.amazonaws.com/a.pdf?X-Amz-Signature=expired'), /Gere um novo link/);
});
test('extracts slide text in numeric order and decodes XML', async () => {
  const zip = new JSZip();
  zip.file('ppt/slides/slide10.xml', '<a:t>Último</a:t>');
  zip.file('ppt/slides/slide2.xml', '<a:t>Ciência &amp; estudo</a:t>');
  assert.equal(await extractText(await zip.generateAsync({ type: 'nodebuffer' }), ''), 'Ciência & estudo\n\nÚltimo');
});
test('extracts DOCX document text', async () => {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Conteúdo de estudo</w:t></w:r></w:p></w:body></w:document>');
  assert.match(await extractText(await zip.generateAsync({ type: 'nodebuffer' }), ''), /Conteúdo de estudo/);
});
test('extracts text from a PDF with a text layer', async () => {
  const stream = 'BT /F1 12 Tf 40 150 Td (Material de estudo sobre ciencias naturais) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const [i, object] of objects.entries()) { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; }
  const start = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => String(offset).padStart(10, '0') + ' 00000 n ').join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  assert.match(await extractText(Buffer.from(pdf), 'application/pdf'), /Material de estudo/);
});
test('rejects HTML login pages and unsupported binaries', async () => {
  await assert.rejects(extractText(Buffer.from('<html>Login</html>'), 'text/html'));
  await assert.rejects(extractText(Buffer.from([0, 1, 2]), 'application/octet-stream'));
});
test('imports public text without sending credentials', async () => {
  global.fetch = async (_, options) => {
    assert.equal(options.redirect, 'manual');
    assert.equal(options.headers.Authorization, undefined);
    return new Response('Texto público de estudo com conteúdo suficiente para processamento. '.repeat(3), { headers: { 'content-type': 'text/plain' } });
  };
  assert.match(await importExternalMaterial('https://drive.google.com/file/d/abc/view'), /Texto público/);
});
test('rejects private, empty and oversized materials', async () => {
  for (const response of [new Response('', { status: 403 }), new Response(' ', { headers: { 'content-type': 'text/plain' } }), new Response('x', { headers: { 'content-length': String(16 * 1024 * 1024) } })]) {
    global.fetch = async () => response;
    await assert.rejects(importExternalMaterial('https://drive.google.com/file/d/abc/view'));
  }
});
test('checks redirects before fetching destination', async () => {
  let calls = 0;
  global.fetch = async () => { calls++; return new Response('', { status: 302, headers: { location: 'https://127.0.0.1/private' } }); };
  await assert.rejects(importExternalMaterial('https://1drv.ms/test'));
  assert.equal(calls, 1);
});
test('chunks preserve overlap and stay bounded', () => {
  const text = 'a'.repeat(3500);
  const chunks = chunksOf(text);
  assert.equal(chunks.length, 3);
  assert.ok(chunks.every(chunk => chunk.length <= 1600));
  assert.equal(chunks[0].slice(-200), chunks[1].slice(0, 200));
});
