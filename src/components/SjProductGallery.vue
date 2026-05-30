<template>
  <view
    class="sj-product-gallery"
    :class="[fitClass, compactClass, customClass]"
    :style="galleryStyle"
  >
    <view class="sj-product-gallery__frame">
      <swiper
        v-if="imageItems.length && !imageFailed"
        class="sj-product-gallery__swiper"
        :current="activeIndex"
        :duration="220"
        @change="handleSwiperChange"
      >
        <swiper-item
          v-for="(item, index) in imageItems"
          :key="item + index"
          class="sj-product-gallery__slide"
        >
          <view class="sj-product-gallery__slide-inner" @tap="previewImage(index)">
            <image
              class="sj-product-gallery__media"
              :src="item"
              :mode="imageMode"
              @error="handleImageError(index)"
            />
          </view>
        </swiper-item>
      </swiper>
      <view v-else class="sj-product-gallery__placeholder">
        <slot name="empty">{{ emptyText }}</slot>
      </view>
      <view v-if="loading" class="sj-product-gallery__loading"></view>
      <view v-if="colorSwatches.length" class="sj-product-gallery__swatches">
        <view
          v-for="(color, index) in colorSwatches"
          :key="color + index"
          class="sj-product-gallery__swatch"
          :class="{
            'sj-product-gallery__swatch--active': index === activeSwatchIndex,
            'sj-product-gallery__swatch--light': color.isLight,
          }"
          :style="{ background: color.value || color }"
        ></view>
      </view>
      <view v-if="showCounter && imageItems.length > 1" class="sj-product-gallery__counter">
        {{ activeIndex + 1 }}/{{ imageItems.length }}
      </view>
    </view>

    <scroll-view
      v-if="showThumbs && imageItems.length > 1"
      class="sj-product-gallery__thumbs"
      scroll-x
      :show-scrollbar="false"
    >
      <view
        v-for="(item, index) in imageItems"
        :key="item + index"
        class="sj-product-gallery__thumb"
        :class="{ 'is-active': index === activeIndex }"
        @tap="selectImage(index)"
      >
        <image class="sj-product-gallery__thumb-image" :src="item" mode="aspectFill" />
      </view>
    </scroll-view>
  </view>
</template>

<script>
function imageFromItem(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.images || item.url || item.src || item.image || "";
}

export default {
  name: "SjProductGallery",
  emits: ["change"],
  props: {
    images: { type: Array, default: () => [] },
    ratio: { type: Number, default: 1 },
    radius: { type: String, default: "14px" },
    fit: { type: String, default: "contain" },
    active: { type: Number, default: 0 },
    loading: { type: Boolean, default: false },
    showThumbs: { type: Boolean, default: true },
    showCounter: { type: Boolean, default: true },
    colors: { type: Array, default: () => [] },
    compact: { type: Boolean, default: false },
    emptyText: { type: String, default: "暂无图片" },
    scale: { type: Number, default: 1 },
    customClass: { type: String, default: "" },
  },
  data() {
    return {
      activeIndex: this.active,
      imageFailed: false,
    };
  },
  computed: {
    imageItems() {
      return this.images.map(imageFromItem).filter(Boolean);
    },
    activeImage() {
      return this.imageItems[this.activeIndex] || "";
    },
    colorSwatches() {
      return this.colors.map((item) => {
        if (!item) return "";
        if (typeof item === "string") return { value: item, isLight: false };
        return {
          value: item.hex || item.color || item.value || "",
          isLight: Boolean(item.isLight),
        };
      }).filter(Boolean).slice(0, 8);
    },
    activeSwatchIndex() {
      if (!this.colorSwatches.length) return -1;
      if (this.activeIndex <= 0) return -1;
      return Math.min(this.activeIndex - 1, this.colorSwatches.length - 1);
    },
    imageMode() {
      return this.fit === "cover" ? "aspectFill" : "aspectFit";
    },
    fitClass() {
      return this.fit === "cover" ? "sj-product-gallery--cover" : "";
    },
    compactClass() {
      return this.compact ? "sj-product-gallery--compact" : "";
    },
    galleryStyle() {
      return {
        "--sj-product-gallery-ratio": this.ratio,
        "--sj-product-gallery-radius": this.radius,
        "--sj-product-gallery-scale": this.scale,
      };
    },
  },
  watch: {
    active(value) {
      this.activeIndex = value;
      this.imageFailed = false;
    },
    images() {
      if (this.activeIndex >= this.imageItems.length) this.activeIndex = 0;
      this.imageFailed = false;
    },
  },
  methods: {
    selectImage(index) {
      this.activeIndex = index;
      this.imageFailed = false;
      this.$emit("change", { index, image: this.imageItems[index] });
    },
    handleSwiperChange(event) {
      const index = Number(event && event.detail && event.detail.current) || 0;
      this.activeIndex = index;
      this.imageFailed = false;
      this.$emit("change", { index, image: this.imageItems[index] });
    },
    handleImageError(index) {
      if (index === this.activeIndex) this.imageFailed = true;
    },
    previewImage(index = this.activeIndex) {
      const urls = this.imageItems;
      const safeIndex = Math.max(0, Math.min(Number(index) || 0, urls.length - 1));
      const current = urls[safeIndex];
      if (!current || !urls.length) return;
      if (typeof uni === "undefined" || typeof uni.previewImage !== "function") return;
      uni.previewImage({ urls, current });
    },
  },
};
</script>

<style scoped>
.sj-product-gallery {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  display: grid;
  gap: calc(12px * var(--sj-product-gallery-scale, 1));
  overflow: hidden;
  color: #18181b;
  font-family: "PingFang SC", "PingFang TC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

.sj-product-gallery__frame {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid #e4e4e7;
  border-radius: calc(var(--sj-product-gallery-radius, 14px) * var(--sj-product-gallery-scale, 1));
  background: #f4f4f5;
}

.sj-product-gallery__frame::before {
  content: "";
  display: block;
  padding-bottom: calc(100% / var(--sj-product-gallery-ratio, 1));
}

.sj-product-gallery__swiper,
.sj-product-gallery__slide,
.sj-product-gallery__slide-inner,
.sj-product-gallery__media,
.sj-product-gallery__placeholder,
.sj-product-gallery__loading {
  position: absolute;
  inset: 0;
}

.sj-product-gallery__swiper,
.sj-product-gallery__slide,
.sj-product-gallery__slide-inner {
  width: 100%;
  height: 100%;
}

.sj-product-gallery__media {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  height: 100%;
  display: block;
}

.sj-product-gallery__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(24px * var(--sj-product-gallery-scale, 1));
  color: #71717a;
  font-size: calc(14px * var(--sj-product-gallery-scale, 1));
  line-height: calc(20px * var(--sj-product-gallery-scale, 1));
  text-align: center;
}

.sj-product-gallery__loading {
  background: linear-gradient(90deg, #f4f4f5 0%, #fafafa 42%, #f4f4f5 84%);
  background-size: 220% 100%;
  animation: sj-product-gallery-loading 1.8s ease-in-out infinite;
}

.sj-product-gallery__counter {
  position: absolute;
  right: calc(10px * var(--sj-product-gallery-scale, 1));
  bottom: calc(10px * var(--sj-product-gallery-scale, 1));
  min-width: calc(38px * var(--sj-product-gallery-scale, 1));
  height: calc(24px * var(--sj-product-gallery-scale, 1));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 calc(8px * var(--sj-product-gallery-scale, 1));
  border-radius: 9999px;
  background: rgba(24, 24, 27, 0.82);
  color: #fafafa;
  font-size: calc(12px * var(--sj-product-gallery-scale, 1));
  line-height: calc(16px * var(--sj-product-gallery-scale, 1));
  font-weight: 500;
}

.sj-product-gallery__swatches {
  position: absolute;
  right: calc(12px * var(--sj-product-gallery-scale, 1));
  bottom: calc(12px * var(--sj-product-gallery-scale, 1));
  display: flex;
  align-items: center;
  gap: calc(4px * var(--sj-product-gallery-scale, 1));
  padding: calc(6px * var(--sj-product-gallery-scale, 1)) calc(8px * var(--sj-product-gallery-scale, 1));
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 4px 16px rgba(24, 24, 27, 0.12);
}

.sj-product-gallery__swatch {
  width: calc(14px * var(--sj-product-gallery-scale, 1));
  height: calc(4px * var(--sj-product-gallery-scale, 1));
  border-radius: 999px;
  opacity: 0.86;
  transition: width 180ms ease, opacity 180ms ease, transform 180ms ease;
}

.sj-product-gallery__swatch--active {
  width: calc(26px * var(--sj-product-gallery-scale, 1));
  opacity: 1;
}

.sj-product-gallery__swatch--light {
  box-shadow: inset 0 0 0 1px rgba(24, 24, 27, 0.32);
}

.sj-product-gallery__thumbs {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  display: block;
  overflow: hidden;
  padding: 6rpx 10rpx 8rpx;
  white-space: nowrap;
}

.sj-product-gallery__thumb {
  box-sizing: border-box;
  width: calc(52px * var(--sj-product-gallery-scale, 1));
  height: calc(52px * var(--sj-product-gallery-scale, 1));
  display: inline-flex;
  overflow: hidden;
  margin-right: calc(6px * var(--sj-product-gallery-scale, 1));
  border: 1px solid #e4e4e7;
  border-radius: calc(10px * var(--sj-product-gallery-scale, 1));
  background: #f4f4f5;
  vertical-align: top;
}

.sj-product-gallery__thumb.is-active {
  border-color: #18181b;
  box-shadow: inset 0 0 0 1px #18181b;
}

.sj-product-gallery__thumb-image {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  height: 100%;
  display: block;
}

.sj-product-gallery--compact {
  gap: calc(8px * var(--sj-product-gallery-scale, 1));
}

.sj-product-gallery--compact .sj-product-gallery__thumb {
  width: calc(44px * var(--sj-product-gallery-scale, 1));
  height: calc(44px * var(--sj-product-gallery-scale, 1));
  border-radius: calc(8px * var(--sj-product-gallery-scale, 1));
}

@keyframes sj-product-gallery-loading {
  0% {
    background-position: 120% 0;
  }

  100% {
    background-position: -120% 0;
  }
}
</style>
