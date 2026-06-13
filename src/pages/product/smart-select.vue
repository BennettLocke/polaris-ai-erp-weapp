<template>
  <view class="smart-select-page">
    <view class="smart-select-page__nav" :style="navShellStyle">
      <button class="smart-select-page__back" :style="backStyle" hover-class="none" @tap="goBack">
        <text class="smart-select-page__back-icon"></text>
      </button>
      <view class="smart-select-page__title" :style="titleStyle">智能选品</view>
    </view>

    <scroll-view
      class="smart-select-page__body"
      scroll-y
      :show-scrollbar="false"
    >
      <view class="smart-select-page__intro">
        <text class="smart-select-page__intro-title">按需求推荐礼盒</text>
        <text class="smart-select-page__intro-text">选择礼盒大小、颜色和价格，快速找到合适产品。</text>
      </view>

      <view class="smart-select-page__section">
        <view class="smart-select-page__section-head">
          <text class="smart-select-page__step">1</text>
          <text class="smart-select-page__section-title">礼盒大小</text>
        </view>
        <view class="smart-select-page__option-grid smart-select-page__option-grid--sizes">
          <button
            v-for="item in giftSizeOptions"
            :key="item.key"
            :class="['smart-select-page__option', selectedSize && selectedSize.key === item.key ? 'is-active' : '']"
            @tap="selectGiftSize(item)"
          >
            <text>{{ item.label }}</text>
          </button>
        </view>
      </view>

      <view class="smart-select-page__section">
        <view class="smart-select-page__section-head">
          <text class="smart-select-page__step">2</text>
          <text class="smart-select-page__section-title">颜色</text>
        </view>
        <view class="smart-select-page__option-grid">
          <button
            v-for="item in colorOptions"
            :key="item.value || 'all-color'"
            :class="['smart-select-page__option', selectedColorValue === item.value ? 'is-active' : '']"
            @tap="selectColor(item)"
          >
            <text>{{ item.label }}</text>
          </button>
        </view>
      </view>

      <view class="smart-select-page__section">
        <view class="smart-select-page__section-head">
          <text class="smart-select-page__step">3</text>
          <text class="smart-select-page__section-title">价格</text>
        </view>
        <view class="smart-select-page__option-grid">
          <button
            v-for="item in priceRangeOptions"
            :key="item.value"
            :class="['smart-select-page__option', selectedPriceRangeValue === item.value ? 'is-active' : '']"
            @tap="selectPriceRange(item)"
          >
            <text>{{ item.label }}</text>
          </button>
        </view>
        <view v-if="isCustomPriceSelected" class="smart-select-page__custom-price">
          <view class="smart-select-page__price-field">
            <input
              v-model="customPriceMin"
              class="smart-select-page__price-input"
              type="digit"
              placeholder="最低价"
              placeholder-class="smart-select-page__price-placeholder"
            />
            <text class="smart-select-page__price-unit">元</text>
          </view>
          <text class="smart-select-page__price-separator">-</text>
          <view class="smart-select-page__price-field">
            <input
              v-model="customPriceMax"
              class="smart-select-page__price-input"
              type="digit"
              placeholder="最高价"
              placeholder-class="smart-select-page__price-placeholder"
            />
            <text class="smart-select-page__price-unit">元</text>
          </view>
        </view>
      </view>

      <view class="smart-select-page__result">
        <view class="smart-select-page__result-head">
          <view>
            <text class="smart-select-page__result-eyebrow">{{ selectedSummary }}</text>
            <text class="smart-select-page__result-title">{{ recommendationTitle }}</text>
          </view>
          <view v-if="recommendations.length" class="smart-select-page__result-actions">
            <text class="smart-select-page__result-count">{{ recommendations.length }}款</text>
            <button class="smart-select-page__share-button" open-type="share" hover-class="none">分享选品</button>
          </view>
        </view>

        <view v-if="errorText" class="smart-select-page__state smart-select-page__state--error">
          <text>{{ errorText }}</text>
          <button class="smart-select-page__retry" @tap="reloadCurrentSize">重试</button>
        </view>

        <sj-loading-state v-else-if="loadingProducts || loadingRecommendationDetails" class="smart-select-page__loading" size="compact" />

        <view v-else-if="recommendations.length" class="smart-select-page__grid">
          <sj-category-product-card
            v-for="item in recommendations"
            :key="productCardKey(item)"
            :product="item"
            code-position="top"
          />
        </view>

        <view v-else class="smart-select-page__empty">
          <view class="smart-select-page__empty-mark">0</view>
          <text class="smart-select-page__empty-title">暂时没有匹配产品</text>
          <text class="smart-select-page__empty-text">换个礼盒大小、颜色或价格再试试。</text>
        </view>
      </view>
    </scroll-view>

    <canvas
      canvas-id="smartSelectSharePosterCanvas"
      class="smart-select-page__share-canvas"
      style="width: 500px; height: 400px;"
    />
  </view>
</template>

<script>
import SjCategoryProductCard from '../../components/SjCategoryProductCard.vue';
import SjLoadingState from '../../components/SjLoadingState.vue';
import { getCategories } from '../../api/categories';
import { getProductDetail, getProducts } from '../../api/products';
import { PAGE_ROUTES, buildProductSmartSelectShareUrl, navigateToPage } from '../../utils/route';
import { SMART_SELECTION_SHARE_IMAGE, SMART_SELECTION_SHARE_TITLE, buildShareOptions, buildTimelineShareOptions, enablePageShare } from '../../utils/share.js';
import {
  CUSTOM_PRICE_RANGE_VALUE,
  buildSmartSelectionColorOptions,
  buildSmartSelectionDisplayProducts,
  buildSmartSelectionPriceRangeOptions,
  recommendSmartSelectionProducts,
  resolveSmartGiftSizeOptions,
} from '../../utils/smart-selection.js';

function cleanText(value) {
  return String(value || '').trim();
}

const SMART_SELECT_SHARE_CANVAS_ID = 'smartSelectSharePosterCanvas';
const SMART_SELECT_SHARE_WIDTH = 500;
const SMART_SELECT_SHARE_HEIGHT = 400;

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
    ctx.drawImage(image.path, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
    return true;
  }
  ctx.drawImage(image.path, x, y, width, height);
  return true;
}

function canvasToTempFile(canvasId, page) {
  if (typeof uni === 'undefined' || typeof uni.canvasToTempFilePath !== 'function') return Promise.resolve('');
  return new Promise((resolve) => {
    uni.canvasToTempFilePath({
      canvasId,
      width: SMART_SELECT_SHARE_WIDTH,
      height: SMART_SELECT_SHARE_HEIGHT,
      destWidth: SMART_SELECT_SHARE_WIDTH * 2,
      destHeight: SMART_SELECT_SHARE_HEIGHT * 2,
      fileType: 'png',
      quality: 0.92,
      success: (result = {}) => resolve(result.tempFilePath || ''),
      fail: () => resolve(''),
    }, page);
  });
}

function productTitle(product = {}) {
  return cleanText(product.productName || product.title || product.name || product.goods_name);
}

function productCode(product = {}) {
  return cleanText(product.productCode || product.product_code || product.coding || product.sku_no || product.id);
}

function productSpec(product = {}) {
  return cleanText(product.pieceText || product.piece_text || product.packText || product.pack_text || product.specText || product.spec);
}

function productPrice(product = {}) {
  const text = cleanText(product.priceText || product.price_text);
  if (text) return text;
  const value = product.min_price || product.minPrice || product.price || product.retail_price;
  if (value === undefined || value === null || value === '') return '咨询价';
  return String(value).startsWith('¥') ? String(value) : `¥${value}`;
}

export default {
  name: 'ProductSmartSelectPage',
  components: { SjCategoryProductCard, SjLoadingState },
  data() {
    return {
      giftSizeOptions: [],
      selectedSize: null,
      selectedColorValue: '',
      selectedPriceRangeValue: 'all',
      customPriceMin: '',
      customPriceMax: '',
      selectedProducts: [],
      loadingCategories: false,
      loadingProducts: false,
      loadingRecommendationDetails: false,
      errorText: '',
      requestId: 0,
      recommendationDetailMap: {},
      recommendationDetailRequestId: 0,
      smartSelectShareImage: '',
      smartSelectShareTaskId: 0,
      navLayout: {
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
    backStyle() {
      return {
        left: `${this.navLayout.backLeft}px`,
        top: `${this.navLayout.top}px`,
        width: `${this.navLayout.backSize}px`,
        height: `${this.navLayout.height}px`,
      };
    },
    titleStyle() {
      return {
        top: `${this.navLayout.top}px`,
        height: `${this.navLayout.height}px`,
        lineHeight: `${this.navLayout.height}px`,
      };
    },
    colorOptions() {
      return buildSmartSelectionColorOptions(this.selectedProducts);
    },
    priceRangeOptions() {
      return buildSmartSelectionPriceRangeOptions(this.selectedProducts);
    },
    isCustomPriceSelected() {
      return this.selectedPriceRangeValue === CUSTOM_PRICE_RANGE_VALUE;
    },
    customPriceRange() {
      return {
        min: this.customPriceMin,
        max: this.customPriceMax,
      };
    },
    recommendationResult() {
      return recommendSmartSelectionProducts(this.selectedProducts, {
        color: this.selectedColorValue,
        priceRange: this.selectedPriceRangeValue,
        customPriceRange: this.customPriceRange,
      });
    },
    recommendations() {
      return buildSmartSelectionDisplayProducts(this.recommendationResult.products || [], this.selectedColorValue, this.recommendationDetailMap);
    },
    selectedPriceLabel() {
      if (this.isCustomPriceSelected) return this.customPriceLabel;
      return (this.priceRangeOptions.find((item) => item.value === this.selectedPriceRangeValue) || this.priceRangeOptions[0]).label;
    },
    customPriceLabel() {
      const min = cleanText(this.customPriceMin);
      const max = cleanText(this.customPriceMax);
      if (min && max) return `${min}-${max}元`;
      if (min) return `${min}元以上`;
      if (max) return `${max}元以下`;
      return '自定义价格';
    },
    selectedColorLabel() {
      return (this.colorOptions.find((item) => item.value === this.selectedColorValue) || this.colorOptions[0] || {}).label || '不限颜色';
    },
    selectedSummary() {
      const size = this.selectedSize ? this.selectedSize.label : '礼盒';
      return `${size} / ${this.selectedColorLabel} / ${this.selectedPriceLabel}`;
    },
    recommendationTitle() {
      if (this.recommendationResult.matchType === 'nearby') return '同规格近似推荐';
      return '推荐商品';
    },
  },
  watch: {
    selectedColorValue() {
      this.refreshRecommendationDetails();
    },
    selectedPriceRangeValue() {
      this.refreshRecommendationDetails();
    },
    customPriceMin() {
      this.refreshRecommendationDetails();
    },
    customPriceMax() {
      this.refreshRecommendationDetails();
    },
    selectedProducts() {
      this.refreshRecommendationDetails();
    },
  },
  onLoad() {
    this.setupNavLayout();
    this.loadGiftSizes();
  },
  onShow() {
    enablePageShare();
    this.setupNavLayout();
    this.prepareSmartSelectSharePoster();
  },
  onPullDownRefresh() {
    Promise.resolve(this.reloadCurrentSize()).finally(() => {
      if (typeof uni !== 'undefined' && typeof uni.stopPullDownRefresh === 'function') {
        uni.stopPullDownRefresh();
      }
    });
  },
  onShareAppMessage() {
    return buildShareOptions({
      title: '肆计包装智能选品',
      title: SMART_SELECTION_SHARE_TITLE,
      path: this.shareSelectionUrl(),
      imageUrl: this.smartSelectShareImage || SMART_SELECTION_SHARE_IMAGE,
    });
  },
  onShareTimeline() {
    return buildTimelineShareOptions({
      title: '肆计包装智能选品',
      title: SMART_SELECTION_SHARE_TITLE,
      path: this.shareSelectionUrl(),
      imageUrl: this.smartSelectShareImage || SMART_SELECTION_SHARE_IMAGE,
    });
  },
  methods: {
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

      const top = Math.max(0, Math.round(Number(menu.top || fallbackTop)));
      const height = Math.max(28, Math.round(Number(menu.height || fallbackHeight)));
      const backLeft = 12;
      const backSize = Math.max(32, height);
      const navHeight = Math.max(88, Math.round(Number(menu.bottom || top + height) + 10));
      this.navLayout = { top, height, navHeight, backLeft, backSize };
    },
    async loadGiftSizes() {
      this.loadingCategories = true;
      try {
        const categories = await getCategories();
        this.giftSizeOptions = resolveSmartGiftSizeOptions(categories);
      } catch (error) {
        this.giftSizeOptions = resolveSmartGiftSizeOptions([]);
      } finally {
        this.loadingCategories = false;
      }

      if (!this.selectedSize && this.giftSizeOptions.length) {
        this.selectGiftSize(this.giftSizeOptions[0]);
      }
    },
    selectGiftSize(item) {
      if (!item || !item.categoryId) return;
      if (this.selectedSize && this.selectedSize.key === item.key) return;
      this.selectedSize = item;
      this.selectedColorValue = '';
      this.selectedPriceRangeValue = 'all';
      this.customPriceMin = '';
      this.customPriceMax = '';
      this.recommendationDetailMap = {};
      this.loadingRecommendationDetails = false;
      this.loadSelectedSizeProducts();
    },
    async loadSelectedSizeProducts() {
      if (!this.selectedSize || !this.selectedSize.categoryId) return;
      const currentRequest = ++this.requestId;
      this.loadingProducts = true;
      this.errorText = '';
      try {
        const firstPage = await getProducts({
          category_id: this.selectedSize.categoryId,
          page: 1,
          page_size: 100,
          sort: 'sales',
        });
        if (currentRequest !== this.requestId) return;
        let products = firstPage.data || [];
        const pageTotal = Number(firstPage.page_total || 1);
        if (pageTotal > 1) {
          for (let page = 2; page <= pageTotal; page += 1) {
            const nextPage = await getProducts({
              category_id: this.selectedSize.categoryId,
              page,
              page_size: 100,
              sort: 'sales',
            });
            if (currentRequest !== this.requestId) return;
            products = products.concat(nextPage.data || []);
          }
        }
        this.selectedProducts = products;
        this.refreshRecommendationDetails();
      } catch (error) {
        if (currentRequest !== this.requestId) return;
        this.selectedProducts = [];
        this.errorText = error.msg || '智能选品加载失败';
      } finally {
        if (currentRequest === this.requestId) this.loadingProducts = false;
      }
    },
    selectColor(item) {
      this.selectedColorValue = item && item.value !== undefined ? item.value : '';
    },
    selectPriceRange(item) {
      const value = item && item.value ? item.value : 'all';
      this.selectedPriceRangeValue = value;
      if (value !== CUSTOM_PRICE_RANGE_VALUE) {
        this.customPriceMin = '';
        this.customPriceMax = '';
      }
    },
    reloadCurrentSize() {
      if (!this.selectedSize) return this.loadGiftSizes();
      return this.loadSelectedSizeProducts();
    },
    productKey(item = {}) {
      return cleanText(item.id || item.goods_id || item.product_id || item.productCode || item.product_code);
    },
    productCardKey(item = {}) {
      const id = this.productKey(item);
      const color = cleanText(this.selectedColorValue) || 'all';
      const cover = cleanText(item.smartSelectionCover || item.cover || item.images);
      return `${id}-${color}-${cover}`;
    },
    shareSelectionParams() {
      return {
        size: this.selectedSize && this.selectedSize.key,
        category_id: this.selectedSize && this.selectedSize.categoryId,
        color: this.selectedColorValue,
        price: this.selectedPriceRangeValue,
        min: this.isCustomPriceSelected ? this.customPriceMin : '',
        max: this.isCustomPriceSelected ? this.customPriceMax : '',
      };
    },
    shareSelectionUrl() {
      return buildProductSmartSelectShareUrl(this.shareSelectionParams());
    },
    async prepareSmartSelectSharePoster() {
      const taskId = ++this.smartSelectShareTaskId;
      const poster = await this.createSmartSelectSharePoster();
      if (taskId === this.smartSelectShareTaskId && poster) {
        this.smartSelectShareImage = poster;
      }
    },
    async createSmartSelectSharePoster() {
      if (typeof uni === 'undefined' || typeof uni.createCanvasContext !== 'function') return '';
      const products = (this.recommendations || []).slice(0, 2);
      if (!products.length) return '';

      const images = await Promise.all(products.map((item) => getCanvasImageInfo(item.smartSelectionCover || item.cover || item.images)));
      const ctx = uni.createCanvasContext(SMART_SELECT_SHARE_CANVAS_ID, this);
      const chips = [
        this.selectedSize ? this.selectedSize.label : '礼盒',
        this.selectedColorLabel,
        this.selectedPriceLabel,
      ].map((item) => truncateText(item, 8));

      ctx.setFillStyle('#f4f4f5');
      ctx.fillRect(0, 0, SMART_SELECT_SHARE_WIDTH, SMART_SELECT_SHARE_HEIGHT);
      ctx.setFillStyle('#ffffff');
      roundedRect(ctx, 18, 18, SMART_SELECT_SHARE_WIDTH - 36, SMART_SELECT_SHARE_HEIGHT - 36, 22);
      ctx.fill();

      ctx.setFillStyle('#18181b');
      ctx.setFontSize(30);
      ctx.fillText('智能选品推荐', 40, 70);
      ctx.setFillStyle('#71717a');
      ctx.setFontSize(17);
      ctx.fillText('按礼盒大小、颜色和价格快速匹配', 40, 102);

      chips.forEach((item, index) => {
        const x = 40 + index * 132;
        ctx.setFillStyle(index === 1 && this.selectedColorValue ? '#18181b' : '#f4f4f5');
        roundedRect(ctx, x, 128, 116, 36, 18);
        ctx.fill();
        ctx.setFillStyle(index === 1 && this.selectedColorValue ? '#ffffff' : '#3f3f46');
        ctx.setFontSize(16);
        ctx.fillText(item, x + 16, 151);
      });

      const drawCard = (product, image, x) => {
        ctx.setFillStyle('#ffffff');
        roundedRect(ctx, x, 198, 202, 136, 16);
        ctx.fill();
        ctx.setStrokeStyle('rgba(24,24,27,0.08)');
        ctx.setLineWidth(1);
        roundedRect(ctx, x, 198, 202, 136, 16);
        ctx.stroke();

        ctx.save();
        roundedRect(ctx, x + 12, 210, 74, 74, 12);
        ctx.clip();
        if (!drawAspectFillImage(ctx, image, x + 12, 210, 74, 74)) {
          ctx.setFillStyle('#f4f4f5');
          ctx.fillRect(x + 12, 210, 74, 74);
        }
        ctx.restore();

        ctx.setFillStyle('#18181b');
        ctx.setFontSize(18);
        ctx.fillText(truncateText(productTitle(product) || '推荐商品', 8), x + 98, 234);
        ctx.setFillStyle('#71717a');
        ctx.setFontSize(14);
        ctx.fillText(truncateText(productSpec(product), 8), x + 98, 260);
        ctx.setFillStyle('#18181b');
        ctx.setFontSize(22);
        ctx.fillText(truncateText(productPrice(product), 7), x + 98, 292);
        const code = truncateText(productCode(product), 8);
        if (code) {
          ctx.setFillStyle('#18181b');
          roundedRect(ctx, x + 12, 296, 72, 24, 12);
          ctx.fill();
          ctx.setFillStyle('#ffffff');
          ctx.setFontSize(13);
          ctx.fillText(code, x + 22, 313);
        }
      };

      drawCard(products[0] || {}, images[0], 40);
      drawCard(products[1] || {}, images[1], 258);

      ctx.setFillStyle('#71717a');
      ctx.setFontSize(16);
      ctx.fillText('肆计包装', 40, 360);
      ctx.setFillStyle('#18181b');
      ctx.setFontSize(18);
      ctx.fillText('打开小程序查看同条件推荐', 238, 360);

      return new Promise((resolve) => {
        ctx.draw(false, () => {
          setTimeout(async () => {
            resolve(await canvasToTempFile(SMART_SELECT_SHARE_CANVAS_ID, this));
          }, 80);
        });
      });
    },
    async refreshRecommendationDetails() {
      const currentRequest = ++this.recommendationDetailRequestId;
      if (!cleanText(this.selectedColorValue)) {
        this.loadingRecommendationDetails = false;
        this.$nextTick(() => this.prepareSmartSelectSharePoster());
        return;
      }

      const products = (this.recommendationResult.products || []).slice(0, 20);
      const missingProducts = products.filter((item) => {
        const key = this.productKey(item);
        return key && !this.recommendationDetailMap[key];
      });
      if (!missingProducts.length) {
        this.loadingRecommendationDetails = false;
        this.$nextTick(() => this.prepareSmartSelectSharePoster());
        return;
      }

      this.loadingRecommendationDetails = true;
      try {
        const results = await Promise.allSettled(missingProducts.map((item) => getProductDetail(this.productKey(item))));
        if (currentRequest !== this.recommendationDetailRequestId) return;

        const nextMap = { ...this.recommendationDetailMap };
        results.forEach((result, index) => {
          const key = this.productKey(missingProducts[index]);
          if (key && result.status === 'fulfilled' && result.value) {
            nextMap[key] = result.value;
          }
        });
        this.recommendationDetailMap = nextMap;
      } finally {
        if (currentRequest === this.recommendationDetailRequestId) {
          this.loadingRecommendationDetails = false;
          this.$nextTick(() => this.prepareSmartSelectSharePoster());
        }
      }
    },
    goBack() {
      if (typeof uni === 'undefined') return;
      const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
      if (pages.length > 1 && typeof uni.navigateBack === 'function') {
        uni.navigateBack();
        return;
      }
      navigateToPage(PAGE_ROUTES.home);
    },
  },
};
</script>

<style lang="scss" scoped>
.smart-select-page {
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

.smart-select-page__nav {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  flex: none;
  background: #ffffff;
  border-bottom: 1rpx solid #e4e4e7;
}

.smart-select-page__back {
  position: absolute;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border-radius: 999px;
  background: #ffffff;
}

.smart-select-page__back::after {
  border: 0;
}

.smart-select-page__back-icon {
  width: 18rpx;
  height: 18rpx;
  display: block;
  border-left: 4rpx solid #18181b;
  border-bottom: 4rpx solid #18181b;
  transform: rotate(45deg);
}

.smart-select-page__title {
  position: absolute;
  left: 0;
  right: 0;
  color: #18181b;
  font-size: 31rpx;
  font-weight: 800;
  text-align: center;
  pointer-events: none;
}

.smart-select-page__body {
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  padding: 24rpx 26rpx calc(42rpx + env(safe-area-inset-bottom));
  overflow: hidden;
}

.smart-select-page__intro,
.smart-select-page__section,
.smart-select-page__result {
  box-sizing: border-box;
  margin-bottom: 22rpx;
  padding: 28rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 14px;
  background: #ffffff;
}

.smart-select-page__intro-title,
.smart-select-page__intro-text {
  display: block;
}

.smart-select-page__intro-title {
  color: #18181b;
  font-size: 36rpx;
  line-height: 48rpx;
  font-weight: 900;
}

.smart-select-page__intro-text {
  margin-top: 8rpx;
  color: #71717a;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 500;
}

.smart-select-page__section-head,
.smart-select-page__result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 18rpx;
}

.smart-select-page__section-head {
  justify-content: flex-start;
}

.smart-select-page__step {
  width: 42rpx;
  height: 42rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #18181b;
  color: #ffffff;
  font-size: 23rpx;
  line-height: 30rpx;
  font-weight: 800;
}

.smart-select-page__section-title,
.smart-select-page__result-title {
  display: block;
  color: #18181b;
  font-size: 29rpx;
  line-height: 40rpx;
  font-weight: 850;
}

.smart-select-page__result-eyebrow {
  display: block;
  margin-bottom: 2rpx;
  color: #71717a;
  font-size: 22rpx;
  line-height: 32rpx;
  font-weight: 600;
}

.smart-select-page__result-count {
  flex: none;
  color: #9f2f27;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 800;
}

.smart-select-page__result-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.smart-select-page__share-button {
  box-sizing: border-box;
  height: 58rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 22rpx;
  border-radius: 999px;
  background: #18181b;
  color: #ffffff;
  font-size: 22rpx;
  line-height: 58rpx;
  font-weight: 800;
}

.smart-select-page__share-button::after {
  border: 0;
}

.smart-select-page__option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.smart-select-page__option-grid--sizes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.smart-select-page__option {
  box-sizing: border-box;
  min-width: 0;
  min-height: 66rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 20rpx;
  border: 1rpx solid #d4d4d8;
  border-radius: 8px;
  background: #ffffff;
  color: #3f3f46;
  font-size: 24rpx;
  line-height: 32rpx;
  font-weight: 700;
}

.smart-select-page__option::after {
  border: 0;
}

.smart-select-page__option.is-active {
  border-color: #18181b;
  background: #18181b;
  color: #ffffff;
}

.smart-select-page__custom-price {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 16rpx;
}

.smart-select-page__price-field {
  box-sizing: border-box;
  min-width: 0;
  height: 72rpx;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 0 18rpx;
  border: 1rpx solid #d4d4d8;
  border-radius: 8px;
  background: #fafafa;
}

.smart-select-page__price-input {
  min-width: 0;
  flex: 1;
  color: #18181b;
  font-size: 25rpx;
  line-height: 34rpx;
  font-weight: 750;
}

.smart-select-page__price-placeholder {
  color: #a1a1aa;
  font-weight: 500;
}

.smart-select-page__price-unit,
.smart-select-page__price-separator {
  flex: none;
  color: #71717a;
  font-size: 23rpx;
  line-height: 32rpx;
  font-weight: 650;
}

.smart-select-page__loading {
  margin-top: 8rpx;
}

.smart-select-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.smart-select-page__state,
.smart-select-page__empty {
  box-sizing: border-box;
  padding: 44rpx 24rpx;
  border: 1rpx dashed #d4d4d8;
  border-radius: 12px;
  background: #ffffff;
  color: #71717a;
  text-align: center;
}

.smart-select-page__state--error {
  color: #9f2f27;
}

.smart-select-page__retry {
  width: 144rpx;
  height: 64rpx;
  margin-top: 20rpx;
  padding: 0;
  line-height: 64rpx;
  border-radius: 10px;
  background: #18181b;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
}

.smart-select-page__retry::after {
  border: 0;
}

.smart-select-page__empty-mark {
  width: 76rpx;
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16rpx;
  border-radius: 999px;
  background: #f4f4f5;
  color: #a1a1aa;
  font-size: 34rpx;
  line-height: 44rpx;
  font-weight: 900;
}

.smart-select-page__empty-title,
.smart-select-page__empty-text {
  display: block;
}

.smart-select-page__empty-title {
  color: #18181b;
  font-size: 28rpx;
  line-height: 38rpx;
  font-weight: 800;
}

.smart-select-page__empty-text {
  margin-top: 8rpx;
  color: #71717a;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 500;
}

.smart-select-page__share-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 500px;
  height: 400px;
  pointer-events: none;
}
</style>
