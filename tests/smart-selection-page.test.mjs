import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../', import.meta.url);

function read(relativePath) {
  const fileUrl = new URL(relativePath, root);
  return existsSync(fileUrl) ? readFileSync(fileUrl, 'utf8') : '';
}

const pagesConfig = JSON.parse(read('src/pages.json'));
const routesSource = read('src/utils/route.js');
const homePage = read('src/pages/home/index.vue');
const categoryPage = read('src/pages/category/index.vue');
const smartPage = read('src/pages/product/smart-select.vue');
const smartSharePage = read('src/pages/product/smart-select-share.vue');
const smartFab = read('src/components/SjSmartSelectFab.vue');
const detailPage = read('src/pages/product/detail.vue');
const productListPage = read('src/pages/product/list.vue');
const footprintPage = read('src/pages/product/footprint.vue');

describe('smart selection page and entry points', () => {
  it('registers the smart selection page as a non-tab product page', async () => {
    const pagePaths = pagesConfig.pages.map((page) => page.path);
    const tabBarPaths = pagesConfig.tabBar.list.map((item) => item.pagePath);
    const routeHelpers = await import('../src/utils/route.js');

    assert.ok(pagePaths.includes('pages/product/smart-select'));
    assert.ok(pagePaths.includes('pages/product/smart-select-share'));
    assert.equal(tabBarPaths.includes('pages/product/smart-select'), false);
    assert.equal(tabBarPaths.includes('pages/product/smart-select-share'), false);
    assert.match(routesSource, /productSmartSelect:\s*['"]\/pages\/product\/smart-select['"]/);
    assert.match(routesSource, /productSmartSelectShare:\s*['"]\/pages\/product\/smart-select-share['"]/);
    assert.equal(typeof routeHelpers.buildProductSmartSelectUrl, 'function');
    assert.equal(typeof routeHelpers.buildProductSmartSelectShareUrl, 'function');
    assert.equal(routeHelpers.buildProductSmartSelectUrl(), '/pages/product/smart-select');
  });

  it('adds a floating Smart Selection entry only on home and category pages', () => {
    const fabBlock = smartFab.match(/\.sj-smart-select-fab\s*\{[^}]*\}/)?.[0] || '';
    const dividerBlock = smartFab.match(/\.sj-smart-select-fab__divider\s*\{[^}]*\}/)?.[0] || '';

    assert.match(smartFab, /name:\s*['"]SjSmartSelectFab['"]/);
    assert.match(smartFab, /emits:\s*\[[^\]]*['"]back-top['"][^\]]*\]/);
    assert.match(smartFab, /智能选品/);
    assert.match(smartFab, />顶部</);
    assert.match(smartFab, /sj-smart-select-fab__action--select/);
    assert.match(smartFab, /sj-smart-select-fab__action--top/);
    assert.match(smartFab, /sj-smart-select-fab__icon-wrap/);
    assert.match(smartFab, /sj-smart-select-fab__divider/);
    assert.match(smartFab, /pencil-ruler\.svg/);
    assert.match(smartFab, /background:\s*#ffffff/);
    assert.match(smartFab, /right:\s*48rpx/);
    assert.match(smartFab, /width:\s*90rpx/);
    assert.match(smartFab, /min-height:\s*184rpx/);
    assert.match(smartFab, /border-radius:\s*999px/);
    assert.match(smartFab, /font-size:\s*20rpx/);
    assert.doesNotMatch(fabBlock, /\bborder:\s*[^;]+;/);
    assert.match(fabBlock, /box-shadow:\s*0 16rpx 42rpx rgba\(24,\s*24,\s*27,\s*0\.14\)/);
    assert.match(dividerBlock, /linear-gradient/);
    assert.match(smartFab, /buildProductSmartSelectUrl/);
    assert.match(smartFab, /navigateToPage/);
    assert.match(smartFab, /\$emit\(['"]back-top['"]\)/);

    assert.match(homePage, /import SjSmartSelectFab/);
    assert.match(homePage, /<sj-smart-select-fab\s+@back-top="backToTop"\s*\/>/);
    assert.match(homePage, /backToTop\(\)/);
    assert.match(homePage, /uni\.pageScrollTo\(\{\s*scrollTop:\s*0,\s*duration:\s*240\s*\}\)/);
    assert.match(categoryPage, /import SjSmartSelectFab/);
    assert.match(categoryPage, /<sj-smart-select-fab\s+@back-top="backToTop"\s*\/>/);
    assert.match(categoryPage, /backToTop\(\)/);
    assert.match(categoryPage, /this\.contentScrollTop = this\.contentScrollTop === 0 \? 1 : 0/);
    assert.match(categoryPage, /this\.contentScrollTop = 0/);

    for (const [label, source] of [
      ['detail page', detailPage],
      ['product list page', productListPage],
      ['footprint page', footprintPage],
    ]) {
      assert.doesNotMatch(source, /SjSmartSelectFab|<sj-smart-select-fab|智能选品|buildProductSmartSelectUrl/, `${label} should not render smart selection entry`);
    }
  });

  it('renders a three-step rule wizard and in-page recommendations', () => {
    assert.match(smartPage, /name:\s*['"]ProductSmartSelectPage['"]/);
    assert.match(smartPage, /礼盒大小/);
    assert.match(smartPage, /颜色/);
    assert.match(smartPage, /价格/);
    assert.match(smartPage, /推荐商品/);
    assert.match(smartPage, /同规格近似推荐/);
    assert.match(smartPage, /SjCategoryProductCard/);
    assert.match(smartPage, /getCategories/);
    assert.match(smartPage, /getProductDetail/);
    assert.match(smartPage, /getProducts/);
    assert.match(smartPage, /resolveSmartGiftSizeOptions/);
    assert.match(smartPage, /buildSmartSelectionColorOptions/);
    assert.match(smartPage, /buildSmartSelectionDisplayProducts/);
    assert.match(smartPage, /buildSmartSelectionPriceRangeOptions/);
    assert.match(smartPage, /recommendSmartSelectionProducts/);
    assert.match(smartPage, /CUSTOM_PRICE_RANGE_VALUE/);
    assert.match(smartPage, /smart-select-page__custom-price/);
    assert.match(smartPage, /customPriceMin/);
    assert.match(smartPage, /customPriceMax/);
    assert.match(smartPage, /recommendationDetailMap/);
    assert.match(smartPage, /recommendationDetailRequestId/);
    assert.match(smartPage, /loadingRecommendationDetails/);
    assert.match(smartPage, /type="digit"/);
    assert.match(smartPage, /enablePageShare\(\)/);
    assert.match(smartPage, /onShareAppMessage\(\)/);
    assert.match(smartPage, /onShareTimeline\(\)/);
    assert.match(smartPage, /open-type="share"/);
    assert.match(smartPage, /分享选品/);
    assert.match(smartPage, /smart-select-page__share-button/);
    assert.match(smartPage, /smartSelectSharePosterCanvas/);
    assert.match(smartPage, /SMART_SELECTION_SHARE_IMAGE/);
    assert.match(smartPage, /buildProductSmartSelectShareUrl/);
    assert.match(smartPage, /shareSelectionUrl\(\)/);
    assert.match(smartPage, /createSmartSelectSharePoster/);
  });

  it('loads all products for a selected gift size and refreshes recommendations after each choice', () => {
    assert.match(smartPage, /selectGiftSize\(item\)/);
    assert.match(smartPage, /loadSelectedSizeProducts\(/);
    assert.match(smartPage, /page_size:\s*100/);
    assert.match(smartPage, /category_id:\s*this\.selectedSize\.categoryId/);
    assert.match(smartPage, /selectColor\(item\)/);
    assert.match(smartPage, /selectPriceRange\(item\)/);
    assert.match(smartPage, /:key="productCardKey\(item\)"/);
    assert.match(smartPage, /productCardKey\(item/);
    assert.match(smartPage, /selectedColorValue/);
    assert.match(smartPage, /smartSelectionCover \|\| item\.cover/);
    assert.match(smartPage, /this\.customPriceMin = ''/);
    assert.match(smartPage, /this\.customPriceMax = ''/);
    assert.match(smartPage, /this\.recommendationDetailMap = \{\}/);
    assert.match(smartPage, /priceRangeOptions\(\)/);
    assert.match(smartPage, /customPriceRange\(\)/);
    assert.match(smartPage, /buildSmartSelectionDisplayProducts\(this\.recommendationResult\.products[^)]*this\.recommendationDetailMap/s);
    assert.match(smartPage, /refreshRecommendationDetails\(\)/);
    assert.match(smartPage, /Promise\.allSettled/);
    assert.match(smartPage, /loadingProducts \|\| loadingRecommendationDetails/);
    assert.match(smartPage, /recommendations\(\)/);
    assert.match(smartPage, /recommendationResult\.matchType === 'nearby'/);
  });

  it('renders a dedicated smart selection share landing page from encoded filters', () => {
    assert.match(smartSharePage, /name:\s*['"]ProductSmartSelectSharePage['"]/);
    assert.match(smartSharePage, /decodeRouteQueryValue/);
    assert.match(smartSharePage, /selectedSizeKey/);
    assert.match(smartSharePage, /selectedCategoryId/);
    assert.match(smartSharePage, /selectedColorValue/);
    assert.match(smartSharePage, /selectedPriceRangeValue/);
    assert.match(smartSharePage, /customPriceMin/);
    assert.match(smartSharePage, /customPriceMax/);
    assert.match(smartSharePage, /getCategories/);
    assert.match(smartSharePage, /getProducts/);
    assert.match(smartSharePage, /getProductDetail/);
    assert.match(smartSharePage, /recommendSmartSelectionProducts/);
    assert.match(smartSharePage, /buildSmartSelectionDisplayProducts/);
    assert.match(smartSharePage, /this\.recommendationDetailMap/);
    assert.match(smartSharePage, /重新选品/);
    assert.match(smartSharePage, /navigateToPage\(PAGE_ROUTES\.productSmartSelect\)/);
    assert.match(smartSharePage, /onShareAppMessage\(\)/);
    assert.match(smartSharePage, /onShareTimeline\(\)/);
    assert.match(smartSharePage, /enablePageShare\(\)/);
  });
});
