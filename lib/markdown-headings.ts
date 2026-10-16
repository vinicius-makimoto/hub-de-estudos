export type MarkdownHeading = { level: number; text: string; id: string };

function cleanHeadingText(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\s+#+\s*$/, "")
    .trim();
}

export function slugifyHeading(value: string) {
  return cleanHeadingText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "secao";
}

export function extractMarkdownHeadings(content: string, prefix: string): MarkdownHeading[] {
  const occurrences = new Map<string, number>();
  return content.split("\n").flatMap((line): MarkdownHeading[] => {
    const match = line.match(/^(#{1,4})\s+(.+?)\s*$/);
    if (!match) return [];
    const text = cleanHeadingText(match[2]);
    if (!text || /^(temas?|conte[uú]do)$/i.test(text) || /^material\s*:/i.test(text)) return [];
    const slug = slugifyHeading(text);
    const occurrence = (occurrences.get(slug) ?? 0) + 1;
    occurrences.set(slug, occurrence);
    return [{ level: match[1].length, text, id: `${prefix}-${slug}${occurrence > 1 ? `-${occurrence}` : ""}` }];
  });
}
