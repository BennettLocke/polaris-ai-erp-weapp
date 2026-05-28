import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildProductListUrl, isTabBarUrl, openCustomerService, PAGE_ROUTES, resolveNavigationAction } from '../src/utils/route.js';

describe('route helpers', () => {
  it('recognizes only real tabBar pages as switchTab targets', () => {
    assert.equal(isTabBarUrl('/pages/home/index'), true);
    assert.equal(isTabBarUrl('/pages/category/index'), true);
    assert.equal(isTabBarUrl('/pages/orderflow/index'), true);
    assert.equal(isTabBarUrl('/pages/my/index'), true);
    assert.equal(isTabBarUrl('/pages/product/list'), false);
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
});
