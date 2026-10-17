import "server-only";

const acceptedExtensions = [".txt", ".md", ".pdf", ".docx"];

export function isAcceptedMaterial(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return acceptedExtensions.some((extension) => lowerName.endsWith(extension));
}

export async function extractMaterialText(file: File) {
  const lowerName = file.name.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();

  if (lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
    return new TextDecoder("utf-8").decode(arrayBuffer);
  }

  if (lowerName.endsWith(".pdf")) {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
    const result = await extractText(pdf, { mergePages: false });
    const pages = Array.isArray(result.text) ? result.text : [result.text];
    return pages.map((page, index) => `[Página ${index + 1}]\n${page.trim()}`).join("\n\n");
  }

  if (lowerName.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
    return result.value;
  }

  throw new Error("Formato de arquivo não suportado.");
}
