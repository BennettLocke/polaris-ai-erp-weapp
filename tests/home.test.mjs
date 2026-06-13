import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { buildHomePayload } from '../src/utils/home.js';

const homePageSource = readFileSync(new URL('../src/pages/home/index.vue', import.meta.url), 'utf8');
const homeApiSource = readFileSync(new URL('../src/api/home.js', import.meta.url), 'utf8');
const productsApiSource = readFileSync(new URL('../src/api/products.js', import.meta.url), 'utf8');
const pagesConfig = JSON.parse(readFileSync(new URL('../src/pages.json', import.meta.url), 'utf8'));

describe('buildHomePayload', () => {
  it('uses fixed miniapp navigation instead of DIY navigation data', () => {
    const payload = buildHomePayload({
      categories: [
        { id: '', name: 'Legacy aggregate' },
        { id: 12, name: '茶叶礼盒' },
        { id: 18, name: '气泡袋' },
      ],
      productPage: {
        data: [
          { id: 1, productName: '岩韵礼盒' },
          { id: 2, productName: '自封气泡袋' },
        ],
      },
      giftRecommendationPage: {
        data: [{ id: 'gift-1', productName: '礼盒热销 1' }],
      },
      pouchRecommendationPage: {
        data: [{ id: 'pouch-1', productName: '泡袋热销 1' }],
      },
      pvcRecommendationPage: {
        data: [{ id: 'pvc-1', productName: 'PVC热销 1' }],
      },
    });

    assert.deepEqual(payload.navs.map((item) => item.title), ['分类', '订单', '我的', '搜索']);
    assert.deepEqual(payload.navs.map((item) => item.url), [
      '/pages/category/index',
      '/pages/orderflow/index',
      '/pages/my/index',
      '/pages/product/list',
    ]);
  });

  it('keeps categories and recommended products in a stable shape', () => {
    const payload = buildHomePayload({
      categories: [
        { id: '', name: 'Legacy aggregate' },
        { id: 7, name: '礼盒' },
        { id: 8, name: '泡袋' },
        { id: 9, name: '纸盒' },
        { id: 10, name: '耗材' },
      ],
      productPage: {
        data: Array.from({ length: 10 }, (_, index) => ({
          id: index + 1,
          productName: `产品 ${index + 1}`,
        })),
        total: 20,
      },
    });

    assert.equal(payload.mode, 'code');
    assert.equal(payload.source, 'sjagent');
    assert.deepEqual(payload.categories.map((item) => item.name), ['礼盒', '泡袋', '纸盒', '耗材']);
    assert.equal(payload.products.length, 8);
    assert.equal(payload.productPage.total, 20);
  });

  it('builds featured, new, hot and recommended product sections in order', () => {
    const payload = buildHomePayload({
      productPage: {
        data: [
          { id: 'r1', productName: '推荐 1' },
          { id: 'r2', productName: '推荐 2' },
        ],
      },
      featuredProductPage: {
        data: Array.from({ length: 5 }, (_, index) => ({
          id: `feature-${index + 1}`,
          productName: `主推 ${index + 1}`,
        })),
      },
      newProductPage: {
        data: Array.from({ length: 12 }, (_, index) => ({
          id: `new-${index + 1}`,
          productName: `新款 ${index + 1}`,
        })),
      },
      giftRecommendationPage: {
        data: [{ id: 'gift-1', productName: '礼盒热销 1' }],
      },
      pouchRecommendationPage: {
        data: [{ id: 'pouch-1', productName: '泡袋热销 1' }],
      },
      pvcRecommendationPage: {
        data: [{ id: 'pvc-1', productName: 'PVC热销 1' }],
      },
    });

    assert.equal(payload.featuredProducts.length, 4);
    assert.deepEqual(payload.featuredProducts.map((item) => item.id), [
      'feature-1',
      'feature-2',
      'feature-3',
      'feature-4',
    ]);
    assert.equal(payload.newProducts.length, 6);
    assert.deepEqual(payload.newProducts.map((item) => item.id), [
      'new-1',
      'new-2',
      'new-3',
      'new-4',
      'new-5',
      'new-6',
    ]);
    assert.equal(payload.hotProducts.length, 6);
    assert.deepEqual(payload.hotProducts.map((item) => item.id), [
      'new-7',
      'new-8',
      'new-9',
      'new-10',
      'new-11',
      'new-12',
    ]);
    assert.deepEqual(payload.giftRecommendedProducts.map((item) => item.id), ['gift-1']);
    assert.deepEqual(payload.pouchRecommendedProducts.map((item) => item.id), ['pouch-1']);
    assert.deepEqual(payload.pvcRecommendedProducts.map((item) => item.id), ['pvc-1']);
    assert.deepEqual(payload.sections.slice(0, 6).map((section) => section.key), [
      'featured_series',
      'new_products',
      'hot_products',
      'gift_recommendations',
      'pouch_recommendations',
      'pvc_recommendations',
    ]);
  });

  it('uses sales analytics items as the explicit hot product source', () => {
    const payload = buildHomePayload({
      productPage: {
        data: [{ id: 'r1', productName: '鎺ㄨ崘 1' }],
      },
      newProductPage: {
        data: Array.from({ length: 8 }, (_, index) => ({
          id: `new-${index + 1}`,
          productName: `鏂版 ${index + 1}`,
        })),
      },
      hotProductPage: {
        items: Array.from({ length: 3 }, (_, index) => ({
          id: `hot-${index + 1}`,
          productName: `鐑攢 ${index + 1}`,
          sold_qty: 100 - index,
        })),
      },
    });

    assert.deepEqual(payload.hotProducts.map((item) => item.id), ['hot-1', 'hot-2', 'hot-3']);
    assert.deepEqual(payload.sections.find((section) => section.key === 'hot_products')?.products.map((item) => item.id), [
      'hot-1',
      'hot-2',
      'hot-3',
    ]);
  });

  it('falls back to latest PVC products when PVC has no 7-day sales', () => {
    const payload = buildHomePayload({
      pvcRecommendationPage: {
        data: [],
      },
      pvcRecommendationFallbackPage: {
        data: [
          { id: 'pvc-latest-1', productName: 'PVC 最新 1' },
          { id: 'pvc-latest-2', productName: 'PVC 最新 2' },
        ],
      },
    });

    assert.deepEqual(payload.pvcRecommendedProducts.map((item) => item.id), ['pvc-latest-1', 'pvc-latest-2']);
    assert.deepEqual(
      payload.sections.find((section) => section.key === 'pvc_recommendations')?.products.map((item) => item.id),
      ['pvc-latest-1', 'pvc-latest-2'],
    );
  });

  it('prefers database-backed miniapp visual config when available', () => {
    const payload = buildHomePayload({
      config: {
        banners: [{ image_url: 'https://img.example.test/banner.jpg' }],
        home_categories: [
          { id: 1, title: '半斤礼盒', badge_text: '30', subtitle: '泡包装礼盒', url: '/pages/product/list?keyword=%E5%8D%8A%E6%96%A4' },
        ],
      },
      categories: [{ id: 7, name: '旧分类' }],
      productPage: { data: [{ id: 1, productName: '产品' }] },
    });

    assert.equal(payload.banners[0].image_url, 'https://img.example.test/banner.jpg');
    assert.equal(payload.categories[0].title, '半斤礼盒');
    assert.equal(payload.categories[0].badge_text, '30');
    assert.equal(payload.categories[0].subtitle, '泡包装礼盒');
  });

  it('shares homepage category icons with the product category list', () => {
    const payload = buildHomePayload({
      config: {
        home_categories: [
          { id: 1, title: '半斤礼盒', badge_text: '30', subtitle: '泡包装礼盒', link_type: 'search', link_value: '半斤礼盒' },
          { id: 2, title: '三两礼盒', badge_text: '18', subtitle: '泡包装礼盒', link_type: 'search', link_value: '三两礼盒' },
        ],
      },
      categories: [
        {
          id: 11,
          name: '半斤礼盒',
          rawName: '半斤礼盒',
          image: 'https://img.example.test/category-half.png',
          activeImage: 'https://img.example.test/category-half-active.png',
        },
        {
          id: 12,
          name: '三两礼盒',
          rawName: '三两礼盒',
          image: 'https://img.example.test/category-three.png',
        },
      ],
    });

    assert.equal(payload.categories[0].category_id, 11);
    assert.equal(payload.categories[0].icon_url, 'https://img.example.test/category-half.png');
    assert.equal(payload.categories[0].active_icon_url, 'https://img.example.test/category-half-active.png');
    assert.equal(payload.categories[1].icon_url, 'https://img.example.test/category-three.png');
  });
});

describe('home page layout', () => {
  it('uses a custom search header aligned with the WeChat capsule', () => {
    const homeConfig = pagesConfig.pages.find((page) => page.path === 'pages/home/index');

    assert.equal(homeConfig?.style?.navigationStyle, 'custom');
    assert.match(homePageSource, /class="home-custom-nav"/);
    assert.match(homePageSource, /class="home-search-pill"/);
    assert.match(homePageSource, /class="home-search-button"/);
    assert.match(homePageSource, /setupNavLayout\(/);
    assert.match(homePageSource, /uni\.getMenuButtonBoundingClientRect/);
    assert.match(homePageSource, /openSearch\(\)/);
    assert.match(homePageSource, /syncCustomTabBar\(PAGE_ROUTES\.home\)/);
    assert.match(readFileSync(new URL('../src/api/home.js', import.meta.url), 'utf8'), /getMiniappConfig/);
    assert.match(readFileSync(new URL('../src/api/home.js', import.meta.url), 'utf8'), /\/api\/miniapp\/config/);
    assert.match(readFileSync(new URL('../src/api/home.js', import.meta.url), 'utf8'), /bottom_tabs/);
    assert.match(readFileSync(new URL('../src/api/home.js', import.meta.url), 'utf8'), /sj_mall_tabbar_items/);
  });

  it('requests the miniapp sales analytics endpoint for homepage hot products', () => {
    assert.match(productsApiSource, /function getHotProducts/);
    assert.match(productsApiSource, /\/api\/mini\/analytics\/hot-products/);
    assert.match(productsApiSource, /function enrichHotProductPage/);
    assert.match(productsApiSource, /\/api\/mini\/search\/datalist/);
    assert.match(productsApiSource, /sold_qty/);
    assert.match(productsApiSource, /image_url/);
    assert.match(homeApiSource, /FEATURED_HOT_CATEGORY_NAMES/);
    assert.match(homeApiSource, /'半斤礼盒'/);
    assert.match(homeApiSource, /'三两礼盒'/);
    assert.match(homeApiSource, /'二两礼盒'/);
    assert.match(homeApiSource, /'一两礼盒'/);
    assert.match(productsApiSource, /category_names:\s*params\.category_names/);
    assert.match(homeApiSource, /getHotProducts\(\{\s*period:\s*'30d',\s*limit:\s*6,\s*dimension:\s*'product',\s*category_names:\s*FEATURED_HOT_CATEGORY_NAMES\s*\}\)/);
    assert.match(homeApiSource, /getHotProducts\(\{\s*period:\s*'week',\s*limit:\s*6,\s*dimension:\s*'product',\s*category_names:\s*FEATURED_HOT_CATEGORY_NAMES\s*\}\)/);
    assert.match(homeApiSource, /GIFT_RECOMMEND_CATEGORY_NAMES/);
    assert.match(homeApiSource, /POUCH_RECOMMEND_CATEGORY_NAMES/);
    assert.match(homeApiSource, /PVC_RECOMMEND_CATEGORY_NAMES/);
    assert.match(homeApiSource, /getHotProducts\(\{\s*period:\s*'7d',\s*limit:\s*6,\s*dimension:\s*'product',\s*category_names:\s*GIFT_RECOMMEND_CATEGORY_NAMES\s*\}\)/);
    assert.match(homeApiSource, /function getLatestProductsByCategoryNames/);
    assert.match(homeApiSource, /getLatestProductsByCategoryNames\(categories,\s*POUCH_RECOMMEND_CATEGORY_NAMES,\s*6\)/);
    assert.doesNotMatch(homeApiSource, /getHotProducts\(\{\s*period:\s*'7d',\s*limit:\s*6,\s*dimension:\s*'product',\s*category_names:\s*POUCH_RECOMMEND_CATEGORY_NAMES\s*\}\)/);
    assert.match(homeApiSource, /getHotProducts\(\{\s*period:\s*'7d',\s*limit:\s*6,\s*dimension:\s*'product',\s*category_names:\s*PVC_RECOMMEND_CATEGORY_NAMES\s*\}\)/);
    assert.match(homeApiSource, /hotProductsResult/);
    assert.match(homeApiSource, /featuredHotProductsResult/);
    assert.match(homeApiSource, /hotProductPage/);
  });

  it('selects the featured series from the best-selling valid series', () => {
    assert.match(homeApiSource, /function selectFeaturedSeriesKeyword/);
    assert.match(homeApiSource, /DEFAULT_FEATURED_SERIES_KEYWORD/);
    assert.match(homeApiSource, /SKU_SERIES_PATTERN/);
    assert.match(homeApiSource, /extractSeriesKeyword/);
    assert.match(homeApiSource, /featuredHotProductPage/);
    assert.match(homeApiSource, /getProducts\(\{\s*page:\s*1,\s*page_size:\s*4,\s*keyword:\s*featuredKeyword\s*\}\)/);
    assert.doesNotMatch(homeApiSource, /getProducts\(\{\s*page:\s*1,\s*page_size:\s*4,\s*keyword:\s*'见喜'\s*\}\)/);
  });

  it('matches the reference homepage with a visual hero and category board', () => {
    assert.match(homePageSource, /class="home-hero"/);
    assert.match(homePageSource, /:style="heroStyle"/);
    assert.match(homePageSource, /heroImage\(\)/);
    assert.match(homePageSource, /heroImages\(\)/);
    assert.match(homePageSource, /home-custom-nav\s*\{[^}]*position:\s*(?:absolute|fixed)/);
    assert.doesNotMatch(homePageSource, /home-custom-nav\s*\{[^}]*background:\s*#ffffff/);
    assert.match(homePageSource, /class="home-category-board"/);
    assert.match(homePageSource, /primaryCategories\(\)/);
    assert.match(homePageSource, /secondaryCategories\(\)/);
    assert.match(homePageSource, /class="home-primary-grid"/);
    assert.match(homePageSource, /class="home-secondary-grid"/);
    assert.match(homePageSource, /openCategory\(item\)/);
    assert.match(homePageSource, /item && item\.url/);
    assert.match(homePageSource, /buildProductListUrl\(\{ category_id: categoryId \}\)/);
    assert.doesNotMatch(homePageSource, /class="hero section"/);
    assert.doesNotMatch(homePageSource, /class="nav-grid section panel"/);
  });

  it('renders featured, new, hot and three recommendation modules in the homepage order', () => {
    assert.match(homePageSource, /v-if="featuredProducts\.length"/);
    assert.match(homePageSource, /class="home-feature-section"/);
    assert.match(homePageSource, /featuredMainProduct/);
    assert.match(homePageSource, /featuredSideProducts/);
    assert.match(homePageSource, /v-if="newProducts\.length"/);
    assert.match(homePageSource, /class="home-new-section"/);
    assert.match(homePageSource, /v-for="item in newProducts"/);
    assert.match(homePageSource, /v-if="hotProducts\.length"/);
    assert.match(homePageSource, /class="home-hot-section"/);
    assert.match(homePageSource, /scroll-view[\s\S]*class="home-hot-scroll"/);
    assert.match(homePageSource, /v-for="\(item, index\) in hotProducts"/);
    assert.match(homePageSource, /home-hot-rank/);
    assert.match(homePageSource, /v-if="!loading \|\| giftRecommendedProducts\.length"/);
    assert.match(homePageSource, /礼盒推荐/);
    assert.match(homePageSource, /暂无礼盒推荐/);
    assert.match(homePageSource, /v-if="!loading \|\| pouchRecommendedProducts\.length"/);
    assert.match(homePageSource, /泡袋推荐/);
    assert.match(homePageSource, /暂无泡袋推荐/);
    assert.match(homePageSource, /v-if="!loading \|\| pvcRecommendedProducts\.length"/);
    assert.match(homePageSource, /PVC推荐/);
    assert.match(homePageSource, /暂无 PVC 推荐/);
    assert.doesNotMatch(homePageSource, /近 7 天暂无/);
    assert.doesNotMatch(homePageSource, /按销量统计/);
    const featureIndex = homePageSource.indexOf('home-feature-section');
    const newIndex = homePageSource.indexOf('home-new-section');
    const hotIndex = homePageSource.indexOf('home-hot-section');
    const giftIndex = homePageSource.indexOf('giftRecommendedProducts');
    const pouchIndex = homePageSource.indexOf('pouchRecommendedProducts');
    const pvcIndex = homePageSource.indexOf('pvcRecommendedProducts');
    assert.ok(featureIndex < newIndex, 'featured series should render before new products');
    assert.ok(newIndex < hotIndex, 'new products should render before hot products');
    assert.ok(hotIndex < giftIndex, 'hot products should render before gift recommendations');
    assert.ok(giftIndex < pouchIndex, 'gift recommendations should render before pouch recommendations');
    assert.ok(pouchIndex < pvcIndex, 'pouch recommendations should render before PVC recommendations');
  });

  it('gives the featured module more breathing room and a square hero image', () => {
    const featureCardBlock = homePageSource.match(/\.home-feature-card\s*\{[^}]*\}/)?.[0] || '';

    assert.match(featureCardBlock, /aspect-ratio:\s*1\s*\/\s*1/);
    assert.doesNotMatch(featureCardBlock, /height:\s*430rpx/);
  });

  it('keeps lower homepage product modules aligned with the rounded category boards', () => {
    const productShellBlock = homePageSource.match(/\.home-feature-section,[\s\S]*?\.home-product-section\s*\{[^}]*\}/)?.[0] || '';
    const horizontalTrackBlock = homePageSource.match(/\.home-feature-mini-track,[\s\S]*?\.home-hot-track\s*\{[^}]*\}/)?.[0] || '';

    assert.match(productShellBlock, /margin:\s*24rpx 48rpx 0/);
    assert.match(productShellBlock, /padding:\s*30rpx/);
    assert.match(productShellBlock, /border-radius:\s*26px/);
    assert.match(productShellBlock, /background:\s*#ffffff/);
    assert.match(productShellBlock, /box-shadow:\s*0 14rpx 34rpx rgba\(24,\s*24,\s*27,\s*0\.07\)/);
    assert.match(horizontalTrackBlock, /padding:\s*0 0 6rpx/);
    assert.doesNotMatch(homePageSource, /\.home-feature-section\s*\{[^}]*padding:\s*30rpx/);
    assert.doesNotMatch(homePageSource, /\.home-new-section\s+\.[^{]*home-section-header\s*\{[^}]*padding:\s*0 24rpx/);
    assert.doesNotMatch(homePageSource, /\.home-hot-section\s+\.[^{]*home-section-header\s*\{[^}]*padding:\s*0 24rpx/);
  });

  it('uses boxed primary category numbers with a consistent packaging label', () => {
    assert.match(homePageSource, /primaryCategoryCode\(item, index\)/);
    assert.match(homePageSource, /home-category-code/);
    assert.match(homePageSource, /泡包装礼盒/);
    assert.doesNotMatch(homePageSource, /包包装礼盒/);
  });

  it('can render image icons supplied by miniapp config before falling back to line icons', () => {
    assert.match(homePageSource, /import\s+\{[^}]*buildCategoryCoverUrl[^}]*buildCategoryIconUrl[^}]*buildHomeHeroUrl[^}]*\}/);
    assert.match(homePageSource, /categoryIcon\(item\)/);
    assert.match(homePageSource, /buildCategoryIconUrl\(rawIcon\)/);
    assert.match(homePageSource, /buildHomeHeroUrl\(url\)/);
    assert.match(homePageSource, /home-category-icon-image/);
    assert.match(homePageSource, /item\.icon_url \|\| item\.image \|\| item\.icon/);
    assert.match(homePageSource, /width:\s*178rpx/);
    assert.match(homePageSource, /min-height:\s*218rpx/);
  });

  it('uses a lightweight shared loading spinner instead of a branded startup splash', () => {
    assert.match(homePageSource, /import SjLoadingState/);
    assert.match(homePageSource, /components:\s*\{[^}]*SjLoadingState[^}]*\}/);
    assert.match(homePageSource, /<sj-loading-state[\s\S]*v-if="loading"/);
    assert.doesNotMatch(homePageSource, /showStartupSplash/);
    assert.doesNotMatch(homePageSource, /home-startup-/);
    assert.doesNotMatch(homePageSource, /肆计·包装设计/);
    assert.doesNotMatch(homePageSource, /专注于品质包装/);
  });
});
