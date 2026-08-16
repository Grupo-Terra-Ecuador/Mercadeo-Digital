// Navegacion lateral: resalta la seccion activa segun scroll, oculta grupos de menu sin
// enlaces visibles, y maneja el menu movil (overlay + boton hamburguesa).
export function setActiveNav(id) {
  const links = [...document.querySelectorAll('.nav a')];
  links.forEach((link) => {
    const active = !link.hidden && link.getAttribute('href') === `#${id}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

export function syncActiveNavToViewport() {
  const links = [...document.querySelectorAll('.nav a')].filter((link) => !link.hidden);
  if (!links.length) return;
  const offset = window.matchMedia('(max-width:900px)').matches ? 132 : 86;
  let chosen = links[0];
  for (const link of links) {
    const id = link.getAttribute('href')?.slice(1);
    const section = id ? document.getElementById(id) : null;
    if (!section || section.hidden) continue;
    const rect = section.getBoundingClientRect();
    if (rect.top <= offset + 18) chosen = link;
    if (rect.top > offset + 18) break;
  }
  setActiveNav(chosen.getAttribute('href').slice(1));
}

let navScrollTick = false;
export function scheduleActiveNavSync() {
  if (navScrollTick) return;
  navScrollTick = true;
  requestAnimationFrame(() => {
    navScrollTick = false;
    syncActiveNavToViewport();
  });
}

export function updateNavGroupVisibility() {
  document.querySelectorAll('.nav .navlabel').forEach((label) => {
    let item = label.nextElementSibling;
    let hasVisibleLink = false;
    while (item && !item.classList.contains('navlabel')) {
      if (item.matches?.('a') && !item.hidden) {
        hasVisibleLink = true;
        break;
      }
      item = item.nextElementSibling;
    }
    label.hidden = !hasVisibleLink;
  });
}

export function initNav() {
  const body = document.body;
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('mobileMenuBtn');
  const closeBtn = document.getElementById('mobileMenuClose');
  const overlay = document.getElementById('mobileMenuOverlay');

  function isMobile() {
    return window.matchMedia('(max-width:900px)').matches;
  }

  function setMobileMenu(open) {
    const active = !!open && isMobile();
    body.classList.toggle('menu-open', active);
    sidebar?.classList.toggle('open', active);
    overlay?.classList.toggle('show', active);
    overlay?.setAttribute('aria-hidden', active ? 'false' : 'true');
    menuBtn?.setAttribute('aria-expanded', active ? 'true' : 'false');
    menuBtn?.setAttribute('aria-label', active ? 'Cerrar menu de navegacion' : 'Abrir menu de navegacion');
    if (active) closeBtn?.focus();
  }

  menuBtn?.addEventListener('click', () => setMobileMenu(!sidebar?.classList.contains('open')));
  closeBtn?.addEventListener('click', () => {
    setMobileMenu(false);
    menuBtn?.focus();
  });
  overlay?.addEventListener('click', () => setMobileMenu(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar?.classList.contains('open')) {
      setMobileMenu(false);
      menuBtn?.focus();
    }
  });
  window.addEventListener('resize', () => {
    if (!isMobile()) setMobileMenu(false);
    scheduleActiveNavSync();
  });
  window.addEventListener('scroll', scheduleActiveNavSync, { passive: true });
  document.querySelectorAll('details.accordion').forEach((d) => d.addEventListener('toggle', scheduleActiveNavSync));
  document.querySelectorAll('.nav a').forEach((a) =>
    a.addEventListener('click', () => {
      if (a.hidden) return;
      const id = a.getAttribute('href')?.slice(1);
      const sec = id ? document.getElementById(id) : null;
      setActiveNav(id);
      sec?.querySelector('details.accordion')?.setAttribute('open', '');
      if (isMobile()) setMobileMenu(false);
      setTimeout(scheduleActiveNavSync, 380);
    })
  );
  setActiveNav('carga');
  scheduleActiveNavSync();
}
