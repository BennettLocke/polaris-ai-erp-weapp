<template>
  <view class="product-footprint-page">
    <view class="product-footprint-page__nav" :style="navShellStyle">
      <button class="product-footprint-page__back" :style="backStyle" hover-class="none" @tap="goBack">
        <text class="product-footprint-page__back-icon"></text>
      </button>
      <view class="product-footprint-page__title" :style="titleStyle">产品足迹</view>
    </view>

    <view class="product-footprint-page__tabs">
      <button
        v-for="item in footprintTabs"
        :key="item.value"
        :class="['product-footprint-page__tab', activeTab === item.value ? 'is-active' : '']"
        @tap="selectTab(item.value)"
      >
        <text>{{ item.label }}</text>
        <text class="product-footprint-page__tab-count">{{ tabCount(item.value) }}</text>
      </button>
    </view>

    <scroll-view
      class="product-footprint-page__body"
      scroll-y
      :show-scrollbar="false"
    >
      <view v-if="activeTab === 'recent' && recent.length" class="product-footprint-page__toolbar">
        <text class="product-footprint-page__hint">最近浏览按查看时间排序</text>
        <button class="product-footprint-page__clear" @tap="clearRecent">清空</button>
      </view>

      <view v-if="visibleProducts.length" class="product-footprint-page__grid">
        <sj-category-product-card
          v-for="item in visibleProducts"
          :key="productKey(item)"
          :product="item"
          code-position="top"
        />
      </view>

      <view v-else class="product-footprint-page__empty">
        <view class="product-footprint-page__empty-mark">{{ emptyMark }}</view>
        <text class="product-footprint-page__empty-title">{{ emptyTitle }}</text>
        <text class="product-footprint-page__empty-text">{{ emptyText }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import SjCategoryProductCard from '../../components/SjCategoryProductCard.vue';
import { flattenSalesOrderProducts, getMySalesOrders } from '../../api/sales-orders';
import { getAuthState } from '../../stores/auth';
import { PAGE_ROUTES, navigateToPage } from '../../utils/route';
import { buildShareOptions, buildTimelineShareOptions, enablePageShare } from '../../utils/share.js';
import {
  clearProductRecentViews,
  getProductFootprint,
  mergeSalesOrderFrequentProducts,
  rankFrequentProducts,
} from '../../utils/product-footprint.js';

function cleanText(value) {
  return String(value || '').trim();
}

function authSnapshot() {
  const state = getAuthState();
  return {
    token: state.token || '',
    user: state.user || null,
  };
}

function productId(product = {}) {
  return cleanText(product.id || product.goods_id || product.product_id || product.productCode || product.product_code);
}

const TAB_VALUES = ['favorites', 'recent', 'frequent'];

export default {
  name: 'ProductFootprintPage',
  components: { SjCategoryProductCard },
  data() {
    return {
      activeTab: 'favorites',
      favorites: [],
      recent: [],
      frequent: [],
      salesProducts: [],
      authState: authSnapshot(),
      salesLoading: false,
      footprintTabs: [
        { label: '收藏', value: 'favorites' },
        { label: '最近浏览', value: 'recent' },
        { label: '常购商品', value: 'frequent' },
      ],
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
    visibleProducts() {
      if (this.activeTab === 'recent') return this.recent;
      if (this.activeTab === 'frequent') return this.frequent;
      return this.favorites;
    },
    emptyMark() {
      if (this.activeTab === 'recent') return '0';
      if (this.activeTab === 'frequent') return '常';
      return '星';
    },
    emptyTitle() {
      if (this.activeTab === 'recent') return '还没有最近浏览';
      if (this.activeTab === 'frequent') return '还没有常购商品';
      return '还没有收藏商品';
    },
    emptyText() {
      if (this.activeTab === 'recent') return '打开商品详情后会自动记录到这里';
      if (this.activeTab === 'frequent') return '浏览、收藏和购买越多，常购排序越准确';
      return '在商品卡片或详情页点收藏后会出现在这里';
    },
  },
  onLoad(query = {}) {
    this.setupNavLayout();
    this.activeTab = this.normalizeTab(query.tab);
  },
  onShow() {
    enablePageShare();
    this.setupNavLayout();
    this.syncAuthState();
    this.loadFootprint();
  },
  onPullDownRefresh() {
    Promise.resolve(this.loadFootprint()).finally(() => {
      if (typeof uni !== 'undefined' && typeof uni.stopPullDownRefresh === 'function') {
        uni.stopPullDownRefresh();
      }
    });
  },
  onShareAppMessage() {
    return buildShareOptions({
      title: '肆计包装产品足迹',
      path: PAGE_ROUTES.productFootprint,
    });
  },
  onShareTimeline() {
    return buildTimelineShareOptions({
      title: '肆计包装产品足迹',
      path: PAGE_ROUTES.productFootprint,
    });
  },
  methods: {
    syncAuthState() {
      this.authState = authSnapshot();
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

      const top = Math.max(0, Math.round(Number(menu.top || fallbackTop)));
      const height = Math.max(28, Math.round(Number(menu.height || fallbackHeight)));
      const backLeft = 12;
      const backSize = Math.max(32, height);
      const navHeight = Math.max(88, Math.round(Number(menu.bottom || top + height) + 10));
      this.navLayout = { top, height, navHeight, backLeft, backSize };
    },
    normalizeTab(tab) {
      const value = cleanText(tab);
      return TAB_VALUES.includes(value) ? value : 'favorites';
    },
    selectTab(tab) {
      this.activeTab = this.normalizeTab(tab);
    },
    loadFootprint(options = {}) {
      const footprint = getProductFootprint(this.authState);
      this.favorites = footprint.favorites || [];
      this.recent = footprint.recent || [];
      this.frequent = rankFrequentProducts(footprint, this.salesProducts);
      if (options.refreshSales !== false) this.loadSalesFrequentProducts(footprint);
    },
    async loadSalesFrequentProducts(currentFootprint = null) {
      if (!this.authState.token) {
        this.salesProducts = [];
        this.frequent = rankFrequentProducts(currentFootprint || getProductFootprint(this.authState), this.salesProducts);
        return;
      }
      if (this.salesLoading) return;

      this.salesLoading = true;
      try {
        const data = await getMySalesOrders({ page: 1, page_size: 80 });
        const orders = Array.isArray(data.list) ? data.list : Array.isArray(data.sales) ? data.sales : [];
        this.salesProducts = mergeSalesOrderFrequentProducts(flattenSalesOrderProducts(orders));
        const footprint = currentFootprint || getProductFootprint(this.authState);
        this.frequent = rankFrequentProducts(footprint, this.salesProducts);
      } catch (error) {
        this.salesProducts = [];
        this.frequent = rankFrequentProducts(currentFootprint || getProductFootprint(this.authState), this.salesProducts);
      } finally {
        this.salesLoading = false;
      }
    },
    clearRecent() {
      if (typeof uni === 'undefined' || typeof uni.showModal !== 'function') {
        clearProductRecentViews(this.authState);
        this.loadFootprint();
        return;
      }

      uni.showModal({
        title: '清空最近浏览',
        content: '清空后不会影响已收藏和常购商品',
        confirmText: '清空',
        success: (result = {}) => {
          if (!result.confirm) return;
          clearProductRecentViews(this.authState);
          this.loadFootprint({ refreshSales: false });
        },
      });
    },
    tabCount(tab) {
      if (tab === 'recent') return this.recent.length;
      if (tab === 'frequent') return this.frequent.length;
      return this.favorites.length;
    },
    productKey(item = {}) {
      return productId(item) || cleanText(item.title || item.productName || item.name);
    },
    goBack() {
      if (typeof getCurrentPages === 'function' && typeof uni !== 'undefined') {
        const pages = getCurrentPages();
        if (pages && pages.length > 1 && typeof uni.navigateBack === 'function') {
          uni.navigateBack({ delta: 1 });
          return;
        }
      }
      navigateToPage(PAGE_ROUTES.my);
    },
  },
};
</script>

<style lang="scss" scoped>
.product-footprint-page {
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

.product-footprint-page__nav {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  flex: none;
  background: #ffffff;
  border-bottom: 1rpx solid #e4e4e7;
}

.product-footprint-page__back {
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

.product-footprint-page__back::after,
.product-footprint-page__tab::after,
.product-footprint-page__clear::after {
  border: 0;
}

.product-footprint-page__back-icon {
  width: 22rpx;
  height: 22rpx;
  margin-left: 6rpx;
  border-left: 4rpx solid currentColor;
  border-bottom: 4rpx solid currentColor;
  transform: rotate(45deg);
}

.product-footprint-page__title {
  position: absolute;
  left: 96rpx;
  right: 96rpx;
  color: #18181b;
  font-size: 32rpx;
  font-weight: 800;
  text-align: center;
}

.product-footprint-page__tabs {
  box-sizing: border-box;
  flex: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  padding: 18rpx 22rpx;
  background: #ffffff;
}

.product-footprint-page__tab {
  box-sizing: border-box;
  height: 64rpx;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin: 0;
  padding: 0 8rpx;
  border: 0;
  border-radius: 10px;
  background: #f4f4f5;
  color: #52525b;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 700;
}

.product-footprint-page__tab.is-active {
  background: #18181b;
  color: #ffffff;
}

.product-footprint-page__tab-count {
  min-width: 30rpx;
  color: inherit;
  font-size: 21rpx;
  line-height: 30rpx;
  font-weight: 700;
  opacity: 0.72;
}

.product-footprint-page__body {
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  height: 100%;
  padding: 22rpx;
  overflow: hidden;
}

.product-footprint-page__toolbar {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 18rpx;
  padding: 0 2rpx;
}

.product-footprint-page__hint {
  min-width: 0;
  color: #71717a;
  font-size: 23rpx;
  line-height: 34rpx;
  font-weight: 500;
}

.product-footprint-page__clear {
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #9f2f27;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 700;
}

.product-footprint-page__grid {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  padding-bottom: 36rpx;
}

.product-footprint-page__empty {
  box-sizing: border-box;
  min-height: 520rpx;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 16rpx;
  padding: 68rpx 30rpx;
  border-radius: 10px;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 0 0 1rpx rgba(24, 24, 27, 0.08);
}

.product-footprint-page__empty-mark {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #f4f4f5;
  color: #71717a;
  font-size: 34rpx;
  line-height: 1;
  font-weight: 800;
}

.product-footprint-page__empty-title {
  color: #18181b;
  font-size: 30rpx;
  line-height: 42rpx;
  font-weight: 800;
}

.product-footprint-page__empty-text {
  max-width: 520rpx;
  color: #71717a;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 500;
}
</style>
