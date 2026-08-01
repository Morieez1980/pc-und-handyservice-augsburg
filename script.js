const header = document.querySelector('[data-header]');
const toggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
const toggleLabel = toggle?.querySelector('.sr-only');

const closeNav = () => {
  nav?.classList.remove('open');
  document.body.classList.remove('nav-open');
  toggle?.setAttribute('aria-expanded', 'false');
  if (toggleLabel) toggleLabel.textContent = 'Menü öffnen';
};

toggle?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('nav-open', isOpen);
  if (toggleLabel) toggleLabel.textContent = isOpen ? 'Menü schließen' : 'Menü öffnen';
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav?.classList.contains('open')) {
    closeNav();
    toggle?.focus();
  }
});
const desktopQuery = window.matchMedia('(min-width: 701px)');
const handleDesktopChange = (event) => {
  if (event.matches) closeNav();
};
if ('addEventListener' in desktopQuery) {
  desktopQuery.addEventListener('change', handleDesktopChange);
} else {
  desktopQuery.addListener(handleDesktopChange);
}
window.addEventListener('scroll', () => header?.classList.toggle('scrolled', window.scrollY > 20), { passive: true });

document.querySelectorAll('[data-year]').forEach((node) => { node.textContent = new Date().getFullYear(); });

const googleReviewCount = document.querySelector('[data-google-review-count]');
const googleReviewRating = document.querySelector('[data-google-rating]');
const googleReviewDate = document.querySelector('[data-google-review-date]');

if (googleReviewCount && googleReviewRating && googleReviewDate) {
  fetch('/api/google-reviews', { headers: { Accept: 'application/json' } })
    .then((response) => {
      if (!response.ok) throw new Error('Bewertungsdaten nicht verfügbar');
      return response.json();
    })
    .then((data) => {
      if (!Number.isInteger(data.reviewCount) || data.reviewCount < 0) return;
      if (typeof data.rating !== 'number' || data.rating < 0 || data.rating > 5) return;

      googleReviewCount.textContent = new Intl.NumberFormat('de-DE').format(data.reviewCount);
      googleReviewRating.textContent = data.rating.toLocaleString('de-DE', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });

      const updatedAt = new Date(data.updatedAt);
      if (!Number.isNaN(updatedAt.getTime())) {
        googleReviewDate.textContent = new Intl.DateTimeFormat('de-DE', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(updatedAt);
      }
    })
    .catch(() => {
      // Der im HTML hinterlegte, zuletzt geprüfte Wert bleibt sichtbar.
    });
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduceMotion || !('IntersectionObserver' in window)) {
  document.querySelectorAll('.reveal').forEach((node) => node.classList.add('visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
}

document.querySelectorAll('[data-accordion] details').forEach((details) => {
  details.addEventListener('toggle', () => {
    if (!details.open) return;
    document.querySelectorAll('[data-accordion] details[open]').forEach((openDetails) => {
      if (openDetails !== details) openDetails.open = false;
    });
  });
});
