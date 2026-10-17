const REVIEW_HEADING = /^(conceitos?(?:\s+principais)?|gloss[aá]rio|pontos?(?:\s+importantes?)?(?:\s+(?:para|de)\s+prova)?|flashcards?|quiz|question[aá]rio)$/i;

/** Removes review sections duplicated inside legacy Markdown.
 * The structured fields are rendered afterwards by StudyTools, in the correct order.
 */
export function withoutEmbeddedReview(content: string, hasStructuredReview: boolean) {
  if (!hasStructuredReview) return content;

  const contentMarker = "---CONTEUDO---";
  if (content.includes(contentMarker)) return content.slice(content.lastIndexOf(contentMarker) + contentMarker.length).trim();

  const lines = content.split("\n");
  const output: string[] = [];
  let skippedLevel: number | null = null;
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2].replace(/[*_`]/g, "").trim();
      if (REVIEW_HEADING.test(title)) { skippedLevel = level; continue; }
      if (skippedLevel != null && level <= skippedLevel) skippedLevel = null;
    }
    if (skippedLevel == null) output.push(line);
  }
  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
