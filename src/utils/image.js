const DEFAULT_OSS_QUALITY = 85;
const DEFAULT_OSS_FORMAT = 'jpg';
const CATEGORY_COVER_SIZE = 480;
const HOME_HERO_WIDTH = 1080;
const HOME_HERO_HEIGHT = 920;
const CATEGORY_ICON_WIDTH = 240;

function cleanUrl(value) {
  return String(value || '').trim();
}

function isRemoteImageUrl(url) {
  return /^https?:\/\//i.test(url);
}

function hasImageProcess(url) {
  return /(?:[?&]x-oss-process=|imageView2\/|imageMogr2\/)/i.test(url);
}

function splitHash(url) {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return [url, ''];
  return [url.slice(0, hashIndex), url.slice(hashIndex)];
}

export function isJpegImageUrl(url) {
  const [withoutHash] = splitHash(cleanUrl(url));
  const path = withoutHash.split('?')[0] || '';
  return /\.(?:jpe?g)$/i.test(path);
}

export function buildOssImageUrl(url, options = {}) {
  const source = cleanUrl(url);
  if (!source || !isRemoteImageUrl(source) || hasImageProcess(source)) return source;

  const width = Math.max(1, Number(options.width || CATEGORY_COVER_SIZE));
  const height = Number(options.height || 0);
  const quality = Math.max(1, Math.min(100, Number(options.quality || DEFAULT_OSS_QUALITY)));
  const format = cleanUrl(Object.prototype.hasOwnProperty.call(options, 'format') ? options.format : DEFAULT_OSS_FORMAT);
  const resize = height > 0
    ? `image/resize,m_fill,w_${width},h_${Math.max(1, height)}`
    : `image/resize,w_${width}`;
  const process = [
    `x-oss-process=${resize}`,
    `quality,q_${quality}`,
    format ? `format,${format}` : '',
  ].filter(Boolean).join('/');
  const [base, hash] = splitHash(source);
  const joiner = base.includes('?') ? '&' : '?';

  return `${base}${joiner}${process}${hash}`;
}

export function buildCategoryCoverUrl(url) {
  return buildOssImageUrl(url, {
    width: CATEGORY_COVER_SIZE,
    height: CATEGORY_COVER_SIZE,
    quality: DEFAULT_OSS_QUALITY,
    format: DEFAULT_OSS_FORMAT,
  });
}

export function buildHomeHeroUrl(url) {
  return buildOssImageUrl(url, {
    width: HOME_HERO_WIDTH,
    height: HOME_HERO_HEIGHT,
    quality: DEFAULT_OSS_QUALITY,
    format: DEFAULT_OSS_FORMAT,
  });
}

export function buildCategoryIconUrl(url) {
  return buildOssImageUrl(url, {
    width: CATEGORY_ICON_WIDTH,
    quality: 90,
    format: 'png',
  });
}
