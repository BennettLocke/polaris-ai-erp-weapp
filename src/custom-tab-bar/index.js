const DEFAULT_ITEMS = [
  {
    value: 'home',
    text: '首页',
    pagePath: '/pages/home/index',
    iconPath: 'https://img.513sjbz.com/static/upload/images/app_center_nav/2026/03/30/1774869699282797.png',
    selectedIconPath: 'https://img.513sjbz.com/static/upload/images/app_center_nav/2026/03/30/1774869699200935.png',
  },
  {
    value: 'category',
    text: '分类',
    pagePath: '/pages/category/index',
    iconPath: 'https://img.513sjbz.com/static/upload/images/app_center_nav/2026/03/30/1774869699309568.png',
    selectedIconPath: 'https://img.513sjbz.com/static/upload/images/app_center_nav/2026/03/30/1774869698249700.png',
  },
  {
    value: 'order',
    text: '订单',
    pagePath: '/pages/orderflow/index',
    iconPath: 'https://img.513sjbz.com/static/upload/images/app_center_nav/2026/03/30/1774869699858406.png',
    selectedIconPath: 'https://img.513sjbz.com/static/upload/images/app_center_nav/2026/03/30/1774869699328333.png',
  },
  {
    value: 'my',
    text: '我的',
    pagePath: '/pages/my/index',
    iconPath: 'https://img.513sjbz.com/static/upload/images/app_center_nav/2026/03/30/1774869699161830.png',
    selectedIconPath: 'https://img.513sjbz.com/static/upload/images/app_center_nav/2026/03/30/1774869699255558.png',
  },
];

const STORAGE_KEY = 'sj_mall_tabbar_items';

const ROUTE_VALUE_MAP = DEFAULT_ITEMS.reduce((mapping, item) => {
  mapping[item.pagePath] = item.value;
  return mapping;
}, {});

function firstImageUrl(value) {
  if (Array.isArray(value) && value.length > 0) {
    return firstImageUrl(value[0]);
  }
  if (value && typeof value === 'object') {
    return value.url || value.src || value.image || '';
  }
  return typeof value === 'string' ? value : '';
}

function normalizePath(value, fallback = '') {
  const text = String(value || fallback || '').trim();
  if (!text) return '';
  return text.startsWith('/') ? text : `/${text}`;
}

function valueForPath(path, fallback = '') {
  return ROUTE_VALUE_MAP[normalizePath(path)] || fallback || '';
}

function normalizeItem(item = {}, index = 0) {
  const fallback = DEFAULT_ITEMS[index] || {};
  const pagePath = normalizePath(item.pagePath || item.page_path || item.url || item.path, fallback.pagePath);
  const iconPath = item.iconPath || item.icon || item.icon_url || firstImageUrl(item.img) || fallback.iconPath || '';
  const selectedIconPath = item.selectedIconPath
    || item.selected_icon
    || item.selectedIcon
    || item.activeIcon
    || item.active_icon_url
    || item.selected_icon_url
    || firstImageUrl(item.img_checked)
    || fallback.selectedIconPath
    || iconPath;

  return {
    value: valueForPath(pagePath, item.value || item.key || fallback.value || String(index)),
    text: item.text || item.title || item.label || item.name || fallback.text || '',
    pagePath,
    iconPath,
    selectedIconPath,
  };
}

function readStoredItems() {
  try {
    const saved = wx.getStorageSync(STORAGE_KEY);
    const source = Array.isArray(saved) ? saved : saved && Array.isArray(saved.items) ? saved.items : [];
    const itemsByPath = source
      .map(normalizeItem)
      .filter((item) => item.text && item.pagePath && ROUTE_VALUE_MAP[item.pagePath])
      .reduce((mapping, item) => {
        mapping[item.pagePath] = item;
        return mapping;
      }, {});

    const hasAllTabPages = DEFAULT_ITEMS.every((item) => itemsByPath[item.pagePath]);
    if (!hasAllTabPages) return [];

    return DEFAULT_ITEMS.map((item, index) => normalizeItem({
      ...item,
      ...itemsByPath[item.pagePath],
    }, index));
  } catch (error) {
    return [];
  }
}

function currentPagePath() {
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
  const current = pages[pages.length - 1];
  return current && current.route ? `/${current.route}` : '';
}

function activeItemForPath(list, path) {
  const safePath = normalizePath(path);
  return (list || DEFAULT_ITEMS).find((item) => item.pagePath === safePath)
    || DEFAULT_ITEMS.find((item) => item.pagePath === safePath)
    || null;
}

Component({
  data: {
    selected: 'home',
    selectedPath: '/pages/home/index',
    list: DEFAULT_ITEMS,
  },
  lifetimes: {
    attached() {
      this.refreshItems();
      this.syncActive();
    },
  },
  pageLifetimes: {
    show() {
      this.refreshItems();
      this.syncActive();
    },
  },
  methods: {
    refreshItems() {
      const storedItems = readStoredItems();
      if (storedItems.length) {
        this.setData({ list: storedItems });
      }
    },
    syncActive() {
      this.setActiveByPath(currentPagePath());
    },
    setActiveByPath(path) {
      const activeItem = activeItemForPath(this.data.list, path);
      if (activeItem && activeItem.pagePath !== this.data.selectedPath) {
        this.setData({
          selected: activeItem.value,
          selectedPath: activeItem.pagePath,
        });
      }
      return Boolean(activeItem);
    },
    switchTab(event) {
      const path = normalizePath(event.currentTarget.dataset.path);
      const item = (this.data.list || DEFAULT_ITEMS).find((navItem) => navItem.pagePath === path);
      if (!item || !item.pagePath) return;
      this.setActiveByPath(item.pagePath);
      wx.switchTab({ url: item.pagePath });
    },
  },
});
