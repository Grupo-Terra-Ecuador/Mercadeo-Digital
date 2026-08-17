// Tooltip flotante compartido por todo el dashboard: cualquier elemento con atributo
// data-tip muestra su contenido en un recuadro que sigue al cursor. Funcion agnostica de
// framework: se inicializa una vez (app en vivo o motor de exportacion) y opera sobre
// cualquier DOM ya renderizado, sin importar si lo genero React o el clonado de export-html.
export function initTooltip(): void {
  const box = document.getElementById("tooltip");
  let active: HTMLElement | null = null;
  if (!box) return;

  function show(el: HTMLElement, e: MouseEvent) {
    const t = el.getAttribute("data-tip");
    if (!t) return;
    active = el;
    box!.textContent = t;
    box!.classList.add("tooltip-show");
    pos(e);
  }

  function hide() {
    active = null;
    box!.classList.remove("tooltip-show");
  }

  function pos(e: MouseEvent) {
    if (!active) return;
    const margin = 14;
    const gap = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = box!.getBoundingClientRect();
    let x = e.clientX + gap;
    let y = e.clientY - r.height - gap;
    if (x + r.width > vw - margin) x = vw - r.width - margin;
    if (x < margin) x = margin;
    if (y < margin) y = e.clientY + gap;
    if (y + r.height > vh - margin) y = vh - r.height - margin;
    box!.style.left = x + "px";
    box!.style.top = y + "px";
  }

  document.addEventListener("mouseover", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-tip]");
    if (el) show(el, e);
  });
  document.addEventListener("mousemove", (e) => {
    if (active) pos(e);
  });
  document.addEventListener("mouseout", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-tip]");
    if (el && !el.contains(e.relatedTarget as Node)) hide();
  });
  window.addEventListener("scroll", hide, true);
  window.addEventListener("resize", hide);
}
