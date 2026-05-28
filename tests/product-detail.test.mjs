import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildProductDetailPayload, normalizeProductDetail } from '../src/utils/product.js';

describe('product detail payload', () => {
  it('normalizes sjagent goods data for the detail page', () => {
    const product = normalizeProductDetail({
      id: 902,
      goods_id: 902,
      coding: 'SJ0534',
      title: '【SJ0534】DSC_5392-短泡袋',
      product_category_text: '短泡袋',
      size_label: '半斤',
      color: '透明',
      available_colors: ['透明', '金色', '橙色'],
      spec_count: 3,
      unit_name: '个',
      piece_text: '1件16套',
      price: '30.00',
      images: 'https://img.513sjbz.com/order/20260516/13254671.jpg.png',
      detail_image_urls: ['https://img.513sjbz.com/order/20260516/detail.jpg'],
      base_data: [
        { name: '商品编号', value: 'SJ0534' },
        { name: '颜色', value: '透明' },
        { name: '分类', value: '短泡袋' },
        { name: '单位', value: '个' },
      ],
    });

    const payload = buildProductDetailPayload(product);

    assert.equal(payload.title, '【SJ0534】DSC_5392-短泡袋');
    assert.equal(payload.priceText, '¥30');
    assert.deepEqual(payload.galleryImages, ['https://img.513sjbz.com/order/20260516/13254671.jpg.png']);
    assert.deepEqual(payload.infoRows, [
      { label: '编号', value: 'SJ0534' },
      { label: '分类', value: '短泡袋' },
      { label: '规格', value: '半斤' },
      { label: '颜色', value: '透明 / 金色 / 橙色' },
      { label: '单位', value: '个' },
      { label: '装箱数', value: '1件16套' },
    ]);
    assert.deepEqual(payload.paramRows, [
      { label: '编号', value: 'SJ0534' },
      { label: '分类', value: '短泡袋' },
      { label: '规格', value: '半斤' },
      { label: '颜色', value: '透明 / 金色 / 橙色' },
      { label: '单位', value: '个' },
      { label: '装箱数', value: '1件16套' },
    ]);
    assert.deepEqual(payload.colorSwatches, [
      { value: 'rgba(255,255,255,0.66)', isLight: true },
      { value: '#caa24c', isLight: false },
      { value: '#f06423', isLight: false },
    ]);
    assert.deepEqual(payload.detailImages, ['https://img.513sjbz.com/order/20260516/detail.jpg']);
    assert.equal(payload.showDetailMedia, true);
    assert.deepEqual(payload.bottomActions, [
      { text: '返回分类', variant: 'outline', key: 'category' },
      { text: '联系咨询', variant: 'default', key: 'contact' },
    ]);
  });

  it('keeps only main images for single-spec bag products', () => {
    const product = normalizeProductDetail({
      id: 903,
      coding: 'SJ0535',
      title: '【SJ0535】红茶泡袋',
      product_category_text: '泡袋',
      color: '红色',
      available_colors: ['红色'],
      spec_count: 1,
      images: 'https://img.513sjbz.com/main.jpg',
      photo: [
        { images: 'https://img.513sjbz.com/main.jpg' },
        { images: 'https://img.513sjbz.com/detail.jpg' },
      ],
      detail_image_urls: ['https://img.513sjbz.com/detail.jpg'],
      content_web: '<p>detail</p>',
    });

    const payload = buildProductDetailPayload(product);

    assert.deepEqual(payload.galleryImages, ['https://img.513sjbz.com/main.jpg']);
    assert.deepEqual(payload.detailImages, []);
    assert.equal(payload.contentWeb, '');
    assert.equal(payload.showDetailMedia, false);
  });

  it('keeps multi-category names and marks bracket titles for optical alignment', () => {
    const product = normalizeProductDetail({
      id: 904,
      coding: 'SJ1212',
      title: '【锦程】二三两',
      product_category_names: ['三两礼盒', '二两礼盒'],
      product_category_text: '三两礼盒',
      size_label: '二三两',
      unit_name: '套',
      base_data: [
        { name: '分类', value: '三两礼盒' },
      ],
    });

    const payload = buildProductDetailPayload(product);

    assert.equal(product.categoryName, '三两礼盒 / 二两礼盒');
    assert.equal(payload.categoryName, '三两礼盒 / 二两礼盒');
    assert.deepEqual(payload.categoryTags, ['三两礼盒', '二两礼盒']);
    assert.equal(payload.titleNeedsOpticalAlign, true);
    assert.deepEqual(payload.paramRows.slice(0, 3), [
      { label: '编号', value: 'SJ1212' },
      { label: '分类', value: '三两礼盒 / 二两礼盒' },
      { label: '规格', value: '二三两' },
    ]);
  });

  it('resolves multi-category ids through the miniapp category list', () => {
    const product = normalizeProductDetail({
      id: 905,
      coding: 'SJ1212',
      title: '【锦程】二三两',
      product_category_ids: [2, 3],
      product_category_text: '三两礼盒',
      size_label: '二三两',
    }, {
      categories: [
        { id: 2, name: '三两礼盒' },
        { id: 3, name: '二两礼盒' },
      ],
    });

    const payload = buildProductDetailPayload(product);

    assert.equal(payload.categoryName, '三两礼盒 / 二两礼盒');
    assert.deepEqual(payload.categoryTags, ['三两礼盒', '二两礼盒']);
    assert.deepEqual(payload.paramRows.slice(0, 3), [
      { label: '编号', value: 'SJ1212' },
      { label: '分类', value: '三两礼盒 / 二两礼盒' },
      { label: '规格', value: '二三两' },
    ]);
  });

  it('uses only main and color images in the top gallery', () => {
    const product = normalizeProductDetail({
      id: 906,
      coding: 'SJ2001',
      title: '【锦程】二三两',
      images: 'https://img.513sjbz.com/main.jpg',
      available_colors: ['红色', '黄色'],
      color_image_urls: ['https://img.513sjbz.com/red.jpg', 'https://img.513sjbz.com/yellow.jpg'],
      detail_image_urls: ['https://img.513sjbz.com/detail-1.jpg', 'https://img.513sjbz.com/detail-2.jpg'],
    });

    const payload = buildProductDetailPayload(product);

    assert.deepEqual(payload.galleryImages, [
      'https://img.513sjbz.com/main.jpg',
      'https://img.513sjbz.com/red.jpg',
      'https://img.513sjbz.com/yellow.jpg',
    ]);
    assert.deepEqual(payload.detailImages, [
      'https://img.513sjbz.com/detail-1.jpg',
      'https://img.513sjbz.com/detail-2.jpg',
    ]);
  });

  it('uses product group spec images before detail images in the top gallery', () => {
    const product = normalizeProductDetail({
      id: 909,
      coding: 'SJ1576',
      title: '【视界】六小盒',
      images: 'https://img.513sjbz.com/main.jpg',
      color_text: '橙色 / 红色 / 蓝色',
      product_group_data: [
        {
          coding: 'SJ1576',
          color: '橙色',
          images: 'https://img.513sjbz.com/main.jpg',
          spec_image_url: 'https://img.513sjbz.com/orange.jpg',
        },
        {
          coding: 'SJ1577',
          color: '红色',
          images: 'https://img.513sjbz.com/main.jpg',
          spec_image_url: 'https://img.513sjbz.com/red.jpg',
        },
        {
          coding: 'SJ1578',
          color: '蓝色',
          images: 'https://img.513sjbz.com/main.jpg',
          spec_image_url: 'https://img.513sjbz.com/blue.jpg',
        },
      ],
      detail_image_urls: [
        'https://img.513sjbz.com/detail-1.jpg',
        'https://img.513sjbz.com/detail-2.jpg',
        'https://img.513sjbz.com/detail-3.jpg',
      ],
    });

    const payload = buildProductDetailPayload(product);

    assert.deepEqual(payload.galleryImages, [
      'https://img.513sjbz.com/main.jpg',
      'https://img.513sjbz.com/orange.jpg',
      'https://img.513sjbz.com/red.jpg',
      'https://img.513sjbz.com/blue.jpg',
    ]);
  });

  it('does not use detail images in the top gallery when color images are missing', () => {
    const product = normalizeProductDetail({
      id: 907,
      coding: 'SJ2002',
      title: '【锦程】二三两',
      images: 'https://img.513sjbz.com/main.jpg',
      available_colors: ['红色', '黄色', '蓝色'],
      detail_image_urls: [
        'https://img.513sjbz.com/red.jpg',
        'https://img.513sjbz.com/yellow.jpg',
        'https://img.513sjbz.com/blue.jpg',
        'https://img.513sjbz.com/detail-extra.jpg',
      ],
    });

    const payload = buildProductDetailPayload(product);

    assert.deepEqual(payload.galleryImages, ['https://img.513sjbz.com/main.jpg']);
  });

  it('marks white beige transparent light-gold and champagne-gold swatches as light', () => {
    const product = normalizeProductDetail({
      id: 908,
      coding: 'SJ2003',
      title: '【测试】浅色',
      color_text: '白色 / 米色 / 透明 / 浅金色 / 香槟金 / 红色',
    });

    const payload = buildProductDetailPayload(product);

    assert.deepEqual(payload.colorSwatches, [
      { value: '#f7f2e8', isLight: true },
      { value: '#d8c8a4', isLight: true },
      { value: 'rgba(255,255,255,0.66)', isLight: true },
      { value: '#d9bd76', isLight: true },
      { value: '#d6bf8a', isLight: true },
      { value: '#c92f2f', isLight: false },
    ]);
  });

  it('normalizes 3d model links and exposes a future badge flag', () => {
    const product = normalizeProductDetail({
      id: 910,
      coding: 'SJ3D',
      title: 'Model product',
      model_url: 'https://img.513sjbz.com/model/SJ3D.glb',
    });

    const payload = buildProductDetailPayload(product);

    assert.equal(product.modelUrl, 'https://img.513sjbz.com/model/SJ3D.glb');
    assert.equal(product.hasModel, true);
    assert.equal(payload.modelUrl, 'https://img.513sjbz.com/model/SJ3D.glb');
    assert.equal(payload.hasModel, true);
    assert.equal(payload.modelBadgeText, '3D视图');

    const flagOnly = normalizeProductDetail({
      id: 911,
      coding: 'SJ3D-FLAG',
      has_model: 1,
    });

    assert.equal(flagOnly.modelUrl, '');
    assert.equal(flagOnly.hasModel, true);
  });
});
