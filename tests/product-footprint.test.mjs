import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  clearProductRecentViews,
  favoriteProductIds,
  footprintScopeKey,
  getProductFootprint,
  mergeSalesOrderFrequentProducts,
  productFootprintRecord,
  rankFrequentProducts,
  recordProductView,
  toggleProductFavorite,
} from '../src/utils/product-footprint.js';

function createStorage() {
  const store = new Map();
  return {
    getStorageSync(key) {
      return store.get(key) || '';
    },
    setStorageSync(key, value) {
      store.set(key, value);
    },
    removeStorageSync(key) {
      store.delete(key);
    },
  };
}

function product(overrides = {}) {
  return {
    id: 101,
    goods_id: 101,
    productCode: 'SJ0101',
    productName: 'Sample product',
    cover: 'https://img.513sjbz.com/p/101.jpg',
    priceText: '¥18',
    categoryName: 'Gift box',
    pieceText: '12 pcs/case',
    ...overrides,
  };
}

describe('product footprint storage', () => {
  it('scopes product footprint data by bound customer before account and guest', () => {
    assert.equal(footprintScopeKey({ user: { linked_party_id: 88, id: 12 } }), 'customer:88');
    assert.equal(footprintScopeKey({ user: { customer_id: 'C001', user_id: 12 } }), 'customer:C001');
    assert.equal(footprintScopeKey({ user: { id: 12, username: 'alice' } }), 'user:12');
    assert.equal(footprintScopeKey({ user: { username: 'alice' } }), 'user:alice');
    const tokenScope = footprintScopeKey({ token: 'token-value-without-user' });
    assert.match(tokenScope, /^auth:[a-z0-9]+$/);
    assert.equal(tokenScope, footprintScopeKey({ token: 'token-value-without-user' }));
    assert.doesNotMatch(tokenScope, /token-value-without-user/);
    assert.equal(footprintScopeKey({}), 'guest');
  });

  it('normalizes product data into compact reusable card records', () => {
    assert.deepEqual(productFootprintRecord(product()), {
      id: '101',
      goods_id: '101',
      product_id: '101',
      productCode: 'SJ0101',
      productName: 'Sample product',
      title: 'Sample product',
      cover: 'https://img.513sjbz.com/p/101.jpg',
      priceText: '¥18',
      categoryName: 'Gift box',
      description: '',
      pieceText: '12 pcs/case',
      colorText: '',
    });
  });

  it('toggles favorites without losing the rest of the footprint', () => {
    const storage = createStorage();
    const auth = { user: { id: 1 } };

    const added = toggleProductFavorite(product({ id: 201, productName: 'Favorite A' }), auth, {
      storage,
      now: () => 1000,
    });
    assert.equal(added.favorite, true);
    assert.deepEqual(favoriteProductIds(auth, { storage }), ['201']);

    recordProductView(product({ id: 202, productName: 'Recent B' }), auth, {
      storage,
      now: () => 2000,
    });

    const removed = toggleProductFavorite(product({ id: 201 }), auth, {
      storage,
      now: () => 3000,
    });
    assert.equal(removed.favorite, false);

    const footprint = getProductFootprint(auth, { storage });
    assert.deepEqual(footprint.favorites, []);
    assert.equal(footprint.recent[0].id, '202');
  });

  it('records recent views in latest-first order and increments view counts', () => {
    const storage = createStorage();
    const auth = { user: { id: 2 } };

    recordProductView(product({ id: 301, productName: 'First' }), auth, {
      storage,
      now: () => 1000,
    });
    recordProductView(product({ id: 302, productName: 'Second' }), auth, {
      storage,
      now: () => 2000,
    });
    recordProductView(product({ id: 301, productName: 'First updated' }), auth, {
      storage,
      now: () => 3000,
    });

    const footprint = getProductFootprint(auth, { storage });
    assert.deepEqual(footprint.recent.map((item) => item.id), ['301', '302']);
    assert.equal(footprint.recent[0].productName, 'First updated');
    assert.equal(footprint.stats['301'].viewCount, 2);
    assert.equal(footprint.stats['301'].lastViewedAt, 3000);
    assert.equal(footprint.stats['302'].viewCount, 1);
  });

  it('clears only recent views while keeping favorites and stats', () => {
    const storage = createStorage();
    const auth = { user: { id: 3 } };

    toggleProductFavorite(product({ id: 401 }), auth, { storage, now: () => 1000 });
    recordProductView(product({ id: 402 }), auth, { storage, now: () => 2000 });
    clearProductRecentViews(auth, { storage });

    const footprint = getProductFootprint(auth, { storage });
    assert.deepEqual(footprint.recent, []);
    assert.deepEqual(footprint.favorites.map((item) => item.id), ['401']);
    assert.equal(footprint.stats['402'].viewCount, 1);
  });

  it('ranks frequent products from sales rows, favorites, and local view counts', () => {
    const storage = createStorage();
    const auth = { user: { linked_party_id: 66 } };

    recordProductView(product({ id: 501, productName: 'Viewed once' }), auth, {
      storage,
      now: () => 1000,
    });
    recordProductView(product({ id: 502, productName: 'Viewed often' }), auth, {
      storage,
      now: () => 2000,
    });
    recordProductView(product({ id: 502, productName: 'Viewed often' }), auth, {
      storage,
      now: () => 3000,
    });
    toggleProductFavorite(product({ id: 503, productName: 'Favorite' }), auth, {
      storage,
      now: () => 4000,
    });

    const salesProducts = mergeSalesOrderFrequentProducts([
      { goods_id: 504, product_name: 'Bought', product_code: 'SJ0504', image: 'bought.jpg', quantity: 3 },
      { goods_id: 504, product_name: 'Bought', product_code: 'SJ0504', image: 'bought.jpg', quantity: 2 },
    ]);

    const ranked = rankFrequentProducts(getProductFootprint(auth, { storage }), salesProducts);

    assert.deepEqual(ranked.slice(0, 4).map((item) => item.id), ['504', '503', '502', '501']);
    assert.equal(ranked[0].purchaseCount, 2);
    assert.equal(ranked[0].quantityTotal, 5);
    assert.equal(ranked[1].isFavorite, true);
    assert.equal(ranked[2].viewCount, 2);
  });
});
