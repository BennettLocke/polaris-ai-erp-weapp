import { asArray, normalizePageData, toNumber } from './list.js';

const PLACEHOLDER_IMAGE = '/static/images/product-placeholder.png';

function cleanText(value) {
  return String(value || '').trim();
}

function firstText(...values) {
  return values.map(cleanText).find(Boolean) || '';
}

function uniqueTexts(values = []) {
  const texts = [];
  values.flatMap(asArray).forEach((value) => {
    const text = cleanText(value);
    if (text && !texts.includes(text)) texts.push(text);
  });
  return texts;
}

function splitTextList(value) {
  if (Array.isArray(value)) return value.flatMap(splitTextList);
  const text = cleanText(value);
  if (!text) return [];
  return text
    .split(/[、,，/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatTextList(...values) {
  return uniqueTexts(values.flatMap(splitTextList)).join(' / ');
}

const COLOR_HEX_MAP = {
  红色: '#c92f2f',
  红: '#c92f2f',
  黄色: '#f4b23c',
  黄: '#f4b23c',
  绿色: '#3f7f4f',
  绿: '#3f7f4f',
  深绿: '#14532d',
  深绿色: '#14532d',
  橄榄绿: '#6f7f3f',
  蓝色: '#1f3f66',
  蓝: '#1f3f66',
  咖色: '#5b351f',
  咖: '#5b351f',
  古铜色: '#8a5a2b',
  古铜红: '#8f3f2d',
  卡其色: '#c3aa75',
  黑色: '#111111',
  黑: '#111111',
  灰色: '#a3a3a3',
  灰: '#a3a3a3',
  浅灰色: '#c7c7c7',
  浅灰: '#c7c7c7',
  深灰色: '#6b7280',
  深灰: '#6b7280',
  白色: '#f7f2e8',
  白: '#f7f2e8',
  橙色: '#f06423',
  橙: '#f06423',
  金色: '#caa24c',
  金: '#caa24c',
  银色: '#c0c0c0',
  银: '#c0c0c0',
  浅金色: '#d9bd76',
  浅金: '#d9bd76',
  香槟金: '#d6bf8a',
  透明: 'rgba(255,255,255,0.66)',
  米色: '#d8c8a4',
  米: '#d8c8a4',
};

function colorHex(name) {
  const text = cleanText(name);
  if (!text) return '';
  return COLOR_HEX_MAP[text] || '';
}

function isLightSwatch(name) {
  return ['白色', '白', '米色', '米', '透明', '浅金色', '浅金', '香槟金', '浅灰色', '浅灰', '银色', '银', '卡其色'].includes(cleanText(name));
}

function categoryLookupFrom(categories = []) {
  const lookup = {};
  asArray(categories).forEach((item) => {
    const id = item && item.id;
    const name = cleanText(item && item.name).replace(/^[\s　]+/, '');
    if (id !== undefined && id !== null && id !== '' && name) lookup[String(id)] = name;
  });
  return lookup;
}

function categoryNamesFromIds(ids = [], lookup = {}) {
  return uniqueTexts(asArray(ids).map((id) => lookup[String(id)] || ''));
}

function textListCount(value) {
  return uniqueTexts(splitTextList(value)).length;
}

function imageFromItem(item) {
  if (!item) return '';
  if (typeof item === 'string') return cleanText(item);
  return firstText(item.images, item.url, item.src, item.image);
}

function uniqueImages(values) {
  const images = [];
  values.flatMap(asArray).forEach((item) => {
    const image = imageFromItem(item);
    if (image && !images.includes(image)) images.push(image);
  });
  return images;
}

function imageIdentity(image) {
  const text = cleanText(image);
  if (!text) return '';
  const path = text.split('?')[0].split('#')[0];
  const fileName = path.slice(path.lastIndexOf('/') + 1).toLowerCase();
  return fileName || text.toLowerCase();
}

function imagesWithout(baseImages = [], candidates = []) {
  const seen = new Set(uniqueImages(baseImages).map(imageIdentity));
  const result = [];
  uniqueImages(candidates).forEach((image) => {
    const key = imageIdentity(image);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(image);
  });
  return result;
}

function moneyNumber(value) {
  return toNumber(value, 0);
}

function formatMoney(value) {
  const number = moneyNumber(value);
  return number > 0 ? number.toFixed(2).replace(/\.00$/, '') : '';
}

export function productPriceText(product = {}) {
  const min = formatMoney(product.min_price);
  const max = formatMoney(product.max_price);
  const price = formatMoney(product.price || product.retail_price || product.original_price);

  if (min && max && min !== max) return `¥${min}-${max}`;
  if (min || price) return `¥${min || price}`;
  return '咨询价格';
}

function modelUrlFrom(raw = {}) {
  return firstText(
    raw.model_url,
    raw.modelUrl,
    raw.model3d_url,
    raw.model3DUrl,
    raw.model_file_url,
    raw.modelFileUrl,
    raw.three_d_model_url,
    raw.threeDModelUrl,
    raw.goods_model_url,
    raw.goods3d_model_url,
    raw.goods_3d_model_url,
    raw.spu_model_url,
    raw.glb_url,
    raw.gltf_url,
    raw.usdz_url,
  );
}

function truthyFlag(value) {
  if (value === true) return true;
  if (value === false || value === undefined || value === null) return false;
  if (typeof value === 'number') return value > 0;
  return ['1', 'true', 'yes', 'y', 'on'].includes(cleanText(value).toLowerCase());
}

function productHasModel(raw = {}, modelUrl = '') {
  if (modelUrl) return true;
  return [
    raw.has_model,
    raw.hasModel,
    raw.has_3d_model,
    raw.has3dModel,
    raw.is_model_product,
    raw.model_enabled,
    raw.enable_model,
  ].some(truthyFlag);
}

function normalizeParamItem(item) {
  if (!item) return null;
  const label = firstText(item.label, item.name, item.title, item.key);
  const value = firstText(item.value, item.text, item.content, item.val);
  if (!label && !value) return null;
  return {
    label: label || '参数',
    value: value || '-',
  };
}

function normalizeParamRows(rows = []) {
  return asArray(rows).map(normalizeParamItem).filter(Boolean);
}

function canonicalParamLabel(label) {
  const clean = cleanText(label);
  return {
    商品编号: '编号',
    编码: '编号',
    编号: '编号',
    商品分类: '分类',
    分类: '分类',
    商品颜色: '颜色',
    颜色: '颜色',
    商品单位: '单位',
    单位: '单位',
    装箱数量: '装箱数',
    装箱数: '装箱数',
  }[clean] || clean;
}

function mergeParamRows(primaryRows = [], extraRows = []) {
  const rows = [];
  const seen = new Set();

  [...primaryRows, ...normalizeParamRows(extraRows)].forEach((item) => {
    const label = canonicalParamLabel(item && item.label);
    const value = cleanText(item && item.value);
    if (!label || !value || seen.has(label)) return;
    seen.add(label);
    rows.push({ label, value });
  });

  return rows;
}

function productSpecCount(raw = {}, colorText = '') {
  const explicitCount = toNumber(raw.spec_count || raw.color_count, 0);
  if (explicitCount > 0) return explicitCount;

  const groupCount = asArray(raw.product_group_data).length;
  if (groupCount > 0) return groupCount;

  const colorCount = textListCount([
    raw.available_colors,
    raw.color_names,
    raw.color_text,
    colorText,
    raw.color,
    raw.spec,
  ]);
  return colorCount || 1;
}

function productImageCandidates(raw = {}) {
  return uniqueImages([
    raw.color_image_url,
    raw.color_images,
    raw.color_image_urls,
    raw.color_gallery,
    raw.color_gallery_images,
    raw.spec_images,
    raw.sku_images,
    raw.spec_image_url,
    raw.sku_image_url,
    raw.images,
    raw.main_images,
    raw.main_images_list,
  ]);
}

function productVariantColorImages(variants = []) {
  const images = [];
  asArray(variants).forEach((variant) => {
    images.push(...productImageCandidates(variant));
  });
  return uniqueImages(images);
}

function productColorImages(raw = {}, mainImages = [], detailImages = [], specCount = 1) {
  return imagesWithout(mainImages, [
    raw.color_image_url,
    raw.color_images,
    raw.color_image_urls,
    raw.color_gallery,
    raw.color_gallery_images,
    raw.spec_images,
    raw.sku_images,
    productVariantColorImages(raw.product_group_data),
  ]);
}

export function normalizeProduct(raw = {}, options = {}) {
  const id = raw.id || raw.goods_id || raw.product_id || '';
  const code = firstText(raw.product_code, raw.coding, raw.sku_no);
  const name = firstText(raw.title, raw.name, raw.goods_name, code ? `产品 ${code}` : '北极星智能体产品');
  const categoryLookup = options.categoryLookup || categoryLookupFrom(options.categories || []);
  const categoryName = formatTextList(
    raw.product_category_names,
    raw.category_names,
    raw.product_category_texts,
    categoryNamesFromIds(raw.product_category_ids, categoryLookup),
    raw.product_category_text,
    raw.category_name,
    raw.category,
  );
  const sizeLabel = firstText(raw.size_label, raw.size, raw.spec_label);
  const colorText = formatTextList(raw.available_colors, raw.color_names, raw.color_text, raw.color, raw.spec);
  const colorNames = splitTextList(colorText);
  const colorSwatches = colorNames
    .map((name) => {
      const value = colorHex(name);
      return value ? { value, isLight: isLightSwatch(name) } : null;
    })
    .filter(Boolean);
  const specCount = productSpecCount(raw, colorText);
  const specText = firstText(sizeLabel, raw.simple_desc, raw.piece_text);
  const description = firstText(specText, categoryName, raw.tea_type, raw.bag_type, '北极星智能体商品');
  const mainImages = uniqueImages([
    raw.main_images_list,
    raw.images,
    raw.main_images,
    raw.spu_main_image_url,
    raw.spec_image_url,
    raw.sku_image_url,
    raw.share_images,
  ]);
  const photos = uniqueImages([raw.photo, mainImages]);
  const detailImages = uniqueImages([raw.content_app, raw.detail_image_urls]);
  const colorImages = productColorImages(raw, mainImages, detailImages, specCount);
  const modelUrl = modelUrlFrom(raw);
  const hasModel = productHasModel(raw, modelUrl);

  return {
    ...raw,
    id,
    goods_id: raw.goods_id || id,
    product_id: raw.product_id || id,
    productCode: code,
    productName: name,
    cover: photos[0] || PLACEHOLDER_IMAGE,
    mainImages,
    colorImages,
    photos: photos.map((image) => ({ images: image })),
    detailImages,
    categoryName,
    colorText,
    colorNames,
    colorSwatches,
    sizeLabel,
    specText,
    specCount,
    unitName: firstText(raw.unit_name, raw.unit),
    pieceText: firstText(raw.piece_text, raw.case_pack_text, raw.case_pack_qty),
    description,
    priceText: productPriceText(raw),
    modelUrl,
    hasModel,
    params: normalizeParamRows((raw.parameters && raw.parameters.detail) || raw.base_data || []),
    hasImage: photos.length > 0,
    raw,
  };
}

export function normalizeProducts(items = []) {
  return asArray(items).map((item) => normalizeProduct(item));
}

export function normalizeProductPage(page = {}) {
  return normalizePageData(page, normalizeProduct);
}

export function normalizeProductDetail(product = {}, options = {}) {
  return normalizeProduct(product, options);
}

export function buildProductDetailPayload(product = {}) {
  const showDetailMedia = toNumber(product.specCount || product.spec_count || product.color_count, 1) > 1;
  const galleryImages = showDetailMedia
    ? uniqueImages([product.mainImages, product.colorImages, product.cover, product.images])
    : uniqueImages([product.mainImages, product.cover, product.images]);
  const detailImages = showDetailMedia ? uniqueImages([product.detailImages]) : [];
  const modelUrl = product.modelUrl || modelUrlFrom(product);
  const hasModel = productHasModel(product, modelUrl);

  const paramRows = mergeParamRows(
    [
      { label: '编号', value: product.productCode },
      { label: '分类', value: product.categoryName },
      { label: '规格', value: product.sizeLabel },
      { label: '颜色', value: product.colorText },
      { label: '单位', value: product.unitName },
      { label: '装箱数', value: product.pieceText },
    ],
    product.params || [],
  );

  return {
    title: product.productName || product.title || product.name || '北极星智能体产品',
    titleNeedsOpticalAlign: /^【/.test(product.productName || product.title || product.name || ''),
    categoryName: product.categoryName || '',
    categoryTags: splitTextList(product.categoryName || ''),
    colorSwatches: asArray(product.colorSwatches),
    description: product.description || '北极星智能体商品',
    priceText: product.priceText || productPriceText(product),
    galleryImages,
    infoRows: paramRows,
    paramRows,
    detailImages,
    contentWeb: showDetailMedia ? product.content_web || '' : '',
    showDetailMedia,
    modelUrl,
    hasModel,
    modelBadgeText: hasModel ? '3D视图' : '',
    bottomActions: [
      { text: '返回分类', variant: 'outline', key: 'category' },
      { text: '联系咨询', variant: 'default', key: 'contact' },
    ],
  };
}
