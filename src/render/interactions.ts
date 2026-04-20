// Hover-to-isolate + tooltip JS, injected into every output template.

export const interactionsJs = `
function setupInteractions(svg, paths, cards) {
  const tip = document.getElementById('tip');
  Object.keys(cards).forEach((id) => {
    const card = cards[id];
    card.addEventListener('mouseenter', () => {
      const involved = new Set([id]);
      paths.forEach((p) => {
        if (p.from === id || p.to === id) {
          involved.add(p.from); involved.add(p.to);
          p.el.classList.add('path-hi'); p.el.classList.remove('path-dim');
        } else {
          p.el.classList.add('path-dim'); p.el.classList.remove('path-hi');
        }
      });
      Object.keys(cards).forEach((cid) => {
        if (!involved.has(cid)) cards[cid].classList.add('dimmed');
        else cards[cid].classList.remove('dimmed');
      });
    });
    card.addEventListener('mouseleave', () => {
      Object.keys(cards).forEach((cid) => cards[cid].classList.remove('dimmed'));
      paths.forEach((p) => p.el.classList.remove('path-hi', 'path-dim'));
    });
  });
  paths.forEach((p) => {
    p.el.style.pointerEvents = 'stroke';
    p.el.addEventListener('mouseenter', () => { tip.textContent = p.label; tip.style.display = 'block'; });
    p.el.addEventListener('mousemove', (e) => { tip.style.left = (e.clientX + 14) + 'px'; tip.style.top = (e.clientY - 10) + 'px'; });
    p.el.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  });
}
`.trim();

export const tooltipCss = `
#tip { position:fixed; background:rgba(9,13,28,0.97); border:1px solid rgba(0,200,255,0.3);
  border-radius:8px; padding:7px 11px; font-size:10px; color:#00d4ff;
  pointer-events:none; z-index:200; display:none; max-width:260px; }
`.trim();
