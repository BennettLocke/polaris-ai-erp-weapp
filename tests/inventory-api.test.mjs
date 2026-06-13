import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../', import.meta.url);
const inventoryApiUrl = new URL('src/api/inventory.js', root);
const inventoryApiSource = existsSync(inventoryApiUrl) ? readFileSync(inventoryApiUrl, 'utf8') : '';

describe('miniapp inventory api', () => {
  it('wraps the readonly mini inventory list endpoint', () => {
    assert.ok(existsSync(inventoryApiUrl));
    assert.match(inventoryApiSource, /import\s+\{\s*request\s*\}\s+from\s+'\.\/request'/);
    assert.match(inventoryApiSource, /export function getMiniInventoryList\(params = \{\}\)/);
    assert.match(inventoryApiSource, /request\('\/api\/mini\/inventory\/list'/);
    assert.match(inventoryApiSource, /page:\s*params\.page\s*\|\|\s*1/);
    assert.match(inventoryApiSource, /page_size:\s*params\.page_size\s*\|\|\s*30/);
    assert.match(inventoryApiSource, /keyword:\s*params\.keyword\s*\|\|\s*''/);
  });

  it('normalizes inventory matrix groups before falling back to legacy rows', () => {
    assert.match(inventoryApiSource, /function normalizeInventoryGroup/);
    assert.match(inventoryApiSource, /function buildInventoryGroupsFromItems/);
    assert.match(inventoryApiSource, /const warehouses = normalizeWarehouses/);
    assert.match(inventoryApiSource, /const sourceGroups = Array\.isArray\(data\.groups\)/);
    assert.match(inventoryApiSource, /groups:\s*sourceGroups\.length/);
    assert.match(inventoryApiSource, /warehouses,/);
    assert.match(inventoryApiSource, /function normalizeInventoryItem/);
    assert.match(inventoryApiSource, /code:\s*cleanText\(item\.code/);
    assert.match(inventoryApiSource, /title:\s*cleanText\(item\.name/);
    assert.match(inventoryApiSource, /spec:\s*cleanText\(item\.color/);
    assert.match(inventoryApiSource, /pieceText:\s*cleanText\(item\.box_spec/);
    assert.match(inventoryApiSource, /qtyShop:\s*formatQty\(item\.qty_shop/);
    assert.match(inventoryApiSource, /qtyBaixin:\s*formatQty\(item\.qty_baixin/);
    assert.match(inventoryApiSource, /totalQty:\s*formatQty\(item\.total_qty/);
  });
});
