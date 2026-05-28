import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const productListSource = readFileSync(new URL('../src/pages/product/list.vue', import.meta.url), 'utf8');
const categoryProductCardSource = readFileSync(new URL('../src/components/SjCategoryProductCard.vue', import.meta.url), 'utf8');
const pagesJsonSource = readFileSync(new URL('../src/pages.json', import.meta.url), 'utf8');

describe('product list search page', () => {
  it('uses the shared search and category product card components', () => {
    assert.match(productListSource, /import SjSearchBar/);
    assert.match(productListSource, /import SjCategoryProductCard/);
    assert.match(productListSource, /components:\s*\{[^}]*SjSearchBar[^}]*SjCategoryProductCard[^}]*\}/s);
    assert.match(productListSource, /<sj-search-bar/);
    assert.match(productListSource, /<sj-category-product-card/);
    assert.doesNotMatch(productListSource, /import ProductCard/);
    assert.doesNotMatch(productListSource, /<product-card/);
  });

  it('places the product code badge above titles on search result cards', () => {
    assert.match(productListSource, /<sj-category-product-card[\s\S]*code-position="top"[\s\S]*\/>/);
  });

  it('shows color option counts beside search result codes only when there are multiple colors', () => {
    const colorBadgeBlock = categoryProductCardSource.match(/colorOptionBadgeText\(\)\s*\{[\s\S]*?\n    \},/)?.[0] || '';

    assert.match(categoryProductCardSource, /colorOptionBadgeText\(\)/);
    assert.match(categoryProductCardSource, /v-if="colorOptionBadgeText"/);
    assert.match(categoryProductCardSource, /sj-category-product-card__badge--option/);
    assert.match(colorBadgeBlock, /色可选/);
    assert.match(colorBadgeBlock, />\s*1/);
    assert.doesNotMatch(categoryProductCardSource, /specCount|spec_count/);
    assert.doesNotMatch(categoryProductCardSource, /giftBoxSizeBadgeText/);
    assert.doesNotMatch(categoryProductCardSource, /categoryBadgeText\(\)/);
    assert.match(
      categoryProductCardSource,
      /showTopBadges[\s\S]*colorOptionBadgeText[\s\S]*showFooterBadges[\s\S]*this\.codePosition !== 'top'/
    );
  });

  it('aligns search result pack text and price on the same bottom row', () => {
    const topMetaBlock = [...categoryProductCardSource.matchAll(/\.sj-category-product-card__top-meta\s*\{[^}]*\}/g)]
      .map((match) => match[0])
      .find((block) => /display:\s*flex/.test(block)) || '';

    assert.match(categoryProductCardSource, /showTopMeta/);
    assert.match(
      categoryProductCardSource,
      /v-if="showTopMeta"[\s\S]*sj-category-product-card__detail--pack[\s\S]*sj-category-product-card__price[\s\S]*v-else[\s\S]*sj-category-product-card__detail--pack[\s\S]*sj-category-product-card__footer/
    );
    assert.match(topMetaBlock, /display:\s*flex/);
    assert.match(topMetaBlock, /align-items:\s*flex-end/);
    assert.match(topMetaBlock, /justify-content:\s*space-between/);
  });

  it('renders a custom capsule-aligned full-category search screen', () => {
    assert.match(pagesJsonSource, /"path":\s*"pages\/product\/list"[\s\S]*"navigationStyle":\s*"custom"/);
    assert.match(productListSource, /class="search-custom-nav"[\s\S]*:style="navShellStyle"/);
    assert.match(productListSource, /class="search-back"[\s\S]*:style="backStyle"[\s\S]*@tap="goBack"/);
    assert.match(productListSource, /class="search-nav-input"[\s\S]*:style="navSearchStyle"[\s\S]*:height="navLayout\.height"[\s\S]*:value="keyword"[\s\S]*@search="submitSearch"/);
    assert.doesNotMatch(productListSource, /class="search-cancel"/);
    assert.doesNotMatch(productListSource, /cancelStyle/);
    assert.match(productListSource, /setupNavLayout\(\)/);
    assert.match(productListSource, /getMenuButtonBoundingClientRect/);
    assert.match(productListSource, /search-page__body/);
  });

  it('keeps search results all-category, sortable, and loaded only after search', () => {
    assert.match(productListSource, /searched:\s*false/);
    assert.match(productListSource, /v-if="!searched"/);
    assert.match(productListSource, /v-else-if="products\.length"/);
    assert.match(productListSource, /sortOptions/);
    assert.match(productListSource, /activeSort:\s*'sales'/);
    assert.match(productListSource, /sort:\s*this\.activeSort/);
    assert.match(productListSource, /keyword:\s*this\.requestKeyword/);
    assert.match(productListSource, /page_size:\s*20/);
    assert.match(productListSource, /if \(this\.keyword \|\| this\.categoryId\) this\.reload\(\)/);
  });

  it('decodes route keywords before showing them or sending them to search', () => {
    assert.match(productListSource, /function decodeRouteQueryValue\(value\)/);
    assert.match(productListSource, /decodeURIComponent/);
    assert.match(productListSource, /this\.keyword = decodeRouteQueryValue\(query && query\.keyword\)/);
    assert.match(productListSource, /this\.categoryId = decodeRouteQueryValue\(query && query\.category_id\)/);
  });

  it('maps hot search chips such as half-jin gift boxes to category product results', () => {
    assert.match(productListSource, /import \{ getCategories \} from '..\/..\/api\/categories'/);
    assert.match(productListSource, /hotKeywords:\s*\[/);
    assert.match(productListSource, /label:\s*'半斤礼盒'[\s\S]*categoryNames:\s*\['半斤礼盒'\]/);
    assert.match(productListSource, /chipLabel\(item\)/);
    assert.match(productListSource, /:key="chipKey\(item, index\)"/);
    assert.match(productListSource, /@tap="selectKeyword\(item\)"/);
    assert.match(productListSource, /async resolveHotKeywordCategoryId\(item\)/);
    assert.match(productListSource, /await getCategories\(\)/);
    assert.match(productListSource, /this\.categoryId = categoryId/);
    assert.match(productListSource, /categorySearchLabel:\s*''/);
    assert.match(productListSource, /requestKeyword\(\)/);
    assert.match(productListSource, /this\.keyword = label/);
    assert.match(productListSource, /this\.categorySearchLabel = label/);
    assert.match(productListSource, /this\.saveKeyword\(label\)/);
    assert.match(productListSource, /return this\.reload\(\)/);
  });

  it('does not show fake pack text for bubble bag products', () => {
    assert.match(productListSource, /SjCategoryProductCard/);
    assert.doesNotMatch(productListSource, /specText \|\| simple_desc/);
    assert.doesNotMatch(productListSource, /规格确认/);
    assert.doesNotMatch(productListSource, /按规格确认/);
  });
});
