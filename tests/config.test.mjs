import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { API_BASE_URL, API_HOSTS } from '../src/config.js';

const manifest = JSON.parse(readFileSync(new URL('../src/manifest.json', import.meta.url), 'utf8'));

test('defaults miniapp API requests to the sjagent service domain', () => {
  assert.equal(API_HOSTS.prod, 'https://ai.513sjbz.com');
  assert.equal(API_BASE_URL, 'https://ai.513sjbz.com');
});

test('keeps WeChat release URL checks enabled for launch builds', () => {
  assert.equal(manifest['mp-weixin'].setting.urlCheck, true);
});
