<template>
  <view
    class="sj-category-product-card"
    :class="{ 'sj-category-product-card--compact': compact }"
    @tap="openDetail"
  >
    <view class="sj-category-product-card__media">
      <view v-if="cover && !imageReady" class="sj-category-product-card__image-skeleton"></view>
      <image
        v-if="cover"
        class="sj-category-product-card__image"
        :class="{ 'is-ready': imageReady, 'is-hidden': imageFailed }"
        :src="cover"
        mode="aspectFill"
        lazy-load
        @load="handleImageLoad"
        @error="handleImageError"
      />
      <view v-if="!cover || imageFailed" class="sj-category-product-card__placeholder">{{ emptyText }}</view>
      <view v-if="visibleSwatches.length" class="sj-category-product-card__swatches">
        <view
          v-for="(item, index) in visibleSwatches"
          :key="item.value + index"
          class="sj-category-product-card__swatch"
          :class="{ 'sj-category-product-card__swatch--light': item.isLight }"
          :style="{ background: item.value }"
        ></view>
      </view>
    </view>

    <view class="sj-category-product-card__body">
      <view v-if="showTopBadges" class="sj-category-product-card__top-badges sj-category-product-card__info-badges sj-category-product-card__info-badges--top">
        <text v-if="code" class="sj-category-product-card__badge sj-category-product-card__badge--code">{{ code }}</text>
        <text v-if="colorOptionBadgeText" class="sj-category-product-card__badge sj-category-product-card__badge--option">{{ colorOptionBadgeText }}</text>
        <text v-if="hasModel" class="sj-category-product-card__badge sj-category-product-card__badge--model">3D视图</text>
      </view>

      <view class="sj-category-product-card__title" :class="{ 'sj-category-product-card__title--bracket': titleNeedsOpticalAlign }">
        <text v-if="titlePrefix" class="sj-category-product-card__title-prefix">{{ titlePrefix }}</text>
        <text v-if="titlePrefix && titleName" class="sj-category-product-card__title-name">{{ titleName }}</text>
        <text v-if="!titlePrefix" class="sj-category-product-card__title-name">{{ title }}</text>
      </view>

      <view v-if="showTopMeta" class="sj-category-product-card__top-meta">
        <text v-if="packText" class="sj-category-product-card__detail sj-category-product-card__detail--pack">{{ packText }}</text>
        <view v-else class="sj-category-product-card__top-meta-spacer"></view>
        <text class="sj-category-product-card__price sj-category-product-card__price--top">{{ priceText }}</text>
      </view>

      <template v-else>
        <text v-if="packText" class="sj-category-product-card__detail sj-category-product-card__detail--pack">{{ packText }}</text>

        <view class="sj-category-product-card__footer">
          <text class="sj-category-product-card__price">{{ priceText }}</text>
          <view v-if="showFooterBadges" class="sj-category-product-card__info-badges sj-category-product-card__info-badges--footer">
            <text v-if="code" class="sj-category-product-card__badge sj-category-product-card__badge--code">{{ code }}</text>
            <text v-if="hasModel" class="sj-category-product-card__badge sj-category-product-card__badge--model">3D视图</text>
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<script>
import { buildProductDetailUrl, navigateToPage } from '../utils/route';
import { buildCategoryCoverUrl } from '../utils/image';

function cleanText(value) {
  return String(value || '').trim();
}

function truthyFlag(value) {
  if (value === true) return true;
  if (value === false || value === undefined || value === null) return false;
  if (typeof value === 'number') return value > 0;
  return ['1', 'true', 'yes', 'y', 'on'].includes(cleanText(value).toLowerCase());
}

function formatPackText(value) {
  const text = cleanText(value);
  if (!text) return '';
  if (/^件规[:：]/.test(text)) return text;
  if (/\/件$/.test(text)) return `件规：${text}`;
  if (/^\d+(?:\.\d+)?$/.test(text)) return `件规：${text}套/件`;

  const packMatch = text.match(/1\s*件\s*(\d+(?:\.\d+)?)\s*([\u4e00-\u9fa5A-Za-z]+)/);
  if (packMatch) return `件规：${packMatch[1]}${packMatch[2]}/件`;

  return `件规：${text}`;
}

function splitTitleParts(value) {
  const text = cleanText(value);
  const match = text.match(/^(【[^】]+】)\s*(.*)$/);
  if (!match) return { prefix: '', name: text };
  return { prefix: match[1], name: match[2] || '' };
}

function splitTextList(value) {
  if (Array.isArray(value)) return value.flatMap(splitTextList);
  return cleanText(value)
    .split(/[、，,/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function numericOptionCount(...values) {
  return values
    .map((value) => Number(value || 0))
    .find((value) => Number.isFinite(value) && value > 0) || 0;
}

function colorOptionCount(product = {}) {
  const explicitCount = numericOptionCount(
    product.colorCount,
    product.color_count,
    product.colorOptionCount,
    product.color_option_count
  );
  const textCount = uniqueColorCount([
    product.colorNames,
    product.color_names,
    product.available_colors,
    product.colorText,
    product.color_text,
    product.color,
  ]);
  const swatchCount = Math.max(uniqueColorCount(product.colorSwatches), uniqueColorCount(product.swatches));
  const count = Math.max(explicitCount, textCount, swatchCount);
  return count > 1 ? count : 0;
}

function colorValueFromItem(item) {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.name || item.label || item.colorName || item.color_name || item.value || item.hex || item.color || item.background || '';
}

function uniqueColorCount(value) {
  const values = Array.isArray(value)
    ? value.flatMap((item) => splitTextList(colorValueFromItem(item)))
    : splitTextList(value);

  return new Set(values.map((item) => cleanText(item).toLowerCase()).filter(Boolean)).size;
}

function normalizeSwatch(item) {
  if (!item) return null;
  if (typeof item === 'string') return { value: item, isLight: false };
  const value = item.value || item.hex || item.color || item.background || '';
  if (!value) return null;
  return {
    value,
    isLight: Boolean(item.isLight),
  };
}

export default {
  name: 'SjCategoryProductCard',
  props: {
    product: {
      type: Object,
      default: () => ({}),
    },
    compact: {
      type: Boolean,
      default: false,
    },
    emptyText: {
      type: String,
      default: '暂无图片',
    },
    codePosition: {
      type: String,
      default: 'footer',
    },
  },
  data() {
    return {
      imageReady: false,
      imageFailed: false,
    };
  },
  computed: {
    cover() {
      const rawCover = this.product.cover || this.product.images || '/static/images/product-placeholder.png';
      return buildCategoryCoverUrl(rawCover);
    },
    code() {
      return this.product.productCode || this.product.product_code || this.product.coding || this.product.sku_no || '';
    },
    modelUrl() {
      return this.product.modelUrl || this.product.model_url || this.product.model3d_url || this.product.model_file_url || this.product.glb_url || this.product.gltf_url || this.product.usdz_url || '';
    },
    hasModel() {
      if (this.modelUrl) return true;
      return [
        this.product.hasModel,
        this.product.has_model,
        this.product.has_3d_model,
        this.product.has3dModel,
        this.product.is_model_product,
        this.product.model_enabled,
        this.product.enable_model,
      ].some(truthyFlag);
    },
    colorOptionBadgeText() {
      const count = colorOptionCount(this.product);
      return count > 1 ? `${count}色可选` : '';
    },
    showTopBadges() {
      return this.codePosition === 'top' && (this.code || this.colorOptionBadgeText || this.hasModel);
    },
    showFooterBadges() {
      return this.codePosition !== 'top' && (this.code || this.hasModel);
    },
    showTopMeta() {
      return this.codePosition === 'top';
    },
    title() {
      return this.product.productName || this.product.title || this.product.name || (this.code ? `产品 ${this.code}` : '北极星智能体产品');
    },
    titleParts() {
      return splitTitleParts(this.title);
    },
    titlePrefix() {
      return this.titleParts.prefix;
    },
    titleName() {
      return this.titleParts.name;
    },
    titleNeedsOpticalAlign() {
      return Boolean(this.titlePrefix);
    },
    packText() {
      return formatPackText(this.product.packText || this.product.pack_text || this.product.pieceText || this.product.piece_text || this.product.case_pack_text || this.product.case_pack_qty);
    },
    priceText() {
      return this.product.priceText || `¥${this.product.min_price || this.product.price || '0.00'}`;
    },
    visibleSwatches() {
      const swatches = this.product.colorSwatches || this.product.swatches || splitTextList(this.product.color);
      return swatches
        .map(normalizeSwatch)
        .filter(Boolean)
        .slice(0, 5);
    },
  },
  watch: {
    cover() {
      this.resetImageState();
    },
  },
  methods: {
    resetImageState() {
      this.imageReady = false;
      this.imageFailed = false;
    },
    handleImageLoad() {
      this.imageReady = true;
      this.imageFailed = false;
    },
    handleImageError() {
      this.imageReady = true;
      this.imageFailed = true;
    },
    openDetail() {
      const id = this.product.id || this.product.goods_id;
      if (!id) return;
      navigateToPage(buildProductDetailUrl(id));
    },
  },
};
</script>

<style lang="scss" scoped>
.sj-category-product-card {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 10px;
  background: #ffffff;
  color: #18181b;
  box-shadow: 0 1px 2px rgba(24, 24, 27, 0.04);
  font-family: "PingFang SC", "PingFang TC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

.sj-category-product-card__media {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  height: 0;
  overflow: hidden;
  padding-bottom: 100%;
  background: #f4f4f5;
}

.sj-category-product-card__image,
.sj-category-product-card__image-skeleton,
.sj-category-product-card__placeholder {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.sj-category-product-card__image {
  display: block;
  opacity: 0;
  transition: opacity 160ms ease-out;
}

.sj-category-product-card__image.is-ready {
  opacity: 1;
}

.sj-category-product-card__image.is-hidden {
  opacity: 0;
}

.sj-category-product-card__image-skeleton {
  overflow: hidden;
  background: linear-gradient(110deg, #f4f4f5 8%, #ececef 18%, #f4f4f5 33%);
  background-size: 200% 100%;
  animation: sj-category-product-card-skeleton 1.15s ease-in-out infinite;
}

.sj-category-product-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #71717a;
  font-size: 14px;
  line-height: 20px;
}

.sj-category-product-card__swatches {
  position: absolute;
  right: 10px;
  bottom: 10px;
  max-width: calc(100% - 24px);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 4px 16px rgba(24, 24, 27, 0.12);
}

.sj-category-product-card__swatch {
  width: 12px;
  height: 4px;
  flex: 0 0 auto;
  border-radius: 999px;
  opacity: 0.86;
}

.sj-category-product-card__swatch--light {
  box-shadow: inset 0 0 0 1px rgba(24, 24, 27, 0.32);
}

.sj-category-product-card__body {
  display: grid;
  gap: 6px;
  padding: 12px 12px 13px;
}

.sj-category-product-card__title {
  margin: 0;
  display: -webkit-box;
  overflow: hidden;
  color: #18181b;
  font-size: 14px;
  line-height: 19px;
  font-weight: 700;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.sj-category-product-card__title--bracket {
  box-sizing: border-box;
  width: calc(100% + 9px);
  margin-left: -9px;
  padding-left: 9px;
}

.sj-category-product-card__title--bracket ~ .sj-category-product-card__detail,
.sj-category-product-card__title--bracket ~ .sj-category-product-card__footer {
  margin-left: -2px;
}

.sj-category-product-card__title--bracket ~ .sj-category-product-card__top-meta {
  margin-left: -2px;
}

.sj-category-product-card__title-prefix {
  display: inline-block;
  margin-left: -9px;
}

.sj-category-product-card__detail {
  min-width: 0;
  overflow: hidden;
  color: #71717a;
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sj-category-product-card__detail--pack {
  color: #71717a;
}

.sj-category-product-card__footer {
  margin-top: 2px;
  min-width: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
}

.sj-category-product-card__top-meta {
  min-width: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
}

.sj-category-product-card__top-meta .sj-category-product-card__detail,
.sj-category-product-card__top-meta-spacer {
  min-width: 0;
  flex: 1 1 auto;
}

.sj-category-product-card__price {
  flex: 0 0 auto;
  color: #18181b;
  font-size: 20px;
  line-height: 24px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.sj-category-product-card__price--top {
  margin-left: auto;
}

.sj-category-product-card__info-badges {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  overflow: hidden;
}

.sj-category-product-card__info-badges--top {
  justify-content: flex-start;
}

.sj-category-product-card__info-badges--footer {
  flex: 1 1 auto;
  justify-content: flex-end;
}

.sj-category-product-card__badge {
  box-sizing: border-box;
  max-width: 100%;
  height: 18px;
  display: inline-flex;
  flex: 0 1 auto;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 15px;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sj-category-product-card__badge--code {
  flex: 0 0 auto;
  background: #18181b;
  color: #fafafa;
}

.sj-category-product-card__badge--option {
  min-width: 0;
  background: #f4f4f5;
  color: #52525b;
}

.sj-category-product-card__badge--model {
  background: #f4f4f5;
  color: #18181b;
  box-shadow: inset 0 0 0 1px rgba(24, 24, 27, 0.08);
}

@keyframes sj-category-product-card-skeleton {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}
</style>
