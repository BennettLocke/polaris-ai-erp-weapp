import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  buildShareOptions,
  buildSharePath,
  buildTimelineShareOptions,
  DEFAULT_SHARE_IMAGE,
  DEFAULT_SHARE_TITLE,
  preloadShareImage,
  productShareImage,
  productShareTitle,
  SEARCH_SHARE_IMAGE,
  SEARCH_SHARE_TITLE,
} from '../src/utils/share.js';

const root = new URL('../', import.meta.url);

function read(relativePath) {
  const fileUrl = new URL(relativePath, root);
  return existsSync(fileUrl) ? readFileSync(fileUrl, 'utf8') : '';
}

describe('miniapp sharing', () => {
  it('registers share handlers on every configured page', () => {
    const pagesJson = JSON.parse(read('src/pages.json'));
    const pagePaths = pagesJson.pages.map((page) => page.path);

    assert.ok(pagePaths.length >= 10);
    for (const pagePath of pagePaths) {
      const page = read(`src/${pagePath}.vue`);
      assert.match(page, /enablePageShare\(\)/, `${pagePath} should show the share menu`);
      assert.match(page, /onShareAppMessage\(\)/, `${pagePath} should support sharing to friends`);
      assert.match(page, /onShareTimeline\(\)/, `${pagePath} should support timeline sharing`);
    }
  });

  it('builds safe share paths and default payloads', () => {
    assert.equal(DEFAULT_SHARE_TITLE, '北极星智能体·官方小程序');
    assert.equal(DEFAULT_SHARE_IMAGE, '/static/share/home-share-v2.png');
    assert.ok(existsSync(new URL('src/static/share/home-share-v2.png', root)), 'default share image should exist');
    assert.equal(SEARCH_SHARE_TITLE, '北极星智能体·你要的都在这');
    assert.equal(SEARCH_SHARE_IMAGE, '/static/share/search-share-v2.png');
    assert.ok(existsSync(new URL('src/static/share/search-share-v2.png', root)), 'search share image should exist');
    assert.equal(buildSharePath('pages/product/list', { keyword: '见喜 半斤', empty: '' }), '/pages/product/list?keyword=%E8%A7%81%E5%96%9C%20%E5%8D%8A%E6%96%A4');
    assert.deepEqual(buildShareOptions({ title: '见喜', path: 'pages/product/detail?id=33', imageUrl: '' }), {
      title: '见喜',
      path: '/pages/product/detail?id=33',
      imageUrl: DEFAULT_SHARE_IMAGE,
    });
    assert.deepEqual(buildTimelineShareOptions({ title: '分类', path: '/pages/product/list?category_id=12' }), {
      title: '分类',
      query: 'category_id=12',
      imageUrl: DEFAULT_SHARE_IMAGE,
    });
  });

  it('uses product title and image for product detail sharing', () => {
    assert.equal(productShareTitle({ title: '【见喜】半斤' }), '【见喜】半斤｜北极星智能体');
    assert.equal(
      productShareImage({ galleryImages: ['https://img.513sjbz.com/a.jpg'], cover: 'https://img.513sjbz.com/b.jpg' }),
      'https://img.513sjbz.com/a.jpg'
    );
  });

  it('uses runtime poster canvas for search and product detail sharing', () => {
    const searchPage = read('src/pages/product/list.vue');
    const detailPage = read('src/pages/product/detail.vue');

    assert.match(searchPage, /SEARCH_SHARE_TITLE/);
    assert.match(searchPage, /SEARCH_SHARE_IMAGE/);
    assert.match(searchPage, /searchSharePosterCanvas/);
    assert.match(searchPage, /prepareSearchSharePoster/);
    assert.match(searchPage, /searchShareImage \|\| SEARCH_SHARE_IMAGE/);
    assert.match(detailPage, /productSharePosterCanvas/);
    assert.match(detailPage, /sharePosterImage \|\| productShareImage/);
  });

  it('falls back to the original share image when no miniapp image API exists', async () => {
    const originalUni = globalThis.uni;
    Reflect.deleteProperty(globalThis, 'uni');
    try {
      assert.equal(await preloadShareImage(SEARCH_SHARE_IMAGE), SEARCH_SHARE_IMAGE);
    } finally {
      if (originalUni !== undefined) globalThis.uni = originalUni;
    }
  });
});
