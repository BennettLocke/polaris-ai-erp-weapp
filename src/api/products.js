import { request } from './request';
import { getCategories } from './categories';
import { normalizeProductDetail, normalizeProductPage } from '../utils/product';

let categoryCachePromise = null;

function getCategoryCache() {
  if (!categoryCachePromise) {
    categoryCachePromise = getCategories().catch((error) => {
      categoryCachePromise = null;
      throw error;
    });
  }
  return categoryCachePromise;
}

function productSearchKeyword(product = {}) {
  return product.sku_no || product.coding || product.product_code || product.title || product.name || '';
}

function isSameProductGroup(product = {}, item = {}) {
  if (product.spu_id && item.spu_id && String(product.spu_id) === String(item.spu_id)) return true;
  const productCode = productSearchKeyword(product);
  return Boolean(productCode && [item.sku_no, item.coding, item.product_code].some((value) => String(value || '') === String(productCode)));
}

function pickRelatedGroupFields(product = {}, related = {}) {
  if (!related || !Object.keys(related).length) return {};
  return {
    available_colors: product.available_colors || related.available_colors,
    color_count: product.color_count || related.color_count,
    color_names: product.color_names || related.color_names,
    color_text: product.color_text || related.color_text,
    product_group_data: product.product_group_data || related.product_group_data,
    spec_count: product.spec_count || related.spec_count,
  };
}

function hotProductImage(item = {}) {
  return item.images || item.image_url || item.image || item.main_images || item.share_images || '';
}

function normalizeHotProductPage(page = {}) {
  const sourceItems = page.items || page.data || page.list || [];
  const items = sourceItems.map((item = {}) => {
    const productId = item.id || item.goods_id || item.product_id;
    const image = hotProductImage(item);
    return {
      ...item,
      id: item.id || productId,
      goods_id: item.goods_id || productId,
      product_id: productId,
      images: item.images || image,
      main_images: item.main_images || image,
      share_images: item.share_images || image,
      sales_count: item.sales_count || item.sold_qty || 0,
    };
  });
  return normalizeProductPage({
    ...page,
    data: items,
    list: items,
    items,
    page: page.page || 1,
    page_size: page.page_size || page.limit || items.length || 20,
    total: page.total || items.length,
  });
}

function hotProductKeyword(item = {}) {
  return item.sku_no || item.product_code || item.coding || item.title || item.name || '';
}

function findHotProductDetail(hotItem = {}, items = []) {
  const code = hotItem.sku_no || hotItem.product_code || hotItem.coding || '';
  return items.find((item) => code && [item.sku_no, item.coding, item.product_code].some((value) => String(value || '') === String(code))) || items[0] || {};
}

function mergeHotProductDetail(hotItem = {}, detail = {}) {
  const hotImage = hotProductImage(hotItem);
  return {
    ...hotItem,
    ...detail,
    rank: hotItem.rank,
    sold_qty: hotItem.sold_qty,
    amount: hotItem.amount,
    amount_value: hotItem.amount_value,
    order_count: hotItem.order_count,
    customer_count: hotItem.customer_count,
    last_sold_at: hotItem.last_sold_at,
    sales_count: hotItem.sales_count || hotItem.sold_qty || detail.sales_count || 0,
    images: detail.images || hotImage,
    main_images: detail.main_images || hotImage,
    share_images: detail.share_images || hotImage,
  };
}

function enrichHotProductItem(item = {}) {
  const keyword = hotProductKeyword(item);
  if (!keyword) return Promise.resolve(item);
  return request('/api/mini/search/datalist', {
    method: 'POST',
    auth: false,
    data: {
      page: 1,
      page_size: 3,
      wd: keyword,
    },
  }).then((page) => {
    const detail = findHotProductDetail(item, page.data || page.list || page.items || []);
    return mergeHotProductDetail(item, detail);
  }).catch(() => item);
}

function enrichHotProductPage(page = {}) {
  const items = page.items || page.data || page.list || [];
  return Promise.allSettled(items.map((item) => enrichHotProductItem(item))).then((results) => ({
    ...page,
    items: results.map((result, index) => (result.status === 'fulfilled' ? result.value : items[index])),
  }));
}

function getRelatedProductGroup(product = {}) {
  if (product.product_group_data && product.product_group_data.length) return Promise.resolve({});
  const keyword = productSearchKeyword(product);
  if (!keyword) return Promise.resolve({});

  return request('/api/mini/search/datalist', {
    method: 'POST',
    data: { page: 1, page_size: 1, wd: keyword },
  }).then((data) => {
    const items = data.data || data.list || data.items || [];
    return items.find((item) => isSameProductGroup(product, item)) || items[0] || {};
  }).catch(() => ({}));
}

export function getProducts(params = {}) {
  return request('/api/mini/search/datalist', {
    method: 'POST',
    data: {
      page: params.page || 1,
      page_size: params.page_size || 20,
      wd: params.keyword || '',
      category_id: params.category_id || '',
      category_ids: params.category_ids || params.categoryIds || [],
      sort: params.sort || '',
    },
  }).then(normalizeProductPage);
}

export function getHotProducts(params = {}) {
  const categoryNames = params.category_names || params.categoryNames || params.categories || [];
  return request('/api/mini/analytics/hot-products', {
    method: 'POST',
    auth: false,
    data: {
      period: params.period || '30d',
      limit: params.limit || params.page_size || 6,
      dimension: params.dimension || 'product',
      category_names: params.category_names || categoryNames,
    },
  }).then(enrichHotProductPage).then(normalizeHotProductPage);
}

export function getProductDetail(id) {
  const detailPromise = request('/api/mini/goods/detail', {
    method: 'POST',
    data: { id },
  });

  return detailPromise.then((detailData) => Promise.allSettled([
    getCategoryCache(),
    getRelatedProductGroup(detailData.goods || {}),
  ]).then(([categoriesResult, relatedResult]) => {
    const goods = detailData.goods || {};
    const related = relatedResult.status === 'fulfilled' ? relatedResult.value : {};
    const mergedGoods = {
      ...goods,
      ...pickRelatedGroupFields(goods, related),
    };
    return normalizeProductDetail(mergedGoods, {
      categories: categoriesResult.status === 'fulfilled' ? categoriesResult.value : [],
    });
  }));
}
