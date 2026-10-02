# Website maintenance

For every website change, verify desktop and mobile layouts, including 320, 360 and 390 CSS pixels, navigation, contact actions and any available language pages. Prefer the Opera connector for the user's current browser context; use isolated browser tests for repeatable viewport checks. Do not submit real enquiries during tests. Keep the existing GitHub → Cloudflare Pages deployment and preserve DNS, email configuration, pricing and unrelated changes. Save local audit evidence in the established OneDrive ChatGPT task folder.


## Language versions

Customer-facing language selection: German, English, Turkish, Romanian, Ukrainian, Spanish, Swedish and Danish. Do not add Russian, Chinese or Japanese without a new request. Run node tools/build-locales.mjs after editing locales/ or the German form; generated HTML and form dictionaries are committed because Cloudflare has no build command. Preserve CRM field names and option values. Legal text, customer reviews and repair reports are explicitly marked German originals; do not claim they are translated. Verify every language at 320, 360, 390 and desktop widths and intercept all form submissions in tests.
