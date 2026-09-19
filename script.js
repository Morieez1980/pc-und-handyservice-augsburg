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
const reviewDialogMore = document.querySelector('[data-review-dialog-more]');
const REVIEW_BATCH_SIZE = 6;
let dialogReviews = [];
let visibleDialogReviewCount = 0;

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

const sortReviewsNewestFirst = (reviews) => reviews
  .map((review, index) => ({ review, index }))
  .sort((left, right) => {
    const leftTime = Date.parse(left.review.publishedAt || left.review.updatedAt || '');
    const rightTime = Date.parse(right.review.publishedAt || right.review.updatedAt || '');
    const normalizedLeft = Number.isNaN(leftTime) ? Number.NEGATIVE_INFINITY : leftTime;
    const normalizedRight = Number.isNaN(rightTime) ? Number.NEGATIVE_INFINITY : rightTime;
    return normalizedRight - normalizedLeft || left.index - right.index;
  })
  .map(({ review }) => review);

const verifiedOriginalReviewFallback = {
  rating: 4.9,
  reviewCount: 91,
  source: 'verified-public-originals',
  reviews: [
    { author: 'Seba', rating: 5, dateLabel: 'vor einer Woche', text: 'Ich habe meinen PC hier reparieren lassen und bin super zufrieden. Die Reparatur ging extrem schnell und auch die Kommunikation verlief absolut reibungslos. Sehr freundlich und kompetent\n\nkann ich definitiv nur weiterempfehlen!' },
    { author: 'aTOMteilchen', rating: 5, dateLabel: 'vor einem Monat', text: 'Ich habe meinen Gaming Rechner zu Herrn Keil gebracht weil ich kein Bild hatte, nach wenigen Stunden konnte er bereits eine Diagnose stellen. Die Grafikkarte war Kaputt, schon am nächsten Tag hatte er eine neue und konnte sie direkt verbauen inkl. Treiberupdates, aufspielen von Windows 11. Läuft wunderbar, unkompliziert, schnell und faire Preise. Kann ich weiterempfehlen.' },
    { author: 'Katja Obermaier', rating: 5, dateLabel: 'vor 3 Monaten', text: 'Aufgrund eines Absturzes unseres Gaming-PC hat sich Hr. Keil super schnell dem Problem angenommen und konnte es übers Wochenende zu unserer vollsten Zufriedenheit lösen. PC läuft wieder einwandfrei. Preis-Leistungs-Verhältnis wirklich top. Jederzeit wieder gerne!' },
    { author: 'Peter Bender', rating: 1, dateLabel: 'vor 3 Monaten', text: 'Unzuverlässig und Inkompetent.\nIch hatte ein Problem, dass mein PC die Maus nicht mehr erkannte, vermutlich ein beschädigter Treiber. Ich brachte den PC zu Herrn Keil und wollte ihn zwei Tage später am Mittag wieder abholen. Laut Herrn Keil wäre es machbar. Als ich ihn abholen wollte, hatte Herr Keil ihn noch nicht mal angeschaut. Da ich den PC dringend für einen Vortrag brauchte bat ich ihn bitte sofort zu reparieren. Am Abend kam der Anruf, dass ich ihn abholen kann, es sei ihm nicht möglich den Maustreiber zu reparieren. Bei der Abholung durfte ich noch 30 Euro Diagnosegebühr bezahlen, für ein Ergebnis das ich schon wusste. Sein Ratschlag ich sollte ChatGPT fragen und die Anweisungen Schritt für Schritt befolgen. Habe mich als Laie durch die Windowseinstellungen gearbeitet und dort eine Lösung gefunden. Eine Stunde und die Maus funktioniert wieder. Als Laie eine Stunde Arbeit, ein Profi hätte nur Minuten gebraucht, Herr Keil hat es nicht geschafft. Suche mir das nächste mal einen Profi auf dem Gebiet.' },
    { author: 'Renate Weber', rating: 5, dateLabel: 'vor 3 Monaten', text: 'Bin mega zufrieden. Handyrettung erfolgte super schnell, kompetent und unkompliziert. Absolut vertrauenswürdiger Service am Wochenende!!! Danke Maurice!!' },
    { author: 'Anna Oko', rating: 5, dateLabel: 'vor 4 Monaten', text: 'Ich habe Herrn Keil angerufen und durfte sofort vorbeikommen. Er hat meinen Laptop nicht nur am selben Tag repariert, sondern sogar innerhalb von nur drei Stunden! Dabei hat er mich auf dem Laufenden gehalten.\n\nDie Kommunikation war super angenehm und entspannt, und der Preis wurde vorab klar kommuniziert.\nHerr Keil ist sehr professionell und außerdem super nett!\n\nAuf jeden Fall 5 Sterne und absolut weiterzuempfehlen!' },
    { author: 'charlie S', rating: 5, dateLabel: 'vor 4 Monaten', text: 'super schnelle Bearbeitung obwohl ich Sonntag Abend erst angerufen habe. Konnte mein Handy direkt um 9 am Montag abgeben und um 17 Uhr wieder repariert abholen. Und einfach sehr liebe und nette Menschen am Telefon wie auch vor Ort :) Sehr sympathisch!' },
    { author: 'Fritz Allar', rating: 5, dateLabel: 'vor 4 Monaten', text: 'Nachdem mein Laptop keinen Mucks mehr machte, fand Herr Keil sehr schnell den Fehler. So beschloss ich mir einen neuen PC zuzulegen, Herr Keil besorgte mir ein Spitzengerät zu einem sensationellen Preis und überspielte in Rekordzeit alle meine Daten und half mir bei der Einrichtung. Und alles schnell zu einem fairen Preis, ich kann Herrn Keil nur weiterempfehlen.' },
    { author: 'I. Huber', rating: 5, dateLabel: 'vor 4 Monaten', text: 'TOP Service! Zu allererst sehr netter Kontakt und kompetente Beratung. Display Tausch meines Laptops war innerhalb kürzester Zeit tadellos erledigt. Kann Herrn Keil nur weiterempfehlen!' },
    { author: 'Arda Aytac', rating: 5, dateLabel: 'vor 5 Monaten', text: 'Maurice Keil hat meinen Gaming-PC professionell und zu einem günstigen Preis zusammengebaut. Ich gebe ihm 10 von 10 Punkten. Vielen Dank an ihn und ich empfehle ihn jedem weiter.' },
    { author: 'Daniela Scholz', rating: 5, dateLabel: 'vor 5 Monaten', text: 'Mein Handy ging aus und ließ sich nicht mehr laden 😔 Dank dem super netten Team von Computer und Handyservice Keil konnte ich mein Handy In zwei Tagen mit einem neuen Akku und sie haben auch noch die Ansteckbuchse ausgetauscht🤗 wieder voll funktionsfähig abholen.\nSuper Team danke euch kann ich nur empfehlen Preis-Leistungsverhältnis sehr sehr gut 🥰' },
    { author: 'Ebru Coskun', rating: 5, dateLabel: 'vor 7 Monaten', text: 'Sehr freundlicher Kontakt, schnelle Reparatur und hohe Kompetenz. Ich habe mich gut beraten gefühlt und mein Laptop läuft wieder einwandfrei. Vielen Dank! Klare Empfehlung' }
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
  return article;
};

const updateReviewDialogMoreButton = () => {
  if (!reviewDialogMore) return;
  const remaining = dialogReviews.length - visibleDialogReviewCount;
  reviewDialogMore.hidden = remaining <= 0;
  if (remaining > 0) {
    reviewDialogMore.textContent = `Weitere ${Math.min(REVIEW_BATCH_SIZE, remaining)} anzeigen`;
    reviewDialogMore.setAttribute('aria-label', `${Math.min(REVIEW_BATCH_SIZE, remaining)} weitere Rezensionen anzeigen`);
  }
};

const appendReviewDialogBatch = () => {
  if (!reviewDialogList) return;
  const nextReviews = dialogReviews.slice(
    visibleDialogReviewCount,
    visibleDialogReviewCount + REVIEW_BATCH_SIZE
  );
  const fragment = document.createDocumentFragment();
  nextReviews.forEach((review) => fragment.append(createGoogleReview(review, true)));
  reviewDialogList.append(fragment);
  visibleDialogReviewCount += nextReviews.length;
  updateReviewDialogMoreButton();
};

const renderGoogleReviews = (data) => {
  if (!Array.isArray(data.reviews) || data.reviews.length === 0) return false;
  const reviews = sortReviewsNewestFirst(data.reviews.filter((review) => (
    Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5
  )));
  if (!reviews.length) return false;

  const isLive = data.source === 'google-business-profile';
  const previewFragment = document.createDocumentFragment();
  reviews.slice(0, 3).forEach((review) => previewFragment.append(createGoogleReview(review)));
  const source = document.createElement('p');
  source.className = 'review-source';
  source.textContent = isLive
    ? 'Aktuelle öffentlich sichtbare Rezensionen. Weitere Kundenstimmen öffnen sich direkt auf dieser Seite.'
    : 'Ausgewählte öffentlich sichtbare Originalrezensionen. Weitere Kundenstimmen öffnen sich direkt auf dieser Seite.';
  previewFragment.append(source);
  googleReviewPreview?.replaceChildren(previewFragment);

  if (reviewDialogList && reviewDialogOpen) {
    dialogReviews = reviews;
    visibleDialogReviewCount = 0;
    reviewDialogList.replaceChildren();
    appendReviewDialogBatch();
    reviewDialogOpen.hidden = false;
    reviewDialogOpen.disabled = false;
    const total = Number.isInteger(data.reviewCount) ? data.reviewCount : reviews.length;
    reviewDialogOpen.textContent = isLive
      ? `Alle ${new Intl.NumberFormat('de-DE').format(total)} Rezensionen öffnen`
      : 'Kundenstimmen direkt hier lesen';
    if (reviewDialogCount) {
      reviewDialogCount.textContent = isLive
        ? `${new Intl.NumberFormat('de-DE').format(total)} Rezensionen`
        : `${reviews.length} Originalrezensionen`;
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

renderGoogleReviews(verifiedOriginalReviewFallback);

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
reviewDialogMore?.addEventListener('click', appendReviewDialogBatch);
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
