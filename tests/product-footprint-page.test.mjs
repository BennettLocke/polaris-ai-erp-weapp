import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../', import.meta.url);
const pageUrl = new URL('src/pages/product/footprint.vue', root);
const pagesUrl = new URL('src/pages.json', root);
const routesUrl = new URL('src/utils/route.js', root);

const page = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf8') : '';
const pages = existsSync(pagesUrl) ? readFileSync(pagesUrl, 'utf8') : '';
const routes = existsSync(routesUrl) ? readFileSync(routesUrl, 'utf8') : '';

describe('product footprint page', () => {
  it('registers a non-tab product footprint page and route helper', () => {
    const tabBarSet = routes.match(/const TAB_BAR_PATHS = new Set\(\[[\s\S]*?\]\);/);
    assert.ok(existsSync(pageUrl));
    assert.match(pages, /"path":\s*"pages\/product\/footprint"/);
    assert.match(routes, /productFootprint:\s*['"]\/pages\/product\/footprint['"]/);
    assert.match(routes, /buildProductFootprintUrl/);
    assert.ok(tabBarSet);
    assert.doesNotMatch(tabBarSet[0], /PAGE_ROUTES\.productFootprint/);
  });

  it('renders favorites recent and frequent product tabs from footprint storage', () => {
    assert.match(page, /name:\s*['"]ProductFootprintPage['"]/);
    assert.match(page, /activeTab/);
    assert.match(page, /footprintTabs/);
    assert.match(page, /favorites/);
    assert.match(page, /recent/);
    assert.match(page, /frequent/);
    assert.match(page, /getProductFootprint/);
    assert.match(page, /rankFrequentProducts/);
    assert.match(page, /SjCategoryProductCard/);
    assert.match(page, /visibleProducts/);
  });

  it('supports query-selected tabs refreshing on show and clearing recent views', () => {
    assert.match(page, /onLoad\(query = \{\}\)/);
    assert.match(page, /normalizeTab\(query\.tab\)/);
    assert.match(page, /onShow\(\)/);
    assert.match(page, /loadFootprint\(/);
    assert.match(page, /clearRecent\(/);
    assert.match(page, /clearProductRecentViews/);
    assert.match(page, /uni\.showModal/);
  });

  it('shows footprint product cards without adding another favorite button location', () => {
    assert.doesNotMatch(page, /show-favorite/);
    assert.doesNotMatch(page, /:favorite=/);
    assert.doesNotMatch(page, /@favorite=/);
    assert.doesNotMatch(page, /toggleProductFavorite/);
    assert.doesNotMatch(page, /favoriteIds/);
  });
});
