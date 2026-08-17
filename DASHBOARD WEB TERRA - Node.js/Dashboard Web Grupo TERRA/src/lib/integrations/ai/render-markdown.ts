import { esc } from "../../core/format";

// Conversion minima de Markdown (listas con guiones + negritas) a HTML. El texto de
// entrada siempre pasa primero por esc(): aunque viene de la IA y no de un usuario que
// edite el DOM, se escapa igual antes de interpretar la sintaxis, nunca despues.
export function renderInsightMarkdown(text: string): string {
  const escaped = esc(text || "");
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  const lines = withBold.split("\n");
  let html = "";
  let inList = false;
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) {
        html += '<ul class="ml-4 list-disc space-y-1">';
        inList = true;
      }
      html += `<li>${trimmed.replace(/^[-*]\s+/, "")}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      if (trimmed) html += `<p class="mt-2 first:mt-0">${trimmed}</p>`;
    }
  });
  if (inList) html += "</ul>";
  return html || "<p>Sin contenido.</p>";
}
