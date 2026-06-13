import { APP_CONFIG } from '../config.js';
import { buildPolicyUrl as buildPolicyRouteUrl } from './policies.js';
import { DEFAULT_SHARE_IMAGE, productShareImage } from './share.js';

export const PAGE_ROUTES = {
  home: '/pages/home/index',
  category: '/pages/category/index',
  order: '/pages/orderflow/index',
  my: '/pages/my/index',
  salesOrders: '/pages/sales-orders/index',
  settings: '/pages/settings/index',
  profile: '/pages/profile/index',
  policy: '/pages/policy/index',
  productList: '/pages/product/list',
  productSmartSelect: '/pages/product/smart-select',
  productSmartSelectShare: '/pages/product/smart-select-share',
  productDetail: '/pages/product/detail',
  productFootprint: '/pages/product/footprint',
  contact: '/pages/contact/index',
};

const TAB_BAR_PATHS = new Set([
  PAGE_ROUTES.home,
  PAGE_ROUTES.category,
  PAGE_ROUTES.order,
  PAGE_ROUTES.my,
]);

function normalizeRouteUrl(url) {
  return typeof url === 'string' ? url.trim() : '';
}

function routePath(url) {
  return normalizeRouteUrl(url).split('?')[0].split('#')[0];
}

export function isTabBarUrl(url) {
  return TAB_BAR_PATHS.has(routePath(url));
}

export function resolveNavigationAction(url) {
  const safeUrl = normalizeRouteUrl(url);
  if (!safeUrl) return { method: 'none', url: '' };

  const path = routePath(safeUrl);
  if (TAB_BAR_PATHS.has(path)) {
    return { method: 'switchTab', url: path };
  }

  return { method: 'navigateTo', url: safeUrl };
}

export function navigateToPage(url) {
  const action = resolveNavigationAction(url);
  if (action.method === 'none') return false;
  if (typeof uni === 'undefined' || typeof uni[action.method] !== 'function') return false;

  uni[action.method]({ url: action.url });
  return true;
}

function showCustomerServiceError(message = '企业微信客服打开失败') {
  if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
    uni.showToast({ title: message, icon: 'none' });
  }
}

function customerServiceErrorMessage(error = {}) {
  return String(error.errMsg || error.message || '').trim() || '企业微信客服打开失败';
}

function firstCustomerServiceText(...values) {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
}

function truncateCustomerServiceTitle(value, maxLength = 32) {
  const text = firstCustomerServiceText(value);
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

export function buildCustomerServiceProductContext(context = null) {
  if (!context || typeof context !== 'object') return null;
  if (context.type && context.type !== 'product') return null;
  const hasProductShape = context.type === 'product'
    || Boolean(context.product)
    || Boolean(context.detail)
    || Boolean(context.id || context.goods_id || context.goodsId || context.product_id)
    || Boolean(context.productName || context.productCode || context.title || context.name || context.coding);
  if (!hasProductShape) return null;

  const product = context.product && typeof context.product === 'object' ? context.product : context;
  const detail = context.detail && typeof context.detail === 'object' ? context.detail : {};
  const id = firstCustomerServiceText(
    context.id,
    product.id,
    product.goods_id,
    product.goodsId,
    product.product_id,
    detail.id,
    detail.goods_id,
    detail.goodsId,
    detail.product_id
  );
  const name = firstCustomerServiceText(
    context.productName,
    product.productName,
    detail.productName,
    context.title,
    product.title,
    detail.title,
    product.name,
    detail.name
  );
  const code = firstCustomerServiceText(
    context.productCode,
    product.productCode,
    detail.productCode,
    context.product_code,
    product.product_code,
    detail.product_code,
    product.coding,
    detail.coding
  );
  const titleBody = firstCustomerServiceText([name, code].filter(Boolean).join(' '), '\u5546\u54c1\u54a8\u8be2');
  const image = productShareImage(detail, productShareImage(product, DEFAULT_SHARE_IMAGE));

  return {
    title: truncateCustomerServiceTitle(`\u54a8\u8be2\uff1a${titleBody}`),
    path: id ? buildProductDetailUrl(id) : PAGE_ROUTES.productDetail,
    image,
  };
}

export function openCustomerService(context = null) {
  const serviceUrl = String(APP_CONFIG.customerServiceUrl || '').trim();
  const corpId = String(APP_CONFIG.customerServiceCorpId || '').trim();
  const serviceHost = typeof wx !== 'undefined' && typeof wx.openCustomerServiceChat === 'function'
    ? wx
    : typeof uni !== 'undefined' && typeof uni.openCustomerServiceChat === 'function'
      ? uni
      : null;
  const serviceApi = serviceHost
    ? serviceHost.openCustomerServiceChat
    : null;

  if (serviceApi && serviceUrl) {
    const payload = {
      extInfo: { url: serviceUrl },
      fail: (error = {}) => {
        console.warn('openCustomerServiceChat failed', error);
        showCustomerServiceError(customerServiceErrorMessage(error));
      },
    };
    const productContext = buildCustomerServiceProductContext(context);
    if (productContext) {
      payload.showMessageCard = true;
      payload.sendMessageTitle = productContext.title;
      payload.sendMessagePath = productContext.path;
      payload.sendMessageImg = productContext.image;
    }
    if (corpId) payload.corpId = corpId;
    serviceApi.call(serviceHost, payload);
    return true;
  }

  showCustomerServiceError('当前环境不支持企业微信客服');
  return false;
}

export function syncCustomTabBar(url) {
  const path = routePath(url);
  if (!TAB_BAR_PATHS.has(path)) return false;
  if (typeof getCurrentPages !== 'function') return false;

  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const tabBar = currentPage && typeof currentPage.getTabBar === 'function'
    ? currentPage.getTabBar()
    : null;
  if (!tabBar) return false;

  if (typeof tabBar.setActiveByPath === 'function') {
    return tabBar.setActiveByPath(path);
  }

  if (typeof tabBar.setData === 'function') {
    tabBar.setData({ selectedPath: path });
    return true;
  }

  return false;
}

export function buildProductDetailUrl(id) {
  if (!id) return '';
  return `${PAGE_ROUTES.productDetail}?id=${encodeURIComponent(id)}`;
}

export function buildProductListUrl(params = {}) {
  const query = [];
  const keyword = normalizeRouteUrl(params.keyword);
  const categoryId = normalizeRouteUrl(params.category_id);

  if (keyword) query.push(`keyword=${encodeURIComponent(keyword)}`);
  if (categoryId) query.push(`category_id=${encodeURIComponent(categoryId)}`);

  return query.length ? `${PAGE_ROUTES.productList}?${query.join('&')}` : PAGE_ROUTES.productList;
}

export function buildProductSmartSelectUrl() {
  return PAGE_ROUTES.productSmartSelect;
}

export function buildProductSmartSelectShareUrl(selection = {}) {
  const query = [];
  const size = normalizeRouteUrl(selection.size || selection.sizeKey);
  const categoryId = normalizeRouteUrl(selection.category_id || selection.categoryId);
  const color = normalizeRouteUrl(selection.color);
  const price = normalizeRouteUrl(selection.price || selection.priceRange);
  const min = normalizeRouteUrl(selection.min || selection.minPrice || selection.customPriceMin);
  const max = normalizeRouteUrl(selection.max || selection.maxPrice || selection.customPriceMax);

  if (size) query.push(`size=${encodeURIComponent(size)}`);
  if (categoryId) query.push(`category_id=${encodeURIComponent(categoryId)}`);
  if (color) query.push(`color=${encodeURIComponent(color)}`);
  if (price) query.push(`price=${encodeURIComponent(price)}`);
  if (min) query.push(`min=${encodeURIComponent(min)}`);
  if (max) query.push(`max=${encodeURIComponent(max)}`);

  return query.length ? `${PAGE_ROUTES.productSmartSelectShare}?${query.join('&')}` : PAGE_ROUTES.productSmartSelectShare;
}

export function buildProductFootprintUrl(tab = '') {
  const safeTab = normalizeRouteUrl(tab);
  if (!['favorites', 'recent', 'frequent'].includes(safeTab)) return PAGE_ROUTES.productFootprint;
  return `${PAGE_ROUTES.productFootprint}?tab=${encodeURIComponent(safeTab)}`;
}

export function buildPolicyUrl(type = 'agreement') {
  return buildPolicyRouteUrl(type);
}
