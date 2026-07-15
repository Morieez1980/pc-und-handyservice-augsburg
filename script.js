const header = document.querySelector('[data-header]');
const toggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
const toggleLabel = toggle?.querySelector('.sr-only');

const closeNav = () => {
  nav?.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
  if (toggleLabel) toggleLabel.textContent = 'Menü öffnen';
};

toggle?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
  if (toggleLabel) toggleLabel.textContent = isOpen ? 'Menü schließen' : 'Menü öffnen';
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav?.classList.contains('open')) {
    closeNav();
    toggle?.focus();
  }
});
window.matchMedia('(min-width: 701px)').addEventListener('change', (event) => {
  if (event.matches) closeNav();
});
window.addEventListener('scroll', () => header?.classList.toggle('scrolled', window.scrollY > 20), { passive: true });

document.querySelectorAll('[data-year]').forEach((node) => { node.textContent = new Date().getFullYear(); });

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

const googleProfileUrl = 'https://share.google/0Fr2Kl1iXhIG9e8RP';
const legacyGoogleUrls = new Set([
  'https://share.google/57mrs7jE79LUInKVg',
  'https://share.google/2mQbAIfJoIab9YR3G',
  googleProfileUrl
]);

document.querySelectorAll('a[href]').forEach((link) => {
  if (legacyGoogleUrls.has(link.href)) link.href = googleProfileUrl;
});

const formatGermanDate = (isoDate) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const updateGoogleRating = async () => {
  const ratingSection = document.querySelector('#bewertungen .reviews-summary');
  if (!ratingSection) return;

  try {
    const response = await fetch('google-rating.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const rating = Number(data.rating);
    const reviewCount = Number(data.reviewCount);

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new Error('Ungültige Bewertung');
    if (!Number.isInteger(reviewCount) || reviewCount < 0) throw new Error('Ungültige Bewertungsanzahl');

    const ratingValue = ratingSection.querySelector('.rating-line strong');
    const summary = ratingSection.querySelector('.rating-line + p');
    const disclaimer = ratingSection.querySelector('.google-disclaimer');
    const updatedAt = formatGermanDate(data.updatedAt);

    if (ratingValue) ratingValue.textContent = rating.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (summary) {
      summary.textContent = `Basierend auf ${reviewCount.toLocaleString('de-DE')} öffentlich sichtbaren Google-Rezensionen.${updatedAt ? ` Automatisch aktualisiert: ${updatedAt}.` : ''}`;
    }
    if (disclaimer) {
      disclaimer.textContent = 'Google und das Google-Logo sind Marken von Google LLC. Bewertung und Anzahl werden automatisiert über die Google Places API aktualisiert; bei einem Abruffehler bleibt der letzte geprüfte Stand sichtbar.';
    }
  } catch (error) {
    console.warn('Google-Bewertung konnte nicht aktualisiert werden; statischer Fallback bleibt sichtbar.', error);
  }
};

updateGoogleRating();
