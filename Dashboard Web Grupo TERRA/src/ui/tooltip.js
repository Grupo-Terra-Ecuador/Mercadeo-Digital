// Tooltip flotante compartido por todo el dashboard: cualquier elemento con clase
// .tip/.tiplink y atributo data-tip muestra su contenido en un recuadro que sigue al cursor.
export function initTooltip() {
  const box = document.getElementById('tooltip');
  let active = null;
  if (!box) return;

  function show(el, e) {
    const t = el.getAttribute('data-tip');
    if (!t) return;
    active = el;
    box.textContent = t;
    box.classList.add('show');
    pos(e);
  }

  function hide() {
    active = null;
    box.classList.remove('show');
  }

  function pos(e) {
    if (!active) return;
    const margin = 14;
    const gap = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = box.getBoundingClientRect();
    let x = e.clientX + gap;
    let y = e.clientY - r.height - gap;
    if (x + r.width > vw - margin) x = vw - r.width - margin;
    if (x < margin) x = margin;
    if (y < margin) y = e.clientY + gap;
    if (y + r.height > vh - margin) y = vh - r.height - margin;
    box.style.left = x + 'px';
    box.style.top = y + 'px';
  }

  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('.tip,.tiplink');
    if (el) show(el, e);
  });
  document.addEventListener('mousemove', (e) => {
    if (active) pos(e);
  });
  document.addEventListener('mouseout', (e) => {
    const el = e.target.closest('.tip,.tiplink');
    if (el && !el.contains(e.relatedTarget)) hide();
  });
  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
}
