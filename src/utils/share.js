export const DEFAULT_SHARE_TITLE = '肆计包装·官方小程序';
export const DEFAULT_SHARE_IMAGE = '/static/share/home-share-v2.png';
export const SEARCH_SHARE_TITLE = '肆计包装·你要的都在这';
export const SEARCH_SHARE_IMAGE = '/static/share/search-share-v2.png';
export const SMART_SELECTION_SHARE_TITLE = '肆计包装·智能选品推荐';
export const SMART_SELECTION_SHARE_IMAGE = '/static/share/smart-select-share.png';

function cleanText(value) {
  return String(value || '').trim();
}

function normalizePath(path = '/pages/home/index') {
  const text = cleanText(path) || '/pages/home/index';
  return text.startsWith('/') ? text : `/${text}`;
}

function queryString(params = {}) {
  return Object.entries(params || {})
    .filter(([, value]) => value !== undefined && value !== null && cleanText(value) !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(cleanText(value))}`)
    .join('&');
}

export function buildSharePath(path = '/pages/home/index', params = {}) {
  const basePath = normalizePath(path).split('?')[0].split('#')[0];
  const query = queryString(params);
  return query ? `${basePath}?${query}` : basePath;
}

export function pathToTimelineQuery(path = '') {
  return cleanText(path).split('?')[1] || '';
}

export function currentPageSharePath(fallbackPath = '/pages/home/index') {
  if (typeof getCurrentPages !== 'function') return normalizePath(fallbackPath);
  const pages = getCurrentPages();
  const current = pages && pages[pages.length - 1];
  if (!current || !current.route) return normalizePath(fallbackPath);
  return buildSharePath(current.route, current.options || {});
}

export function enablePageShare() {
  const api = typeof wx !== 'undefined' && typeof wx.showShareMenu === 'function'
    ? wx
    : typeof uni !== 'undefined' && typeof uni.showShareMenu === 'function'
      ? uni
      : null;
  if (!api) return false;
  api.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  });
  return true;
}

export function preloadShareImage(imageUrl = DEFAULT_SHARE_IMAGE) {
  const source = cleanText(imageUrl);
  if (!source || typeof uni === 'undefined' || typeof uni.getImageInfo !== 'function') {
    return Promise.resolve(source);
  }

  return new Promise((resolve) => {
    uni.getImageInfo({
      src: source,
      success: (result = {}) => resolve(cleanText(result.path) || source),
      fail: () => resolve(source),
    });
  });
}

export function buildShareOptions(options = {}) {
  const title = cleanText(options.title) || DEFAULT_SHARE_TITLE;
  const path = normalizePath(options.path || currentPageSharePath());
  const imageUrl = cleanText(options.imageUrl) || DEFAULT_SHARE_IMAGE;
  return { title, path, imageUrl };
}

export function buildTimelineShareOptions(options = {}) {
  const title = cleanText(options.title) || DEFAULT_SHARE_TITLE;
  const sourcePath = normalizePath(options.path || currentPageSharePath());
  const query = cleanText(options.query) || pathToTimelineQuery(sourcePath);
  const imageUrl = cleanText(options.imageUrl) || DEFAULT_SHARE_IMAGE;
  return query ? { title, query, imageUrl } : { title, imageUrl };
}

export function productShareTitle(product = {}, fallback = '肆计包装产品') {
  const title = cleanText(
    product.productName
    || product.title
    || product.name
    || product.product_code
    || product.productCode
    || fallback
  );
  return `${title}｜肆计包装`;
}

export function productShareImage(product = {}, fallback = DEFAULT_SHARE_IMAGE) {
  const gallery = product.galleryImages || product.mainImages || product.colorImages || [];
  if (Array.isArray(gallery) && cleanText(gallery[0])) return cleanText(gallery[0]);
  return cleanText(product.cover || product.images || product.main_images || product.share_images || fallback) || fallback;
}
