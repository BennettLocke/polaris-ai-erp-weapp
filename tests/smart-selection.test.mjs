import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CUSTOM_PRICE_RANGE_VALUE,
  PRICE_RANGE_OPTIONS,
  buildSmartSelectionDisplayProduct,
  buildSmartSelectionColorOptions,
  buildSmartSelectionPriceRangeOptions,
  productMatchesPriceRange,
  recommendSmartSelectionProducts,
  resolveSmartGiftSizeOptions,
} from '../src/utils/smart-selection.js';

function product(overrides = {}) {
  return {
    id: overrides.id || 'p1',
    title: overrides.title || '【见喜】半斤',
    color_names: overrides.color_names || ['红色', '黄色'],
    available_colors: overrides.available_colors,
    color: overrides.color,
    spec: overrides.spec,
    min_price: overrides.min_price ?? '22.00',
    price: overrides.price,
    inventory: overrides.inventory ?? '0',
    sales_count: overrides.sales_count ?? 0,
    ...overrides,
  };
}

describe('smart selection rules', () => {
  it('resolves supported gift box sizes and excludes PVC gift boxes', () => {
    const options = resolveSmartGiftSizeOptions([
      { id: 1, name: '半斤礼盒' },
      { id: 2, name: '三两礼盒' },
      { id: 10, name: 'pvc礼盒' },
      { id: 22, name: '2泡小盒' },
    ]);

    assert.deepEqual(options.map((item) => item.label), [
      '半斤礼盒',
      '三两礼盒',
      '二两礼盒',
      '一两礼盒',
      '6小盒礼盒',
      '3小盒礼盒',
      '2泡小盒',
      '五格礼盒',
    ]);
    assert.equal(options.find((item) => item.label === '半斤礼盒')?.categoryId, '1');
    assert.equal(options.find((item) => item.label === '2泡小盒')?.categoryId, '22');
    assert.equal(options.some((item) => /pvc/i.test(item.label)), false);
  });

  it('keeps price range boundaries deterministic at 10, 20, and 30 yuan', () => {
    assert.deepEqual(PRICE_RANGE_OPTIONS.map((item) => item.value), ['all', 'under_10', '10_20', '20_30', 'over_30']);

    assert.equal(productMatchesPriceRange({ min_price: '9.99' }, 'under_10'), true);
    assert.equal(productMatchesPriceRange({ min_price: '10' }, 'under_10'), false);
    assert.equal(productMatchesPriceRange({ min_price: '10' }, '10_20'), true);
    assert.equal(productMatchesPriceRange({ min_price: '20' }, '10_20'), true);
    assert.equal(productMatchesPriceRange({ min_price: '20' }, '20_30'), false);
    assert.equal(productMatchesPriceRange({ min_price: '20.01' }, '20_30'), true);
    assert.equal(productMatchesPriceRange({ min_price: '30' }, '20_30'), true);
    assert.equal(productMatchesPriceRange({ min_price: '30' }, 'over_30'), false);
    assert.equal(productMatchesPriceRange({ min_price: '30.01' }, 'over_30'), true);
  });

  it('builds price options from prices that exist in the selected gift size', () => {
    assert.deepEqual(
      buildSmartSelectionPriceRangeOptions([
        product({ min_price: '10' }),
        product({ min_price: '20.01' }),
        product({ min_price: '45' }),
      ]).map((item) => item.value),
      ['all', '10_20', '20_30', 'over_30', CUSTOM_PRICE_RANGE_VALUE]
    );

    assert.deepEqual(
      buildSmartSelectionPriceRangeOptions([]).map((item) => item.value),
      ['all', CUSTOM_PRICE_RANGE_VALUE]
    );
  });

  it('matches custom price ranges with inclusive and normalized bounds', () => {
    assert.equal(productMatchesPriceRange({ min_price: '10' }, CUSTOM_PRICE_RANGE_VALUE, { min: '10', max: '20' }), true);
    assert.equal(productMatchesPriceRange({ min_price: '20' }, CUSTOM_PRICE_RANGE_VALUE, { min: '10', max: '20' }), true);
    assert.equal(productMatchesPriceRange({ min_price: '9.99' }, CUSTOM_PRICE_RANGE_VALUE, { min: '10' }), false);
    assert.equal(productMatchesPriceRange({ min_price: '30' }, CUSTOM_PRICE_RANGE_VALUE, { max: '20' }), false);
    assert.equal(productMatchesPriceRange({ min_price: '15' }, CUSTOM_PRICE_RANGE_VALUE, { min: '20', max: '10' }), true);
  });

  it('builds color options from the selected size products with an unlimited default', () => {
    assert.deepEqual(
      buildSmartSelectionColorOptions([
        product({ color_names: ['红色', '金色'] }),
        product({ color_names: [], available_colors: ['咖色', '红色'] }),
        product({ color_names: [], color: '黄色 / 蓝色' }),
      ]).map((item) => item.label),
      ['不限颜色', '红色', '金色', '咖色', '黄色', '蓝色']
    );
  });

  it('prioritizes exact color and price matches, then in-stock products', () => {
    const result = recommendSmartSelectionProducts([
      product({ id: 'out-of-stock-red', color_names: ['红色'], min_price: '22', inventory: '0', sales_count: 100 }),
      product({ id: 'in-stock-red', color_names: ['红色'], min_price: '23', inventory: '8', sales_count: 1 }),
      product({ id: 'wrong-color', color_names: ['黄色'], min_price: '24', inventory: '10', sales_count: 200 }),
      product({ id: 'wrong-price', color_names: ['红色'], min_price: '35', inventory: '10', sales_count: 200 }),
    ], {
      color: '红色',
      priceRange: '20_30',
    });

    assert.equal(result.matchType, 'exact');
    assert.deepEqual(result.products.map((item) => item.id), ['in-stock-red', 'out-of-stock-red']);
  });

  it('falls back to same-size nearby recommendations when exact filters have no results', () => {
    const result = recommendSmartSelectionProducts([
      product({ id: 'stock-yellow', color_names: ['黄色'], min_price: '23', inventory: '8', sales_count: 4 }),
      product({ id: 'sold-yellow', color_names: ['黄色'], min_price: '24', inventory: '0', sales_count: 100 }),
      product({ id: 'cheap-red', color_names: ['红色'], min_price: '8', inventory: '10', sales_count: 10 }),
    ], {
      color: '紫色',
      priceRange: '20_30',
    });

    assert.equal(result.matchType, 'nearby');
    assert.deepEqual(result.products.map((item) => item.id), ['stock-yellow', 'sold-yellow']);
  });

  it('returns an empty result when a custom price range has no matching products', () => {
    const result = recommendSmartSelectionProducts([
      product({ id: 'cheap-red', color_names: ['绾㈣壊'], min_price: '8', inventory: '10' }),
      product({ id: 'mid-red', color_names: ['绾㈣壊'], min_price: '18', inventory: '10' }),
    ], {
      color: '绾㈣壊',
      priceRange: CUSTOM_PRICE_RANGE_VALUE,
      customPriceRange: { min: '30', max: '40' },
    });

    assert.equal(result.matchType, 'empty');
    assert.deepEqual(result.products, []);
  });

  it('uses a matching color image as the smart selection display cover', () => {
    const source = product({
      cover: 'https://img.513sjbz.com/main.jpg',
      color_names: ['红色', '黄色'],
      product_group_data: [
        { color: '红色', spec_image_url: 'https://img.513sjbz.com/red.jpg' },
        { color: '黄色', spec_image_url: 'https://img.513sjbz.com/yellow.jpg' },
      ],
    });

    const display = buildSmartSelectionDisplayProduct(source, '红色');

    assert.equal(display.cover, 'https://img.513sjbz.com/red.jpg');
    assert.equal(display.smartSelectionCover, 'https://img.513sjbz.com/red.jpg');
    assert.equal(source.cover, 'https://img.513sjbz.com/main.jpg');
  });

  it('falls back to ordered color images before the original cover', () => {
    const source = product({
      cover: 'https://img.513sjbz.com/main.jpg',
      color_names: ['红色', '黄色'],
      colorImages: [
        'https://img.513sjbz.com/red.jpg',
        'https://img.513sjbz.com/yellow.jpg',
      ],
    });

    assert.equal(buildSmartSelectionDisplayProduct(source, '黄色').cover, 'https://img.513sjbz.com/yellow.jpg');
    assert.equal(buildSmartSelectionDisplayProduct(source, '蓝色').cover, 'https://img.513sjbz.com/main.jpg');
  });

  it('uses detail color images when list products do not include color image data', () => {
    const source = product({
      id: 'list-product',
      cover: 'https://img.513sjbz.com/main.jpg',
      color_names: ['红色', '黄色'],
    });
    const detail = {
      id: 'list-product',
      product_group_data: [
        { color: '红色', spec_image_url: 'https://img.513sjbz.com/detail-red.jpg' },
        { color: '黄色', spec_image_url: 'https://img.513sjbz.com/detail-yellow.jpg' },
      ],
    };

    const display = buildSmartSelectionDisplayProduct(source, '红色', detail);

    assert.equal(display.id, 'list-product');
    assert.equal(display.cover, 'https://img.513sjbz.com/detail-red.jpg');
    assert.equal(source.cover, 'https://img.513sjbz.com/main.jpg');
  });

  it('switches the same product cover from coffee to red when color data uses different spec fields', () => {
    const source = product({
      id: 'mixed-color-fields',
      cover: 'https://img.513sjbz.com/main.jpg',
      color_names: ['咖色', '红色'],
    });
    const detail = {
      id: 'mixed-color-fields',
      product_group_data: [
        { color: '咖色', spec_image_url: 'https://img.513sjbz.com/coffee.jpg' },
        { spec_value_name: '红色', spec_image_url: 'https://img.513sjbz.com/red.jpg' },
      ],
    };

    const coffeeDisplay = buildSmartSelectionDisplayProduct(source, '咖色', detail);
    const redDisplay = buildSmartSelectionDisplayProduct(source, '红色', detail);

    assert.equal(coffeeDisplay.cover, 'https://img.513sjbz.com/coffee.jpg');
    assert.equal(redDisplay.cover, 'https://img.513sjbz.com/red.jpg');
    assert.notEqual(coffeeDisplay.cover, redDisplay.cover);
  });

  it('does not let grouped sku available colors make the first sku match every selected color', () => {
    const source = product({
      id: 'sj1177-like',
      cover: 'https://img.513sjbz.com/main.jpg',
      color_names: ['卡其色', '橙色', '红色', '蓝色', '黄色'],
      product_group_data: [
        {
          product_code: 'SJ1177',
          spec: '卡其色',
          available_colors: ['卡其色', '橙色', '红色', '蓝色', '黄色'],
          spec_image_url: 'https://img.513sjbz.com/khaki.jpg',
        },
        {
          product_code: 'SJ1179',
          spec: '红色',
          available_colors: ['卡其色', '橙色', '红色', '蓝色', '黄色'],
          spec_image_url: 'https://img.513sjbz.com/red.jpg',
        },
      ],
    });

    const display = buildSmartSelectionDisplayProduct(source, '红色');

    assert.equal(display.cover, 'https://img.513sjbz.com/red.jpg');
  });
});
