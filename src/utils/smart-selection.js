import { asArray, toNumber } from './list.js';

const UNLIMITED_COLOR_VALUE = '';
const UNLIMITED_COLOR_LABEL = '不限颜色';

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeText(value) {
  return cleanText(value).toLowerCase();
}

function uniqueTexts(values = []) {
  const result = [];
  values.flatMap(asArray).forEach((value) => {
    const text = cleanText(value);
    if (text && !result.some((item) => normalizeText(item) === normalizeText(text))) {
      result.push(text);
    }
  });
  return result;
}

function splitTextList(value) {
  if (Array.isArray(value)) return value.flatMap(splitTextList);
  const text = cleanText(value);
  if (!text) return [];
  return text
    .split(/[、，,/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function categoryNameValues(category = {}) {
  return [
    category.rawName,
    category.name,
    category.title,
    category.category_name,
    category.categoryName,
  ].map(cleanText).filter(Boolean);
}

function categoryIdValue(category = {}) {
  return cleanText(category.id || category.category_id || category.categoryId);
}

export const SMART_GIFT_SIZE_RULES = [
  { key: 'half_jin', label: '半斤礼盒', fallbackCategoryId: '1', aliases: ['半斤礼盒', '半斤'] },
  { key: 'three_liang', label: '三两礼盒', fallbackCategoryId: '2', aliases: ['三两礼盒', '三两'] },
  { key: 'two_liang', label: '二两礼盒', fallbackCategoryId: '3', aliases: ['二两礼盒', '二两'] },
  { key: 'one_liang', label: '一两礼盒', fallbackCategoryId: '4', aliases: ['一两礼盒', '一两'] },
  { key: 'six_small', label: '6小盒礼盒', fallbackCategoryId: '16', aliases: ['6小盒礼盒', '六小盒礼盒', '6小盒', '六小盒'] },
  { key: 'three_small', label: '3小盒礼盒', fallbackCategoryId: '17', aliases: ['3小盒礼盒', '三小盒礼盒', '3小盒', '三小盒'] },
  { key: 'two_bubble_small', label: '2泡小盒', fallbackCategoryId: '22', aliases: ['2泡小盒', '二泡小盒', '2小盒礼盒', '二小盒礼盒', '2小盒', '二小盒'] },
  { key: 'five_grid', label: '五格礼盒', fallbackCategoryId: '13', aliases: ['五格礼盒', '5格礼盒', '五格', '5格'] },
];

export const PRICE_RANGE_OPTIONS = [
  { label: '不限价格', value: 'all' },
  { label: '10元以下', value: 'under_10' },
  { label: '10-20元', value: '10_20' },
  { label: '20-30元', value: '20_30' },
  { label: '30元以上', value: 'over_30' },
];

export const CUSTOM_PRICE_RANGE_VALUE = 'custom';
export const CUSTOM_PRICE_RANGE_OPTION = { label: '自定义价格', value: CUSTOM_PRICE_RANGE_VALUE };

export function resolveSmartGiftSizeOptions(categories = []) {
  const source = asArray(categories);
  return SMART_GIFT_SIZE_RULES.map((rule) => {
    const aliases = rule.aliases.map(normalizeText);
    const matched = source.find((category) => (
      categoryNameValues(category).some((name) => aliases.includes(normalizeText(name)))
    ));
    const categoryId = categoryIdValue(matched) || rule.fallbackCategoryId;
    return {
      ...rule,
      categoryId,
      matched: Boolean(matched),
    };
  });
}

export function productColorValues(product = {}) {
  return uniqueTexts([
    product.colorNames,
    product.color_names,
    product.available_colors,
    product.colorText,
    product.color_text,
    product.color,
    product.spec,
    product.specName,
    product.spec_name,
    product.specValue,
    product.spec_value,
    product.specValueName,
    product.spec_value_name,
    product.valueName,
    product.value_name,
    product.optionName,
    product.option_name,
    product.attrValue,
    product.attr_value,
  ].flatMap(splitTextList));
}

function variantColorValues(variant = {}) {
  const parameterColorValues = asArray([
    variant.base_data,
    variant.base,
    variant.parameters && variant.parameters.base,
    variant.parameters && variant.parameters.detail,
  ]).flatMap((item) => asArray(item))
    .filter((item) => /颜色|color/i.test(cleanText(item && (item.name || item.label || item.title || item.key))))
    .map((item) => item.value || item.text || item.name);

  return uniqueTexts([
    variant.color,
    variant.colorName,
    variant.color_name,
    variant.spec,
    variant.specName,
    variant.spec_name,
    variant.specValue,
    variant.spec_value,
    variant.specValueName,
    variant.spec_value_name,
    variant.valueName,
    variant.value_name,
    variant.optionName,
    variant.option_name,
    variant.attrValue,
    variant.attr_value,
    parameterColorValues,
  ].flatMap(splitTextList));
}

function variantMatchesColor(variant = {}, color = UNLIMITED_COLOR_VALUE) {
  const target = normalizeText(color);
  if (!target) return true;
  return variantColorValues(variant).some((item) => normalizeText(item) === target);
}

function imageFromItem(item) {
  if (!item) return '';
  if (typeof item === 'string') return cleanText(item);
  return cleanText(
    item.images
      || item.url
      || item.src
      || item.image
      || item.image_url
      || item.imageUrl
      || item.spec_image_url
      || item.specImageUrl
      || item.sku_image_url
      || item.skuImageUrl
      || item.color_image_url
      || item.colorImageUrl
      || item.main_image_url
      || item.mainImageUrl
  );
}

function uniqueImages(values = []) {
  const images = [];
  values.flatMap(asArray).forEach((item) => {
    const image = imageFromItem(item);
    if (image && !images.includes(image)) images.push(image);
  });
  return images;
}

function productGroupVariants(product = {}) {
  const raw = product.raw || {};
  return asArray(product.product_group_data || product.productGroupData || raw.product_group_data || raw.productGroupData);
}

function variantImageCandidates(variant = {}) {
  return uniqueImages([
    variant.spec_image_url,
    variant.specImageUrl,
    variant.sku_image_url,
    variant.skuImageUrl,
    variant.color_image_url,
    variant.colorImageUrl,
    variant.thumb,
    variant.thumb_url,
    variant.thumbUrl,
    variant.cover,
    variant.cover_url,
    variant.coverUrl,
    variant.photo,
    variant.pic,
    variant.pic_url,
    variant.picUrl,
    variant.goods_image,
    variant.goodsImage,
    variant.goods_image_url,
    variant.goodsImageUrl,
    variant.color_images,
    variant.colorImages,
    variant.images,
    variant.image_url,
    variant.image,
  ]);
}

function productColorImageCandidates(product = {}) {
  const raw = product.raw || {};
  return uniqueImages([
    product.colorImages,
    product.color_images,
    product.color_image_urls,
    product.colorImageUrls,
    product.color_gallery,
    product.colorGallery,
    product.color_gallery_images,
    product.colorGalleryImages,
    product.spec_images,
    product.specImages,
    product.sku_images,
    product.skuImages,
    product.spec_image_url,
    product.specImageUrl,
    product.sku_image_url,
    product.skuImageUrl,
    product.color_image_url,
    product.colorImageUrl,
    raw.colorImages,
    raw.color_images,
    raw.color_image_urls,
    raw.colorImageUrls,
    raw.color_gallery,
    raw.colorGallery,
    raw.color_gallery_images,
    raw.colorGalleryImages,
    raw.spec_images,
    raw.specImages,
    raw.sku_images,
    raw.skuImages,
    raw.spec_image_url,
    raw.specImageUrl,
    raw.sku_image_url,
    raw.skuImageUrl,
    raw.color_image_url,
    raw.colorImageUrl,
  ]);
}

export function smartSelectionColorCover(product = {}, color = UNLIMITED_COLOR_VALUE) {
  const target = normalizeText(color);
  if (!target) return '';

  const matchedVariant = productGroupVariants(product).find((variant) => variantMatchesColor(variant, color));
  const matchedVariantImage = variantImageCandidates(matchedVariant)[0] || '';
  if (matchedVariantImage) return matchedVariantImage;

  const colors = productColorValues(product);
  const images = productColorImageCandidates(product);
  const colorIndex = colors.findIndex((item) => normalizeText(item) === target);
  if (colorIndex >= 0 && images[colorIndex]) return images[colorIndex];
  if (images.length === 1 && productMatchesColor(product, color)) return images[0];

  return '';
}

function mergeDisplayColorSource(product = {}, detail = {}) {
  if (!detail || !Object.keys(detail).length) return product;
  return {
    ...product,
    colorNames: detail.colorNames || product.colorNames,
    color_names: detail.color_names || product.color_names,
    available_colors: detail.available_colors || product.available_colors,
    colorText: detail.colorText || product.colorText,
    color_text: detail.color_text || product.color_text,
    color: detail.color || product.color,
    spec: detail.spec || product.spec,
    colorImages: detail.colorImages || product.colorImages,
    color_images: detail.color_images || product.color_images,
    color_image_urls: detail.color_image_urls || product.color_image_urls,
    spec_images: detail.spec_images || product.spec_images,
    sku_images: detail.sku_images || product.sku_images,
    product_group_data: detail.product_group_data || product.product_group_data,
    productGroupData: detail.productGroupData || product.productGroupData,
    raw: {
      ...(product.raw || {}),
      ...(detail.raw || {}),
    },
  };
}

function productIdentityValues(product = {}) {
  return [
    product.id,
    product.goods_id,
    product.product_id,
    product.productCode,
    product.product_code,
    product.coding,
    product.sku_no,
  ].map(cleanText).filter(Boolean);
}

function detailForProduct(product = {}, detailMap = {}) {
  const source = detailMap && typeof detailMap === 'object' ? detailMap : {};
  return productIdentityValues(product).map((key) => source[key]).find(Boolean) || {};
}

export function buildSmartSelectionDisplayProduct(product = {}, color = UNLIMITED_COLOR_VALUE, detail = {}) {
  const cover = smartSelectionColorCover(mergeDisplayColorSource(product, detail), color);
  if (!cover) return product;
  return {
    ...product,
    cover,
    smartSelectionCover: cover,
  };
}

export function buildSmartSelectionDisplayProducts(products = [], color = UNLIMITED_COLOR_VALUE, detailMap = {}) {
  return asArray(products).map((product) => buildSmartSelectionDisplayProduct(product, color, detailForProduct(product, detailMap)));
}

export function buildSmartSelectionColorOptions(products = []) {
  const colors = uniqueTexts(asArray(products).flatMap(productColorValues));
  return [
    { label: UNLIMITED_COLOR_LABEL, value: UNLIMITED_COLOR_VALUE },
    ...colors.map((item) => ({ label: item, value: item })),
  ];
}

export function smartSelectionProductPrice(product = {}) {
  return toNumber(
    product.min_price
      || product.minPrice
      || product.price
      || product.retail_price
      || product.original_price,
    0
  );
}

function optionalPrice(value) {
  const text = cleanText(value);
  if (!text) return null;
  const number = toNumber(text, NaN);
  return Number.isFinite(number) ? number : null;
}

export function normalizeCustomPriceRange(range = {}) {
  const source = range && typeof range === 'object' ? range : {};
  let min = optionalPrice(source.min ?? source.minPrice ?? source.min_price);
  let max = optionalPrice(source.max ?? source.maxPrice ?? source.max_price);
  const hasValue = min !== null || max !== null;

  if (min !== null && max !== null && min > max) {
    const nextMin = max;
    max = min;
    min = nextMin;
  }

  return { min, max, hasValue };
}

function isCustomPriceRange(range) {
  if (range && typeof range === 'object') {
    return cleanText(range.value || range.type || range.range) === CUSTOM_PRICE_RANGE_VALUE
      || range.custom === true
      || range.min !== undefined
      || range.max !== undefined
      || range.minPrice !== undefined
      || range.maxPrice !== undefined
      || range.min_price !== undefined
      || range.max_price !== undefined;
  }
  return cleanText(range) === CUSTOM_PRICE_RANGE_VALUE;
}

export function productMatchesCustomPriceRange(product = {}, range = {}) {
  const { min, max, hasValue } = normalizeCustomPriceRange(range);
  if (!hasValue) return true;
  const price = smartSelectionProductPrice(product);
  if (price <= 0) return false;
  if (min !== null && price < min) return false;
  if (max !== null && price > max) return false;
  return true;
}

export function buildSmartSelectionPriceRangeOptions(products = []) {
  const items = asArray(products).filter(Boolean);
  const fixedOptions = PRICE_RANGE_OPTIONS
    .filter((item) => item.value !== 'all')
    .filter((item) => items.some((product) => productMatchesPriceRange(product, item.value)));

  return [
    PRICE_RANGE_OPTIONS[0],
    ...fixedOptions,
    CUSTOM_PRICE_RANGE_OPTION,
  ];
}

export function productMatchesPriceRange(product = {}, range = 'all', customPriceRange = {}) {
  const price = smartSelectionProductPrice(product);
  const rangeValue = range && typeof range === 'object'
    ? cleanText(range.value || range.type || range.range || CUSTOM_PRICE_RANGE_VALUE)
    : cleanText(range) || 'all';
  if (rangeValue === 'all') return true;
  if (rangeValue === CUSTOM_PRICE_RANGE_VALUE || isCustomPriceRange(range)) {
    return productMatchesCustomPriceRange(product, range && typeof range === 'object' ? range : customPriceRange);
  }
  if (price <= 0) return false;
  if (rangeValue === 'under_10') return price < 10;
  if (rangeValue === '10_20') return price >= 10 && price <= 20;
  if (rangeValue === '20_30') return price > 20 && price <= 30;
  if (rangeValue === 'over_30') return price > 30;
  return true;
}

export function productMatchesColor(product = {}, color = UNLIMITED_COLOR_VALUE) {
  const target = normalizeText(color);
  if (!target) return true;
  return productColorValues(product).some((item) => normalizeText(item) === target);
}

function productStockValue(product = {}) {
  return toNumber(product.inventory || product.stock || product.stock_qty || product.available_stock, 0);
}

function productSalesValue(product = {}) {
  return toNumber(product.sales_count || product.sold_qty || product.order_count || product.sales || 0, 0);
}

function smartSelectionSortValue(product = {}, selection = {}) {
  const colorScore = productMatchesColor(product, selection.color) ? 1 : 0;
  const stockScore = productStockValue(product) > 0 ? 1 : 0;
  const salesScore = productSalesValue(product);
  const price = smartSelectionProductPrice(product);
  return { colorScore, stockScore, salesScore, price };
}

export function sortSmartSelectionProducts(products = [], selection = {}) {
  return asArray(products).slice().sort((a, b) => {
    const left = smartSelectionSortValue(a, selection);
    const right = smartSelectionSortValue(b, selection);
    if (right.colorScore !== left.colorScore) return right.colorScore - left.colorScore;
    if (right.stockScore !== left.stockScore) return right.stockScore - left.stockScore;
    if (right.salesScore !== left.salesScore) return right.salesScore - left.salesScore;
    return left.price - right.price;
  });
}

export function recommendSmartSelectionProducts(products = [], selection = {}, options = {}) {
  const items = asArray(products).filter(Boolean);
  if (!items.length) {
    return { products: [], matchType: 'empty' };
  }

  const priceRange = selection.priceRange || 'all';
  const customPriceRange = selection.customPriceRange || {
    min: selection.customPriceMin,
    max: selection.customPriceMax,
  };
  const color = selection.color || UNLIMITED_COLOR_VALUE;
  const priceMatches = items.filter((item) => productMatchesPriceRange(item, priceRange, customPriceRange));
  if (isCustomPriceRange(priceRange) && normalizeCustomPriceRange(customPriceRange).hasValue && !priceMatches.length) {
    return { products: [], matchType: 'empty' };
  }
  const exactMatches = priceMatches.filter((item) => productMatchesColor(item, color));
  const source = exactMatches.length ? exactMatches : priceMatches.length ? priceMatches : items;
  const limit = toNumber(options.limit, 20);

  return {
    products: sortSmartSelectionProducts(source, { color, priceRange }).slice(0, limit),
    matchType: exactMatches.length ? 'exact' : 'nearby',
  };
}
