(() => {
  'use strict';

  const form = document.querySelector('#repair-request');
  if (!form) return;

  const steps = [...form.querySelectorAll('[data-form-step]')];
  const progress = [...document.querySelectorAll('[data-progress-step]')];
  const next = form.querySelector('[data-next-step]');
  const previous = form.querySelector('[data-prev-step]');
  const device = form.querySelector('#device-type');
  const imeiWrap = form.querySelector('[data-imei-field]');
  const submit = form.querySelector('[data-submit]');
  const errorSummary = form.querySelector('[data-error-summary]');
  const success = document.querySelector('[data-form-success]');
  const responseFrame = document.querySelector('.bigin-response-frame');
  const pipelineEmail = form.querySelector('#pipeline-email');
  const pipelinePhone = form.querySelector('#pipeline-phone');
  const pipelineAddress = form.querySelector('#pipeline-address');
  const contactEmail = form.querySelector('#email');
  const phone = form.querySelector('#phone');
  const started = Date.now();
  let sending = false;
  let responseTimer;
  let confirmationNonce;
  const showUnconfirmed = () => {
    if (!sending) return;
    errorSummary.textContent = 'Bitte prüfen Sie die Antwort von Bigin unten: Steht dort „Vielen Dank für Ihre Reparaturanfrage“, ist Ihre Anfrage eingegangen. Die Website kann diese externe Antwort nicht automatisch auslesen. Bitte nicht erneut senden. Fehlt die Dankesmeldung, rufen Sie uns an: 0152 54530080.';
    errorSummary.hidden = false;
    responseFrame.removeAttribute('aria-hidden');
    responseFrame.removeAttribute('tabindex');
    responseFrame.classList.add('response-visible');
    submit.textContent = 'Antwort von Bigin prüfen';
  };

  const requestConfirmationReference = async () => {
    const response = await fetch('/api/repair-confirmation', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error('Bestätigungsdienst nicht verfügbar');
    const result = await response.json();
    if (!/^[0-9a-f-]{36}$/i.test(result.ref || '')) throw new Error('Ungültige Bestätigungsnummer');
    return result.ref;
  };

  const phoneInput = window.intlTelInput ? window.intlTelInput(phone, {
    initialCountry: 'de',
    countryOrder: ['de', 'at', 'ch', 'tr', 'ua'],
    countrySearch: true,
    separateDialCode: true,
    countryNameLocale: 'de',
    strictMode: true,
    formatAsYouType: true,
    uiTranslations: {
      selectedCountryAriaLabel: 'Land der Telefonnummer ändern, ausgewählt ${countryName} (${dialCode})',
      noCountrySelected: 'Land der Telefonnummer auswählen',
      countryListAriaLabel: 'Liste der Länder',
      searchPlaceholder: 'Land suchen',
      clearSearchAriaLabel: 'Suche löschen',
      searchEmptyState: 'Keine Suchergebnisse',
      searchSummaryAria(count) {
        if (count === 0) return 'Keine Suchergebnisse';
        if (count === 1) return 'Ein Suchergebnis';
        return `${count} Suchergebnisse`;
      }
    }
  }) : null;

  const clearPhoneError = () => {
    phone.setCustomValidity('');
    phone.removeAttribute('aria-invalid');
  };

  phone.addEventListener('input', clearPhoneError);
  phone.addEventListener('countrychange', clearPhoneError);

  const showStep = (number) => {
    steps.forEach((step, index) => {
      const active = index === number - 1;
      step.hidden = !active;
      step.classList.toggle('is-active', active);
    });
    progress.forEach((item, index) => {
      item.classList.toggle('is-active', index === number - 1);
      item.classList.toggle('is-done', index < number - 1);
      item.textContent = index < number - 1 ? '✓' : String(index + 1);
    });
    document.querySelector('.request-form-shell').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const validateArea = (area) => {
    const controls = [...area.querySelectorAll('input, select, textarea')]
      .filter((element) => !element.disabled && element.type !== 'hidden');
    let firstInvalid = null;

    controls.forEach((element) => {
      const valid = element.checkValidity();
      element.setAttribute('aria-invalid', String(!valid));
      if (!valid && !firstInvalid) firstInvalid = element;
    });

    if (!firstInvalid) return true;
    firstInvalid.focus();
    firstInvalid.reportValidity();
    return false;
  };

  const updateDeviceFields = () => {
    const needsImei = ['Smartphone', 'Tablet'].includes(device.value);
    imeiWrap.hidden = !needsImei;
    if (!needsImei) imeiWrap.querySelector('input').value = '';
  };

  device.addEventListener('change', updateDeviceFields);
  updateDeviceFields();

  form.addEventListener('input', (event) => {
    if (event.target.matches('input, select, textarea')) {
      event.target.removeAttribute('aria-invalid');
    }
  });

  next.addEventListener('click', () => {
    if (validateArea(steps[0])) showStep(2);
  });
  previous.addEventListener('click', () => showStep(1));

  responseFrame.addEventListener('load', () => {
    if (!sending) return;
    try {
      const result = new URL(responseFrame.contentWindow.location.href);
      const confirmation = responseFrame.contentDocument?.documentElement?.dataset.confirmation;
      if (result.origin !== location.origin || result.pathname !== '/anfrage-bestaetigt' || result.searchParams.get('ref') !== confirmationNonce || confirmation !== 'valid') return showUnconfirmed();
    } catch { return showUnconfirmed(); }
    clearTimeout(responseTimer);
    sending = false;
    form.hidden = true;
    responseFrame.classList.remove('response-visible');
    responseFrame.setAttribute('aria-hidden', 'true');
    document.querySelector('.request-form-heading').hidden = true;
    success.hidden = false;
    success.focus();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    errorSummary.hidden = true;
    if (!validateArea(steps[0])) {
      showStep(1);
      validateArea(steps[0]);
      return;
    }
    if (!validateArea(steps[1])) {
      errorSummary.hidden = false;
      return;
    }

    const honeypot = form.querySelector('#website-url');
    if (honeypot.value || Date.now() - started < 2500) {
      errorSummary.textContent = 'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.';
      errorSummary.hidden = false;
      return;
    }

    let value;
    if (phoneInput) {
      if (!phoneInput.isValidNumber()) {
        phone.setCustomValidity('Bitte geben Sie eine gültige Telefonnummer für das ausgewählte Land ein.');
        phone.setAttribute('aria-invalid', 'true');
        errorSummary.textContent = 'Bitte prüfen Sie die markierte Telefonnummer und versuchen Sie es erneut.';
        errorSummary.hidden = false;
        phone.focus();
        phone.reportValidity();
        return;
      }
      value = phoneInput.getNumber();
    } else {
      value = phone.value.replace(/[()\s/.-]/g, '');
      if (value.startsWith('00')) value = '+' + value.slice(2);
      else if (value.startsWith('0')) value = '+49' + value.slice(1);
      if (!/^\+[1-9]\d{6,14}$/.test(value)) {
        phone.setCustomValidity('Bitte geben Sie eine gültige Telefonnummer mit Ländervorwahl ein.');
        phone.setAttribute('aria-invalid', 'true');
        errorSummary.textContent = 'Bitte prüfen Sie die markierte Telefonnummer und versuchen Sie es erneut.';
        errorSummary.hidden = false;
        phone.focus();
        phone.reportValidity();
        return;
      }
    }
    phone.value = value;

    pipelineEmail.value = contactEmail.value.trim();
    pipelinePhone.value = value;

    const street = form.querySelector('#street').value.trim();
    const postcode = form.querySelector('#postcode').value.trim();
    const city = form.querySelector('#city').value.trim();
    pipelineAddress.value = [
      street,
      [postcode, city].filter(Boolean).join(' ')
    ].filter(Boolean).join(', ');

    submit.disabled = true;
    submit.textContent = 'Bestätigung wird vorbereitet …';
    try {
      confirmationNonce = await requestConfirmationReference();
    } catch {
      submit.disabled = false;
      submit.textContent = 'Reparaturanfrage senden';
      errorSummary.textContent = 'Die sichere Bestätigungsnummer konnte nicht erstellt werden. Bitte versuchen Sie es erneut.';
      errorSummary.hidden = false;
      return;
    }

    form.querySelector('[name="returnURL"]').value = location.origin + '/anfrage-bestaetigt?ref=' + encodeURIComponent(confirmationNonce);
    const model = form.querySelector('#device-model').value.trim();
    form.querySelector('[name="Potential Name"]').value = ('Reparatur · ' + model + ' · ' + new Date().toLocaleDateString('de-DE')).slice(0, 100);
    sending = true;
    responseTimer = setTimeout(showUnconfirmed, 30000);
    submit.textContent = 'Wird sicher übermittelt …';
    HTMLFormElement.prototype.submit.call(form);
  });
})();
