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
const googleReviewPreview = document.querySelector('[data-google-review-preview]');
const reviewDialog = document.querySelector('[data-review-dialog]');
const reviewDialogOpen = document.querySelector('[data-review-dialog-open]');
const reviewDialogClose = document.querySelector('[data-review-dialog-close]');
const reviewDialogList = document.querySelector('[data-review-dialog-list]');
const reviewDialogRating = document.querySelector('[data-review-dialog-rating]');
const reviewDialogCount = document.querySelector('[data-review-dialog-count]');

const updateGoogleReviewSummary = (data) => {
  if (googleReviewCount && Number.isInteger(data.reviewCount) && data.reviewCount >= 0) {
      googleReviewCount.textContent = new Intl.NumberFormat('de-DE').format(data.reviewCount);
  }
  if (googleReviewRating && typeof data.rating === 'number' && data.rating >= 0 && data.rating <= 5) {
      googleReviewRating.textContent = data.rating.toLocaleString('de-DE', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });
  }

  if (googleReviewDate && data.updatedAt) {
      const updatedAt = new Date(data.updatedAt);
      if (!Number.isNaN(updatedAt.getTime())) {
        googleReviewDate.textContent = new Intl.DateTimeFormat('de-DE', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(updatedAt);
      }
  }
};

const reviewSummaryRequest = googleReviewCount && googleReviewRating && googleReviewDate
  ? fetch('/api/review-summary', { headers: { Accept: 'application/json' } })
    .then((response) => {
      if (!response.ok) throw new Error('Bewertungsdaten nicht verfügbar');
      return response.json();
    })
    .catch(() => null)
  : Promise.resolve(null);

const formatReviewDate = (value) => {
  const publishedAt = value ? new Date(value) : null;
  if (!publishedAt || Number.isNaN(publishedAt.getTime())) return '';
  return new Intl.DateTimeFormat('de-DE', {
    month: 'long',
    year: 'numeric'
  }).format(publishedAt);
};

const verifiedReviewFallback = {
  rating: 4.9,
  reviewCount: 91,
  source: 'verified-public-summary',
  reviews: [
    { author: 'Seba', rating: 5, dateLabel: 'vor einer Woche', isSummary: true, text: 'Seba berichtet von einer sehr schnellen PC-Reparatur und einer reibungslosen Kommunikation.' },
    { author: 'aTOMteilchen', rating: 5, dateLabel: 'vor einem Monat', isSummary: true, text: 'Der Bildfehler am Gaming-PC wurde innerhalb weniger Stunden erkannt und anschließend zügig behoben.' },
    { author: 'Peter Bender', rating: 1, dateLabel: 'vor 3 Monaten', isSummary: true, text: 'Peter Bender beschreibt seine Erfahrung kritisch und bemängelt Zuverlässigkeit und Kompetenz bei einem PC-Problem.' },
    { author: 'Katja Obermaier', rating: 5, dateLabel: 'vor 3 Monaten', isSummary: true, text: 'Ein abgestürzter Gaming-PC wurde sogar über das Wochenende schnell und zur vollen Zufriedenheit wiederhergestellt.' },
    { author: 'Anna Oko', rating: 5, dateLabel: 'vor 4 Monaten', isSummary: true, text: 'Der Laptop konnte noch am selben Tag und innerhalb kurzer Zeit repariert werden.' },
    { author: 'charlie S', rating: 5, dateLabel: 'vor 4 Monaten', isSummary: true, text: 'Trotz Anfrage am Sonntag wurde das Smartphone am Montag angenommen und noch am selben Tag repariert.' },
    { author: 'Fritz Allar', rating: 5, dateLabel: 'vor 4 Monaten', isSummary: true, text: 'Der Fehler am ausgefallenen Laptop wurde schnell gefunden und die weitere Lösung persönlich begleitet.' },
    { author: 'Arda Aytac', rating: 5, dateLabel: 'vor 5 Monaten', isSummary: true, text: 'Der Gaming-PC wurde professionell, preislich fair und vollständig zusammengebaut.' },
    { author: 'I. Huber', rating: 5, dateLabel: 'vor 4 Monaten', isSummary: true, text: 'Kompetente Beratung und ein schneller, tadelloser Displaytausch am Laptop werden besonders hervorgehoben.' },
    { author: 'Daniela Scholz', rating: 5, dateLabel: 'vor 5 Monaten', isSummary: true, text: 'Ein nicht mehr ladendes Smartphone wurde innerhalb kurzer Zeit wieder einsatzbereit gemacht.' },
    { author: 'Renate Weber', rating: 5, dateLabel: 'vor 3 Monaten', isSummary: true, text: 'Die Handyrettung wurde schnell, unkompliziert und auch am Wochenende zuverlässig durchgeführt.' },
    { author: 'Ebru Coskun', rating: 5, dateLabel: 'vor 7 Monaten', isSummary: true, text: 'Freundliche Beratung und eine schnelle Laptop-Reparatur mit einwandfreiem Ergebnis.' }
  ]
};

const createGoogleReview = (review, inDialog = false) => {
  const article = document.createElement('article');
  article.className = inDialog ? 'google-review google-review-dialog-item' : 'google-review';

  const header = document.createElement('div');
  header.className = 'google-review-header';

  const avatar = document.createElement('span');
  avatar.className = 'google-review-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = (review.author || 'G').trim().charAt(0).toLocaleUpperCase('de-DE');

  const identity = document.createElement('div');
  const author = document.createElement('h3');
  author.textContent = review.author || 'Google-Nutzer';
  const date = document.createElement('time');
  const formattedDate = formatReviewDate(review.publishedAt);
  if (review.dateLabel) {
    date.textContent = review.dateLabel;
  } else if (formattedDate) {
    date.dateTime = new Date(review.publishedAt).toISOString();
    date.textContent = formattedDate;
  }
  identity.append(author, date);
  header.append(avatar, identity);

  const stars = document.createElement('p');
  stars.className = 'google-review-stars';
  stars.setAttribute('aria-label', `${review.rating} von 5 Sternen`);
  stars.textContent = `${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}`;

  const comment = document.createElement('p');
  comment.className = 'google-review-text';
  comment.textContent = review.text || 'Bewertung ohne zusätzlichen Text.';

  article.append(header, stars, comment);
  if (review.isSummary) {
    const summaryNote = document.createElement('small');
    summaryNote.className = 'google-review-summary-note';
    summaryNote.textContent = 'Inhaltlich zusammengefasst';
    article.append(summaryNote);
  }
  return article;
};

const renderGoogleReviews = (data) => {
  if (!Array.isArray(data.reviews) || data.reviews.length === 0) return false;
  const reviews = data.reviews.filter((review) => (
    Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5
  ));
  if (!reviews.length) return false;

  const isLive = data.source === 'google-business-profile';
  const previewFragment = document.createDocumentFragment();
  reviews.slice(0, 3).forEach((review) => previewFragment.append(createGoogleReview(review)));
  const source = document.createElement('p');
  source.className = 'review-source';
  source.textContent = isLive
    ? 'Aktuelle öffentlich sichtbare Rezensionen. Weitere Kundenstimmen öffnen sich direkt auf dieser Seite.'
    : 'Ausgewählte öffentlich sichtbare Rezensionen, inhaltlich zusammengefasst. Weitere Kundenstimmen öffnen sich direkt auf dieser Seite.';
  previewFragment.append(source);
  googleReviewPreview?.replaceChildren(previewFragment);

  if (reviewDialogList && reviewDialogOpen) {
    const dialogFragment = document.createDocumentFragment();
    reviews.forEach((review) => dialogFragment.append(createGoogleReview(review, true)));
    reviewDialogList.replaceChildren(dialogFragment);
    reviewDialogOpen.hidden = false;
    reviewDialogOpen.disabled = false;
    reviewDialogOpen.textContent = 'Kundenstimmen direkt hier lesen';
    const total = Number.isInteger(data.reviewCount) ? data.reviewCount : reviews.length;
    if (reviewDialogCount) {
      reviewDialogCount.textContent = isLive
        ? `${new Intl.NumberFormat('de-DE').format(total)} Rezensionen`
        : `${reviews.length} ausgewählte Stimmen`;
    }
    if (reviewDialogRating && typeof data.rating === 'number') {
      reviewDialogRating.textContent = data.rating.toLocaleString('de-DE', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });
    }
  }
  return true;
};

renderGoogleReviews(verifiedReviewFallback);

const googleReviewsRequest = googleReviewPreview
  ? fetch('/api/google-reviews', { headers: { Accept: 'application/json' } })
    .then((response) => {
      if (!response.ok) throw new Error('Google-Rezensionen nicht verfügbar');
      return response.json();
    })
    .then((data) => {
      renderGoogleReviews(data);
      return data;
    })
    .catch(() => null)
  : Promise.resolve(null);

Promise.all([reviewSummaryRequest, googleReviewsRequest]).then(([fallbackData, googleData]) => {
  const summaryData = googleData?.source === 'google-business-profile' ? googleData : fallbackData;
  if (summaryData) updateGoogleReviewSummary(summaryData);
});

reviewDialogOpen?.addEventListener('click', () => {
  if (
    reviewDialogOpen.hidden ||
    reviewDialogOpen.disabled ||
    !reviewDialogList?.children.length ||
    !reviewDialog ||
    typeof reviewDialog.showModal !== 'function'
  ) return;
  reviewDialog.showModal();
  document.body.classList.add('review-dialog-open');
});

reviewDialogClose?.addEventListener('click', () => reviewDialog?.close());
reviewDialog?.addEventListener('click', (event) => {
  if (event.target === reviewDialog) reviewDialog.close();
});
reviewDialog?.addEventListener('close', () => {
  document.body.classList.remove('review-dialog-open');
  reviewDialogOpen?.focus();
});

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
