export const appsNavLabels = {
  de: 'Apps', en: 'Apps', tr: 'Uygulamalar', ro: 'Aplicații', uk: 'Застосунки',
  es: 'Apps', sv: 'Appar', da: 'Apps', ru: 'Приложения', zh: '应用', ja: 'アプリ',
  pl: 'Aplikacje', it: 'App', fr: 'Applications', bg: 'Приложения', hr: 'Aplikacije',
  el: 'Εφαρμογές', ar: 'التطبيقات', fa: 'برنامه‌ها'
};

// Use the same public Apps destination in static pages and repair reports.
export function withAppsNavigation(html, lang = 'de') {
  if (!Object.hasOwn(appsNavLabels, lang)) throw new Error('Unknown Apps language');
  const href = `${lang === 'de' ? '/' : `/${lang}/`}#apps`;
  const link = `<a data-apps-link href="${href}">${appsNavLabels[lang]}</a>`;
  html = html.replace(/<a\b[^>]*\bdata-apps-link\b[^>]*>[\s\S]*?<\/a>/g, '');
  html = html.replace(/(<header\b[^>]*>)([\s\S]*?)(<\/header>)/, (_, open, body, close) => {
    let foundNav = false;
    body = body.replace(/(<nav\b[^>]*\bid="(?:nav|locale-nav)"[^>]*>)([\s\S]*?)(<\/nav>)/, (_, navOpen, links, navClose) => {
      foundNav = true;
      const cta = /<a\b(?=[^>]*(?:class="[^"]*\bnav-cta\b|href="[^"]*reparaturanfrage))[^>]*>/;
      links = cta.test(links) ? links.replace(cta, match => link + match) : links + link;
      return navOpen + links + navClose;
    });
    if (!foundNav) {
      if (!open.includes('has-apps-shortcut')) open = open.replace(/class="([^"]*)"/, 'class="$1 has-apps-shortcut"');
      body += link.replace('data-apps-link', 'class="apps-header-link" data-apps-link');
    }
    return open + body + close;
  });
  return html.replace(/(<footer\b[^>]*class="(?:footer|locale-footer|reports-footer)"[^>]*>)([\s\S]*?)(<\/footer>)/, (_, open, body, close) => {
    if (body.includes('<h3>Navigation</h3>')) body = body.replace('<h3>Navigation</h3>', '<h3>Navigation</h3>' + link);
    else body = body.replace(/<a\b[^>]*>[\s\S]*?<\/a>/, match => match + link);
    return open + body + close;
  });
}
