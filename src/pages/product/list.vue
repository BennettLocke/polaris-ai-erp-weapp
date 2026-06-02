<template>
  <view class="search-page">
    <view class="search-custom-nav" :style="navShellStyle">
      <button class="search-back" :style="backStyle" hover-class="none" @tap="goBack">
        <text class="search-back__icon"></text>
      </button>
      <sj-search-bar
        class="search-nav-input"
        :style="navSearchStyle"
        :height="navLayout.height"
        :value="keyword"
        placeholder="搜索产品编号、名称、规格"
        @search="submitSearch"
      />
    </view>

    <scroll-view
      class="search-page__body"
      scroll-y
      lower-threshold="90"
      :show-scrollbar="false"
      @scrolltolower="loadMore"
    >
      <view v-if="!searched" class="search-page__panel">
        <view v-if="historyKeywords.length" class="search-page__section">
          <view class="search-page__section-head">
            <text class="search-page__title">最近搜索</text>
            <button class="search-page__clear" @tap="clearHistory">清空</button>
          </view>
          <view class="search-page__chips">
            <button
              v-for="item in historyKeywords"
              :key="item"
              class="search-page__chip"
              @tap="selectKeyword(item)"
            >
              {{ item }}
            </button>
          </view>
        </view>

        <view class="search-page__section">
          <view class="search-page__section-head">
            <text class="search-page__title">热门搜索</text>
          </view>
          <view class="search-page__chips">
            <button
              v-for="(item, index) in hotKeywords"
              :key="chipKey(item, index)"
              :class="['search-page__chip', index === 0 ? 'search-page__chip--active' : '']"
              @tap="selectKeyword(item)"
            >
              {{ chipLabel(item) }}
            </button>
          </view>
        </view>
      </view>

      <view v-else class="search-page__panel">
        <view v-if="errorText" class="search-page__state search-page__state--error">
          <text>{{ errorText }}</text>
          <button class="search-page__retry" @tap="reload">重试</button>
        </view>

        <view v-else-if="products.length">
          <view class="search-page__result-head">
            <text class="search-page__result-title">搜索结果</text>
            <text class="search-page__result-count">{{ resultText }}</text>
          </view>

          <view class="search-page__sort">
            <button
              v-for="item in sortOptions"
              :key="item.value"
              :class="['search-page__sort-item', activeSort === item.value ? 'is-active' : '']"
              @tap="selectSort(item.value)"
            >
              {{ item.label }}
            </button>
          </view>

          <view class="search-page__grid">
            <sj-category-product-card
              v-for="item in products"
              :key="item.id"
              :product="item"
              code-position="top"
            />
          </view>
        </view>

        <view v-else-if="loading" class="search-page__skeleton">
          <view class="search-page__skeleton-card"></view>
          <view class="search-page__skeleton-card"></view>
          <view class="search-page__skeleton-card"></view>
          <view class="search-page__skeleton-card"></view>
        </view>

        <view v-else class="search-page__empty">
          <view class="search-page__empty-mark">0</view>
          <text class="search-page__empty-title">没有找到相关产品</text>
          <text class="search-page__empty-text">换个产品编号、名称或规格再试试</text>
        </view>
      </view>

      <view v-if="loading && products.length" class="search-page__state search-page__state--muted">加载中...</view>
      <view v-if="!loading && !errorText && products.length > 0 && page >= pageTotal" class="search-page__state search-page__state--muted">
        已全部加载
      </view>
    </scroll-view>

    <canvas
      canvas-id="searchSharePosterCanvas"
      class="search-share-canvas"
      style="width: 500px; height: 400px;"
    />
  </view>
</template>

<script>
import SjCategoryProductCard from '../../components/SjCategoryProductCard.vue';
import SjSearchBar from '../../components/SjSearchBar.vue';
import { getCategories } from '../../api/categories';
import { getProducts } from '../../api/products';
import { buildProductListUrl } from '../../utils/route';
import { buildShareOptions, buildTimelineShareOptions, enablePageShare, SEARCH_SHARE_IMAGE, SEARCH_SHARE_TITLE } from '../../utils/share.js';

function cleanText(value) {
  return String(value || '').trim();
}

function decodeRouteQueryValue(value) {
  const text = cleanText(value);
  if (!text) return '';
  try {
    return cleanText(decodeURIComponent(text));
  } catch (error) {
    return text;
  }
}

const HISTORY_KEY = 'sj_mall_search_history';
const SEARCH_SHARE_CANVAS_ID = 'searchSharePosterCanvas';
const SEARCH_SHARE_WIDTH = 500;
const SEARCH_SHARE_HEIGHT = 400;

function truncateText(value, maxLength) {
  const text = cleanText(value);
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arc(x + width - r, y + r, r, -Math.PI / 2, 0);
  ctx.lineTo(x + width, y + height - r);
  ctx.arc(x + width - r, y + height - r, r, 0, Math.PI / 2);
  ctx.lineTo(x + r, y + height);
  ctx.arc(x + r, y + height - r, r, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  ctx.closePath();
}

function canvasToTempFile(canvasId, page) {
  if (typeof uni === 'undefined' || typeof uni.canvasToTempFilePath !== 'function') {
    return Promise.resolve('');
  }

  return new Promise((resolve) => {
    uni.canvasToTempFilePath({
      canvasId,
      width: SEARCH_SHARE_WIDTH,
      height: SEARCH_SHARE_HEIGHT,
      destWidth: SEARCH_SHARE_WIDTH * 2,
      destHeight: SEARCH_SHARE_HEIGHT * 2,
      fileType: 'png',
      quality: 0.92,
      success: (result = {}) => resolve(result.tempFilePath || ''),
      fail: () => resolve(''),
    }, page);
  });
}

function getCanvasImageInfo(src) {
  const imageUrl = cleanText(src);
  if (!imageUrl || typeof uni === 'undefined' || typeof uni.getImageInfo !== 'function') {
    return Promise.resolve({ path: imageUrl, width: 0, height: 0 });
  }

  return new Promise((resolve) => {
    uni.getImageInfo({
      src: imageUrl,
      success: (result = {}) => resolve({
        path: result.path || imageUrl,
        width: Number(result.width || 0),
        height: Number(result.height || 0),
      }),
      fail: () => resolve({ path: '', width: 0, height: 0 }),
    });
  });
}

function drawAspectFillImage(ctx, image, x, y, width, height) {
  if (!image || !image.path) return false;
  if (image.width > 0 && image.height > 0) {
    const scale = Math.max(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight) / 2;
    ctx.drawImage(image.path, drawX, drawY, drawWidth, drawHeight);
    return true;
  }
  ctx.drawImage(image.path, x, y, width, height);
  return true;
}

function productImageUrl(product = {}) {
  const images = product.galleryImages || product.mainImages || product.colorImages || product.imageUrls || [];
  if (Array.isArray(images) && cleanText(images[0])) return cleanText(images[0]);
  return cleanText(product.cover || product.image || product.thumb || product.pic || product.main_image || product.mainImage);
}

function productCode(product = {}) {
  return cleanText(product.productCode || product.product_code || product.code || product.sku || product.id);
}

function productTitle(product = {}) {
  return cleanText(product.productName || product.product_name || product.title || product.name || product.goods_name);
}

function productSpec(product = {}) {
  return cleanText(product.packageSpecText || product.package_spec_text || product.pieceText || product.specText || product.spec || product.unitText);
}

function productPrice(product = {}) {
  const text = cleanText(product.priceText || product.price_text || product.minPriceText || product.salePriceText);
  if (text) return text;
  const value = product.min_price || product.minPrice || product.price || product.sale_price;
  if (value === undefined || value === null || value === '') return '咨询价';
  return String(value).startsWith('¥') ? String(value) : `¥${value}`;
}

function keywordLabel(item) {
  if (typeof item === 'string') return cleanText(item);
  return cleanText(item && (item.label || item.keyword || item.name));
}

function keywordCategoryNames(item = {}) {
  const names = item.categoryNames || item.category_names || item.categories || [];
  return (Array.isArray(names) ? names : [names]).map(cleanText).filter(Boolean);
}

function categoryNameValues(category = {}) {
  return [
    category.name,
    category.rawName,
    category.category_name,
    category.categoryName,
    category.title,
  ].map(cleanText).filter(Boolean);
}

function categoryIdValue(category = {}) {
  return cleanText(category.id || category.category_id || category.categoryId);
}

export default {
  components: { SjSearchBar, SjCategoryProductCard },
  data() {
    return {
      loading: false,
      searched: false,
      keyword: '',
      categoryId: '',
      page: 1,
      pageTotal: 1,
      total: 0,
      products: [],
      errorText: '',
      requestId: 0,
      historyKeywords: [],
      categoryCache: [],
      categoryCacheReady: false,
      categorySearchLabel: '',
      searchShareImage: '',
      searchShareTaskId: 0,
      hotKeywords: [
        { label: '半斤礼盒', categoryNames: ['半斤礼盒'] },
        { label: '三两礼盒', categoryNames: ['三两礼盒'] },
        { label: '二两礼盒', categoryNames: ['二两礼盒'] },
        { label: '红茶泡袋', categoryNames: ['红茶泡袋'] },
        { label: '肉桂泡袋', categoryNames: ['肉桂泡袋'] },
      ],
      activeSort: 'sales',
      sortOptions: [
        { label: '综合', value: 'sales' },
        { label: '最新', value: 'latest' },
        { label: '价格', value: 'price_asc' },
      ],
      navLayout: {
        left: 56,
        right: 72,
        top: 28,
        height: 32,
        navHeight: 92,
        backLeft: 12,
        backSize: 32,
      },
    };
  },
  computed: {
    navShellStyle() {
      return {
        height: `${this.navLayout.navHeight}px`,
      };
    },
    navSearchStyle() {
      return {
        left: `${this.navLayout.left}px`,
        right: `${this.navLayout.right}px`,
        top: `${this.navLayout.top}px`,
        height: `${this.navLayout.height}px`,
      };
    },
    backStyle() {
      return {
        left: `${this.navLayout.backLeft}px`,
        top: `${this.navLayout.top}px`,
        width: `${this.navLayout.backSize}px`,
        height: `${this.navLayout.height}px`,
      };
    },
    resultText() {
      const total = Number(this.total || this.products.length || 0);
      return total ? `${total} 款产品` : '';
    },
    requestKeyword() {
      if (this.categoryId && this.categorySearchLabel && this.keyword === this.categorySearchLabel) return '';
      return this.keyword;
    },
  },
  onLoad(query) {
    this.setupNavLayout();
    this.loadHistory();
    this.keyword = decodeRouteQueryValue(query && query.keyword);
    this.categoryId = decodeRouteQueryValue(query && query.category_id);
    if (this.keyword || this.categoryId) this.reload();
  },
  onShow() {
    enablePageShare();
    this.setupNavLayout();
    this.prepareSearchSharePoster();
  },
  onPullDownRefresh() {
    const task = this.searched ? this.reload() : Promise.resolve();
    task.finally(() => uni.stopPullDownRefresh());
  },
  onShareAppMessage() {
    const path = buildProductListUrl({ keyword: this.keyword, category_id: this.categoryId });
    return buildShareOptions({ title: SEARCH_SHARE_TITLE, path, imageUrl: this.searchShareImage || SEARCH_SHARE_IMAGE });
  },
  onShareTimeline() {
    const path = buildProductListUrl({ keyword: this.keyword, category_id: this.categoryId });
    return buildTimelineShareOptions({ title: SEARCH_SHARE_TITLE, path, imageUrl: this.searchShareImage || SEARCH_SHARE_IMAGE });
  },
  methods: {
    async prepareSearchSharePoster() {
      const taskId = ++this.searchShareTaskId;
      const poster = await this.createSearchSharePoster();
      if (taskId === this.searchShareTaskId && poster) this.searchShareImage = poster;
    },
    async createSearchSharePoster() {
      if (typeof uni === 'undefined' || typeof uni.createCanvasContext !== 'function') return '';

      const ctx = uni.createCanvasContext(SEARCH_SHARE_CANVAS_ID, this);
      const products = (this.products || []).slice(0, 2);
      const productImages = await Promise.all(products.map((item) => getCanvasImageInfo(productImageUrl(item))));
      const keyword = truncateText(this.keyword || this.categorySearchLabel || '搜索产品编号、名称、规格', 15);
      const chips = []
        .concat((this.historyKeywords || []).map(keywordLabel))
        .concat((this.hotKeywords || []).map(keywordLabel))
        .filter(Boolean)
        .filter((item, index, list) => list.indexOf(item) === index)
        .slice(0, 4);

      ctx.setFillStyle('#f4f4f5');
      ctx.fillRect(0, 0, SEARCH_SHARE_WIDTH, SEARCH_SHARE_HEIGHT);
      ctx.setFillStyle('#ffffff');
      roundedRect(ctx, 18, 18, SEARCH_SHARE_WIDTH - 36, SEARCH_SHARE_HEIGHT - 36, 22);
      ctx.fill();

      ctx.setStrokeStyle('#18181b');
      ctx.setLineWidth(1);
      roundedRect(ctx, 36, 36, 428, 42, 21);
      ctx.stroke();
      ctx.setFillStyle('#a1a1aa');
      ctx.setFontSize(18);
      ctx.fillText('⌕', 54, 63);
      ctx.setFillStyle('#71717a');
      ctx.setFontSize(18);
      ctx.fillText(keyword, 82, 63);
      ctx.setFillStyle('#18181b');
      roundedRect(ctx, 388, 40, 68, 34, 17);
      ctx.fill();
      ctx.setFillStyle('#ffffff');
      ctx.setFontSize(17);
      ctx.fillText('搜索', 404, 63);

      ctx.setFillStyle('#18181b');
      ctx.setFontSize(28);
      ctx.fillText('北极星智能体', 40, 122);
      ctx.setFillStyle('#71717a');
      ctx.setFontSize(17);
      ctx.fillText('茶礼盒、泡袋与包装耗材', 40, 150);
      ctx.setFillStyle('#18181b');
      ctx.setFontSize(20);
      ctx.fillText('你要的都在这', 40, 186);

      chips.forEach((item, index) => {
        const chipText = truncateText(item, 6);
        const x = 40 + index * 102;
        ctx.setFillStyle(index === 0 ? '#18181b' : '#f4f4f5');
        roundedRect(ctx, x, 204, 88, 34, 17);
        ctx.fill();
        ctx.setFillStyle(index === 0 ? '#ffffff' : '#3f3f46');
        ctx.setFontSize(15);
        ctx.fillText(chipText, x + 14, 226);
      });

      const cardY = 260;
      const cardWidth = 202;
      const cardHeight = 92;
      const drawCard = (product, image, x, index) => {
        ctx.setFillStyle('#ffffff');
        roundedRect(ctx, x, cardY, cardWidth, cardHeight, 14);
        ctx.fill();
        ctx.setStrokeStyle('rgba(24,24,27,0.08)');
        ctx.setLineWidth(1);
        roundedRect(ctx, x, cardY, cardWidth, cardHeight, 14);
        ctx.stroke();

        ctx.save();
        roundedRect(ctx, x + 10, cardY + 10, 62, 62, 10);
        ctx.clip();
        if (!drawAspectFillImage(ctx, image, x + 10, cardY + 10, 62, 62)) {
          ctx.setFillStyle('#eef2f7');
          ctx.fillRect(x + 10, cardY + 10, 62, 62);
          ctx.setFillStyle('#dbeafe');
          ctx.beginPath();
          ctx.arc(x + 28, cardY + 30, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.setFillStyle('#bfdbfe');
          ctx.beginPath();
          ctx.moveTo(x + 18, cardY + 68);
          ctx.lineTo(x + 42, cardY + 40);
          ctx.lineTo(x + 66, cardY + 68);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        const fallback = index === 0 ? '【见喜】 半斤' : '半斤礼盒';
        const title = truncateText(productTitle(product) || fallback, 9);
        const spec = truncateText(productSpec(product), 8);
        const price = truncateText(productPrice(product), 6);
        const code = truncateText(productCode(product), 8);
        ctx.setFillStyle('#18181b');
        ctx.setFontSize(17);
        ctx.fillText(title, x + 84, cardY + 34);
        if (spec) {
          ctx.setFillStyle('#71717a');
          ctx.setFontSize(14);
          ctx.fillText(spec, x + 84, cardY + 58);
        }
        ctx.setFillStyle('#18181b');
        ctx.setFontSize(19);
        ctx.fillText(price, x + 84, cardY + 82);
        if (code) {
          ctx.setFillStyle('#18181b');
          roundedRect(ctx, x + 142, cardY + 62, 48, 20, 10);
          ctx.fill();
          ctx.setFillStyle('#ffffff');
          ctx.setFontSize(11);
          ctx.fillText(code, x + 149, cardY + 76);
        }
      };

      drawCard(products[0] || {}, productImages[0], 40, 0);
      drawCard(products[1] || {}, productImages[1], 258, 1);

      return new Promise((resolve) => {
        ctx.draw(false, () => {
          setTimeout(async () => {
            resolve(await canvasToTempFile(SEARCH_SHARE_CANVAS_ID, this));
          }, 60);
        });
      });
    },
    setupNavLayout() {
      const fallbackWidth = 375;
      let systemInfo = {};
      if (typeof uni !== 'undefined' && typeof uni.getSystemInfoSync === 'function') {
        try {
          systemInfo = uni.getSystemInfoSync() || {};
        } catch (error) {
          systemInfo = {};
        }
      }

      const windowWidth = Number(systemInfo.windowWidth || fallbackWidth);
      const statusBarHeight = Number(systemInfo.statusBarHeight || 20);
      let capsule = null;
      if (typeof uni !== 'undefined' && typeof uni.getMenuButtonBoundingClientRect === 'function') {
        try {
          capsule = uni.getMenuButtonBoundingClientRect();
        } catch (error) {
          capsule = null;
        }
      }

      const fallbackHeight = 32;
      const fallbackTop = statusBarHeight + 7;
      const fallbackRight = windowWidth - 8;
      const fallbackLeft = Math.max(0, fallbackRight - 87);
      const menu = capsule && capsule.width && capsule.height
        ? capsule
        : {
            top: fallbackTop,
            bottom: fallbackTop + fallbackHeight,
            left: fallbackLeft,
            right: fallbackRight,
            height: fallbackHeight,
          };

      const gap = 10;
      const top = Math.max(0, Math.round(Number(menu.top || fallbackTop)));
      const height = Math.max(28, Math.round(Number(menu.height || fallbackHeight)));
      const backLeft = 12;
      const backSize = Math.max(32, height);
      const left = backLeft + backSize + 8;
      const right = Math.max(12, Math.round(windowWidth - Number(menu.left || fallbackLeft) + gap));
      const navHeight = Math.max(88, Math.round(Number(menu.bottom || top + height) + 10));
      this.navLayout = { left, right, top, height, navHeight, backLeft, backSize };
    },
    loadHistory() {
      if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') return;
      try {
        const history = uni.getStorageSync(HISTORY_KEY);
        this.historyKeywords = Array.isArray(history) ? history.filter(Boolean).slice(0, 8) : [];
      } catch (error) {
        this.historyKeywords = [];
      }
    },
    saveKeyword(keyword) {
      const text = cleanText(keyword);
      if (!text) return;
      this.historyKeywords = [text].concat(this.historyKeywords.filter((item) => item !== text)).slice(0, 8);
      if (typeof uni === 'undefined' || typeof uni.setStorageSync !== 'function') return;
      try {
        uni.setStorageSync(HISTORY_KEY, this.historyKeywords);
      } catch (error) {
        // Storage can fail in preview/devtools privacy modes; search should still work.
      }
    },
    clearHistory() {
      this.historyKeywords = [];
      if (typeof uni === 'undefined' || typeof uni.removeStorageSync !== 'function') return;
      try {
        uni.removeStorageSync(HISTORY_KEY);
      } catch (error) {
        // ignore storage cleanup failure
      }
    },
    chipLabel(item) {
      return keywordLabel(item);
    },
    chipKey(item, index = 0) {
      const label = this.chipLabel(item);
      return label || `hot-keyword-${index}`;
    },
    resolveHotKeywordItem(item) {
      const label = this.chipLabel(item);
      if (!label || (item && typeof item === 'object')) return item;
      return this.hotKeywords.find((hotItem) => this.chipLabel(hotItem) === label) || item;
    },
    async loadSearchCategories() {
      if (this.categoryCacheReady) return this.categoryCache;
      try {
        this.categoryCache = await getCategories();
        this.categoryCacheReady = true;
      } catch (error) {
        this.categoryCache = [];
      }
      return this.categoryCache;
    },
    async resolveHotKeywordCategoryId(item) {
      if (!item || typeof item !== 'object') return '';
      const targetNames = keywordCategoryNames(item).map((name) => name.toLowerCase());
      if (!targetNames.length) return '';
      const categories = await this.loadSearchCategories();
      const matched = categories.find((category) => categoryNameValues(category).some((name) => targetNames.includes(name.toLowerCase())));
      return categoryIdValue(matched);
    },
    async selectKeyword(item) {
      const resolvedItem = this.resolveHotKeywordItem(item);
      const label = this.chipLabel(resolvedItem) || this.chipLabel(item);
      const categoryId = await this.resolveHotKeywordCategoryId(resolvedItem);
      if (categoryId) {
        this.keyword = label;
        this.categoryId = categoryId;
        this.categorySearchLabel = label;
        this.saveKeyword(label);
        return this.reload();
      }
      return this.submitSearch(label);
    },
    submitSearch(keyword) {
      this.keyword = cleanText(keyword);
      this.categoryId = '';
      this.categorySearchLabel = '';
      this.saveKeyword(this.keyword);
      return this.reload();
    },
    reload() {
      this.searched = true;
      this.page = 1;
      this.pageTotal = 1;
      this.total = 0;
      return this.loadPage(1, true);
    },
    selectSort(sort) {
      if (!sort || sort === this.activeSort) return;
      this.activeSort = sort;
      this.reload();
    },
    loadMore() {
      if (!this.searched || this.loading || this.errorText || this.page >= this.pageTotal) return;
      this.loadPage(this.page + 1);
    },
    async loadPage(page = 1, replace = false) {
      const currentRequest = ++this.requestId;
      this.loading = true;
      if (replace) this.errorText = '';
      try {
        const data = await getProducts({
          keyword: this.requestKeyword,
          category_id: this.categoryId,
          page,
          page_size: 20,
          sort: this.activeSort,
        });
        if (currentRequest !== this.requestId) return;
        this.page = page;
        this.pageTotal = data.page_total || 1;
        this.total = data.total || 0;
        this.products = replace ? data.data || [] : this.products.concat(data.data || []);
        this.$nextTick(() => this.prepareSearchSharePoster());
      } catch (error) {
        if (currentRequest !== this.requestId) return;
        if (replace) this.products = [];
        this.errorText = error.msg || '加载失败';
      } finally {
        if (currentRequest === this.requestId) this.loading = false;
      }
    },
    goBack() {
      if (typeof uni === 'undefined') return;
      const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
      if (pages.length > 1 && typeof uni.navigateBack === 'function') {
        uni.navigateBack();
        return;
      }
      if (typeof uni.switchTab === 'function') uni.switchTab({ url: '/pages/category/index' });
    },
  },
};
</script>

<style lang="scss" scoped>
.search-page {
  box-sizing: border-box;
  width: 100%;
  max-width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f4f4f5;
  color: #18181b;
  font-family: "PingFang SC", "PingFang TC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

.search-custom-nav {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  flex: none;
  background: #ffffff;
  border-bottom: 1rpx solid #e4e4e7;
}

.search-nav-input {
  box-sizing: border-box;
  position: absolute;
}

.search-back {
  position: absolute;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #18181b;
}

.search-back::after {
  border: 0;
}

.search-back__icon {
  width: 22rpx;
  height: 22rpx;
  margin-left: 6rpx;
  border-left: 4rpx solid currentColor;
  border-bottom: 4rpx solid currentColor;
  transform: rotate(45deg);
}

.search-page__body {
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  height: 100%;
  padding: 22rpx;
  overflow: hidden;
}

.search-page__panel {
  box-sizing: border-box;
  display: grid;
  gap: 22rpx;
}

.search-page__section {
  box-sizing: border-box;
  display: grid;
  gap: 18rpx;
  padding: 28rpx;
  border-radius: 14rpx;
  background: #ffffff;
  box-shadow: 0 0 0 1rpx rgba(24, 24, 27, 0.08);
}

.search-page__section-head,
.search-page__result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.search-page__title,
.search-page__result-title {
  color: #18181b;
  font-size: 30rpx;
  line-height: 42rpx;
  font-weight: 700;
}

.search-page__clear {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #71717a;
  font-size: 23rpx;
  line-height: 34rpx;
}

.search-page__clear::after,
.search-page__chip::after,
.search-page__sort-item::after,
.search-page__retry::after {
  border: 0;
}

.search-page__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.search-page__chip {
  box-sizing: border-box;
  height: 56rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 24rpx;
  border: 1rpx solid transparent;
  border-radius: 999px;
  background: #f4f4f5;
  color: #3f3f46;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 500;
}

.search-page__chip--active {
  background: #18181b;
  color: #fafafa;
}

.search-page__result-head {
  align-items: flex-end;
  padding: 2rpx 2rpx 0;
}

.search-page__result-count {
  color: #71717a;
  font-size: 23rpx;
  line-height: 34rpx;
  font-weight: 500;
}

.search-page__sort {
  display: flex;
  align-items: center;
  gap: 42rpx;
  padding: 8rpx 2rpx 24rpx;
}

.search-page__sort-item {
  position: relative;
  height: 46rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #71717a;
  font-size: 25rpx;
  line-height: 36rpx;
  font-weight: 600;
}

.search-page__sort-item.is-active {
  color: #18181b;
  font-weight: 800;
}

.search-page__sort-item.is-active::before {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -6rpx;
  width: 30rpx;
  height: 5rpx;
  border-radius: 999px;
  background: #18181b;
  transform: translateX(-50%);
}

.search-page__grid {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  padding: 1rpx 2rpx 2rpx;
}

.search-page__state,
.search-page__empty {
  box-sizing: border-box;
  display: grid;
  justify-items: center;
  gap: 14rpx;
  padding: 68rpx 28rpx;
  border-radius: 14rpx;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 0 0 1rpx rgba(24, 24, 27, 0.08);
}

.search-page__state--muted {
  margin-top: 22rpx;
  padding: 26rpx 0 42rpx;
  background: transparent;
  box-shadow: none;
  color: #71717a;
  font-size: 23rpx;
  line-height: 34rpx;
}

.search-page__state--error {
  color: #9f2f27;
  font-size: 26rpx;
  line-height: 38rpx;
}

.search-page__retry {
  width: 144rpx;
  height: 64rpx;
  margin: 10rpx 0 0;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: #18181b;
  color: #ffffff;
  font-size: 24rpx;
  line-height: 64rpx;
}

.search-page__empty {
  min-height: 420rpx;
}

.search-page__empty-mark {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #f4f4f5;
  color: #71717a;
  font-size: 36rpx;
  line-height: 1;
  font-weight: 800;
}

.search-page__empty-title {
  color: #18181b;
  font-size: 30rpx;
  line-height: 42rpx;
  font-weight: 700;
}

.search-page__empty-text {
  color: #71717a;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 500;
}

.search-share-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  opacity: 0;
  pointer-events: none;
}

.search-page__skeleton {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.search-page__skeleton-card {
  height: 430rpx;
  overflow: hidden;
  border-radius: 10px;
  background: linear-gradient(110deg, #f4f4f5 8%, #ececef 18%, #f4f4f5 33%);
  background-size: 200% 100%;
  animation: search-page-skeleton 1.15s ease-in-out infinite;
}

@keyframes search-page-skeleton {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}
</style>
