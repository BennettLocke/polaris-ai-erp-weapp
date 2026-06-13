import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildProductFootprintUrl, buildProductListUrl, buildProductSmartSelectShareUrl, isTabBarUrl, openCustomerService, PAGE_ROUTES, resolveNavigationAction } from '../src/utils/route.js';
import { DEFAULT_SHARE_IMAGE } from '../src/utils/share.js';

describe('route helpers', () => {
  it('recognizes only real tabBar pages as switchTab targets', () => {
    assert.equal(isTabBarUrl('/pages/home/index'), true);
    assert.equal(isTabBarUrl('/pages/category/index'), true);
    assert.equal(isTabBarUrl('/pages/orderflow/index'), true);
    assert.equal(isTabBarUrl('/pages/my/index'), true);
    assert.equal(isTabBarUrl('/pages/product/list'), false);
    assert.equal(isTabBarUrl('/pages/product/smart-select-share'), false);
    assert.equal(isTabBarUrl('/pages/product/footprint'), false);
    assert.equal(isTabBarUrl('/pages/sales-orders/index'), false);
    assert.equal(isTabBarUrl('/pages/contact/index'), false);
  });

  it('selects the correct uni navigation method', () => {
    assert.deepEqual(resolveNavigationAction('/pages/orderflow/index'), {
      method: 'switchTab',
      url: '/pages/orderflow/index',
    });
    assert.deepEqual(resolveNavigationAction('/pages/product/list?keyword=泡袋'), {
      method: 'navigateTo',
      url: '/pages/product/list?keyword=泡袋',
    });
    assert.deepEqual(resolveNavigationAction(PAGE_ROUTES.salesOrders), {
      method: 'navigateTo',
      url: '/pages/sales-orders/index',
    });
    assert.deepEqual(resolveNavigationAction(PAGE_ROUTES.productFootprint), {
      method: 'navigateTo',
      url: '/pages/product/footprint',
    });
  });

  it('normalizes empty or invalid URLs to no-op actions', () => {
    assert.deepEqual(resolveNavigationAction(''), { method: 'none', url: '' });
    assert.deepEqual(resolveNavigationAction(null), { method: 'none', url: '' });
  });

  it('builds product list search urls with encoded keywords', () => {
    assert.equal(buildProductListUrl(), '/pages/product/list');
    assert.equal(buildProductListUrl({ keyword: '' }), '/pages/product/list');
    assert.equal(
      buildProductListUrl({ keyword: 'SJ1112 红色' }),
      '/pages/product/list?keyword=SJ1112%20%E7%BA%A2%E8%89%B2'
    );
    assert.equal(
      buildProductListUrl({ keyword: '半斤', category_id: '12' }),
      '/pages/product/list?keyword=%E5%8D%8A%E6%96%A4&category_id=12'
    );
  });

  it('builds product footprint urls with optional selected tabs', () => {
    assert.equal(buildProductFootprintUrl(), '/pages/product/footprint');
    assert.equal(buildProductFootprintUrl('favorites'), '/pages/product/footprint?tab=favorites');
    assert.equal(buildProductFootprintUrl('recent'), '/pages/product/footprint?tab=recent');
    assert.equal(buildProductFootprintUrl('frequent'), '/pages/product/footprint?tab=frequent');
    assert.equal(buildProductFootprintUrl('unknown'), '/pages/product/footprint');
  });

  it('builds smart selection share urls with encoded selection filters', () => {
    assert.equal(buildProductSmartSelectShareUrl(), '/pages/product/smart-select-share');
    assert.equal(
      buildProductSmartSelectShareUrl({
        size: 'three_liang',
        category_id: '2',
        color: '红色',
        price: 'custom',
        min: '10',
        max: '20',
      }),
      '/pages/product/smart-select-share?size=three_liang&category_id=2&color=%E7%BA%A2%E8%89%B2&price=custom&min=10&max=20'
    );
  });

  it('shows the customer service failure detail from WeChat', () => {
    const shownToasts = [];
    let payload = null;
    const originalWx = globalThis.wx;
    const originalUni = globalThis.uni;

    globalThis.uni = {
      showToast(options) {
        shownToasts.push(options);
      },
    };
    globalThis.wx = {
      openCustomerServiceChat(options) {
        payload = options;
        options.fail({ errMsg: 'openCustomerServiceChat:fail corpId is not bound' });
      },
    };

    try {
      assert.equal(openCustomerService(), true);
      assert.equal(payload.corpId, 'ww32faf883416778d9');
      assert.equal(shownToasts[0].title, 'openCustomerServiceChat:fail corpId is not bound');
    } finally {
      globalThis.wx = originalWx;
      globalThis.uni = originalUni;
    }
  });

  it('passes product context as a customer service message card', () => {
    let payload = null;
    const originalWx = globalThis.wx;
    const originalUni = globalThis.uni;
    const productTitle = '\u3010\u5ca9\u5f69\u3011\u4e8c\u4e09\u4e24';

    globalThis.uni = {};
    globalThis.wx = {
      openCustomerServiceChat(options) {
        payload = options;
      },
    };

    try {
      assert.equal(openCustomerService({
        type: 'product',
        id: 817,
        productName: productTitle,
        productCode: 'SJ1177',
        cover: 'https://img.513sjbz.com/red.jpg',
      }), true);

      assert.equal(payload.showMessageCard, true);
      assert.equal(payload.sendMessageTitle, `\u54a8\u8be2\uff1a${productTitle} SJ1177`);
      assert.equal(payload.sendMessagePath, '/pages/product/detail?id=817');
      assert.equal(payload.sendMessageImg, 'https://img.513sjbz.com/red.jpg');
      assert.equal(payload.corpId, 'ww32faf883416778d9');
    } finally {
      globalThis.wx = originalWx;
      globalThis.uni = originalUni;
    }
  });

  it('falls back to the default customer service card image and truncates long titles', () => {
    let payload = null;
    const originalWx = globalThis.wx;
    const originalUni = globalThis.uni;

    globalThis.uni = {};
    globalThis.wx = {
      openCustomerServiceChat(options) {
        payload = options;
      },
    };

    try {
      assert.equal(openCustomerService({
        type: 'product',
        id: 'long-title',
        title: 'Very long product title that needs to be truncated for customer service cards',
      }), true);

      assert.equal(payload.showMessageCard, true);
      assert.equal(payload.sendMessagePath, '/pages/product/detail?id=long-title');
      assert.equal(payload.sendMessageImg, DEFAULT_SHARE_IMAGE);
      assert.equal(payload.sendMessageTitle.startsWith('\u54a8\u8be2\uff1aVery long product'), true);
      assert.equal(payload.sendMessageTitle.length <= 32, true);
    } finally {
      globalThis.wx = originalWx;
      globalThis.uni = originalUni;
    }
  });
});
