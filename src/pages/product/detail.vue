<template>
  <view class="detail-page">
    <view v-if="loading && !ready" class="detail-shell">
      <view class="gallery-card">
        <sj-product-gallery :images="[]" loading empty-text="图片加载中" />
      </view>
      <view class="summary-card">
        <view class="skeleton skeleton-title"></view>
        <view class="skeleton skeleton-line"></view>
        <view class="skeleton skeleton-price"></view>
      </view>
    </view>

    <view v-else-if="errorText" class="page-state error-state">
      <view>{{ errorText }}</view>
      <button class="retry-btn" @tap="loadData">重试</button>
    </view>

    <view v-else-if="!ready" class="page-state muted">产品已下架</view>

    <block v-else>
      <view class="detail-shell">
        <view class="gallery-card">
          <sj-product-gallery
          :images="detail.galleryImages"
          :colors="detail.colorSwatches"
          :show-counter="false"
          :ratio="1"
          fit="contain"
          empty-text="暂无商品图片"
          />
        </view>

        <view class="summary-card">
          <view class="summary-tags">
            <text v-if="product.productCode" class="summary-tag">{{ product.productCode }}</text>
            <text
              v-for="category in detail.categoryTags"
              :key="category"
              class="summary-tag summary-tag--muted"
            >
              {{ category }}
            </text>
          </view>
          <view class="summary-title" :class="{ 'summary-title--bracket': detail.titleNeedsOpticalAlign }">{{ detail.title }}</view>
          <view class="summary-desc">{{ detail.description }}</view>
          <view class="summary-price">{{ detail.priceText }}</view>
        </view>

        <sj-product-param-list
          v-if="detail.paramRows.length"
          title="商品参数"
          description="编号、分类、颜色、装箱规格"
          :items="detail.paramRows"
        />

        <view v-if="detail.showDetailMedia" class="detail-card">
          <view class="detail-card__title">商品详情</view>
          <view v-if="detail.detailImages.length" class="detail-images">
            <view v-for="(image, index) in detail.detailImages" :key="image" class="detail-image-wrap">
              <image class="detail-image" :src="image" mode="widthFix" @tap="previewDetailImage(index)" />
            </view>
          </view>
          <rich-text v-else-if="detail.contentWeb" :nodes="detail.contentWeb" />
          <view v-else class="muted empty-detail">暂无详情图文</view>
        </view>
      </view>

      <sj-bottom-action-bar
        :title="detail.title"
        description="咨询报价与规格"
        :actions="detail.bottomActions"
        @action="handleBottomAction"
      />
    </block>

    <canvas
      canvas-id="productSharePosterCanvas"
      class="product-share-canvas"
      style="width: 500px; height: 400px;"
    />
  </view>
</template>

<script>
import SjBottomActionBar from '../../components/SjBottomActionBar.vue';
import SjProductGallery from '../../components/SjProductGallery.vue';
import SjProductParamList from '../../components/SjProductParamList.vue';
import { getProductDetail } from '../../api/products';
import { buildProductDetailPayload } from '../../utils/product.js';
import { PAGE_ROUTES, buildProductDetailUrl, navigateToPage, openCustomerService } from '../../utils/route';
import { buildShareOptions, buildTimelineShareOptions, enablePageShare, productShareImage, productShareTitle } from '../../utils/share.js';

const PRODUCT_SHARE_CANVAS_ID = 'productSharePosterCanvas';
const PRODUCT_SHARE_WIDTH = 500;
const PRODUCT_SHARE_HEIGHT = 400;

function cleanText(value) {
  return String(value || '').trim();
}

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
      fail: () => resolve({ path: imageUrl, width: 0, height: 0 }),
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

function canvasToTempFile(canvasId, page) {
  if (typeof uni === 'undefined' || typeof uni.canvasToTempFilePath !== 'function') {
    return Promise.resolve('');
  }

  return new Promise((resolve) => {
    uni.canvasToTempFilePath({
      canvasId,
      width: PRODUCT_SHARE_WIDTH,
      height: PRODUCT_SHARE_HEIGHT,
      destWidth: PRODUCT_SHARE_WIDTH * 2,
      destHeight: PRODUCT_SHARE_HEIGHT * 2,
      fileType: 'png',
      quality: 0.92,
      success: (result = {}) => resolve(result.tempFilePath || ''),
      fail: () => resolve(''),
    }, page);
  });
}

export default {
  components: {
    SjBottomActionBar,
    SjProductGallery,
    SjProductParamList,
  },
  data() {
    return {
      id: '',
      product: {},
      sharePosterImage: '',
      sharePosterTaskId: 0,
      loading: false,
      errorText: '',
    };
  },
  computed: {
    ready() {
      return Boolean(this.product && this.product.id);
    },
    detail() {
      return buildProductDetailPayload(this.product || {});
    },
  },
  onLoad(query) {
    this.id = query.id || query.goods_id || '';
    this.loadData();
  },
  onShow() {
    enablePageShare();
  },
  onPullDownRefresh() {
    this.loadData().finally(() => uni.stopPullDownRefresh());
  },
  onShareAppMessage() {
    const path = buildProductDetailUrl(this.id || this.product.id);
    return buildShareOptions({
      title: productShareTitle(this.product, '北极星智能体产品'),
      path,
      imageUrl: this.sharePosterImage || productShareImage(this.detail),
    });
  },
  onShareTimeline() {
    const path = buildProductDetailUrl(this.id || this.product.id);
    return buildTimelineShareOptions({
      title: productShareTitle(this.product, '北极星智能体产品'),
      path,
      imageUrl: this.sharePosterImage || productShareImage(this.detail),
    });
  },
  methods: {
    async loadData() {
      if (!this.id) {
        this.product = {};
        this.errorText = '缺少产品编号';
        return Promise.resolve();
      }

      this.loading = true;
      this.errorText = '';
      this.sharePosterImage = '';
      try {
        this.product = await getProductDetail(this.id);
        this.$nextTick(() => this.prepareSharePoster());
      } catch (error) {
        this.product = {};
        this.sharePosterImage = '';
        this.errorText = error.msg || '商品加载失败';
      } finally {
        this.loading = false;
      }
    },
    async prepareSharePoster() {
      if (!this.ready) return;
      const taskId = ++this.sharePosterTaskId;
      const poster = await this.createProductSharePoster();
      if (taskId === this.sharePosterTaskId && poster) this.sharePosterImage = poster;
    },
    async createProductSharePoster() {
      if (typeof uni === 'undefined' || typeof uni.createCanvasContext !== 'function') return '';

      const detail = this.detail;
      const image = await getCanvasImageInfo(productShareImage(detail));
      const ctx = uni.createCanvasContext(PRODUCT_SHARE_CANVAS_ID, this);
      const title = truncateText(detail.title, 16);
      const desc = truncateText(detail.description, 16);
      const code = truncateText(this.product.productCode || this.product.product_code || '', 10);
      const category = truncateText((detail.categoryTags || [])[0] || detail.categoryName || '', 8);
      const price = truncateText(detail.priceText || '咨询价格', 9);
      const swatches = (detail.colorSwatches || []).slice(0, 5);

      ctx.setFillStyle('#f4f4f5');
      ctx.fillRect(0, 0, PRODUCT_SHARE_WIDTH, PRODUCT_SHARE_HEIGHT);
      ctx.save();
      roundedRect(ctx, 0, 0, PRODUCT_SHARE_WIDTH, PRODUCT_SHARE_HEIGHT, 22);
      ctx.clip();
      ctx.setFillStyle('#ffffff');
      ctx.fillRect(0, 0, PRODUCT_SHARE_WIDTH, PRODUCT_SHARE_HEIGHT);

      if (!drawAspectFillImage(ctx, image, 0, 0, PRODUCT_SHARE_WIDTH, 252)) {
        ctx.setFillStyle('#f4f4f5');
        ctx.fillRect(0, 0, PRODUCT_SHARE_WIDTH, 252);
      }

      if (swatches.length) {
        const pillWidth = 34 + swatches.length * 24;
        const pillX = PRODUCT_SHARE_WIDTH - pillWidth - 24;
        ctx.setFillStyle('rgba(255,255,255,0.86)');
        roundedRect(ctx, pillX, 216, pillWidth, 24, 12);
        ctx.fill();
        swatches.forEach((item, index) => {
          const x = pillX + 17 + index * 24;
          ctx.setFillStyle(item.value || '#d4d4d8');
          roundedRect(ctx, x, 224, 16, 7, 4);
          ctx.fill();
          if (item.isLight) {
            ctx.setStrokeStyle('rgba(24,24,27,0.28)');
            ctx.setLineWidth(1);
            roundedRect(ctx, x, 224, 16, 7, 4);
            ctx.stroke();
          }
        });
      }

      ctx.setFillStyle('#ffffff');
      ctx.fillRect(0, 248, PRODUCT_SHARE_WIDTH, 152);
      ctx.setFillStyle('#18181b');
      ctx.setFontSize(20);
      ctx.fillText('北极星智能体', 28, 382);

      if (code) {
        ctx.setFillStyle('#18181b');
        roundedRect(ctx, 28, 272, 82, 28, 14);
        ctx.fill();
        ctx.setFillStyle('#ffffff');
        ctx.setFontSize(16);
        ctx.fillText(code, 44, 292);
      }

      if (category) {
        ctx.setFillStyle('#f4f4f5');
        roundedRect(ctx, code ? 120 : 28, 272, 88, 28, 14);
        ctx.fill();
        ctx.setFillStyle('#71717a');
        ctx.setFontSize(15);
        ctx.fillText(category, code ? 138 : 46, 292);
      }

      ctx.setFillStyle('#18181b');
      ctx.setFontSize(28);
      ctx.fillText(title, 28, 330);
      ctx.setFillStyle('#71717a');
      ctx.setFontSize(18);
      ctx.fillText(desc, 28, 360);
      ctx.setFillStyle('#18181b');
      ctx.setFontSize(34);
      const priceWidth = (price.length || 1) * 18;
      ctx.fillText(price, Math.max(320, PRODUCT_SHARE_WIDTH - priceWidth - 32), 360);
      ctx.restore();

      return new Promise((resolve) => {
        ctx.draw(false, () => {
          setTimeout(async () => {
            resolve(await canvasToTempFile(PRODUCT_SHARE_CANVAS_ID, this));
          }, 80);
        });
      });
    },
    previewDetailImage(index = 0) {
      const urls = (this.detail.detailImages || []).filter(Boolean);
      const safeIndex = Math.max(0, Math.min(Number(index) || 0, urls.length - 1));
      const current = urls[safeIndex];
      if (!current || !urls.length) return;
      if (typeof uni === 'undefined' || typeof uni.previewImage !== 'function') return;
      uni.previewImage({ urls, current });
    },
    handleBottomAction(event) {
      const key = event && event.action && event.action.key;
      if (key === 'category') {
        navigateToPage(PAGE_ROUTES.category);
        return;
      }
      if (key === 'contact') {
        openCustomerService();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.detail-page {
  box-sizing: border-box;
  width: 100%;
  max-width: 100vw;
  min-height: 100vh;
  padding-bottom: calc(188rpx + env(safe-area-inset-bottom));
  overflow-x: hidden;
  background: #f6f6f3;
}

.product-share-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  opacity: 0;
  pointer-events: none;
}

.detail-shell {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  display: grid;
  gap: 22rpx;
  padding: 22rpx;
  overflow: hidden;
}

.page-state {
  min-height: 70vh;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 20rpx;
  padding: 80rpx 36rpx;
  text-align: center;
  font-size: 28rpx;
}

.muted {
  color: #71717a;
}

.error-state {
  color: #9f2f27;
}

.retry-btn {
  width: 156rpx;
  height: 66rpx;
  line-height: 66rpx;
  color: #fff;
  background: #18181b;
  border-radius: 10px;
  font-size: 25rpx;
}

.retry-btn::after {
  border: 0;
}

.gallery-card,
.summary-card,
.detail-card {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  border-radius: 14px;
  background: #ffffff;
  color: #18181b;
  box-shadow: 0 0 0 1px rgba(24, 24, 27, 0.1);
}

.gallery-card {
  padding: 0;
}

.summary-card,
.detail-card {
  padding: 32rpx;
}

.summary-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  column-gap: 24rpx;
  align-items: end;
}

.summary-tags {
  grid-column: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-left: 6rpx;
  margin-bottom: 18rpx;
}

.summary-tag {
  max-width: 100%;
  height: 40rpx;
  display: inline-flex;
  align-items: center;
  padding: 0 16rpx;
  border-radius: 999px;
  overflow: hidden;
  color: #fafafa;
  background: #18181b;
  font-size: 22rpx;
  line-height: 32rpx;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.summary-tag--muted {
  color: #18181b;
  background: #f4f4f5;
}

.summary-title {
  grid-column: 1;
  min-width: 0;
  color: #18181b;
  font-size: 40rpx;
  line-height: 52rpx;
  font-weight: 700;
  letter-spacing: 0;
}

.summary-title--bracket {
  margin-left: -12rpx;
}

.summary-desc {
  grid-column: 1;
  min-width: 0;
  margin-top: 12rpx;
  margin-left: 6rpx;
  color: #71717a;
  font-size: 26rpx;
  line-height: 38rpx;
}

.summary-price {
  grid-column: 2;
  grid-row: 1 / span 3;
  align-self: end;
  justify-self: end;
  margin-top: 0;
  color: #18181b;
  font-size: 50rpx;
  line-height: 58rpx;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.detail-card__title {
  margin-bottom: 24rpx;
  color: #18181b;
  font-size: 32rpx;
  line-height: 44rpx;
  font-weight: 600;
}

.detail-images {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  display: grid;
  gap: 0;
  border-radius: 10px;
  overflow: hidden;
  background: #f4f4f5;
}

.detail-image-wrap {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  line-height: 0;
}

.detail-image-wrap:first-child {
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

.detail-image-wrap:last-child {
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.detail-image {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  display: block;
  border-radius: 0;
  background: #f4f4f5;
}

.empty-detail {
  padding: 28rpx 0;
  text-align: center;
  font-size: 26rpx;
}

.skeleton {
  overflow: hidden;
  border-radius: 8px;
  background: linear-gradient(90deg, #f4f4f5 0%, #fafafa 42%, #f4f4f5 84%);
  background-size: 220% 100%;
  animation: detail-skeleton 1.8s ease-in-out infinite;
}

.skeleton-title {
  width: 72%;
  height: 42rpx;
}

.skeleton-line {
  width: 100%;
  height: 30rpx;
  margin-top: 20rpx;
}

.skeleton-price {
  width: 36%;
  height: 44rpx;
  margin-top: 28rpx;
}

@keyframes detail-skeleton {
  0% {
    background-position: 120% 0;
  }

  100% {
    background-position: -120% 0;
  }
}
</style>
