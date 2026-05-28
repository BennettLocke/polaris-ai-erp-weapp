import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const gallerySource = readFileSync(new URL('../src/components/SjProductGallery.vue', import.meta.url), 'utf8');

describe('product gallery component', () => {
  it('uses a swiper for the main image area so dragging changes the active image', () => {
    assert.match(gallerySource, /<swiper\b/);
    assert.match(gallerySource, /:current="activeIndex"/);
    assert.match(gallerySource, /@change="handleSwiperChange"/);
    assert.match(gallerySource, /handleSwiperChange\(/);
  });

  it('previews the active main image with the full gallery image list when tapped', () => {
    assert.match(gallerySource, /@tap\.stop="previewActiveImage"/);
    assert.match(gallerySource, /previewActiveImage\(\)/);
    assert.match(gallerySource, /uni\.previewImage\(\{\s*urls,\s*current/);
    assert.match(gallerySource, /const current = this\.activeImage/);
    assert.match(gallerySource, /const urls = this\.imageItems/);
  });

  it('does not stretch a color swatch while the main image is active', () => {
    assert.match(gallerySource, /if \(this\.activeIndex <= 0\) return -1;/);
    assert.match(gallerySource, /return Math\.min\(this\.activeIndex - 1, this\.colorSwatches\.length - 1\);/);
  });
});
