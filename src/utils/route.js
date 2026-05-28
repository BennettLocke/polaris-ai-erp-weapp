import { APP_CONFIG } from '../config.js';
import { buildPolicyUrl as buildPolicyRouteUrl } from './policies.js';

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
  productDetail: '/pages/product/detail',
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

export function openCustomerService() {
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

export function buildPolicyUrl(type = 'agreement') {
  return buildPolicyRouteUrl(type);
}
