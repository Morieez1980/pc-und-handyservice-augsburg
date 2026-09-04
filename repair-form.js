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
  const serial = form.querySelector('#serial-number');
  const serialUnknown = form.querySelector('#serial-unknown');
  const submit = form.querySelector('[data-submit]');
  const errorSummary = form.querySelector('[data-error-summary]');
  const success = document.querySelector('[data-form-success]');
  const responseFrame = document.querySelector('.bigin-response-frame');\n  const pipelineEmail = form.querySelector('#pipeline-email');\n  const contactEmail = form.querySelector('#email');
  const started = Date.now();
  let sending = false;

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

  serialUnknown.addEventListener('change', () => {
    if (serialUnknown.checked) {
      serial.dataset.previous = serial.value;
      serial.value = 'Nicht angegeben';
      serial.readOnly = true;
      serial.setAttribute('aria-invalid', 'false');
      return;
    }
    serial.value = serial.dataset.previous || '';
    serial.readOnly = false;
    serial.focus();
  });

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
    form.hidden = true;
    document.querySelector('.request-form-heading').hidden = true;
    success.hidden = false;
    success.focus();
  });

  form.addEventListener('submit', (event) => {
    errorSummary.hidden = true;
    if (!validateArea(steps[1])) {
      event.preventDefault();
      errorSummary.hidden = false;
      return;
    }

    const honeypot = form.querySelector('#website-url');
    if (honeypot.value || Date.now() - started < 2500) {
      event.preventDefault();
      errorSummary.textContent = 'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.';
      errorSummary.hidden = false;
      return;
    }

    pipelineEmail.value = contactEmail.value.trim();\n\n    const phone = form.querySelector('#phone');
    let value = phone.value.replace(/[()\s/.-]/g, '');
    if (value.startsWith('00')) value = '+' + value.slice(2);
    else if (value.startsWith('0')) value = '+49' + value.slice(1);
    phone.value = value;

    sending = true;
    submit.disabled = true;
    submit.textContent = 'Wird sicher übermittelt …';
  });
})();
