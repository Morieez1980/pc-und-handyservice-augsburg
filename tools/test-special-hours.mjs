import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {languages, routes} from '../locales/content.mjs';

test('Closure follows the Berlin calendar and expires without another deployment', () => {
  for (const [instant, hidden] of [
    ['2026-10-23T21:59:59Z', true],
    ['2026-10-23T22:00:00Z', false],
    ['2026-10-24T21:59:59Z', false],
    ['2026-10-24T22:00:00Z', true],
    ['2026-10-31T12:00:00Z', true],
  ]) {
    const notice={dataset:{closureDate:'2026-10-24'}, hidden:true};
    vm.runInNewContext(fs.readFileSync('special-hours.js','utf8'), {
      Intl, Date: class extends Date {constructor(){super(instant);}},
      document:{querySelectorAll:()=>[notice]},
    });
    assert.equal(notice.hidden, hidden, instant);
  }
});

test('Every language and route has exactly one closure notice and script', () => {
  for (const lang of Object.keys(languages)) for (const route of routes) {
    const file=(lang==='de'?'':lang+'/')+(route||'index')+'.html';
    const html=fs.readFileSync(file,'utf8');
    assert.equal((html.match(/data-closure-date="2026-10-24"/g)||[]).length,1,file);
    assert.equal((html.match(/src="\/special-hours.js/g)||[]).length,1,file);
  }
});
