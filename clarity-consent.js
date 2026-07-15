(() => {
  const projectId = document.documentElement.dataset.clarityProject?.trim();
  if (!projectId || !/^[a-z0-9]{6,32}$/i.test(projectId)) return;

  const storageKey = 'pc-service-clarity-consent-v1';
  const settingsButtons = document.querySelectorAll('[data-clarity-settings]');

  const setChoice = (choice) => {
    try { localStorage.setItem(storageKey, choice); } catch {}
  };
  const getChoice = () => {
    try { return localStorage.getItem(storageKey); } catch { return null; }
  };

  const configureClarity = (analyticsStorage) => {
    window.clarity = window.clarity || function (...args) {
      (window.clarity.q = window.clarity.q || []).push(args);
    };
    window.clarity('consentv2', {
      ad_Storage: 'denied',
      analytics_Storage: analyticsStorage
    });
  };

  const loadClarity = () => {
    if (document.querySelector('script[data-clarity-loader]')) return;
    configureClarity('granted');
    for (const href of ['https://www.clarity.ms', 'https://c.clarity.ms']) {
      if (!document.querySelector(`link[rel="preconnect"][href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = href;
        link.crossOrigin = 'anonymous';
        document.head.append(link);
      }
    }
    const script = document.createElement('script');
    script.async = true;
    script.dataset.clarityLoader = '';
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`;
    document.head.append(script);
  };

  const removeBanner = () => document.querySelector('[data-clarity-banner]')?.remove();

  const showBanner = () => {
    removeBanner();
    const banner = document.createElement('section');
    banner.className = 'consent-banner';
    banner.dataset.clarityBanner = '';
    banner.setAttribute('aria-label', 'Optionale Analyse-Einstellungen');
    banner.innerHTML = `
      <div>
        <strong>Optionale Nutzungsanalyse</strong>
        <p>Mit Ihrer Einwilligung hilft Microsoft Clarity dabei, die Bedienbarkeit dieser Website zu verbessern. Ohne Zustimmung wird Clarity nicht geladen. <a href="/datenschutz.html">Datenschutz</a></p>
      </div>
      <div class="consent-actions">
        <button type="button" class="button button-outline" data-clarity-choice="denied">Ablehnen</button>
        <button type="button" class="button button-primary" data-clarity-choice="granted">Zustimmen</button>
      </div>`;
    document.body.append(banner);
    banner.querySelectorAll('[data-clarity-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        const choice = button.dataset.clarityChoice;
        setChoice(choice);
        if (choice === 'granted') loadClarity();
        else if (window.clarity) {
          configureClarity('denied');
          window.clarity('consent', false);
        }
        removeBanner();
      });
    });
  };

  settingsButtons.forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => {
      setChoice('');
      showBanner();
    });
  });

  const choice = getChoice();
  if (choice === 'granted') loadClarity();
  else if (choice !== 'denied') showBanner();
})();
