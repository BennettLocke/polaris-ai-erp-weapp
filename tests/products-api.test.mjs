import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const productsApiSource = readFileSync(new URL('../src/api/products.js', import.meta.url), 'utf8');

describe('products api', () => {
  it('passes product sort mode through to the miniapp search endpoint', () => {
    assert.match(productsApiSource, /export function getProducts\(params = \{\}\)/);
    assert.match(productsApiSource, /sort:\s*params\.sort\s*\|\|\s*''/);
  });
});
