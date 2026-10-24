import JSZip from "jszip";
import { extractMaterialText } from "./material-extraction";

export class MaterialError extends Error {
  constructor(message: string, public status = 422) { super(message); }
}

const MAX_BYTES = 15 * 1024 * 1024;
const hosts = ["docs.google.com", "drive.google.com", "drive.usercontent.google.com", "googleusercontent.com", "1drv.ms", "onedrive.live.com", "sharepoint.com", "files.1drv.com", "storage.live.com"];

function isS3Host(hostname: string) {
  return /^(?:[a-z0-9][a-z0-9.-]*\.)?s3(?:[.-][a-z0-9-]+)*\.amazonaws\.com(?:\.cn)?$/.test(hostname);
}

function isFiapMaterialUrl(url: URL) {
  return url.hostname === "on1.fiap.com.br" && url.pathname.startsWith("/updown/upload_fiap/") && /\.(pdf|docx|pptx|txt|md)$/i.test(url.pathname);
}

// Rotating S3 signatures identify the same material. Only the deduplication
// key is normalized; the actual download and stored source retain the signature.
export function materialSourceKey(url: URL): string {
  const key = new URL(url);
  key.hash = "";
  if (isS3Host(key.hostname)) {
    for (const parameter of [...key.searchParams.keys()]) {
      if (/^x-amz-/i.test(parameter) || /^(AWSAccessKeyId|Signature|Expires)$/i.test(parameter)) key.searchParams.delete(parameter);
    }
    key.searchParams.sort();
  }
  if (isFiapMaterialUrl(key)) {
    for (const parameter of [...key.searchParams.keys()]) {
      if (/^(_gl|_ga|_ga_.+|_gcl_.+)$/.test(parameter)) key.searchParams.delete(parameter);
    }
  }
  return key.href;
}

export function validateMaterialUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new MaterialError("Link inválido. Informe uma URL completa.", 400); }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") ||
      !(isFiapMaterialUrl(url) || isS3Host(url.hostname) || hosts.some(host => url.hostname === host || (host !== "1drv.ms" && url.hostname.endsWith(`.${host}`))))) {
    throw new MaterialError("Use um link HTTPS do Google Drive, Google Slides, OneDrive/SharePoint, Amazon S3 ou de apostilas em on1.fiap.com.br/updown/upload_fiap/.", 400);
  }
  return url;
}

export function downloadUrl(url: URL): URL {
  const copy = new URL(url);
  if (copy.hostname === "docs.google.com") {
    const match = copy.pathname.match(/^\/(presentation|document)\/d\/([\w-]+)/);
    if (!match) throw new MaterialError("Este link do Google não é um documento ou apresentação compatível.");
    copy.pathname = `/${match[1]}/d/${match[2]}/export`;
    copy.search = match[1] === "presentation" ? "?format=pptx" : "?format=txt";
  } else if (copy.hostname === "drive.google.com") {
    const id = copy.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] ?? copy.searchParams.get("id");
    if (!id || !/^[\w-]+$/.test(id)) throw new MaterialError("Informe o link de um arquivo, não de uma pasta do Google Drive.");
    return new URL(`https://drive.usercontent.google.com/download?id=${id}&export=download`);
  } else if (copy.hostname.endsWith("sharepoint.com") || copy.hostname === "onedrive.live.com") {
    copy.searchParams.set("download", "1");
  }
  copy.hash = "";
  return copy;
}

export function chunksOf(text: string): string[] {
  const chunks: string[] = [];
  for (let offset = 0; offset < text.length; offset += 1400) chunks.push(text.slice(offset, offset + 1600));
  return chunks;
}

function decodeXml(text: string) {
  return text.replace(/&#(x[\da-f]+|\d+);/gi, (_, value: string) => {
    const code = value.startsWith("x") ? parseInt(value.slice(1), 16) : Number(value);
    return code <= 0x10ffff ? String.fromCodePoint(code) : " ";
  }).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

export async function extractText(buffer: Buffer, contentType: string): Promise<string> {
  if (buffer.subarray(0, 5).toString() === "%PDF-") {
    return extractMaterialText(new File([new Uint8Array(buffer)], "material.pdf", { type: "application/pdf" }));
  }
  if (buffer.subarray(0, 2).toString() === "PK") {
    const zip = await JSZip.loadAsync(buffer);
    // Bound total uncompressed content before extraction (including zip bombs).
    const entries = Object.values(zip.files) as Array<JSZip.JSZipObject & { _data?: { uncompressedSize?: number } }>;
    if (entries.reduce((size, file) => size + (file.dir ? 0 : (file._data?.uncompressedSize ?? MAX_BYTES)), 0) > 40 * 1024 * 1024) throw new MaterialError("Arquivo descompactado muito grande.");
    if (zip.file("word/document.xml")) return extractMaterialText(new File([new Uint8Array(buffer)], "material.docx"));
    const slides = entries.filter(file => /^ppt\/slides\/slide\d+\.xml$/.test(file.name)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    if (!slides.length) throw new MaterialError("Formato de arquivo não compatível. Use PDF, DOCX, PPTX ou TXT.");
    const text: string[] = [];
    for (const slide of slides) {
      const xml = await slide.async("string");
      text.push([...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map(match => decodeXml(match[1])).join("\n"));
    }
    return text.join("\n\n");
  }
  const raw = buffer.toString("utf8");
  if (/text\/html/i.test(contentType) || /^\s*<(?:!doctype|html)/i.test(raw)) throw new MaterialError("O link retornou uma página de acesso ou visualização. Verifique o compartilhamento público e use o link do arquivo.");
  if (!/^(text\/plain|text\/markdown)/i.test(contentType) || raw.includes("\0")) throw new MaterialError("Não foi possível extrair texto deste formato. Use PDF, DOCX, PPTX ou TXT.");
  return raw;
}

export async function importExternalMaterial(value: string) {
  let url = downloadUrl(validateMaterialUrl(value));
  const signal = AbortSignal.timeout(25_000);
  for (let redirects = 0; redirects <= 6; redirects++) {
    validateMaterialUrl(url.href);
    const response = await fetch(url, { redirect: "manual", signal, cache: "no-store", headers: { Accept: "*/*" } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new MaterialError("O link está inacessível.");
      const target = validateMaterialUrl(new URL(location, url).href);
      // Short OneDrive links resolve to a viewer; request its public download.
      url = url.hostname === "1drv.ms" ? downloadUrl(target) : target;
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      if (isS3Host(url.hostname) && (response.status === 400 || response.status === 401 || response.status === 403)) {
        throw new MaterialError("O link do Amazon S3 está expirado, inválido ou sem permissão de acesso. Gere um novo link na plataforma de origem e tente novamente.");
      }
      throw new MaterialError(response.status === 401 || response.status === 403 ? "Material privado. Ative o acesso para qualquer pessoa com o link." : "Link inválido ou inacessível. Confira o endereço e as permissões.");
    }
    if (Number(response.headers.get("content-length")) > MAX_BYTES) { await response.body?.cancel(); throw new MaterialError("O material excede o limite de 15 MB."); }
    const reader = response.body?.getReader();
    if (!reader) throw new MaterialError("O material não contém conteúdo acessível.");
    const parts: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value: part } = await reader.read();
        if (done) break;
        size += part.byteLength;
        if (size > MAX_BYTES) { await reader.cancel(); throw new MaterialError("O material excede o limite de 15 MB."); }
        parts.push(part);
      }
    } finally { reader.releaseLock(); }
    const text = (await extractText(Buffer.concat(parts), response.headers.get("content-type") ?? "")).replace(/\r/g, "").trim();
    if (text.replace(/\s/g, "").length < 80) throw new MaterialError("O material não possui texto suficiente para RAG. Arquivos digitalizados precisam de OCR.");
    if (text.length > 150_000) throw new MaterialError("O texto excede o limite de 150 mil caracteres.");
    return text;
  }
  throw new MaterialError("O link redirecionou muitas vezes e não pôde ser acessado.");
}
