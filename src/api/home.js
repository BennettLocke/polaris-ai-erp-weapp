import { getCategories } from './categories';
import { getHotProducts, getProducts } from './products';
import { request } from './request';
import { buildHomePayload } from '../utils/home';

const TABBAR_STORAGE_KEY = 'sj_mall_tabbar_items';
const DEFAULT_FEATURED_SERIES_KEYWORD = '见喜';
const FEATURED_HOT_CATEGORY_NAMES = ['半斤礼盒', '三两礼盒', '二两礼盒', '一两礼盒'];
const GIFT_RECOMMEND_CATEGORY_NAMES = [
  '半斤礼盒',
  '三两礼盒',
  '二两礼盒',
  '一两礼盒',
  '6小盒礼盒',
  '六小盒礼盒',
  '3小盒礼盒',
  '三小盒礼盒',
  '2小盒礼盒',
  '二小盒礼盒',
  '2泡小盒',
  '五格礼盒',
  '5格礼盒',
];
const POUCH_RECOMMEND_CATEGORY_NAMES = [
  '大红袍泡袋',
  '肉桂泡袋',
  '水仙泡袋',
  '品种茶袋',
  '公版泡袋',
  '红茶泡袋',
  '空白泡袋',
  '宽版泡袋',
];
const PVC_RECOMMEND_CATEGORY_NAMES = ['PVC礼盒', 'pvc礼盒'];
const SKU_SERIES_PATTERN = /^SJ\d+$/i;
const NON_FEATURED_SERIES_TITLE_PATTERN = /泡袋|纸箱|烫金|机器|厂里/;

function cleanText(value) {
  return String(value || '').trim();
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function hotItemsFromPage(page = {}) {
  return asArray(page.data || page.list || page.items);
}

function categoryNameKeys(item = {}) {
  return [
    item.rawName,
    item.name,
    item.title,
    item.category_name,
    item.categoryName,
  ].map(cleanText).filter(Boolean);
}

function findCategoryIdByNames(categories = [], names = []) {
  return findCategoryIdsByNames(categories, names)[0] || '';
}

function findCategoryIdsByNames(categories = [], names = []) {
  const nameSet = new Set(names.map((name) => cleanText(name).toLowerCase()).filter(Boolean));
  const ids = [];
  asArray(categories).forEach((item) => {
    const matched = categoryNameKeys(item).some((name) => nameSet.has(name.toLowerCase()));
    const id = matched ? item.id || item.category_id || item.categoryId || '' : '';
    if (id !== '' && !ids.some((value) => String(value) === String(id))) {
      ids.push(id);
    }
  });
  return ids;
}

function latestFallbackKeyword(names = []) {
  const text = names.map(cleanText).join(' ');
  if (/泡袋|茶袋/.test(text)) return '泡袋';
  return cleanText(names[0]);
}

function getLatestProductsByCategoryNames(categories = [], names = [], limit = 6) {
  const categoryIds = findCategoryIdsByNames(categories, names);
  return getProducts({
    page: 1,
    page_size: limit,
    sort: 'latest',
    category_ids: categoryIds,
    keyword: categoryIds.length ? '' : latestFallbackKeyword(names),
  });
}

function getLatestPvcProducts(categories = []) {
  const categoryId = findCategoryIdByNames(categories, PVC_RECOMMEND_CATEGORY_NAMES);
  return getProducts({
    page: 1,
    page_size: 6,
    sort: 'latest',
    category_id: categoryId,
    keyword: categoryId ? '' : 'PVC礼盒',
  });
}

function validSeriesKeyword(value) {
  const text = cleanText(value);
  if (!text || SKU_SERIES_PATTERN.test(text)) return '';
  return text;
}

function extractSeriesKeyword(item = {}) {
  const explicit = validSeriesKeyword(item.series || item.series_name || item.seriesName);
  if (explicit) return explicit;

  const title = cleanText(item.productName || item.title || item.name || item.goods_name);
  if (!title || NON_FEATURED_SERIES_TITLE_PATTERN.test(title)) return '';
  const match = title.match(/【([^】]+)】/);
  return validSeriesKeyword(match && match[1]);
}

function selectFeaturedSeriesKeyword(hotProductPage = {}) {
  const matched = hotItemsFromPage(hotProductPage)
    .map(extractSeriesKeyword)
    .find(Boolean);
  return matched || DEFAULT_FEATURED_SERIES_KEYWORD;
}

function cacheBottomTabs(config = {}) {
  const tabs = Array.isArray(config.bottom_tabs) ? config.bottom_tabs : [];
  if (!tabs.length || typeof uni === 'undefined' || typeof uni.setStorageSync !== 'function') return;
  const items = tabs.map((item) => ({
    text: item.text || item.title || '',
    pagePath: item.pagePath || item.page_path || item.url || item.link_value || '',
    iconPath: item.iconPath || item.icon || item.icon_url || '',
    selectedIconPath: item.selectedIconPath || item.selected_icon || item.active_icon_url || item.selected_icon_url || '',
  }));
  uni.setStorageSync(TABBAR_STORAGE_KEY, { items });
}

export function getMiniappConfig() {
  return request('/api/miniapp/config', { auth: false }).then((config) => {
    cacheBottomTabs(config);
    return config;
  });
}

export function getHomeData() {
  return Promise.allSettled([
    getMiniappConfig(),
    getCategories(),
    getProducts({ page: 1, page_size: 12, sort: 'latest' }),
    getHotProducts({ period: 'week', limit: 6, dimension: 'product', category_names: FEATURED_HOT_CATEGORY_NAMES }),
    getHotProducts({ period: '30d', limit: 6, dimension: 'product', category_names: FEATURED_HOT_CATEGORY_NAMES }),
    getHotProducts({ period: '7d', limit: 6, dimension: 'product', category_names: GIFT_RECOMMEND_CATEGORY_NAMES }),
    getHotProducts({ period: '7d', limit: 6, dimension: 'product', category_names: PVC_RECOMMEND_CATEGORY_NAMES }),
    getProducts({ page: 1, page_size: 8 }),
  ]).then(async ([
    configResult,
    categoriesResult,
    newProductsResult,
    featuredHotProductsResult,
    hotProductsResult,
    giftRecommendationResult,
    pvcRecommendationResult,
    productsResult,
  ]) => {
    const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
    const featuredHotProductPage = featuredHotProductsResult.status === 'fulfilled' ? featuredHotProductsResult.value : {};
    const hotProductPage = hotProductsResult.status === 'fulfilled' ? hotProductsResult.value : {};
    const pvcRecommendationPage = pvcRecommendationResult.status === 'fulfilled' ? pvcRecommendationResult.value : {};
    const pvcRecommendationFallbackResult = hotItemsFromPage(pvcRecommendationPage).length
      ? { status: 'fulfilled', value: {} }
      : await getLatestPvcProducts(categories)
        .then((value) => ({ status: 'fulfilled', value }))
        .catch((reason) => ({ status: 'rejected', reason }));
    const pouchRecommendationResult = await getLatestProductsByCategoryNames(categories, POUCH_RECOMMEND_CATEGORY_NAMES, 6)
      .then((value) => ({ status: 'fulfilled', value }))
      .catch((reason) => ({ status: 'rejected', reason }));
    const featuredKeyword = selectFeaturedSeriesKeyword(featuredHotProductPage);
    const featuredProductsResult = await getProducts({ page: 1, page_size: 4, keyword: featuredKeyword })
      .then((value) => ({ status: 'fulfilled', value }))
      .catch((reason) => ({ status: 'rejected', reason }));

    return buildHomePayload({
      config: configResult.status === 'fulfilled' ? configResult.value : {},
      categories,
      featuredProductPage: featuredProductsResult.status === 'fulfilled' ? featuredProductsResult.value : {},
      newProductPage: newProductsResult.status === 'fulfilled' ? newProductsResult.value : {},
      hotProductPage,
      giftRecommendationPage: giftRecommendationResult.status === 'fulfilled' ? giftRecommendationResult.value : {},
      pouchRecommendationPage: pouchRecommendationResult.status === 'fulfilled' ? pouchRecommendationResult.value : {},
      pvcRecommendationPage,
      pvcRecommendationFallbackPage: pvcRecommendationFallbackResult.status === 'fulfilled' ? pvcRecommendationFallbackResult.value : {},
      productPage: productsResult.status === 'fulfilled' ? productsResult.value : {},
    });
  });
}
