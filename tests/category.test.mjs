import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  categoryActiveImage,
  categoryDomId,
  categoryImage,
  categoryInitial,
  normalizeCategoryList,
} from '../src/utils/category.js';

describe('category helpers', () => {
  it('keeps image fields and fallback initials for side navigation', () => {
    const list = normalizeCategoryList([
      {
        id: 2,
        name: '三两礼盒',
        images: 'https://assets.example.test/category/box.jpg',
        total: 21,
      },
      {
        id: 5,
        name: '大红袍泡袋',
        icon: 'https://assets.example.test/category/bag.jpg',
        total: 1,
      },
    ]);

    assert.equal(list.length, 2);
    assert.equal(list[0].name, '三两礼盒');
    assert.equal(list[0].image, 'https://assets.example.test/category/box.jpg');
    assert.equal(list[0].activeImage, 'https://assets.example.test/category/box.jpg');
    assert.equal(list[0].initial, '三');
    assert.equal(list[0].total, 21);
    assert.equal(list[1].image, 'https://assets.example.test/category/bag.jpg');
  });

  it('uses active category icon for selected side navigation state', () => {
    const item = {
      icon: 'https://assets.example.test/category/normal.png',
      icon_active: 'https://assets.example.test/category/active.png',
    };

    assert.equal(categoryImage(item), 'https://assets.example.test/category/normal.png');
    assert.equal(categoryActiveImage(item), 'https://assets.example.test/category/active.png');
  });

  it('builds stable scroll anchor ids and image fallbacks', () => {
    assert.equal(categoryDomId({ id: '' }, 0), 'category-all');
    assert.equal(categoryDomId({ id: 'a b' }, 2), 'category-ab');
    assert.equal(categoryImage({ realistic_images: 'real.jpg', icon: 'icon.jpg' }), 'real.jpg');
    assert.equal(categoryInitial('  水仙泡袋'), '水');
  });

  it('hides removed and empty categories from the miniapp sidebar', () => {
    const list = normalizeCategoryList([
      { id: 1, name: '纯色泡袋', total: 8 },
      { id: 2, name: '品种茶泡袋', total: 3 },
      { id: 3, name: '2泡礼盒', total: 2 },
      { id: 4, name: '空分类', total: 0 },
      { id: 5, name: '半斤礼盒', total: 12 },
    ]);

    assert.deepEqual(list.map((item) => item.name), ['半斤礼盒']);
  });

  it('orders miniapp sidebar categories in the custom mall sequence', () => {
    const list = normalizeCategoryList([
      { id: 18, name: '快递纸箱', total: 9 },
      { id: 13, name: '五格礼盒', total: 4 },
      { id: 5, name: '大红袍泡袋', total: 32 },
      { id: 10, name: 'pvc礼盒', total: 9 },
      { id: 16, name: '6小盒礼盒', total: 16 },
      { id: 1, name: '半斤礼盒', total: 17 },
      { id: 15, name: '其他产品', total: 2 },
      { id: 7, name: '肉桂泡袋', total: 135 },
      { id: 22, name: '2泡小盒', total: 4 },
      { id: 4, name: '一两礼盒', total: 41 },
      { id: 3, name: '二两礼盒', total: 35 },
      { id: 17, name: '3小盒礼盒', total: 31 },
      { id: 2, name: '三两礼盒', total: 18 },
    ]);

    assert.deepEqual(list.map((item) => item.name), [
      '半斤礼盒',
      '三两礼盒',
      '二两礼盒',
      '一两礼盒',
      '6小盒礼盒',
      '3小盒礼盒',
      '2泡小盒',
      '大红袍泡袋',
      '肉桂泡袋',
      'pvc礼盒',
      '快递纸箱',
      '五格礼盒',
      '其他产品',
    ]);
  });
});
