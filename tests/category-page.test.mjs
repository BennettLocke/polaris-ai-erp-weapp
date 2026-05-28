import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const categoryPageSource = readFileSync(new URL('../src/pages/category/index.vue', import.meta.url), 'utf8');
const categoryProductCardSource = readFileSync(new URL('../src/components/SjCategoryProductCard.vue', import.meta.url), 'utf8');
const pagesConfigSource = readFileSync(new URL('../src/pages.json', import.meta.url), 'utf8');
const searchBarUrl = new URL('../src/components/SjSearchBar.vue', import.meta.url);
const searchBarSource = existsSync(searchBarUrl) ? readFileSync(searchBarUrl, 'utf8') : '';

describe('category page', () => {
  it('does not render an all-products category or category counts', () => {
    assert.doesNotMatch(categoryPageSource, /全部商品/);
    assert.doesNotMatch(categoryPageSource, /side-count/);
    assert.doesNotMatch(categoryPageSource, /content-total/);
    assert.doesNotMatch(categoryPageSource, /共\s*\$\{.*?\}\s*款产品/);
  });

  it('uses active category images for selected sidebar items', () => {
    assert.match(categoryPageSource, /categoryThumb\(/);
    assert.match(categoryPageSource, /item\.activeImage/);
  });

  it('preloads normal and active category sidebar images', () => {
    assert.match(categoryPageSource, /import\s+\{\s*buildCategoryIconUrl,\s*isJpegImageUrl\s*\}/);
    assert.match(categoryPageSource, /categoryPreloadImages\(/);
    assert.match(categoryPageSource, /preloadCategoryImages\(/);
    assert.match(categoryPageSource, /buildCategoryIconUrl\(src\)/);
    assert.match(categoryPageSource, /isJpegImageUrl\(item\.activeImage\)/);
    assert.match(categoryPageSource, /uni\.getImageInfo/);
  });

  it('centers the selected sidebar category instead of scrolling it to the top', () => {
    assert.doesNotMatch(categoryPageSource, /scroll-into-view/);
    assert.match(categoryPageSource, /:scroll-top="sideScrollTop"/);
    assert.match(categoryPageSource, /centerSideCategory\(/);
    assert.match(categoryPageSource, /getSideViewportHeight\(/);
  });

  it('uses a narrower sidebar with balanced category icons and PingFang-first typography', () => {
    const sideShellBlock = categoryPageSource.match(/\.side-shell\s*\{[^}]*\}/)?.[0] || '';
    const sideBlock = categoryPageSource.match(/\.side\s*\{[^}]*\}/)?.[0] || '';
    const sideThumbBlock = categoryPageSource.match(/\.side-thumb\s*\{[^}]*\}/)?.[0] || '';
    const sideThumbImageBlock = categoryPageSource.match(/\.side-thumb-image\s*\{[^}]*\}/)?.[0] || '';

    assert.match(categoryPageSource, /<view class="side-shell">[\s\S]*<scroll-view[\s\S]*class="side"/);
    assert.match(sideShellBlock, /width:\s*150rpx/);
    assert.match(sideShellBlock, /background:\s*#ffffff/);
    assert.match(sideBlock, /width:\s*100%/);
    assert.match(sideThumbBlock, /width:\s*66rpx/);
    assert.match(sideThumbBlock, /height:\s*66rpx/);
    assert.match(sideThumbImageBlock, /width:\s*64rpx/);
    assert.match(sideThumbImageBlock, /height:\s*64rpx/);
    assert.match(categoryPageSource, /font-family:\s*"PingFang SC"/);
  });

  it('renders a capsule-aligned search entry in a custom navigation bar', () => {
    const pagesConfig = JSON.parse(pagesConfigSource);
    const categoryPageConfig = pagesConfig.pages.find((page) => page.path === 'pages/category/index');

    assert.equal(categoryPageConfig?.style?.navigationStyle, 'custom');
    assert.match(categoryPageSource, /import SjSearchBar/);
    assert.match(categoryPageSource, /components:\s*\{[^}]*SjSearchBar[^}]*\}/);
    assert.match(
      categoryPageSource,
      /<view class="category-custom-nav"[\s\S]*:style="navShellStyle"[\s\S]*<sj-search-bar[\s\S]*class="category-nav-search"[\s\S]*:style="navSearchStyle"[\s\S]*:height="navLayout\.height"[\s\S]*placeholder="搜索编号、名称、规格"[\s\S]*@search="openSearch"[\s\S]*\/>[\s\S]*<\/view>[\s\S]*<view class="category-main">/
    );
    assert.match(categoryPageSource, /setupNavLayout\(/);
    assert.match(categoryPageSource, /uni\.getMenuButtonBoundingClientRect/);
    assert.match(categoryPageSource, /uni\.getSystemInfoSync/);
    assert.match(categoryPageSource, /navHeight:\s*105/);
    assert.match(categoryPageSource, /Math\.max\(105,/);
    assert.match(categoryPageSource, /navSearchStyle\(\)/);
    assert.match(categoryPageSource, /navShellStyle\(\)/);
    assert.doesNotMatch(categoryPageSource, /category-search-shell/);
    assert.match(categoryPageSource, /buildProductListUrl/);
    assert.match(categoryPageSource, /openSearch\(keyword/);
    assert.match(categoryPageSource, /buildProductListUrl\(\{ keyword \}\)/);
    assert.doesNotMatch(categoryPageSource, /buildProductListUrl\(\{ keyword,\s*category_id/);
  });

  it('keeps the search bar visually aligned with the catalog card style', () => {
    const pageBlock = categoryPageSource.match(/\.category-page\s*\{[^}]*\}/)?.[0] || '';
    const mainBlock = categoryPageSource.match(/\.category-main\s*\{[^}]*\}/)?.[0] || '';
    const navBlock = categoryPageSource.match(/\.category-custom-nav\s*\{[^}]*\}/)?.[0] || '';
    const navSearchBlock = categoryPageSource.match(/\.category-nav-search\s*\{[^}]*\}/)?.[0] || '';
    const rootBlock = searchBarSource.match(/\.sj-search-bar\s*\{[^}]*\}/)?.[0] || '';
    const inputBlock = searchBarSource.match(/\.sj-search-bar__input\s*\{[^}]*\}/)?.[0] || '';
    const iconBlock = searchBarSource.match(/\.sj-search-bar__icon\s*\{[^}]*\}/)?.[0] || '';

    assert.match(pageBlock, /flex-direction:\s*column/);
    assert.match(mainBlock, /display:\s*flex/);
    assert.match(mainBlock, /min-height:\s*0/);
    assert.match(navBlock, /position:\s*relative/);
    assert.match(navBlock, /flex:\s*none/);
    assert.match(navSearchBlock, /position:\s*absolute/);
    assert.match(navSearchBlock, /box-sizing:\s*border-box/);
    assert.match(searchBarSource, /name:\s*'SjSearchBar'/);
    assert.match(searchBarSource, /height:\s*\{/);
    assert.match(searchBarSource, /rootStyle\(\)/);
    assert.match(searchBarSource, /inputStyle\(\)/);
    assert.match(searchBarSource, /resolvePxSize/);
    assert.match(searchBarSource, /confirm-type="search"/);
    assert.match(searchBarSource, /\$emit\('search'/);
    assert.match(rootBlock, /height:\s*72rpx/);
    assert.match(rootBlock, /border:\s*1rpx solid #d9d9d9/);
    assert.match(rootBlock, /border-radius:\s*20px/);
    assert.match(rootBlock, /background:\s*#ffffff/);
    assert.match(rootBlock, /box-shadow:\s*none/);
    assert.match(inputBlock, /font-size:\s*24rpx/);
    assert.match(iconBlock, /border:\s*3rpx solid #a1a1aa/);
  });

  it('replaces the repeated category header with a compact product sorter', () => {
    const sortNavBlock = categoryPageSource.match(/\.sort-nav\s*\{[^}]*\}/)?.[0] || '';
    const sortLinkBlock = categoryPageSource.match(/\.sort-link\s*\{[^}]*\}/)?.[0] || '';
    const sortLinkActiveBlock = categoryPageSource.match(/\.sort-link\.active\s*\{[^}]*\}/)?.[0] || '';

    assert.doesNotMatch(categoryPageSource, /content-head/);
    assert.doesNotMatch(categoryPageSource, /content-title/);
    assert.doesNotMatch(categoryPageSource, /content-desc/);
    assert.doesNotMatch(categoryPageSource, /activeDesc/);
    assert.match(categoryPageSource, /sortOptions/);
    assert.match(categoryPageSource, /activeSort/);
    assert.match(categoryPageSource, /selectSort\(/);
    assert.match(categoryPageSource, /sort:\s*this\.activeSort/);
    assert.match(categoryPageSource, /综合/);
    assert.match(categoryPageSource, /最新/);
    assert.match(categoryPageSource, /价格/);
    assert.match(categoryPageSource, /\.sort-nav\s*\{/);
    assert.match(categoryPageSource, /\.sort-link\s*\{/);
    assert.match(categoryPageSource, /\.sort-link\.active\s*\{/);
    assert.match(categoryPageSource, /\.sort-link__indicator\s*\{/);
    assert.match(categoryPageSource, /v-if="activeSort === item\.value"/);
    assert.doesNotMatch(categoryPageSource, /\.sort-item/);
    assert.doesNotMatch(sortNavBlock, /border-radius:\s*999px/);
    assert.doesNotMatch(sortLinkBlock, /border-radius:\s*999px/);
    assert.doesNotMatch(sortLinkActiveBlock, /background:\s*#18181b/);
  });

  it('gives category product cards a cleaner catalog density', () => {
    const contentBlock = categoryPageSource.match(/\.content\s*\{[^}]*\}/)?.[0] || '';
    const productGridBlock = categoryPageSource.match(/\.product-grid\s*\{[^}]*\}/)?.[0] || '';
    const cardBlock = categoryProductCardSource.match(/\.sj-category-product-card\s*\{[^}]*\}/)?.[0] || '';
    const bodyBlock = categoryProductCardSource.match(/\.sj-category-product-card__body\s*\{[^}]*\}/)?.[0] || '';
    const swatchesBlock = categoryProductCardSource.match(/\.sj-category-product-card__swatches\s*\{[^}]*\}/)?.[0] || '';
    const badgeBlock = categoryProductCardSource.match(/\.sj-category-product-card__badge\s*\{[^}]*\}/)?.[0] || '';
    const titleBlock = categoryProductCardSource.match(/\.sj-category-product-card__title\s*\{[^}]*\}/)?.[0] || '';
    const titlePrefixBlock = categoryProductCardSource.match(/\.sj-category-product-card__title-prefix\s*\{[^}]*\}/)?.[0] || '';
    const bracketTitleBlock = categoryProductCardSource.match(/\.sj-category-product-card__title--bracket\s*\{[^}]*\}/)?.[0] || '';
    const bracketSiblingBlock = categoryProductCardSource.match(/\.sj-category-product-card__title--bracket ~ \.sj-category-product-card__detail,[\s\S]*?\.sj-category-product-card__title--bracket ~ \.sj-category-product-card__footer\s*\{[^}]*\}/)?.[0] || '';
    const detailBlock = categoryProductCardSource.match(/\.sj-category-product-card__detail\s*\{[^}]*\}/)?.[0] || '';
    const footerBlock = [...categoryProductCardSource.matchAll(/\.sj-category-product-card__footer\s*\{[^}]*\}/g)]
      .map((match) => match[0])
      .find((block) => /display:\s*flex/.test(block)) || '';
    const infoBadgesBlock = categoryProductCardSource.match(/\.sj-category-product-card__info-badges\s*\{[^}]*\}/)?.[0] || '';
    const priceBlock = categoryProductCardSource.match(/\.sj-category-product-card__price\s*\{[^}]*\}/)?.[0] || '';

    assert.match(contentBlock, /padding:\s*18rpx/);
    assert.match(productGridBlock, /box-sizing:\s*border-box/);
    assert.match(productGridBlock, /padding:\s*1rpx 2rpx 2rpx/);
    assert.match(productGridBlock, /gap:\s*14rpx/);
    assert.match(cardBlock, /border-radius:\s*10px/);
    assert.match(cardBlock, /border:\s*1rpx solid rgba\(24,\s*24,\s*27,\s*0\.08\)/);
    assert.doesNotMatch(cardBlock, /box-shadow:\s*0 0 0 1px/);
    assert.match(swatchesBlock, /right:\s*10px/);
    assert.match(swatchesBlock, /bottom:\s*10px/);
    assert.match(bodyBlock, /padding:\s*12px 12px 13px/);
    assert.match(bodyBlock, /gap:\s*6px/);
    assert.match(badgeBlock, /height:\s*18px/);
    assert.match(badgeBlock, /font-size:\s*11px/);
    assert.match(titleBlock, /font-size:\s*14px/);
    assert.match(titleBlock, /line-height:\s*19px/);
    assert.match(titleBlock, /font-weight:\s*700/);
    assert.match(bracketTitleBlock, /box-sizing:\s*border-box/);
    assert.match(bracketTitleBlock, /width:\s*calc\(100% \+ 9px\)/);
    assert.match(bracketTitleBlock, /margin-left:\s*-9px/);
    assert.match(bracketTitleBlock, /padding-left:\s*9px/);
    assert.match(categoryProductCardSource, /sj-category-product-card__title-prefix/);
    assert.match(titlePrefixBlock, /margin-left:\s*-9px/);
    assert.doesNotMatch(titlePrefixBlock, /font-weight:\s*800/);
    assert.match(bracketSiblingBlock, /margin-left:\s*-2px/);
    assert.match(detailBlock, /font-size:\s*12px/);
    assert.match(detailBlock, /line-height:\s*18px/);
    assert.match(footerBlock, /justify-content:\s*space-between/);
    assert.match(infoBadgesBlock, /justify-content:\s*flex-end/);
    assert.match(priceBlock, /font-size:\s*20px/);
  });

  it('uses a neutral gray page background instead of a warm beige base', () => {
    const pageBlock = categoryPageSource.match(/\.category-page\s*\{[^}]*\}/)?.[0] || '';

    assert.match(pageBlock, /background:\s*#f4f4f5/);
    assert.doesNotMatch(pageBlock, /background:\s*#f6f6f3/);
  });

  it('ends the sidebar scroller above the floating bottom navigation without padding the product grid', () => {
    const sideShellBlock = categoryPageSource.match(/\.side-shell\s*\{[^}]*\}/)?.[0] || '';
    const sideBlock = categoryPageSource.match(/\.side\s*\{[^}]*\}/)?.[0] || '';
    const contentBlock = categoryPageSource.match(/\.content\s*\{[^}]*\}/)?.[0] || '';

    assert.match(sideShellBlock, /height:\s*100%/);
    assert.match(sideShellBlock, /background:\s*#ffffff/);
    assert.match(sideBlock, /height:\s*calc\(100% - 190rpx - env\(safe-area-inset-bottom\)\)/);
    assert.doesNotMatch(sideBlock, /padding-bottom:\s*calc/);
    assert.match(categoryPageSource, /getSideBottomClearance\(/);
    assert.match(contentBlock, /padding:\s*18rpx/);
    assert.doesNotMatch(contentBlock, /env\(safe-area-inset-bottom\)/);
  });

  it('keeps category sidebar selection free of black frames and rails', () => {
    const sideThumbBlock = categoryPageSource.match(/\.side-thumb\s*\{[^}]*\}/)?.[0] || '';

    assert.doesNotMatch(categoryPageSource, /side-item\.active::before/);
    assert.doesNotMatch(categoryPageSource, /box-shadow:\s*inset 0 0 0 1rpx #18181b/);
    assert.doesNotMatch(categoryPageSource, /border-color:\s*#18181b/);
    assert.doesNotMatch(sideThumbBlock, /border:/);
    assert.doesNotMatch(sideThumbBlock, /background:/);
  });

  it('uses the component-library category product card for category products', () => {
    assert.match(categoryPageSource, /SjCategoryProductCard/);
    assert.match(categoryPageSource, /<sj-category-product-card/);
    assert.doesNotMatch(categoryPageSource, /<product-card/);

    assert.match(categoryProductCardSource, /formatPackText/);
    assert.match(categoryProductCardSource, /splitTitleParts/);
    assert.match(categoryProductCardSource, /titlePrefix\(\)/);
    assert.match(categoryProductCardSource, /titleName\(\)/);
    assert.match(categoryProductCardSource, /v-if="titlePrefix"/);
    assert.match(categoryProductCardSource, /sj-category-product-card__price/);
    assert.match(categoryProductCardSource, /v-if="hasModel"/);
    assert.match(categoryProductCardSource, /modelUrl\(\)/);
    assert.match(categoryProductCardSource, /sj-category-product-card__badge--model/);
    assert.match(categoryProductCardSource, /3D视图/);
    assert.doesNotMatch(categoryProductCardSource, /3D预览/);
    assert.match(categoryProductCardSource, /color:\s*#18181b/);
    assert.match(categoryProductCardSource, /font-weight:\s*800/);
  });

  it('keeps category-list cards focused on pack spec without category or color labels', () => {
    assert.doesNotMatch(categoryPageSource, /:current-category-name="activeName"/);
    assert.doesNotMatch(categoryProductCardSource, /visibleCategoryLabels/);
    assert.doesNotMatch(categoryProductCardSource, /colorText\(\)/);
    assert.doesNotMatch(categoryProductCardSource, /uniqueTextList/);
    assert.match(categoryProductCardSource, /colorOptionBadgeText\(\)/);
    assert.doesNotMatch(categoryPageSource, /code-position="top"/);
    assert.doesNotMatch(categoryProductCardSource, /sj-category-product-card__detail--colors/);
    assert.match(categoryProductCardSource, /visibleSwatches/);
    assert.match(categoryProductCardSource, /normalizeSwatch/);
    assert.match(categoryProductCardSource, /sj-category-product-card__swatches/);
    assert.match(categoryProductCardSource, /packText\(\)/);
    assert.match(categoryProductCardSource, /v-if="packText"/);
    assert.match(categoryProductCardSource, /sj-category-product-card__detail--pack/);
    assert.doesNotMatch(categoryProductCardSource, /this\.product\.specText \|\| this\.product\.simple_desc/);
    assert.doesNotMatch(categoryProductCardSource, /this\.product\.sizeLabel \|\| this\.product\.spec/);
  });

  it('keeps color swatches on the image and places sku badges in the info footer', () => {
    assert.match(categoryProductCardSource, /sj-category-product-card__swatches/);
    assert.match(categoryProductCardSource, /codePosition/);
    assert.match(categoryProductCardSource, /showTopBadges/);
    assert.match(categoryProductCardSource, /showFooterBadges/);
    assert.match(categoryProductCardSource, /sj-category-product-card__info-badges/);
    assert.match(categoryProductCardSource, /sj-category-product-card__top-badges/);
    assert.doesNotMatch(categoryProductCardSource, /sj-category-product-card__media-badges/);
    assert.doesNotMatch(categoryProductCardSource, /sj-category-product-card__badges/);
    assert.doesNotMatch(categoryPageSource, /code-position="top"/);
    assert.match(
      categoryProductCardSource,
      /sj-category-product-card__media[\s\S]*sj-category-product-card__swatches[\s\S]*sj-category-product-card__body[\s\S]*sj-category-product-card__title[\s\S]*sj-category-product-card__detail--pack[\s\S]*sj-category-product-card__footer[\s\S]*sj-category-product-card__price[\s\S]*sj-category-product-card__info-badges[\s\S]*sj-category-product-card__badge--code/
    );
  });

  it('uses the shared lightweight loading spinner while category products load', () => {
    assert.match(categoryPageSource, /import SjLoadingState/);
    assert.match(categoryPageSource, /components:\s*\{[^}]*SjLoadingState[^}]*\}/);
    assert.match(categoryPageSource, /<sj-loading-state[\s\S]*v-if="loading"/);
    assert.doesNotMatch(categoryPageSource, /加载中\.\.\./);
  });
});
