// Navegacion lateral: resalta la seccion activa segun scroll, y maneja el menu movil
// (overlay + boton hamburguesa). Funcion agnostica de framework, reutilizada igual en la
// app en vivo y en el motor de exportacion standalone.
//
// La visibilidad de modulos/enlaces segun disponibilidad de datos la resuelve React de
// forma declarativa (ver components/layout/Sidebar.tsx), asi que aqui no hace falta
// portar el equivalente de "updateNavGroupVisibility" del proyecto original.
export function setActiveNav(id: string): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>(".nav a")];
  links.forEach((link) => {
    const active = !link.hidden && link.getAttribute("href") === `#${id}`;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

export function syncActiveNavToViewport(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>(".nav a")].filter((link) => !link.hidden);
  if (!links.length) return;
  const offset = window.matchMedia("(max-width:900px)").matches ? 132 : 86;
  let chosen = links[0];
  for (const link of links) {
    const id = link.getAttribute("href")?.slice(1);
    const section = id ? document.getElementById(id) : null;
    if (!section || section.hidden) continue;
    const rect = section.getBoundingClientRect();
    if (rect.top <= offset + 18) chosen = link;
    if (rect.top > offset + 18) break;
  }
  const href = chosen.getAttribute("href");
  if (href) setActiveNav(href.slice(1));
}

let navScrollTick = false;
export function scheduleActiveNavSync(): void {
  if (navScrollTick) return;
  navScrollTick = true;
  requestAnimationFrame(() => {
    navScrollTick = false;
    syncActiveNavToViewport();
  });
}

export function initNav(): void {
  const body = document.body;
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("mobileMenuBtn");
  const closeBtn = document.getElementById("mobileMenuClose");
  const overlay = document.getElementById("mobileMenuOverlay");

  function isMobile() {
    return window.matchMedia("(max-width:900px)").matches;
  }

  function setMobileMenu(open: boolean) {
    const active = !!open && isMobile();
    body.classList.toggle("menu-open", active);
    sidebar?.classList.toggle("sidebar-open", active);
    overlay?.classList.toggle("overlay-show", active);
    overlay?.setAttribute("aria-hidden", active ? "false" : "true");
    menuBtn?.setAttribute("aria-expanded", active ? "true" : "false");
    menuBtn?.setAttribute("aria-label", active ? "Cerrar menu de navegacion" : "Abrir menu de navegacion");
    if (active) closeBtn?.focus();
  }

  menuBtn?.addEventListener("click", () => setMobileMenu(!sidebar?.classList.contains("sidebar-open")));
  closeBtn?.addEventListener("click", () => {
    setMobileMenu(false);
    menuBtn?.focus();
  });
  overlay?.addEventListener("click", () => setMobileMenu(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar?.classList.contains("sidebar-open")) {
      setMobileMenu(false);
      menuBtn?.focus();
    }
  });
  window.addEventListener("resize", () => {
    if (!isMobile()) setMobileMenu(false);
    scheduleActiveNavSync();
  });
  window.addEventListener("scroll", scheduleActiveNavSync, { passive: true });
  // Delegados (no listeners por elemento): tanto los acordeones de modulo como los enlaces
  // del menu se montan/desmontan dinamicamente segun disponibilidad de datos (ver
  // ModuleAccordion.tsx y Sidebar.tsx), asi que no se puede asumir que ya existen al
  // llamar initNav() una sola vez al montar el shell.
  document.addEventListener("toggle", (e) => {
    if ((e.target as HTMLElement).matches?.("details.accordion")) scheduleActiveNavSync();
  }, true);
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>(".nav a");
    if (!a || a.hidden) return;
    const id = a.getAttribute("href")?.slice(1);
    const sec = id ? document.getElementById(id) : null;
    if (id) setActiveNav(id);
    sec?.querySelector("details.accordion")?.setAttribute("open", "");
    if (isMobile()) setMobileMenu(false);
    setTimeout(scheduleActiveNavSync, 380);
  });
  setActiveNav("carga");
  scheduleActiveNavSync();
}
