import { asArray, toNumber } from './list.js';

const REMOVED_CATEGORY_NAMES = new Set(['纯色泡袋', '品种茶泡袋', '2泡礼盒']);
const CATEGORY_ORDER_GROUPS = [
  ['半斤礼盒'],
  ['三两礼盒'],
  ['二两礼盒'],
  ['一两礼盒'],
  ['6小盒礼盒', '六小盒礼盒', '6小盒', '六小盒'],
  ['3小盒礼盒', '三小盒礼盒', '3小盒', '三小盒'],
  ['2泡小盒', '二泡小盒', '2泡盒', '二泡盒', '2小盒礼盒', '二小盒礼盒'],
];
const AFTER_BAG_CATEGORY_ORDER = [
  ['pvc礼盒', 'PVC礼盒'],
  ['快递纸箱', '纸箱'],
  ['五格礼盒', '5格礼盒'],
  ['其他产品'],
];
const CATEGORY_FIXED_RANK = new Map();

CATEGORY_ORDER_GROUPS.forEach((names, index) => {
  names.forEach((name) => CATEGORY_FIXED_RANK.set(cleanCategoryKey(name), index));
});
AFTER_BAG_CATEGORY_ORDER.forEach((names, index) => {
  names.forEach((name) => CATEGORY_FIXED_RANK.set(cleanCategoryKey(name), 200 + index));
});

function cleanText(value) {
  return String(value || '').trim();
}

function cleanCategoryKey(value) {
  return cleanText(value).toLowerCase();
}

function firstText(...values) {
  return values.map(cleanText).find(Boolean) || '';
}

export function categoryImage(item = {}) {
  return firstText(
    item.images,
    item.realistic_images,
    item.icon,
    item.icon_active,
    item.big_images,
    item.image,
    item.cover,
    item.pic_url,
    item.logo,
  );
}

export function categoryActiveImage(item = {}) {
  return firstText(
    item.icon_active,
    item.icon,
    item.images,
    item.realistic_images,
    item.big_images,
    item.image,
    item.cover,
    item.pic_url,
    item.logo,
  );
}

export function categoryInitial(name = '') {
  const text = cleanText(name).replace(/^[\s　]+/, '');
  return text ? text.slice(0, 1) : '分';
}

export function categoryDomId(item = {}, index = 0) {
  const id = item.id === undefined || item.id === null || item.id === '' ? 'all' : item.id;
  return `category-${String(id).replace(/[^a-zA-Z0-9_-]/g, '') || index}`;
}

export function flattenCategories(items = [], level = 0) {
  return asArray(items).flatMap((item) => {
    const name = cleanText(item.name);
    const normalized = {
      ...item,
      id: item.id === undefined || item.id === null ? '' : item.id,
      name,
      rawName: name,
      level,
      total: toNumber(item.total, 0),
      image: categoryImage(item),
      activeImage: categoryActiveImage(item),
      initial: categoryInitial(name),
    };
    return [
      normalized,
      ...flattenCategories(item.items || item.children || [], level + 1),
    ];
  });
}

function hasExplicitTotal(item = {}) {
  return item.total !== undefined && item.total !== null && item.total !== '';
}

function categorySortRank(item = {}, fallbackIndex = 0) {
  const name = cleanCategoryKey(item.name);
  if (CATEGORY_FIXED_RANK.has(name)) return CATEGORY_FIXED_RANK.get(name);
  if (name.includes('泡袋') || name.includes('泡带') || name.includes('品种茶袋')) return 100 + fallbackIndex / 1000;
  return 300 + fallbackIndex / 1000;
}

function sortCategoryItems(items = []) {
  return asArray(items)
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const rankDiff = categorySortRank(left.item, left.index) - categorySortRank(right.item, right.index);
      return rankDiff || left.index - right.index;
    })
    .map(({ item }) => item);
}

function visibleCategoryTree(items = []) {
  return sortCategoryItems(items).flatMap((item) => {
    const name = cleanText(item && item.name);
    if (!item || REMOVED_CATEGORY_NAMES.has(name)) return [];

    const children = visibleCategoryTree(item.items || item.children || []);
    const total = toNumber(item.total, 0);
    if (hasExplicitTotal(item) && total <= 0 && children.length === 0) return [];

    return [{
      ...item,
      items: children,
    }];
  });
}

export function normalizeCategoryList(items = []) {
  return flattenCategories(visibleCategoryTree(items));
}
