import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { buildCategoryCoverUrl, buildCategoryIconUrl, buildHomeHeroUrl, buildOssImageUrl, isJpegImageUrl } from '../src/utils/image.js';

const categoryProductCardSource = readFileSync(new URL('../src/components/SjCategoryProductCard.vue', import.meta.url), 'utf8');

describe('image url helpers', () => {
  it('builds square OSS thumbnails for category product covers', () => {
    assert.equal(
      buildCategoryCoverUrl('https://img.513sjbz.com/static/upload/images/goods/cover.png'),
      'https://img.513sjbz.com/static/upload/images/goods/cover.png?x-oss-process=image/resize,m_fill,w_480,h_480/quality,q_85/format,jpg'
    );
  });

  it('builds wide OSS images for homepage hero banners', () => {
    assert.equal(
      buildHomeHeroUrl('https://img.513sjbz.com/static/upload/images/app_nav/banner.jpg'),
      'https://img.513sjbz.com/static/upload/images/app_nav/banner.jpg?x-oss-process=image/resize,m_fill,w_1080,h_920/quality,q_85/format,jpg'
    );
  });

  it('builds lightweight PNG OSS images for category icons', () => {
    assert.equal(
      buildCategoryIconUrl('https://img.513sjbz.com/static/upload/images/goods_category/icon.png'),
      'https://img.513sjbz.com/static/upload/images/goods_category/icon.png?x-oss-process=image/resize,w_240/quality,q_90/format,png'
    );
  });

  it('detects jpeg category button sources even with query strings', () => {
    assert.equal(isJpegImageUrl('https://img.513sjbz.com/order/icon.jpg'), true);
    assert.equal(isJpegImageUrl('https://img.513sjbz.com/order/icon.jpeg?version=1'), true);
    assert.equal(isJpegImageUrl('https://img.513sjbz.com/order/icon.jpg.png'), false);
    assert.equal(isJpegImageUrl('https://img.513sjbz.com/order/icon.png'), false);
  });

  it('preserves existing query strings and hash fragments when adding OSS processing', () => {
    assert.equal(
      buildOssImageUrl('https://img.513sjbz.com/a/b.jpg?version=1#preview', { width: 360, height: 360 }),
      'https://img.513sjbz.com/a/b.jpg?version=1&x-oss-process=image/resize,m_fill,w_360,h_360/quality,q_85/format,jpg#preview'
    );
  });

  it('does not double-append image processing or mutate local assets', () => {
    const processed = 'https://img.513sjbz.com/a/b.jpg?x-oss-process=image/resize,w_800';

    assert.equal(buildCategoryCoverUrl(processed), processed);
    assert.equal(buildCategoryCoverUrl('/static/images/product-placeholder.png'), '/static/images/product-placeholder.png');
    assert.equal(buildCategoryCoverUrl(''), '');
  });
});

describe('category product card images', () => {
  it('uses the category cover helper and lazy-loads product covers', () => {
    assert.match(categoryProductCardSource, /import\s+\{\s*buildCategoryCoverUrl\s*\}/);
    assert.match(categoryProductCardSource, /buildCategoryCoverUrl\(rawCover\)/);
    assert.match(categoryProductCardSource, /lazy-load/);
    assert.match(categoryProductCardSource, /mode="aspectFill"/);
  });

  it('keeps a skeleton placeholder until category product images finish loading', () => {
    assert.match(categoryProductCardSource, /sj-category-product-card__image-skeleton/);
    assert.match(categoryProductCardSource, /@load="handleImageLoad"/);
    assert.match(categoryProductCardSource, /@error="handleImageError"/);
    assert.match(categoryProductCardSource, /imageReady/);
    assert.match(categoryProductCardSource, /imageFailed/);
    assert.match(categoryProductCardSource, /watch:\s*\{/);
  });
});
