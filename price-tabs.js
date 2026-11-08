/* Progressive enhancement: readable category pages with normal anchor fallback. */
(() => {
  const pricing = document.querySelector('#preise');
  const nav = pricing?.querySelector('.price-nav, .price-category-nav');
  if (!nav) return;
  const entries = [...nav.querySelectorAll('a[href^="#"]')].map((tab) => ({
    tab, panel: document.getElementById(tab.getAttribute('href').slice(1))
  })).filter(({panel}) => panel && pricing.contains(panel));
  if (entries.length < 2) return;
  const select = (entry, focus = false) => {
    for (const candidate of entries) {
      const active = candidate === entry;
      candidate.tab.setAttribute('aria-selected', String(active));
      candidate.tab.tabIndex = active ? 0 : -1;
      candidate.panel.hidden = !active;
    }
    if (focus) entry.tab.focus();
  };
  nav.setAttribute('role', 'tablist');
  for (const [index, entry] of entries.entries()) {
    entry.tab.id ||= 'price-tab-' + index;
    entry.tab.setAttribute('role', 'tab');
    entry.tab.setAttribute('aria-controls', entry.panel.id);
    entry.panel.setAttribute('role', 'tabpanel');
    entry.panel.setAttribute('aria-labelledby', entry.tab.id);
    entry.panel.tabIndex = 0;
    entry.tab.addEventListener('click', (event) => {
      event.preventDefault();
      select(entry);
      history.replaceState(null, '', '#' + entry.panel.id);
    });
    entry.tab.addEventListener('keydown', (event) => {
      let next;
      const direction = document.documentElement.dir === 'rtl' ? -1 : 1;
      if (event.key === 'ArrowRight') next = (index + direction + entries.length) % entries.length;
      if (event.key === 'ArrowLeft') next = (index - direction + entries.length) % entries.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = entries.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(entries[next], true);
      history.replaceState(null, '', '#' + entries[next].panel.id);
    });
  }
  const fromHash = () => {
    const target = document.getElementById(location.hash.slice(1));
    return entries.find(({panel}) => panel === target || panel.contains(target));
  };
  select(fromHash() || entries[0]);
  addEventListener('hashchange', () => {
    const entry = fromHash();
    if (!entry) return;
    select(entry);
    requestAnimationFrame(() => pricing.scrollIntoView({block:'start'}));
  });
  pricing.classList.add('has-price-tabs');
})();
