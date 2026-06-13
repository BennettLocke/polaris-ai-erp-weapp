const STORAGE_PREFIX = 'sj_product_footprint';
const DEFAULT_RECENT_LIMIT = 80;
const DEFAULT_FAVORITE_LIMIT = 120;

const memoryStorage = new Map();

function cleanText(value) {
  return String(value || '').trim();
}

function firstText(...values) {
  return values.map(cleanText).find(Boolean) || '';
}

function toId(value) {
  const text = cleanText(value);
  return text || '';
}

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function hashText(value) {
  let hash = 2166136261;
  Array.from(cleanText(value)).forEach((char) => {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  });
  return hash.toString(36);
}

function nowValue(options = {}) {
  return typeof options.now === 'function' ? Number(options.now() || Date.now()) : Date.now();
}

function storageAdapter(options = {}) {
  if (options.storage) return options.storage;
  if (typeof uni !== 'undefined') return uni;
  return {
    getStorageSync(key) {
      return memoryStorage.get(key) || '';
    },
    setStorageSync(key, value) {
      memoryStorage.set(key, value);
    },
    removeStorageSync(key) {
      memoryStorage.delete(key);
    },
  };
}

function emptyFootprint() {
  return {
    favorites: [],
    recent: [],
    stats: {},
  };
}

function normalizeFootprint(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    favorites: Array.isArray(source.favorites) ? source.favorites.filter(Boolean) : [],
    recent: Array.isArray(source.recent) ? source.recent.filter(Boolean) : [],
    stats: source.stats && typeof source.stats === 'object' && !Array.isArray(source.stats) ? source.stats : {},
  };
}

function readRawFootprint(authState = {}, options = {}) {
  const storage = storageAdapter(options);
  if (!storage || typeof storage.getStorageSync !== 'function') return emptyFootprint();
  const raw = storage.getStorageSync(productFootprintStorageKey(authState));
  if (!raw) return emptyFootprint();
  if (typeof raw === 'object') return normalizeFootprint(raw);
  try {
    return normalizeFootprint(JSON.parse(raw));
  } catch (error) {
    return emptyFootprint();
  }
}

function writeFootprint(authState = {}, footprint = {}, options = {}) {
  const storage = storageAdapter(options);
  const normalized = normalizeFootprint(footprint);
  if (storage && typeof storage.setStorageSync === 'function') {
    storage.setStorageSync(productFootprintStorageKey(authState), normalized);
  }
  return normalized;
}

function recordKey(record = {}) {
  return toId(record.id || record.goods_id || record.product_id || record.productCode || record.product_code);
}

function compactListById(items = [], limit = DEFAULT_RECENT_LIMIT) {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    const key = recordKey(item);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });
  return result.slice(0, limit);
}

export function footprintScopeKey(authState = {}) {
  const user = authState.user || authState.currentUser || {};
  const customerId = firstText(user.linked_party_id, user.customer_id, user.customerId);
  if (customerId) return `customer:${customerId}`;

  const userId = firstText(user.id, user.user_id, user.userId, user.account, user.username, user.mobile, user.phone);
  if (userId) return `user:${userId}`;

  const token = cleanText(authState.token);
  if (token) return `auth:${hashText(token)}`;
  return 'guest';
}

export function productFootprintStorageKey(authState = {}) {
  return `${STORAGE_PREFIX}:${footprintScopeKey(authState)}`;
}

export function productFootprintRecord(product = {}) {
  const id = firstText(product.id, product.goods_id, product.product_id, product.goodsId, product.productId);
  const code = firstText(product.productCode, product.product_code, product.coding, product.sku_no, product.code);
  const title = firstText(product.productName, product.product_name, product.title, product.name, product.goods_name, code ? `Product ${code}` : '');
  const cover = firstText(
    product.cover,
    product.images,
    product.image,
    product.image_url,
    product.main_images,
    product.share_images,
    Array.isArray(product.mainImages) ? product.mainImages[0] : ''
  );

  return {
    id,
    goods_id: firstText(product.goods_id, product.goodsId, id),
    product_id: firstText(product.product_id, product.productId, id),
    productCode: code,
    productName: title,
    title,
    cover,
    priceText: firstText(product.priceText, product.price_text, product.minPriceText, product.price),
    categoryName: firstText(product.categoryName, product.category_name, product.product_category_text),
    description: firstText(product.description, product.simple_desc, product.specText),
    pieceText: firstText(product.pieceText, product.piece_text, product.case_pack_text, product.case_pack_qty),
    colorText: firstText(product.colorText, product.color_text, product.color, product.spec),
  };
}

export function getProductFootprint(authState = {}, options = {}) {
  return readRawFootprint(authState, options);
}

export function favoriteProductIds(authState = {}, options = {}) {
  return getProductFootprint(authState, options).favorites.map((item) => recordKey(item)).filter(Boolean);
}

export function isProductFavorite(productOrId, authState = {}, options = {}) {
  const id = typeof productOrId === 'object' ? recordKey(productFootprintRecord(productOrId)) : toId(productOrId);
  if (!id) return false;
  return favoriteProductIds(authState, options).includes(id);
}

export function toggleProductFavorite(product = {}, authState = {}, options = {}) {
  const footprint = getProductFootprint(authState, options);
  const record = productFootprintRecord(product);
  const id = recordKey(record);
  if (!id) return { favorite: false, footprint };

  const exists = footprint.favorites.some((item) => recordKey(item) === id);
  const nextFavorites = exists
    ? footprint.favorites.filter((item) => recordKey(item) !== id)
    : [{ ...record, favoriteAt: nowValue(options) }, ...footprint.favorites];

  const nextFootprint = writeFootprint(authState, {
    ...footprint,
    favorites: compactListById(nextFavorites, options.favoriteLimit || DEFAULT_FAVORITE_LIMIT),
  }, options);

  return {
    favorite: !exists,
    footprint: nextFootprint,
  };
}

export function recordProductView(product = {}, authState = {}, options = {}) {
  const footprint = getProductFootprint(authState, options);
  const record = productFootprintRecord(product);
  const id = recordKey(record);
  if (!id) return footprint;

  const viewedAt = nowValue(options);
  const previousStats = footprint.stats[id] || {};
  const stats = {
    ...footprint.stats,
    [id]: {
      viewCount: toNumber(previousStats.viewCount) + 1,
      firstViewedAt: previousStats.firstViewedAt || viewedAt,
      lastViewedAt: viewedAt,
    },
  };

  const recent = compactListById([
    { ...record, viewedAt },
    ...footprint.recent.filter((item) => recordKey(item) !== id),
  ], options.recentLimit || DEFAULT_RECENT_LIMIT);

  return writeFootprint(authState, {
    ...footprint,
    recent,
    stats,
  }, options);
}

export function clearProductRecentViews(authState = {}, options = {}) {
  const footprint = getProductFootprint(authState, options);
  return writeFootprint(authState, {
    ...footprint,
    recent: [],
  }, options);
}

function salesProductRecord(item = {}) {
  const id = firstText(item.id, item.goods_id, item.product_id, item.goodsId, item.productId, item.product_code, item.productCode);
  const code = firstText(item.productCode, item.product_code, item.coding, item.sku_no, item.code);
  const title = firstText(item.productName, item.product_name, item.goods_name, item.title, item.name, code);
  return {
    id,
    goods_id: firstText(item.goods_id, item.goodsId, id),
    product_id: firstText(item.product_id, item.productId, id),
    productCode: code,
    productName: title,
    title,
    cover: firstText(item.cover, item.image, item.image_url, item.images, item.main_images),
    priceText: firstText(item.priceText, item.price_text, item.price, item.amount),
    categoryName: firstText(item.categoryName, item.category_name, item.product_category_text),
    description: firstText(item.description, item.simple_desc),
    pieceText: firstText(item.pieceText, item.piece_text, item.spec, item.size),
    colorText: firstText(item.colorText, item.color_text, item.color),
  };
}

export function mergeSalesOrderFrequentProducts(items = []) {
  const map = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const record = salesProductRecord(item);
    const id = recordKey(record);
    if (!id) return;

    const previous = map.get(id) || {
      ...record,
      purchaseCount: 0,
      quantityTotal: 0,
      lastPurchasedAt: 0,
    };
    const quantity = toNumber(item.quantity || item.qty || item.goods_number || item.num || 1) || 1;
    map.set(id, {
      ...previous,
      ...record,
      purchaseCount: previous.purchaseCount + 1,
      quantityTotal: previous.quantityTotal + quantity,
      lastPurchasedAt: Math.max(toNumber(previous.lastPurchasedAt), toNumber(item.created_at || item.order_time || item.time)),
    });
  });
  return Array.from(map.values());
}

function mergeFrequentRecord(map, record = {}, patch = {}) {
  const id = recordKey(record);
  if (!id) return;
  const previous = map.get(id) || productFootprintRecord(record);
  map.set(id, {
    ...previous,
    ...record,
    ...patch,
  });
}

export function rankFrequentProducts(footprint = {}, salesProducts = [], options = {}) {
  const normalized = normalizeFootprint(footprint);
  const map = new Map();
  const favoriteIds = new Set(normalized.favorites.map((item) => recordKey(item)));

  normalized.recent.forEach((item) => {
    const id = recordKey(item);
    const stats = normalized.stats[id] || {};
    mergeFrequentRecord(map, item, {
      viewCount: toNumber(stats.viewCount),
      lastViewedAt: toNumber(stats.lastViewedAt || item.viewedAt),
    });
  });

  normalized.favorites.forEach((item) => {
    const id = recordKey(item);
    const stats = normalized.stats[id] || {};
    mergeFrequentRecord(map, item, {
      isFavorite: true,
      favoriteAt: toNumber(item.favoriteAt),
      viewCount: toNumber(stats.viewCount),
      lastViewedAt: toNumber(stats.lastViewedAt),
    });
  });

  (Array.isArray(salesProducts) ? salesProducts : []).forEach((item) => {
    mergeFrequentRecord(map, item, {
      purchaseCount: toNumber(item.purchaseCount),
      quantityTotal: toNumber(item.quantityTotal),
      lastPurchasedAt: toNumber(item.lastPurchasedAt),
    });
  });

  const ranked = Array.from(map.values()).map((item) => {
    const id = recordKey(item);
    const isFavorite = Boolean(item.isFavorite || favoriteIds.has(id));
    const purchaseCount = toNumber(item.purchaseCount);
    const quantityTotal = toNumber(item.quantityTotal);
    const viewCount = toNumber(item.viewCount);
    const lastActivity = Math.max(
      toNumber(item.lastPurchasedAt),
      toNumber(item.favoriteAt),
      toNumber(item.lastViewedAt),
      toNumber(item.viewedAt)
    );
    const score = purchaseCount * 1000
      + quantityTotal * 20
      + (isFavorite ? 500 : 0)
      + viewCount * 50
      + lastActivity / 1000000000000;
    return {
      ...item,
      isFavorite,
      purchaseCount,
      quantityTotal,
      viewCount,
      footprintScore: score,
    };
  });

  return ranked
    .sort((a, b) => b.footprintScore - a.footprintScore)
    .slice(0, options.limit || 60);
}
