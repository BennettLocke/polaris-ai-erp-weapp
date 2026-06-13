<template>
  <view class="smart-share-page">
    <view class="smart-share-page__nav" :style="navShellStyle">
      <button class="smart-share-page__back" :style="backStyle" hover-class="none" @tap="goBack">
        <text class="smart-share-page__back-icon"></text>
      </button>
      <view class="smart-share-page__title" :style="titleStyle">智能选品推荐</view>
    </view>

    <scroll-view class="smart-share-page__body" scroll-y :show-scrollbar="false">
      <view class="smart-share-page__intro">
        <text class="smart-share-page__intro-title">按需求推荐礼盒</text>
        <text class="smart-share-page__intro-text">这是按分享条件实时匹配的推荐结果。</text>
        <view class="smart-share-page__chips">
          <text class="smart-share-page__chip">{{ selectedSizeLabel }}</text>
          <text class="smart-share-page__chip" :class="{ 'is-active': selectedColorValue }">{{ selectedColorLabel }}</text>
          <text class="smart-share-page__chip">{{ selectedPriceLabel }}</text>
        </view>
      </view>

      <view class="smart-share-page__result">
        <view class="smart-share-page__result-head">
          <view>
            <text class="smart-share-page__result-eyebrow">{{ selectedSummary }}</text>
            <text class="smart-share-page__result-title">{{ recommendationTitle }}</text>
          </view>
          <text v-if="recommendations.length" class="smart-share-page__result-count">{{ recommendations.length }}款</text>
        </view>

        <view v-if="errorText" class="smart-share-page__state smart-share-page__state--error">
          <text>{{ errorText }}</text>
        </view>

        <sj-loading-state v-else-if="loadingProducts || loadingRecommendationDetails" class="smart-share-page__loading" size="compact" />

        <view v-else-if="recommendations.length" class="smart-share-page__grid">
          <sj-category-product-card
            v-for="item in recommendations"
            :key="productCardKey(item)"
            :product="item"
            code-position="top"
          />
        </view>

        <view v-else class="smart-share-page__empty">
          <view class="smart-share-page__empty-mark">0</view>
          <text class="smart-share-page__empty-title">暂时没有匹配产品</text>
          <text class="smart-share-page__empty-text">分享条件可能已经变化，可以重新选品。</text>
        </view>
      </view>

      <button class="smart-share-page__again" hover-class="none" @tap="goSelectAgain">重新选品</button>
    </scroll-view>
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
  PRICE_RANGE_OPTIONS,
  buildSmartSelectionDisplayProducts,
  recommendSmartSelectionProducts,
  resolveSmartGiftSizeOptions,
} from '../../utils/smart-selection.js';

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

export default {
  name: 'ProductSmartSelectSharePage',
  components: { SjCategoryProductCard, SjLoadingState },
  data() {
    return {
      selectedSizeKey: '',
      selectedCategoryId: '',
      selectedSize: null,
      selectedColorValue: '',
      selectedPriceRangeValue: 'all',
      customPriceMin: '',
      customPriceMax: '',
      selectedProducts: [],
      loadingProducts: false,
      loadingRecommendationDetails: false,
      errorText: '',
      requestId: 0,
      recommendationDetailMap: {},
      recommendationDetailRequestId: 0,
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
      return { height: `${this.navLayout.navHeight}px` };
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
    isCustomPriceSelected() {
      return this.selectedPriceRangeValue === CUSTOM_PRICE_RANGE_VALUE;
    },
    customPriceRange() {
      return { min: this.customPriceMin, max: this.customPriceMax };
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
    selectedSizeLabel() {
      return (this.selectedSize && this.selectedSize.label) || '礼盒';
    },
    selectedColorLabel() {
      return cleanText(this.selectedColorValue) || '不限颜色';
    },
    selectedPriceLabel() {
      if (this.isCustomPriceSelected) {
        const min = cleanText(this.customPriceMin);
        const max = cleanText(this.customPriceMax);
        if (min && max) return `${min}-${max}元`;
        if (min) return `${min}元以上`;
        if (max) return `${max}元以下`;
        return '自定义价格';
      }
      return (PRICE_RANGE_OPTIONS.find((item) => item.value === this.selectedPriceRangeValue) || PRICE_RANGE_OPTIONS[0]).label;
    },
    selectedSummary() {
      return `${this.selectedSizeLabel} / ${this.selectedColorLabel} / ${this.selectedPriceLabel}`;
    },
    recommendationTitle() {
      if (this.recommendationResult.matchType === 'nearby') return '同规格近似推荐';
      return '推荐商品';
    },
  },
  onLoad(query = {}) {
    this.setupNavLayout();
    this.selectedSizeKey = decodeRouteQueryValue(query.size);
    this.selectedCategoryId = decodeRouteQueryValue(query.category_id);
    this.selectedColorValue = decodeRouteQueryValue(query.color);
    this.selectedPriceRangeValue = decodeRouteQueryValue(query.price) || 'all';
    this.customPriceMin = decodeRouteQueryValue(query.min);
    this.customPriceMax = decodeRouteQueryValue(query.max);
    this.loadShareSelection();
  },
  onShow() {
    enablePageShare();
    this.setupNavLayout();
  },
  onPullDownRefresh() {
    Promise.resolve(this.loadShareSelection()).finally(() => {
      if (typeof uni !== 'undefined' && typeof uni.stopPullDownRefresh === 'function') {
        uni.stopPullDownRefresh();
      }
    });
  },
  onShareAppMessage() {
    return buildShareOptions({
      title: SMART_SELECTION_SHARE_TITLE,
      path: this.shareSelectionUrl(),
      imageUrl: SMART_SELECTION_SHARE_IMAGE,
    });
  },
  onShareTimeline() {
    return buildTimelineShareOptions({
      title: SMART_SELECTION_SHARE_TITLE,
      path: this.shareSelectionUrl(),
      imageUrl: SMART_SELECTION_SHARE_IMAGE,
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
    async loadShareSelection() {
      this.errorText = '';
      this.selectedProducts = [];
      this.recommendationDetailMap = {};
      try {
        const categories = await getCategories();
        const options = resolveSmartGiftSizeOptions(categories);
        this.selectedSize = this.resolveSelectedSize(options);
      } catch (error) {
        this.selectedSize = this.resolveSelectedSize(resolveSmartGiftSizeOptions([]));
      }

      if (!this.selectedSize || !this.selectedSize.categoryId) {
        this.errorText = '分享条件无效，请重新选品';
        return;
      }

      this.selectedCategoryId = this.selectedSize.categoryId;
      await this.loadSelectedSizeProducts();
    },
    resolveSelectedSize(options = []) {
      return options.find((item) => this.selectedSizeKey && item.key === this.selectedSizeKey)
        || options.find((item) => this.selectedCategoryId && cleanText(item.categoryId) === this.selectedCategoryId)
        || (this.selectedCategoryId ? { key: this.selectedSizeKey || this.selectedCategoryId, label: '礼盒', categoryId: this.selectedCategoryId } : null);
    },
    async loadSelectedSizeProducts() {
      const currentRequest = ++this.requestId;
      this.loadingProducts = true;
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
        this.errorText = error.msg || '智能选品推荐加载失败';
      } finally {
        if (currentRequest === this.requestId) this.loadingProducts = false;
      }
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
    async refreshRecommendationDetails() {
      const currentRequest = ++this.recommendationDetailRequestId;
      if (!cleanText(this.selectedColorValue)) {
        this.loadingRecommendationDetails = false;
        return;
      }

      const products = (this.recommendationResult.products || []).slice(0, 20);
      const missingProducts = products.filter((item) => {
        const key = this.productKey(item);
        return key && !this.recommendationDetailMap[key];
      });
      if (!missingProducts.length) {
        this.loadingRecommendationDetails = false;
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
        }
      }
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
    goSelectAgain() {
      navigateToPage(PAGE_ROUTES.productSmartSelect);
    },
    goBack() {
      if (typeof uni === 'undefined') return;
      const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
      if (pages.length > 1 && typeof uni.navigateBack === 'function') {
        uni.navigateBack();
        return;
      }
      this.goSelectAgain();
    },
  },
};
</script>

<style lang="scss" scoped>
.smart-share-page {
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

.smart-share-page__nav {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  flex: none;
  background: #ffffff;
  border-bottom: 1rpx solid #e4e4e7;
}

.smart-share-page__back {
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

.smart-share-page__back::after,
.smart-share-page__again::after {
  border: 0;
}

.smart-share-page__back-icon {
  width: 18rpx;
  height: 18rpx;
  display: block;
  border-left: 4rpx solid #18181b;
  border-bottom: 4rpx solid #18181b;
  transform: rotate(45deg);
}

.smart-share-page__title {
  position: absolute;
  left: 0;
  right: 0;
  color: #18181b;
  font-size: 31rpx;
  font-weight: 800;
  text-align: center;
  pointer-events: none;
}

.smart-share-page__body {
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  padding: 24rpx 26rpx calc(42rpx + env(safe-area-inset-bottom));
  overflow: hidden;
}

.smart-share-page__intro,
.smart-share-page__result {
  box-sizing: border-box;
  margin-bottom: 22rpx;
  padding: 28rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 14px;
  background: #ffffff;
}

.smart-share-page__intro-title,
.smart-share-page__intro-text {
  display: block;
}

.smart-share-page__intro-title {
  color: #18181b;
  font-size: 36rpx;
  line-height: 48rpx;
  font-weight: 900;
}

.smart-share-page__intro-text {
  margin-top: 8rpx;
  color: #71717a;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 500;
}

.smart-share-page__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 22rpx;
}

.smart-share-page__chip {
  box-sizing: border-box;
  min-height: 58rpx;
  display: inline-flex;
  align-items: center;
  padding: 0 20rpx;
  border-radius: 999px;
  background: #f4f4f5;
  color: #3f3f46;
  font-size: 23rpx;
  line-height: 32rpx;
  font-weight: 750;
}

.smart-share-page__chip.is-active {
  background: #18181b;
  color: #ffffff;
}

.smart-share-page__result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 18rpx;
}

.smart-share-page__result-eyebrow,
.smart-share-page__result-title {
  display: block;
}

.smart-share-page__result-eyebrow {
  margin-bottom: 2rpx;
  color: #71717a;
  font-size: 22rpx;
  line-height: 32rpx;
  font-weight: 600;
}

.smart-share-page__result-title {
  color: #18181b;
  font-size: 29rpx;
  line-height: 40rpx;
  font-weight: 850;
}

.smart-share-page__result-count {
  flex: none;
  color: #9f2f27;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 800;
}

.smart-share-page__loading {
  margin-top: 8rpx;
}

.smart-share-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.smart-share-page__state,
.smart-share-page__empty {
  box-sizing: border-box;
  padding: 44rpx 24rpx;
  border: 1rpx dashed #d4d4d8;
  border-radius: 12px;
  background: #ffffff;
  color: #71717a;
  text-align: center;
}

.smart-share-page__state--error {
  color: #9f2f27;
}

.smart-share-page__empty-mark {
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

.smart-share-page__empty-title,
.smart-share-page__empty-text {
  display: block;
}

.smart-share-page__empty-title {
  color: #18181b;
  font-size: 28rpx;
  line-height: 38rpx;
  font-weight: 800;
}

.smart-share-page__empty-text {
  margin-top: 8rpx;
  color: #71717a;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 500;
}

.smart-share-page__again {
  box-sizing: border-box;
  width: 100%;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border-radius: 12px;
  background: #18181b;
  color: #ffffff;
  font-size: 26rpx;
  line-height: 80rpx;
  font-weight: 850;
}
</style>
