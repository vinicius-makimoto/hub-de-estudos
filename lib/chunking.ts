export function chunkMaterial(source: string, maxChars = 1_400, overlapChars = 180) {
  const normalized = source.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 150_000);
  if (!normalized) return [];
  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < normalized.length) {
    let end = Math.min(cursor + maxChars, normalized.length);
    if (end < normalized.length) {
      const paragraphBreak = normalized.lastIndexOf("\n\n", end);
      const sentenceBreak = normalized.lastIndexOf(". ", end);
      const preferredBreak = Math.max(paragraphBreak, sentenceBreak);
      if (preferredBreak > cursor + Math.floor(maxChars * 0.55)) end = preferredBreak + (preferredBreak === sentenceBreak ? 1 : 0);
    }
    const chunk = normalized.slice(cursor, end).trim();
    if (chunk.length >= 80) chunks.push(chunk);
    if (end >= normalized.length) break;
    cursor = Math.max(end - overlapChars, cursor + 1);
  }
  return chunks;
}
