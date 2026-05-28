<template>
  <view class="category-page">
    <view class="category-custom-nav" :style="navShellStyle">
      <sj-search-bar
        class="category-nav-search"
        :style="navSearchStyle"
        :height="navLayout.height"
        placeholder="搜索编号、名称、规格"
        @search="openSearch"
      />
    </view>

    <view class="category-main">
      <view class="side-shell">
        <scroll-view
          class="side"
          scroll-y
          :scroll-top="sideScrollTop"
          :scroll-with-animation="true"
          :show-scrollbar="false"
        >
          <view
            v-for="(item, index) in categories"
            :key="item.id"
            :class="['side-item', activeId === item.id ? 'active' : '', item.level > 0 ? 'child' : '']"
            @tap="selectCategory(item, index)"
          >
            <view class="side-thumb">
              <image v-if="categoryThumb(item)" class="side-thumb-image" :src="categoryThumb(item)" mode="aspectFit" />
              <text v-else class="side-thumb-text">{{ item.initial }}</text>
            </view>
            <view class="side-name">{{ item.rawName || item.name }}</view>
          </view>
        </scroll-view>
      </view>

      <scroll-view
        class="content"
        scroll-y
        lower-threshold="90"
        :scroll-top="contentScrollTop"
        :show-scrollbar="false"
        @scrolltolower="loadMore"
      >
        <view class="sort-nav">
          <view
            v-for="item in sortOptions"
            :key="item.value"
            :class="['sort-link', activeSort === item.value ? 'active' : '']"
            @tap="selectSort(item.value)"
          >
            <text class="sort-link__text">{{ item.label }}</text>
            <view v-if="activeSort === item.value" class="sort-link__indicator"></view>
          </view>
        </view>

        <view v-if="errorText" class="state-card error-state">
          <view>{{ errorText }}</view>
          <button class="retry-btn" @tap="reloadProducts">重试</button>
        </view>

        <view v-else class="product-grid">
          <sj-category-product-card
            v-for="item in products"
            :key="item.id"
            :product="item"
          />
        </view>

        <sj-loading-state v-if="loading" class="category-loading-state" size="compact" />
        <view v-if="!loading && !errorText && products.length === 0" class="state-card muted">
          暂无产品
        </view>
        <view v-if="!loading && !errorText && products.length > 0 && page >= pageTotal" class="state-text muted">
          已经到底了
        </view>
      </scroll-view>
    </view>

    <view class="category-preload">
      <image
        v-for="src in categoryPreloadImages"
        :key="src"
        class="category-preload-image"
        :src="src"
        mode="aspectFit"
      />
    </view>
  </view>
</template>

<script>
import SjCategoryProductCard from '../../components/SjCategoryProductCard.vue';
import SjLoadingState from '../../components/SjLoadingState.vue';
import SjSearchBar from '../../components/SjSearchBar.vue';
import { getCategories } from '../../api/categories';
import { getProducts } from '../../api/products';
import { buildCategoryIconUrl, isJpegImageUrl } from '../../utils/image';
import { PAGE_ROUTES, buildProductListUrl, navigateToPage, syncCustomTabBar } from '../../utils/route';
import { buildShareOptions, buildTimelineShareOptions, enablePageShare } from '../../utils/share.js';

export default {
  components: { SjCategoryProductCard, SjLoadingState, SjSearchBar },
  data() {
    return {
      loading: false,
      categories: [],
      activeId: '',
      activeName: '商品分类',
      page: 1,
      pageTotal: 1,
      total: 0,
      products: [],
      errorText: '',
      requestId: 0,
      sideScrollTop: 0,
      contentScrollTop: 0,
      preloadedCategoryImages: {},
      navLayout: {
        left: 16,
        right: 112,
        top: 28,
        height: 32,
        navHeight: 105,
      },
      activeSort: 'sales',
      sortOptions: [
        { label: '综合', value: 'sales' },
        { label: '最新', value: 'latest' },
        { label: '价格', value: 'price_asc' },
      ],
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
    activeCategory() {
      return this.categories.find((item) => item.id === this.activeId) || null;
    },
    categoryPreloadImages() {
      const seen = {};
      const sources = [];
      this.categories.forEach((item) => {
        const activeImage = item.activeImage && !isJpegImageUrl(item.activeImage) ? item.activeImage : '';
        [item.image, activeImage].forEach((src) => {
          if (!src || seen[src]) return;
          seen[src] = true;
          sources.push(buildCategoryIconUrl(src));
        });
      });
      return sources;
    },
  },
  onLoad() {
    this.setupNavLayout();
    this.loadCategories();
  },
  onShow() {
    enablePageShare();
    syncCustomTabBar(PAGE_ROUTES.category);
    this.setupNavLayout();
  },
  onPullDownRefresh() {
    this.reloadProducts().finally(() => uni.stopPullDownRefresh());
  },
  onShareAppMessage() {
    return buildShareOptions({
      title: '肆计包装商品分类',
      path: PAGE_ROUTES.category,
    });
  },
  onShareTimeline() {
    return buildTimelineShareOptions({
      title: '肆计包装商品分类',
      path: PAGE_ROUTES.category,
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

      const left = 16;
      const gap = 10;
      const right = Math.max(12, Math.round(windowWidth - Number(menu.left || fallbackLeft) + gap));
      const top = Math.max(0, Math.round(Number(menu.top || fallbackTop)));
      const height = Math.max(28, Math.round(Number(menu.height || fallbackHeight)));
      const navHeight = Math.max(105, Math.round(Number(menu.bottom || top + height) + 10));
      this.navLayout = { left, right, top, height, navHeight };
    },
    openSearch(keyword) {
      navigateToPage(buildProductListUrl({ keyword }));
    },
    categoryThumb(item) {
      if (!item) return '';
      const canUseActiveImage = item.activeImage && !isJpegImageUrl(item.activeImage);
      const src = this.activeId === item.id && canUseActiveImage ? item.activeImage : item.image || item.activeImage || '';
      return buildCategoryIconUrl(src);
    },
    preloadCategoryImages() {
      if (typeof uni === 'undefined' || typeof uni.getImageInfo !== 'function') return;
      this.categoryPreloadImages.forEach((src) => {
        if (!src || this.preloadedCategoryImages[src]) return;
        this.preloadedCategoryImages[src] = 1;
        uni.getImageInfo({
          src,
          success: () => {
            this.preloadedCategoryImages[src] = 2;
          },
          fail: () => {
            this.preloadedCategoryImages[src] = -1;
          },
        });
      });
    },
    rpxToPx(value) {
      if (typeof uni !== 'undefined' && typeof uni.upx2px === 'function') return uni.upx2px(value);
      return value;
    },
    getSideItemHeightRpx(category) {
      return category && category.level > 0 ? 124 : 132;
    },
    getSideViewportHeight() {
      const minViewportHeight = this.rpxToPx(260);
      const fallbackHeight = this.rpxToPx(900);
      const navHeight = Number(this.navLayout.navHeight || 0);
      if (typeof uni === 'undefined' || typeof uni.getSystemInfoSync !== 'function') {
        return Math.max(minViewportHeight, fallbackHeight - navHeight - this.getSideBottomClearance());
      }
      try {
        const info = uni.getSystemInfoSync();
        const windowHeight = Number(info.windowHeight || fallbackHeight);
        return Math.max(minViewportHeight, windowHeight - navHeight - this.getSideBottomClearance(info));
      } catch (error) {
        return Math.max(minViewportHeight, fallbackHeight - navHeight - this.getSideBottomClearance());
      }
    },
    getSideBottomClearance(systemInfo = null) {
      const bottomNavHeight = this.rpxToPx(190);
      const info = systemInfo || {};
      const safeAreaInsets = info.safeAreaInsets || {};
      let bottomInset = Number(safeAreaInsets.bottom || 0);
      if (!bottomInset && info.safeArea && info.windowHeight) {
        bottomInset = Math.max(0, Number(info.windowHeight) - Number(info.safeArea.bottom || info.windowHeight));
      }
      return bottomNavHeight + bottomInset;
    },
    centerSideCategory(index = 0) {
      const itemHeights = this.categories.map((item) => this.rpxToPx(this.getSideItemHeightRpx(item)));
      const itemTop = itemHeights.slice(0, index).reduce((sum, height) => sum + height, 0);
      const itemHeight = itemHeights[index] || this.rpxToPx(142);
      const viewportHeight = this.getSideViewportHeight();
      const contentHeight = itemHeights.reduce((sum, height) => sum + height, 0);
      const maxScrollTop = Math.max(0, contentHeight - viewportHeight);
      const centeredScrollTop = itemTop + itemHeight / 2 - viewportHeight / 2;
      this.sideScrollTop = Math.round(Math.min(Math.max(centeredScrollTop, 0), maxScrollTop));
    },
    async loadCategories() {
      this.loading = true;
      this.errorText = '';
      try {
        this.categories = await getCategories();
        this.preloadCategoryImages();
        if (this.categories.length > 0) {
          await this.selectCategory(this.categories[0], 0);
        } else {
          this.activeName = '暂无分类';
          this.products = [];
        }
      } catch (error) {
          this.errorText = error.msg || '分类加载失败，请重试';
      } finally {
        this.loading = false;
      }
    },
    selectCategory(category, index = 0) {
      if (!category || category.id === undefined || category.id === null || category.id === '') {
        this.activeId = '';
        this.activeName = '商品分类';
        this.products = [];
        this.total = 0;
        return Promise.resolve();
      }
      this.activeId = category.id;
      this.activeName = category.rawName || category.name || '商品分类';
      this.centerSideCategory(index);
      this.resetContentScroll();
      return this.reloadProducts();
    },
    resetContentScroll() {
      this.contentScrollTop = this.contentScrollTop === 0 ? 1 : 0;
      this.$nextTick(() => {
        this.contentScrollTop = 0;
      });
    },
    reloadProducts() {
      this.page = 1;
      this.pageTotal = 1;
      this.total = 0;
      return this.loadProducts(1, true);
    },
    selectSort(sort) {
      if (!sort || sort === this.activeSort) return;
      this.activeSort = sort;
      this.resetContentScroll();
      this.reloadProducts();
    },
    loadMore() {
      if (this.loading || this.errorText || this.page >= this.pageTotal) return;
      this.loadProducts(this.page + 1);
    },
    async loadProducts(page = 1, replace = false) {
      const currentRequest = ++this.requestId;
      this.loading = true;
      if (replace) this.errorText = '';
      try {
        if (!this.activeId) {
          this.products = [];
          this.total = 0;
          this.pageTotal = 1;
          return;
        }
        const result = await getProducts({
          category_id: this.activeId,
          page,
          page_size: 20,
          sort: this.activeSort,
        });
        if (currentRequest !== this.requestId) return;
        this.page = page;
        this.pageTotal = result.page_total || 1;
        this.total = result.total || 0;
        this.products = replace ? result.data || [] : this.products.concat(result.data || []);
      } catch (error) {
        if (currentRequest !== this.requestId) return;
        if (replace) this.products = [];
        this.errorText = error.msg || '商品加载失败';
      } finally {
        if (currentRequest === this.requestId) this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.category-page {
  box-sizing: border-box;
  position: relative;
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

.category-custom-nav {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  flex: none;
  background: #ffffff;
  border-bottom: 1rpx solid #e4e4e7;
}

.category-nav-search {
  box-sizing: border-box;
  position: absolute;
}

.category-main {
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.side-shell {
  box-sizing: border-box;
  width: 150rpx;
  height: 100%;
  flex: none;
  overflow: hidden;
  background: #ffffff;
}

.side {
  box-sizing: border-box;
  width: 100%;
  height: calc(100% - 190rpx - env(safe-area-inset-bottom));
  overflow: hidden;
  background: #ffffff;
}

.side-item {
  position: relative;
  box-sizing: border-box;
  min-height: 132rpx;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 6rpx;
  padding: 14rpx 8rpx;
  color: #71717a;
}

.side-item.child {
  min-height: 124rpx;
}

.side-item.active {
  color: #18181b;
  background: #f4f4f5;
}

.side-thumb {
  box-sizing: border-box;
  width: 66rpx;
  height: 66rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.side-thumb-image {
  width: 64rpx;
  height: 64rpx;
  display: block;
}

.side-thumb-text {
  color: #3f3f46;
  font-size: 26rpx;
  line-height: 34rpx;
  font-weight: 700;
}

.side-name {
  width: 100%;
  overflow: hidden;
  text-align: center;
  color: inherit;
  font-size: 21rpx;
  line-height: 29rpx;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.category-preload {
  position: fixed;
  left: -9999rpx;
  top: -9999rpx;
  width: 1rpx;
  height: 1rpx;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.category-preload-image {
  width: 1rpx;
  height: 1rpx;
}

.content {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 18rpx;
  overflow: hidden;
}

.sort-nav {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 34rpx;
  margin-bottom: 16rpx;
  padding: 4rpx 2rpx 12rpx;
}

.sort-link {
  position: relative;
  box-sizing: border-box;
  min-width: 56rpx;
  height: 44rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #71717a;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 600;
}

.sort-link.active {
  color: #18181b;
  font-weight: 800;
}

.sort-link__text {
  display: block;
}

.sort-link__indicator {
  position: absolute;
  left: 50%;
  bottom: -6rpx;
  width: 28rpx;
  height: 4rpx;
  border-radius: 4rpx;
  background-color: #18181b;
  transform: translateX(-50%);
}

.product-grid {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  padding: 1rpx 2rpx 2rpx;
}

.category-loading-state {
  margin-top: 18rpx;
}

.state-card {
  margin-top: 18rpx;
  padding: 44rpx 24rpx;
  border: 1rpx dashed #d4d4d8;
  border-radius: 14rpx;
  background: #ffffff;
  font-size: 26rpx;
  line-height: 38rpx;
  text-align: center;
}

.state-text {
  padding: 24rpx 0 40rpx;
  text-align: center;
  font-size: 23rpx;
  line-height: 32rpx;
}

.muted {
  color: #71717a;
}

.error-state {
  color: #9f2f27;
}

.retry-btn {
  width: 144rpx;
  height: 64rpx;
  margin-top: 20rpx;
  padding: 0;
  line-height: 64rpx;
  color: #fff;
  background: #18181b;
  border-radius: 10px;
  font-size: 24rpx;
}

.retry-btn::after {
  border: 0;
}
</style>
