import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {localeContent, prices} from '../locales/content.mjs';
import {calibratedFees} from '../locales/price-calibration.mjs';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('Spanish source uses canonical fees and confirmed appointment hours', () => {
  assert.equal(localeContent.es.fees, calibratedFees.es);
  assert.match(localeContent.es.hours, /solo con cita confirmada/);
  assert.match(localeContent.es.hours, /lunes a viernes de 10:00 a 20:00/);
  assert.match(localeContent.es.hours, /sábados de 10:00 a 16:00/);
  assert.doesNotMatch(localeContent.es.fees, /250/);
});

test('Committed Spanish homepage preserves all canonical prices and appointment requirements', () => {
  const html = read('es/index.html');
  assert.equal((html.match(/data-price-index=/g) || []).length, prices.length);
  for (const [index, price] of prices.entries()) {
    const amount = html.match(new RegExp('data-price-index="' + index + '"[^]*?<dd>([^<]+)'))?.[1];
    assert.ok(amount, 'Missing Spanish price ' + index);
    if (price) assert.match(amount, new RegExp('(?:^|\\s)' + price + ' €$'));
  }
  assert.match(html, /solo con cita confirmada/i);
  assert.match(html, /lunes a viernes de 10:00 a 20:00/);
  assert.match(html, /sábados de 10:00 a 16:00/);
  assert.ok(html.includes(calibratedFees.es));
  assert.doesNotMatch(html, /250 €|lunes a sábado de 9|sin cita previa/i);
});

test('Phone service copy matches the existing identifier exception and optional online device code', () => {
  const page = read('handyreparatur-augsburg.html');
  const form = read('reparaturanfrage.html');
  assert.match(page, /Im Anfrageformular genügt eine Seriennummer oder IMEI/);
  assert.match(page, /wählen Sie dort die Ausnahme/);
  assert.match(page, /Einen Gerätecode müssen Sie nicht online angeben/);
  assert.doesNotMatch(page, /Seriennummer und IMEI sind[^.]*freiwillig/);
  assert.match(form, /id="identifier-unavailable"/);
  assert.match(form, /value="later">Bei Abgabe persönlich entsperren/);
  assert.match(form, /ein Code im Onlineformular nicht/);
  assert.match(form, /Keine Passwörter für E-Mail, Apple, Google oder andere Onlinekonten/);
});

test('Existing identifier validation accepts either identifier or its explicit unavailable exception', () => {
  const source = read('repair-form.js');
  const update = source.match(/const updateIdentifierFields = \(\) => \{[^]*?\n  \};/)?.[0];
  assert.ok(update);
  for (const [serialValue, imeiValue, exempt, required] of [
    ['', '', false, [true, true]],
    ['serial', '', false, [true, false]],
    ['', '123456789012345', false, [false, true]],
    ['serial', '123456789012345', false, [false, false]],
    ['', '', true, [false, false]],
  ]) {
    const serial = {value: serialValue};
    const imei = {value: imeiValue};
    vm.runInNewContext(update + '\nupdateIdentifierFields();', {
      serial, imei, identifierUnavailable: {checked: exempt},
    });
    assert.deepEqual([serial.required, imei.required], required);
    assert.equal(serial.disabled, exempt);
    assert.equal(imei.disabled, exempt);
  }
});
