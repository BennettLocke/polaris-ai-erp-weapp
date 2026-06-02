<template>
  <view class="home-page">
    <view class="home-custom-nav" :style="navShellStyle">
      <view class="home-search-pill" :style="navSearchStyle" @tap="openSearch">
        <view class="home-search-icon"></view>
        <text class="home-search-placeholder">半斤礼盒 大红袍泡袋</text>
        <button class="home-search-button" hover-class="none" @tap.stop="openSearch">搜索</button>
      </view>
    </view>

    <view class="home-hero" :style="heroStyle">
      <swiper
        class="home-hero__swiper"
        :autoplay="heroImages.length > 1"
        :circular="heroImages.length > 1"
        :indicator-dots="heroImages.length > 1"
        indicator-color="rgba(255,255,255,0.45)"
        indicator-active-color="#ffffff"
      >
        <swiper-item v-for="(image, index) in heroImages" :key="`${image}-${index}`">
          <image class="home-hero__image" :src="image" mode="aspectFill"></image>
        </swiper-item>
      </swiper>
    </view>

    <view class="home-category-board">
      <view class="home-primary-grid">
        <view
          v-for="(item, index) in primaryCategories"
          :key="item.id || item.name || index"
          class="home-primary-category"
          @tap="openCategory(item)"
        >
          <image
            v-if="categoryIcon(item)"
            class="home-category-icon-image home-category-icon-image--large"
            :src="categoryIcon(item)"
            mode="aspectFit"
          ></image>
          <view v-else class="home-line-icon home-line-icon--large" :class="`home-line-icon--${(index % 4) + 1}`"></view>
          <view class="home-category-name">{{ categoryTitle(item) }}</view>
          <view class="home-category-meta">
            <text class="home-category-code">{{ primaryCategoryCode(item, index) }}</text>
            <text>{{ categoryMeta(item, index) }}</text>
          </view>
        </view>
      </view>

      <view class="home-secondary-grid">
        <view
          v-for="(item, index) in secondaryCategories"
          :key="item.id || item.name || index"
          class="home-secondary-category"
          @tap="openCategory(item)"
        >
          <image
            v-if="categoryIcon(item)"
            class="home-category-icon-image home-category-icon-image--small"
            :src="categoryIcon(item)"
            mode="aspectFit"
          ></image>
          <view v-else class="home-line-icon home-line-icon--small" :class="`home-line-icon--${((index + 1) % 4) + 1}`"></view>
          <view class="home-secondary-info">
            <view class="home-secondary-name">{{ categoryTitle(item) }}</view>
            <view class="home-secondary-meta">
              <text v-if="secondaryCategoryCode(item)" class="home-secondary-code">{{ secondaryCategoryCode(item) }}</text>
              <text>{{ secondaryCategoryMeta(item, index) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="home-pouch-board">
      <view class="home-pouch-grid">
        <view
          v-for="(item, index) in pouchCategories"
          :key="item.id || item.name || index"
          class="home-pouch-category"
          @tap="openCategory(item)"
        >
          <view class="home-pouch-icon-wrap">
            <image
              v-if="categoryIcon(item)"
              class="home-pouch-icon"
              :src="categoryIcon(item)"
              mode="aspectFit"
            ></image>
            <text v-else class="home-pouch-initial">{{ pouchInitial(item) }}</text>
          </view>
          <view class="home-pouch-name">{{ categoryTitle(item) }}</view>
        </view>
      </view>
    </view>

    <sj-loading-state v-if="loading" class="home-loading" size="large" />

    <view v-if="featuredProducts.length" class="home-feature-section">
      <view class="home-section-header">
        <view>
          <view class="home-section-eyebrow">主推系列</view>
          <view class="home-section-title">系列橱窗</view>
        </view>
        <text class="home-section-note">本周热销</text>
      </view>
      <view class="home-feature-card" @tap="openProduct(featuredMainProduct)">
        <image
          class="home-feature-image"
          :src="productCover(featuredMainProduct)"
          mode="aspectFill"
          lazy-load
        ></image>
        <view class="home-feature-shade"></view>
        <view class="home-feature-content">
          <text class="home-feature-label">FEATURED</text>
          <view class="home-feature-title">{{ productTitle(featuredMainProduct) }}</view>
          <view class="home-feature-meta">{{ productPack(featuredMainProduct) }}</view>
          <view class="home-feature-price">{{ productPrice(featuredMainProduct) }}</view>
        </view>
      </view>
      <scroll-view
        v-if="featuredSideProducts.length"
        class="home-feature-mini-scroll"
        scroll-x
        :show-scrollbar="false"
      >
        <view class="home-feature-mini-track">
          <view
            v-for="item in featuredSideProducts"
            :key="item.id || item.productCode || item.product_code"
            class="home-feature-mini"
            @tap="openProduct(item)"
          >
            <image class="home-feature-mini-image" :src="productCover(item)" mode="aspectFill" lazy-load></image>
            <view class="home-feature-mini-info">
              <view class="home-feature-mini-title">{{ productTitle(item) }}</view>
              <view class="home-feature-mini-price">{{ productPrice(item) }}</view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="newProducts.length" class="home-new-section">
      <view class="home-section-header">
        <view>
          <view class="home-section-eyebrow">新品上架</view>
          <view class="home-section-title">刚刚更新</view>
        </view>
        <text class="home-section-note">横向浏览</text>
      </view>
      <scroll-view class="home-new-scroll" scroll-x :show-scrollbar="false">
        <view class="home-new-track">
          <view
            v-for="item in newProducts"
            :key="item.id || item.productCode || item.product_code"
            class="home-new-card"
          >
            <sj-category-product-card
              :product="item"
              code-position="top"
              compact
            />
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="hotProducts.length" class="home-hot-section">
      <view class="home-section-header">
        <view>
          <view class="home-section-eyebrow">热销榜</view>
          <view class="home-section-title">近期热门</view>
        </view>
        <text class="home-section-note">精选产品</text>
      </view>
      <scroll-view class="home-hot-scroll" scroll-x :show-scrollbar="false">
        <view class="home-hot-track">
          <view
            v-for="(item, index) in hotProducts"
            :key="item.id || item.productCode || item.product_code || index"
            class="home-hot-card"
          >
            <view class="home-hot-rank" :class="{ 'is-top': index === 0 }">TOP {{ index + 1 }}</view>
            <sj-category-product-card
              :product="item"
              code-position="top"
              compact
            />
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="!loading || giftRecommendedProducts.length" class="home-product-section">
      <view class="home-section-header">
        <view>
          <view class="home-section-eyebrow">热销推荐</view>
          <view class="home-section-title">礼盒推荐</view>
        </view>
        <text class="home-section-note">礼盒热销</text>
      </view>
      <view v-if="giftRecommendedProducts.length" class="home-product-grid">
        <sj-category-product-card
          v-for="item in giftRecommendedProducts"
          :key="item.id"
          :product="item"
          code-position="top"
        />
      </view>
      <view v-else class="home-recommend-empty">暂无礼盒推荐</view>
    </view>

    <view v-if="!loading || pouchRecommendedProducts.length" class="home-product-section">
      <view class="home-section-header">
        <view>
          <view class="home-section-eyebrow">新品推荐</view>
          <view class="home-section-title">泡袋推荐</view>
        </view>
        <text class="home-section-note">最新上架</text>
      </view>
      <view v-if="pouchRecommendedProducts.length" class="home-product-grid">
        <sj-category-product-card
          v-for="item in pouchRecommendedProducts"
          :key="item.id"
          :product="item"
          code-position="top"
        />
      </view>
      <view v-else class="home-recommend-empty">暂无泡袋推荐</view>
    </view>

    <view v-if="!loading || pvcRecommendedProducts.length" class="home-product-section">
      <view class="home-section-header">
        <view>
          <view class="home-section-eyebrow">热销推荐</view>
          <view class="home-section-title">PVC推荐</view>
        </view>
        <text class="home-section-note">PVC热销</text>
      </view>
      <view v-if="pvcRecommendedProducts.length" class="home-product-grid">
        <sj-category-product-card
          v-for="item in pvcRecommendedProducts"
          :key="item.id"
          :product="item"
          code-position="top"
        />
      </view>
      <view v-else class="home-recommend-empty">暂无 PVC 推荐</view>
    </view>

    <view
      v-if="!loading && products.length === 0 && hotProducts.length === 0 && newProducts.length === 0 && featuredProducts.length === 0 && giftRecommendedProducts.length === 0 && pouchRecommendedProducts.length === 0 && pvcRecommendedProducts.length === 0"
      class="home-state muted"
    >暂无产品</view>
  </view>
</template>

<script>
import SjCategoryProductCard from '../../components/SjCategoryProductCard.vue';
import SjLoadingState from '../../components/SjLoadingState.vue';
import { getHomeData } from '../../api/home';
import { buildCategoryCoverUrl, buildCategoryIconUrl, buildHomeHeroUrl } from '../../utils/image';
import { buildProductDetailUrl, buildProductListUrl } from '../../utils/route';
import { PAGE_ROUTES, navigateToPage, syncCustomTabBar } from '../../utils/route';
import { buildShareOptions, buildTimelineShareOptions, DEFAULT_SHARE_IMAGE, DEFAULT_SHARE_TITLE, enablePageShare } from '../../utils/share.js';

const FALLBACK_HERO = 'https://img.513sjbz.com/static/upload/images/app_nav/2026/04/25/1777104334795209.jpg';
const NAV_FADE_DISTANCE = 180;
const PRIMARY_CODES = ['30', '18', '12', '06'];
const SECONDARY_ENTRIES = [
  {
    title: '6小盒礼盒',
    code: '12',
    meta: '泡包装礼盒',
    categoryId: 16,
    icon: 'https://img.513sjbz.com/static/upload/images/goods_category/2026/03/31/1774944780103886.png',
    names: ['6小盒礼盒', '六小盒礼盒', '6小盒', '六小盒'],
  },
  {
    title: '3小盒礼盒',
    code: '06',
    meta: '泡包装礼盒',
    categoryId: 17,
    icon: 'https://img.513sjbz.com/static/upload/images/goods_category/2026/03/31/1774944780932823.png',
    names: ['3小盒礼盒', '三小盒礼盒', '3小盒', '三小盒'],
  },
  {
    title: '2小盒礼盒',
    code: '02',
    meta: '泡包装礼盒',
    categoryId: 22,
    icon: 'https://img.513sjbz.com/static/upload/images/goods_category/2026/03/31/1774944780647287.png',
    names: ['2小盒礼盒', '二小盒礼盒', '2小盒', '二小盒', '2泡小盒', '二泡小盒'],
  },
  {
    title: '五格礼盒',
    code: '20',
    meta: '泡包装礼盒',
    categoryId: 13,
    icon: 'https://img.513sjbz.com/static/upload/images/goods_category/2026/03/31/1774944781448937.png',
    names: ['五格礼盒', '5格礼盒', '五格', '5格'],
  },
  {
    title: 'PVC礼盒',
    code: '',
    meta: '半斤/三两',
    categoryId: 10,
    icon: 'https://img.513sjbz.com/static/upload/images/goods_category/2026/03/31/1774944781371619.png',
    names: ['PVC礼盒', 'pvc礼盒'],
  },
  {
    title: '快递纸箱',
    code: '',
    meta: '30斤/20斤/15斤',
    categoryId: 18,
    icon: 'https://img.513sjbz.com/static/upload/images/goods_category/2026/03/31/1774944781981285.png',
    names: ['快递纸箱', '纸箱'],
  },
];
const POUCH_ENTRIES = [
  {
    title: '大红袍泡袋',
    categoryId: 5,
    icon: 'https://img.513sjbz.com/static/upload/images/goods_category/2026/04/02/1775111642101984.png',
    names: ['大红袍泡袋', '大红袍'],
  },
  {
    title: '肉桂泡袋',
    categoryId: 7,
    icon: 'https://img.513sjbz.com/static/upload/images/goods_category/2026/04/02/1775111641688659.png',
    names: ['肉桂泡袋', '肉桂'],
  },
  {
    title: '水仙泡袋',
    categoryId: 6,
    icon: 'https://img.513sjbz.com/static/upload/images/goods_category/2026/04/02/1775111641565406.png',
    names: ['水仙泡袋', '水仙'],
  },
  {
    title: '品种茶泡袋',
    categoryId: 19,
    icon: 'https://img.513sjbz.com/static/upload/images/goods_category/2026/04/02/1775111639597204.png',
    names: ['品种茶袋', '品种茶泡袋', '品种茶'],
  },
  {
    title: '公版泡袋',
    categoryId: 9,
    icon: 'https://img.513sjbz.com/static/upload/images/goods_category/2026/04/02/1775111640962454.png',
    names: ['公版泡袋', '公版'],
  },
  {
    title: '红茶泡袋',
    categoryId: 12,
    icon: 'https://img.513sjbz.com/static/upload/images/goods_category/2026/04/02/1775111640138273.png',
    names: ['红茶泡袋', '红茶'],
  },
  {
    title: '空白泡袋',
    categoryId: 20,
    icon: 'https://img.513sjbz.com/static/upload/images/goods_category/2026/04/02/1775111640892603.png',
    names: ['空白泡袋', '空白'],
  },
  {
    title: '宽版泡袋',
    categoryId: 21,
    icon: 'https://img.513sjbz.com/static/upload/images/goods_category/2026/04/02/1775111640396699.png',
    names: ['宽版泡袋', '宽版'],
  },
];

export default {
  components: { SjCategoryProductCard, SjLoadingState },
  data() {
    return {
      loading: true,
      navs: [],
      banners: [],
      categories: [],
      featuredProducts: [],
      newProducts: [],
      hotProducts: [],
      giftRecommendedProducts: [],
      pouchRecommendedProducts: [],
      pvcRecommendedProducts: [],
      products: [],
      navLayout: {
        left: 20,
        right: 132,
        top: 34,
        height: 36,
        navHeight: 106,
      },
      navOpacity: 0,
    };
  },
  computed: {
    navShellStyle() {
      const opacity = Math.max(0, Math.min(1, this.navOpacity));
      return {
        height: `${this.navLayout.navHeight}px`,
        backgroundColor: `rgba(255, 255, 255, ${opacity})`,
        borderBottomColor: `rgba(228, 228, 231, ${opacity})`,
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
    primaryCategories() {
      return this.categories.slice(0, 4);
    },
    secondaryCategories() {
      return SECONDARY_ENTRIES.map((entry, index) => {
        const matched = this.findCategoryByEntry(entry);
        return {
          ...(matched || {}),
          id: matched && matched.id ? matched.id : entry.categoryId || `home-secondary-${index}`,
          category_id: matched && matched.id ? matched.id : entry.categoryId || '',
          displayTitle: entry.title,
          displayMeta: entry.meta,
          displayCode: entry.code,
          displayIcon: (matched && (matched.icon_url || matched.image || matched.icon || matched.image_url || matched.activeImage)) || entry.icon || '',
          keyword: entry.title,
        };
      });
    },
    pouchCategories() {
      return POUCH_ENTRIES.map((entry, index) => {
        const matched = this.findCategoryByEntry(entry);
        return {
          ...(matched || {}),
          id: matched && matched.id ? matched.id : entry.categoryId || `home-pouch-${index}`,
          category_id: matched && matched.id ? matched.id : entry.categoryId || '',
          displayTitle: entry.title,
          displayIcon: (matched && (matched.icon_url || matched.image || matched.icon || matched.image_url || matched.activeImage)) || entry.icon || '',
          keyword: entry.title,
        };
      });
    },
    featuredMainProduct() {
      return this.featuredProducts[0] || {};
    },
    featuredSideProducts() {
      return this.featuredProducts.slice(1, 4);
    },
    heroImages() {
      const bannerImages = this.banners
        .map((item) => typeof item === 'string' ? item : item && (item.asset_url || item.image_url || item.image || item.cover || item.src))
        .map((url) => buildHomeHeroUrl(url))
        .filter(Boolean);
      return bannerImages.length ? bannerImages : [buildHomeHeroUrl(FALLBACK_HERO)];
    },
    heroImage() {
      return this.heroImages[0] || buildHomeHeroUrl(FALLBACK_HERO);
    },
    heroStyle() {
      return {
        backgroundImage: `linear-gradient(180deg, rgba(24,24,27,0.1), rgba(24,24,27,0.28)), url(${this.heroImage})`,
      };
    },
  },
  onLoad() {
    this.setupNavLayout();
    this.loadData();
  },
  onShow() {
    this.setupNavLayout();
    enablePageShare();
    syncCustomTabBar(PAGE_ROUTES.home);
  },
  onPullDownRefresh() {
    this.loadData().finally(() => uni.stopPullDownRefresh());
  },
  onPageScroll(event = {}) {
    this.updateNavOpacity(Number(event.scrollTop || 0));
  },
  onShareAppMessage() {
    return buildShareOptions({
      title: DEFAULT_SHARE_TITLE,
      path: PAGE_ROUTES.home,
      imageUrl: DEFAULT_SHARE_IMAGE,
    });
  },
  onShareTimeline() {
    return buildTimelineShareOptions({
      title: DEFAULT_SHARE_TITLE,
      path: PAGE_ROUTES.home,
      imageUrl: DEFAULT_SHARE_IMAGE,
    });
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const home = await getHomeData();
        this.navs = home.navs || [];
        this.banners = home.banners || [];
        this.categories = home.categories || [];
        this.featuredProducts = home.featuredProducts || [];
        this.newProducts = home.newProducts || [];
        this.hotProducts = home.hotProducts || [];
        this.giftRecommendedProducts = home.giftRecommendedProducts || [];
        this.pouchRecommendedProducts = home.pouchRecommendedProducts || [];
        this.pvcRecommendedProducts = home.pvcRecommendedProducts || [];
        this.products = home.products || [];
      } catch (error) {
        uni.showToast({ title: error.msg || '加载失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
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

      const fallbackHeight = 36;
      const fallbackTop = statusBarHeight + 8;
      const fallbackRight = windowWidth - 8;
      const fallbackLeft = Math.max(0, fallbackRight - 96);
      const menu = capsule && capsule.width && capsule.height
        ? capsule
        : {
            top: fallbackTop,
            bottom: fallbackTop + fallbackHeight,
            left: fallbackLeft,
            right: fallbackRight,
            height: fallbackHeight,
          };

      const left = 20;
      const gap = 14;
      const right = Math.max(118, Math.round(windowWidth - Number(menu.left || fallbackLeft) + gap));
      const top = Math.max(0, Math.round(Number(menu.top || fallbackTop)));
      const height = Math.max(32, Math.round(Number(menu.height || fallbackHeight)));
      const navHeight = Math.max(106, Math.round(Number(menu.bottom || top + height) + 18));
      this.navLayout = { left, right, top, height, navHeight };
    },
    updateNavOpacity(scrollTop = 0) {
      const nextOpacity = Math.max(0, Math.min(1, scrollTop / NAV_FADE_DISTANCE));
      const roundedOpacity = Math.round(nextOpacity * 100) / 100;
      if (Math.abs(roundedOpacity - this.navOpacity) < 0.02) return;
      this.navOpacity = roundedOpacity;
    },
    productCover(product = {}) {
      const rawCover = product.cover || product.images || product.main_images || product.photo || '';
      return buildCategoryCoverUrl(rawCover || '/static/images/product-placeholder.png');
    },
    productTitle(product = {}) {
      return product.productName || product.title || product.name || product.product_code || product.productCode || '肆计包装产品';
    },
    productPack(product = {}) {
      return product.pieceText || product.piece_text || product.description || product.simple_desc || '茶礼盒包装';
    },
    productPrice(product = {}) {
      return product.priceText || `¥${product.min_price || product.price || '0'}`;
    },
    openProduct(product = {}) {
      const id = product.id || product.goods_id || product.product_id;
      if (!id) return;
      navigateToPage(buildProductDetailUrl(id));
    },
    openSearch() {
      navigateToPage(PAGE_ROUTES.productList);
    },
    openCategory(item) {
      if (item && item.url) {
        navigateToPage(item.url);
        return;
      }
      const categoryId = item && (item.category_id || item.id);
      if (item && item.keyword && String(categoryId || '').startsWith('home-secondary-')) {
        navigateToPage(buildProductListUrl({ keyword: item.keyword }));
        return;
      }
      if (!item || categoryId === undefined || categoryId === null || categoryId === '') {
        navigateToPage(PAGE_ROUTES.category);
        return;
      }
      navigateToPage(buildProductListUrl({ category_id: categoryId }));
    },
    openUrl(url) {
      navigateToPage(url);
    },
    normalizeCategoryName(value) {
      return String(value || '').trim().toLowerCase();
    },
    findCategoryByEntry(entry) {
      const names = (entry.names || [entry.title]).map(this.normalizeCategoryName).filter(Boolean);
      const categories = this.categories || [];
      const exact = categories.find((item) => {
        const title = this.normalizeCategoryName(item.rawName || item.name || item.title || item.category_name);
        return names.includes(title);
      });
      if (exact) return exact;
      return categories.find((item) => {
        const title = this.normalizeCategoryName(item.rawName || item.name || item.title || item.category_name);
        return names.some((name) => title.includes(name) || name.includes(title));
      });
    },
    categoryTitle(item) {
      return item && (item.displayTitle || item.rawName || item.name || item.title) || '产品分类';
    },
    categoryIcon(item) {
      const rawIcon = item && (item.displayIcon || item.icon_url || item.image || item.icon || item.image_url || item.activeImage) || '';
      return buildCategoryIconUrl(rawIcon);
    },
    primaryCategoryCode(item, index) {
      return item && (item.badge_text || item.code) || PRIMARY_CODES[index] || `${index + 1}`.padStart(2, '0');
    },
    categoryMeta(item, index) {
      return item && (item.subtitle || item.desc || item.description) || '泡包装礼盒';
    },
    secondaryCategoryMeta(item, index) {
      if (item && item.displayMeta) return item.displayMeta;
      const count = item && (item.product_count || item.productCount || item.count);
      if (count) return `${String(count).padStart(2, '0')} 款产品`;
      return item && (item.subtitle || item.desc || item.description) || '包装产品';
    },
    secondaryCategoryCode(item) {
      return item && item.displayCode || '';
    },
    pouchInitial(item) {
      const title = this.categoryTitle(item);
      return title ? title.slice(0, 1) : '泡';
    },
  },
};
</script>

<style lang="scss" scoped>
.home-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding-bottom: calc(190rpx + env(safe-area-inset-bottom));
  overflow-x: hidden;
  background: #f4f4f5;
  color: #18181b;
  font-family: "PingFang SC", "PingFang TC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

.home-custom-nav {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  z-index: 60;
  width: 100%;
  border-bottom: 1rpx solid transparent;
  pointer-events: none;
  transition: background-color 160ms ease, border-color 160ms ease;
}

.home-search-pill {
  box-sizing: border-box;
  position: absolute;
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-width: 0;
  padding: 0 4rpx 0 22rpx;
  border: 1rpx solid rgba(24, 24, 27, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  overflow: hidden;
  pointer-events: auto;
  box-shadow: none;
}

.home-search-icon {
  position: relative;
  width: 24rpx;
  height: 24rpx;
  flex: 0 0 auto;
  border: 3rpx solid #a1a1aa;
  border-radius: 999px;
}

.home-search-icon::after {
  content: "";
  position: absolute;
  right: -8rpx;
  bottom: -6rpx;
  width: 11rpx;
  height: 3rpx;
  border-radius: 999px;
  background: #a1a1aa;
  transform: rotate(45deg);
  transform-origin: center;
}

.home-search-placeholder {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  color: #a1a1aa;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-search-button {
  width: 88rpx;
  height: calc(100% - 6rpx);
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 0;
  border-radius: 999px;
  background: #18181b;
  color: #ffffff;
  font-size: 24rpx;
  line-height: 32rpx;
  font-weight: 700;
}

.home-search-button::after {
  border: 0;
}

.home-hero {
  position: relative;
  height: 640rpx;
  overflow: hidden;
  background-color: #7b6859;
  background-position: center;
  background-size: cover;
}

.home-hero__swiper,
.home-hero__image {
  width: 100%;
  height: 100%;
}

.home-category-board {
  position: relative;
  z-index: 2;
  margin: -100rpx 48rpx 0;
  overflow: hidden;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 18rpx 42rpx rgba(24, 24, 27, 0.08);
}

.home-primary-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.home-primary-grid::before,
.home-primary-grid::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
}

.home-primary-grid::before {
  left: 50%;
  top: 28rpx;
  bottom: 28rpx;
  width: 1rpx;
  background: #d8d4cd;
  transform: translateX(-50%);
}

.home-primary-grid::after {
  left: 48rpx;
  right: 48rpx;
  top: 0;
  bottom: 0;
  background:
    linear-gradient(#d8d4cd, #d8d4cd) center 50% / 100% 1rpx no-repeat,
    linear-gradient(#d8d4cd, #d8d4cd) center 100% / 100% 1rpx no-repeat;
}

.home-primary-category {
  box-sizing: border-box;
  min-height: 218rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx 18rpx 18rpx;
}

.home-category-name {
  margin-top: -20rpx;
  color: #18181b;
  font-size: 39rpx;
  line-height: 48rpx;
  font-weight: 800;
}

.home-category-meta {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  margin-top: 4rpx;
  color: #c59a5a;
  font-size: 24rpx;
  line-height: 32rpx;
}

.home-category-code {
  height: 30rpx;
  display: inline-flex;
  align-items: center;
  padding: 0 6rpx;
  border: 1rpx solid #c59a5a;
  border-radius: 4rpx;
  font-size: 22rpx;
  line-height: 28rpx;
}

.home-category-icon-image {
  display: block;
  flex: 0 0 auto;
}

.home-category-icon-image--large {
  width: 200rpx;
  height: 156rpx;
}

.home-category-icon-image--small {
  width: 150rpx;
  height: 96rpx;
}

.home-secondary-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 10rpx 44rpx 20rpx;
  column-gap: 32rpx;
}

.home-secondary-grid::after {
  content: "";
  position: absolute;
  left: 44rpx;
  right: 44rpx;
  top: 210rpx;
  height: 1rpx;
  background: #d8d4cd;
  pointer-events: none;
}

.home-secondary-category {
  min-width: 0;
  display: grid;
  grid-template-columns: 112rpx minmax(0, 1fr);
  align-items: center;
  gap: 18rpx;
  padding: 6rpx 0;
}

.home-secondary-category:nth-child(3),
.home-secondary-category:nth-child(4) {
  margin-top: -10rpx;
}

.home-secondary-info {
  min-width: 0;
}

.home-secondary-name {
  overflow: hidden;
  color: #18181b;
  font-size: 28rpx;
  line-height: 36rpx;
  font-weight: 800;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-secondary-meta {
  margin-top: 4rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 4rpx;
  color: #71717a;
  font-size: 20rpx;
  line-height: 28rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-secondary-code {
  height: 24rpx;
  display: inline-flex;
  align-items: center;
  flex: none;
  padding: 0 4rpx;
  border: 1rpx solid #a1a1aa;
  border-radius: 4rpx;
  color: #71717a;
  font-size: 18rpx;
  line-height: 22rpx;
}

.home-pouch-board {
  position: relative;
  z-index: 2;
  margin: 20rpx 48rpx 0;
  padding: 20rpx 22rpx 22rpx;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 14rpx 34rpx rgba(24, 24, 27, 0.07);
}

.home-pouch-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  row-gap: 18rpx;
  column-gap: 10rpx;
}

.home-pouch-category {
  min-width: 0;
  display: grid;
  justify-items: center;
  gap: 8rpx;
  padding: 8rpx 0 6rpx;
}

.home-pouch-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  display: grid;
  place-items: center;
  color: #71717a;
}

.home-pouch-icon {
  width: 68rpx;
  height: 68rpx;
  display: block;
}

.home-pouch-initial {
  width: 60rpx;
  height: 60rpx;
  display: grid;
  place-items: center;
  border: 2rpx solid #d4d4d8;
  border-radius: 999px;
  color: #71717a;
  font-size: 24rpx;
  line-height: 1;
  font-weight: 800;
}

.home-pouch-name {
  max-width: 100%;
  overflow: hidden;
  color: #3f3f46;
  font-size: 23rpx;
  line-height: 32rpx;
  font-weight: 650;
  text-align: center;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-line-icon {
  box-sizing: border-box;
  position: relative;
  border: 4rpx solid #2d2520;
  border-radius: 8rpx;
}

.home-line-icon--large {
  width: 178rpx;
  height: 106rpx;
}

.home-line-icon--small {
  width: 108rpx;
  height: 68rpx;
  border-width: 3rpx;
  border-radius: 7rpx;
}

.home-line-icon::before,
.home-line-icon::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3rpx;
  background: #2d2520;
}

.home-line-icon--1::before {
  left: 46%;
}

.home-line-icon--1::after {
  left: 58%;
}

.home-line-icon--2::before {
  left: 34%;
}

.home-line-icon--2::after {
  left: 66%;
}

.home-line-icon--3::before {
  left: 50%;
}

.home-line-icon--3::after {
  display: none;
}

.home-line-icon--4::before {
  left: 30%;
}

.home-line-icon--4::after {
  left: 50%;
}

.home-feature-section,
.home-new-section,
.home-hot-section,
.home-product-section {
  position: relative;
  z-index: 2;
  margin: 24rpx 48rpx 0;
  padding: 30rpx;
  border-radius: 26px;
  background: #ffffff;
  box-shadow: 0 14rpx 34rpx rgba(24, 24, 27, 0.07);
}

.home-section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 18rpx;
}

.home-section-eyebrow {
  margin-bottom: 4rpx;
  color: #71717a;
  font-size: 22rpx;
  line-height: 30rpx;
  font-weight: 700;
}

.home-section-title {
  color: #18181b;
  font-size: 34rpx;
  line-height: 44rpx;
  font-weight: 800;
}

.home-section-note {
  flex-shrink: 0;
  color: #a1a1aa;
  font-size: 22rpx;
  line-height: 32rpx;
  font-weight: 650;
}

.home-feature-card {
  position: relative;
  aspect-ratio: 1 / 1;
  height: 594rpx;
  overflow: hidden;
  border-radius: 22px;
  background: #18181b;
  box-shadow: 0 18rpx 42rpx rgba(24, 24, 27, 0.13);
}

.home-feature-image,
.home-feature-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.home-feature-image {
  display: block;
}

.home-feature-shade {
  background:
    linear-gradient(90deg, rgba(24, 24, 27, 0.72), rgba(24, 24, 27, 0.12) 58%, rgba(24, 24, 27, 0.3)),
    linear-gradient(180deg, rgba(24, 24, 27, 0.05), rgba(24, 24, 27, 0.72));
}

.home-feature-content {
  position: absolute;
  left: 28rpx;
  right: 28rpx;
  bottom: 28rpx;
  z-index: 2;
  color: #ffffff;
}

.home-feature-label {
  display: inline-flex;
  align-items: center;
  height: 34rpx;
  padding: 0 14rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 18rpx;
  line-height: 30rpx;
  font-weight: 800;
  letter-spacing: 0;
}

.home-feature-title {
  max-width: 78%;
  margin-top: 18rpx;
  overflow: hidden;
  font-size: 42rpx;
  line-height: 52rpx;
  font-weight: 850;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-feature-meta {
  max-width: 70%;
  margin-top: 8rpx;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.78);
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-feature-price {
  position: absolute;
  right: 0;
  bottom: 0;
  font-size: 44rpx;
  line-height: 52rpx;
  font-weight: 850;
}

.home-feature-mini-scroll,
.home-new-scroll,
.home-hot-scroll {
  width: 100%;
  white-space: nowrap;
}

.home-feature-mini-track,
.home-new-track,
.home-hot-track {
  display: inline-flex;
  gap: 18rpx;
  padding: 0 0 6rpx;
}

.home-feature-mini-track {
  padding: 18rpx 0 4rpx;
}

.home-feature-mini {
  width: 246rpx;
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  padding: 10rpx;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(24, 24, 27, 0.08);
}

.home-feature-mini-image {
  width: 78rpx;
  height: 78rpx;
  flex: 0 0 auto;
  display: block;
  border-radius: 10px;
  background: #f4f4f5;
}

.home-feature-mini-info {
  min-width: 0;
  flex: 1 1 auto;
}

.home-feature-mini-title {
  overflow: hidden;
  color: #18181b;
  font-size: 22rpx;
  line-height: 30rpx;
  font-weight: 750;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-feature-mini-price {
  margin-top: 4rpx;
  color: #18181b;
  font-size: 24rpx;
  line-height: 32rpx;
  font-weight: 850;
}

.home-new-card,
.home-hot-card {
  position: relative;
  width: 304rpx;
  flex: 0 0 304rpx;
  display: block;
  white-space: normal;
}

.home-hot-rank {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  z-index: 3;
  padding: 6rpx 12rpx;
  border-radius: 999px;
  background: rgba(24, 24, 27, 0.88);
  color: #ffffff;
  font-size: 20rpx;
  line-height: 24rpx;
  font-weight: 800;
  box-shadow: 0 8rpx 18rpx rgba(24, 24, 27, 0.2);
}

.home-hot-rank.is-top {
  background: linear-gradient(135deg, #18181b, #3f3f46);
}

.home-product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.home-recommend-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 156rpx;
  border: 1rpx dashed #d4d4d8;
  border-radius: 16px;
  background: #fafafa;
  color: #71717a;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 650;
}

.home-state {
  padding: 48rpx 0;
  text-align: center;
}
</style>
