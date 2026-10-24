/* eslint-disable @typescript-eslint/no-require-imports -- Node harness for TypeScript modules. */
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function(name, ...args) { return name === 'server-only' ? {} : originalLoad.call(this, name, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { generateStudyMaterial, parseStoredStudyMaterial } = require('../lib/groq.ts');
const originalFetch = global.fetch;
const environment = { GROQ_API_KEY: process.env.GROQ_API_KEY, OPENAI_API_KEY: process.env.OPENAI_API_KEY };
afterEach(() => {
  global.fetch = originalFetch;
  for (const [key, value] of Object.entries(environment)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
});
const source = 'A memória episódica registra experiências e eventos. A memória semântica organiza conhecimentos e conceitos para consulta.';
const repeat = (count, value) => Array.from({ length: count }, (_, i) => value(i));
function material() {
  return {
    conteudo: '## Memória\nA memória episódica registra experiências.', descricao: 'Tipos de memória.',
    temas: repeat(6, i => `Tema ${i}`), conceitos: repeat(8, i => ({ titulo: `Conceito ${i}`, descricao: 'Definição da fonte.' })),
    glossario: repeat(15, i => ({ termo: `Termo ${i}`, definicao: 'Definição da fonte.' })), pontos_prova: repeat(6, i => `Ponto ${i}`),
    flashcards: repeat(8, i => ({ frente: `Pergunta ${i}`, verso: 'Resposta da fonte.' })),
    quiz: repeat(6, i => ({ pergunta: `Questão ${i}`, opcoes: ['A', 'B', 'C', 'D'], correta: 0, explicacao: 'Conforme a fonte.' })),
  };
}
function openAI(value) { return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] }); }
function keys(groq = false) { delete process.env.GROQ_API_KEY; if (groq) process.env.GROQ_API_KEY = 'mock-groq'; process.env.OPENAI_API_KEY = 'mock-openai'; }

test('complete material returns without requesting a repair', async () => {
  keys(); let calls = 0;
  global.fetch = async (_, options) => {
    calls++; const body = JSON.parse(options.body);
    assert.equal(body.text.format.strict, true);
    assert.equal(body.text.format.schema.properties.glossario.maxItems, 30);
    return openAI(material());
  };
  assert.equal((await generateStudyMaterial('Memória', source)).quiz.length, 6);
  assert.equal(calls, 1);
});
test('repairs missing resources once with specific field names and the original source', async () => {
  keys(); let calls = 0; const partial = material(); delete partial.glossario; partial.quiz = [];
  global.fetch = async (_, options) => {
    calls++;
    if (calls === 1) return openAI(partial);
    const body = JSON.parse(options.body);
    assert.match(body.input.at(-1).content, /glossário, quiz/);
    assert.ok(body.input.some(message => message.content.includes(source)));
    return openAI(material());
  };
  assert.equal((await generateStudyMaterial('Memória', source)).glossario.length, 15);
  assert.equal(calls, 2);
});
test('does not accept partial material or retry indefinitely', async () => {
  keys(); let calls = 0;
  global.fetch = async () => { calls++; return openAI({ conteudo: 'Texto válido, mas sem recursos.' }); };
  await assert.rejects(generateStudyMaterial('Memória', source), /após a correção automática.*quiz.*Nenhum campo/);
  assert.equal(calls, 2);
});
test('Groq truncation triggers OpenAI fallback', async () => {
  keys(true); const calls = [];
  global.fetch = async (url) => {
    calls.push(url);
    return url.includes('groq.com') ? Response.json({ choices: [{ finish_reason: 'length', message: { content: '{"conteudo":"incompleto' } }] }) : openAI(material());
  };
  assert.ok((await generateStudyMaterial('Memória', source)).conteudo);
  assert.equal(calls.length, 2);
});
test('incomplete Groq and OpenAI resources can be repaired', async () => {
  keys(true); let calls = 0;
  global.fetch = async (url) => {
    calls++;
    if (url.includes('groq.com')) return Response.json({ choices: [{ message: { content: JSON.stringify({ conteudo: 'Texto parcial.' }) } }] });
    return calls === 2 ? openAI({ conteudo: 'Texto parcial.' }) : openAI(material());
  };
  assert.ok((await generateStudyMaterial('Memória', source)).quiz.length);
  assert.equal(calls, 3);
});
test('OpenAI refusal is not retried as a formatting problem', async () => {
  keys(); let calls = 0;
  global.fetch = async () => { calls++; return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'Recusado.' }] }] }); };
  await assert.rejects(generateStudyMaterial('Memória', source), /recusou/);
  assert.equal(calls, 1);
});
test('OpenAI token exhaustion is reported explicitly', async () => {
  keys(); let calls = 0;
  global.fetch = async () => { calls++; return Response.json({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }); };
  await assert.rejects(generateStudyMaterial('Memória', source), /limite de saída/);
  assert.equal(calls, 1);
});
test('parser rejects blank resources and invalid quiz answers', () => {
  const data = material();
  data.flashcards = [{ frente: ' ', verso: ' ' }];
  assert.equal(parseStoredStudyMaterial(JSON.stringify(data)), null);
  data.flashcards = material().flashcards;
  data.quiz = [{ pergunta: 'Questão', opcoes: ['A', 'B', 'C', 'D'], correta: 4, explicacao: 'Inválido' }];
  assert.equal(parseStoredStudyMaterial(JSON.stringify(data)), null);
});
test('malformed JSON is rejected and markdown fences can be recovered', () => {
  assert.equal(parseStoredStudyMaterial('{"conteudo":'), null);
  assert.ok(parseStoredStudyMaterial('```json\n' + JSON.stringify(material()) + '\n```'));
});
