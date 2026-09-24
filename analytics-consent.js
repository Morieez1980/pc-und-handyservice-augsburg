(() => {
  'use strict';

  const measurementId = 'G-W6FZ6FN9T3';
  const storageKey = 'pc-service-analysis-consent-v2';
  const privatePage = document.documentElement.dataset.privatePage === 'true';
  let loaded = false;

  const hasConsent = () => {
    try { return localStorage.getItem(storageKey) === 'granted'; }
    catch { return false; }
  };

  const loadAnalytics = () => {
    if (loaded || !hasConsent()) return false;
    loaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: !privatePage });

    const script = document.createElement('script');
    script.async = true;
    script.dataset.googleAnalyticsLoader = '';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.append(script);
    return true;
  };

  if (!privatePage) {
    loadAnalytics();
    window.addEventListener('pc-service-analysis-consent-granted', loadAnalytics);
    document.addEventListener('click', (event) => {
      if (!loaded) return;
      const link = event.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (/^\/?reparaturanfrage(?:\b|[/?#])/.test(href)) {
        window.gtag('event', 'repair_request_click');
      } else if (href.startsWith('tel:')) {
        window.gtag('event', 'contact_click', { contact_method: 'phone' });
      } else if (href.startsWith('mailto:')) {
        window.gtag('event', 'contact_click', { contact_method: 'email' });
      } else if (href.startsWith('https://wa.me/') || href.startsWith('https://api.whatsapp.com/')) {
        window.gtag('event', 'contact_click', { contact_method: 'whatsapp' });
      }
    });
  }

  // Called only after the site's confirmation endpoint verifies a completed Bigin request.
  window.pcTrackRepairLead = () => {
    if (!privatePage || !hasConsent()) return;
    loadAnalytics();
    window.gtag('event', 'generate_lead', {
      lead_source: 'repair_form',
      page_location: `${location.origin}/reparaturanfrage`
    });
  };
})();
