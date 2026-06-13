import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../', import.meta.url);

function source(path) {
  const url = new URL(path, root);
  return existsSync(url) ? readFileSync(url, 'utf8') : '';
}

const detailPage = source('src/pages/product/detail.vue');
const card = source('src/components/SjCategoryProductCard.vue');
const categoryPage = source('src/pages/category/index.vue');
const listPage = source('src/pages/product/list.vue');
const homePage = source('src/pages/home/index.vue');
const myPage = source('src/pages/my/index.vue');
const myComponent = source('src/components/SjMyPage.vue');
const footprintPage = source('src/pages/product/footprint.vue');
const salesOrdersApi = source('src/api/sales-orders.js');

function assertNoFavoriteButton(page, label) {
  assert.doesNotMatch(page, /show-favorite/, `${label} must not render favorite buttons`);
  assert.doesNotMatch(page, /:favorite=/, `${label} must not pass favorite state to cards`);
  assert.doesNotMatch(page, /@favorite=/, `${label} must not toggle favorites from cards`);
  assert.doesNotMatch(page, /toggleProductFavorite/, `${label} must not toggle favorites outside detail page`);
  assert.doesNotMatch(page, /favoriteProductIds/, `${label} must not manage card favorite state`);
  assert.doesNotMatch(page, /favoriteIds/, `${label} must not manage card favorite state`);
}

describe('product footprint scene integration', () => {
  it('records product detail views and exposes a detail-page favorite action', () => {
    assert.match(detailPage, /getAuthState/);
    assert.match(detailPage, /recordProductView/);
    assert.match(detailPage, /isProductFavorite/);
    assert.match(detailPage, /toggleProductFavorite/);
    assert.match(detailPage, /favoriteActive/);
    assert.match(detailPage, /:actions="detailBottomActions"/);
    assert.match(detailPage, /detailBottomActions\(\)/);
    assert.match(detailPage, /key:\s*['"]favorite['"]/);
    assert.match(detailPage, /if \(key === ['"]favorite['"]\)/);
    assert.doesNotMatch(detailPage, /summary-favorite/);
    assert.match(detailPage, /recordCurrentProductView\(\)/);
    assert.match(detailPage, /syncFavoriteState\(\)/);
  });

  it('keeps favorite entry only on product detail bottom actions', () => {
    assert.doesNotMatch(card, /showFavorite|sj-category-product-card__favorite|@tap\.stop="emitFavorite"|emits:\s*\[[^\]]*['"]favorite['"]/s);
    assertNoFavoriteButton(categoryPage, 'category page');
    assertNoFavoriteButton(listPage, 'product list page');
    assertNoFavoriteButton(homePage, 'home page');
    assertNoFavoriteButton(footprintPage, 'product footprint page');
  });

  it('keeps product cards in category search list and home read-only for favorites', () => {
    assert.match(categoryPage, /SjCategoryProductCard/);
    assert.match(listPage, /SjCategoryProductCard/);
    assert.match(homePage, /SjCategoryProductCard/);
    assertNoFavoriteButton(categoryPage, 'category page');
    assertNoFavoriteButton(listPage, 'product list page');
    assertNoFavoriteButton(homePage, 'home page');
  });

  it('adds a My page product footprint entry that opens the footprint page', () => {
    assert.match(myComponent, /footprint/);
    assert.match(myComponent, /产品足迹/);
    assert.match(myComponent, /grid-2x2\.svg/);
    assert.match(myPage, /buildProductFootprintUrl/);
    assert.match(myPage, /case ['"]footprint['"]:/);
    assert.match(myPage, /navigateToPage\(buildProductFootprintUrl\(['"]favorites['"]\)\)/);
  });

  it('builds frequent products from both local footprint activity and sales-order products', () => {
    assert.match(salesOrdersApi, /export function flattenSalesOrderProducts/);
    assert.match(salesOrdersApi, /order\.products|order\.items|order\.goods/);
    assert.match(footprintPage, /getMySalesOrders/);
    assert.match(footprintPage, /flattenSalesOrderProducts/);
    assert.match(footprintPage, /mergeSalesOrderFrequentProducts/);
    assert.match(footprintPage, /salesProducts/);
    assert.match(footprintPage, /rankFrequentProducts\(footprint,\s*this\.salesProducts/);
  });
});
