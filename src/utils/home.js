const HOME_NAVS = [
  { title: '分类', url: '/pages/category/index' },
  { title: '订单', url: '/pages/orderflow/index' },
  { title: '我的', url: '/pages/my/index' },
  { title: '搜索', url: '/pages/product/list' },
];

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function dropAllCategory(categories) {
  return asArray(categories).filter((item) => item && item.id !== '');
}

function cleanText(value) {
  return String(value || '').trim();
}

function categoryNameKeys(item = {}) {
  return [
    item.rawName,
    item.name,
    item.title,
    item.category_name,
    item.link_value,
  ].map(cleanText).filter(Boolean);
}

function categoryIdKeys(item = {}) {
  return [
    item.category_id,
    item.categoryId,
    item.id,
    item.link_type === 'category' ? item.link_value : '',
  ].filter((value) => value !== undefined && value !== null && value !== '').map(String);
}

function buildCategoryLookup(categories = []) {
  const byId = new Map();
  const byName = new Map();
  dropAllCategory(categories).forEach((item) => {
    categoryIdKeys(item).forEach((key) => byId.set(key, item));
    categoryNameKeys(item).forEach((key) => byName.set(key, item));
  });
  return { byId, byName };
}

function findSharedCategoryIcon(item = {}, lookup) {
  if (!lookup) return null;
  for (const key of categoryIdKeys({ category_id: item.category_id, categoryId: item.categoryId, link_type: item.link_type, link_value: item.link_value })) {
    const matched = lookup.byId.get(key);
    if (matched) return matched;
  }
  for (const key of categoryNameKeys(item)) {
    const matched = lookup.byName.get(key);
    if (matched) return matched;
  }
  return null;
}

function mergeHomeCategoryWithSharedIcon(item = {}, lookup) {
  const matched = findSharedCategoryIcon(item, lookup);
  if (!matched) return item;
  const image = matched.image || matched.icon_url || matched.icon || matched.realistic_images || '';
  const activeImage = matched.activeImage || matched.active_icon_url || matched.icon_active || image;
  return {
    ...item,
    category_id: item.category_id || matched.id,
    category_name: item.category_name || matched.rawName || matched.name,
    icon_url: image || item.icon_url || item.icon || item.image_url || '',
    active_icon_url: activeImage || item.active_icon_url || item.icon_active || '',
    icon: image || item.icon || item.icon_url || '',
    image: image || item.image || item.image_url || '',
    activeImage: activeImage || item.activeImage || '',
  };
}

export function buildHomePayload({
  config = {},
  categories = [],
  productPage = {},
  featuredProductPage = {},
  newProductPage = {},
  hotProductPage = {},
  giftRecommendationPage = {},
  pouchRecommendationPage = {},
  pvcRecommendationPage = {},
  pvcRecommendationFallbackPage = {},
} = {}) {
  const configData = config && typeof config === 'object' ? config : {};
  const configCategories = asArray(configData.home_categories).filter((item) => item && (item.title || item.name));
  const categoryLookup = buildCategoryLookup(categories);
  const categoryItems = (configCategories.length ? configCategories : dropAllCategory(categories))
    .map((item) => mergeHomeCategoryWithSharedIcon(item, categoryLookup));
  const banners = asArray(configData.banners).filter((item) => item && (item.asset_url || item.image_url || item.image || item.url || typeof item === 'string'));
  const navItems = asArray(configData.nav_items).filter((item) => item && (item.url || item.link_value || item.title || item.name));
  const products = asArray(productPage.data || productPage.list).slice(0, 8);
  const newSource = asArray(newProductPage.data || newProductPage.list || hotProductPage.data || hotProductPage.list);
  const featuredSource = asArray(featuredProductPage.data || featuredProductPage.list);
  const featuredProducts = (featuredSource.length ? featuredSource : newSource.length ? newSource : products).slice(0, 4);
  const newProducts = (newSource.length ? newSource : products).slice(0, 6);
  const explicitHotSource = asArray(hotProductPage.data || hotProductPage.list || hotProductPage.items);
  const latestHotFallback = newSource.length > 6 ? newSource.slice(6) : newSource;
  const hotProducts = (explicitHotSource.length ? explicitHotSource : latestHotFallback.length ? latestHotFallback : products).slice(0, 6);
  const giftRecommendedProducts = asArray(giftRecommendationPage.data || giftRecommendationPage.list || giftRecommendationPage.items).slice(0, 6);
  const pouchRecommendedProducts = asArray(pouchRecommendationPage.data || pouchRecommendationPage.list || pouchRecommendationPage.items).slice(0, 6);
  const pvcRecommendationSource = asArray(pvcRecommendationPage.data || pvcRecommendationPage.list || pvcRecommendationPage.items);
  const pvcRecommendationFallbackSource = asArray(pvcRecommendationFallbackPage.data || pvcRecommendationFallbackPage.list || pvcRecommendationFallbackPage.items);
  const pvcRecommendedProducts = (pvcRecommendationSource.length ? pvcRecommendationSource : pvcRecommendationFallbackSource).slice(0, 6);

  return {
    mode: 'code',
    source: 'sjagent',
    banners,
    navs: navItems.length ? navItems : HOME_NAVS,
    categories: categoryItems,
    featuredProducts,
    newProducts,
    hotProducts,
    giftRecommendedProducts,
    pouchRecommendedProducts,
    pvcRecommendedProducts,
    products,
    productPage: {
      ...productPage,
      data: products,
      list: products,
    },
    sections: [
      {
        key: 'featured_series',
        title: '主推系列',
        type: 'featured-series',
        products: featuredProducts,
      },
      {
        key: 'new_products',
        title: '新品上架',
        type: 'product-shelf',
        products: newProducts,
      },
      {
        key: 'hot_products',
        title: '热销榜',
        type: 'product-shelf',
        products: hotProducts,
      },
      {
        key: 'gift_recommendations',
        title: '礼盒推荐',
        type: 'product-grid',
        products: giftRecommendedProducts,
      },
      {
        key: 'pouch_recommendations',
        title: '泡袋推荐',
        type: 'product-grid',
        products: pouchRecommendedProducts,
      },
      {
        key: 'pvc_recommendations',
        title: 'PVC推荐',
        type: 'product-grid',
        products: pvcRecommendedProducts,
      },
      {
        key: 'category_entries',
        title: '产品分类',
        type: 'category-list',
        categories: categoryItems,
      },
    ],
  };
}
