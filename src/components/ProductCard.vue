<template>
  <view class="product-card panel" @tap="openDetail">
    <image class="cover" :src="cover" mode="aspectFill" />
    <view class="info">
      <view class="title two-line">{{ title }}</view>
      <view class="meta-row">
        <text v-if="code" class="code">{{ code }}</text>
        <text v-if="category" class="category">{{ category }}</text>
      </view>
      <view class="desc muted">{{ description }}</view>
      <view class="bottom">
        <text class="price">{{ priceText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { buildProductDetailUrl, navigateToPage } from '../utils/route';

export default {
  name: 'ProductCard',
  props: {
    product: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      fallbackImage: '/static/images/product-placeholder.png',
    };
  },
  computed: {
    cover() {
      return this.product.cover || this.product.images || this.fallbackImage;
    },
    title() {
      return this.product.productName || this.product.title || this.product.name || '肆计包装产品';
    },
    code() {
      return this.product.productCode || this.product.product_code || this.product.coding || this.product.sku_no || '';
    },
    category() {
      return this.product.categoryName || this.product.product_category_text || '';
    },
    description() {
      return this.product.description || this.product.simple_desc || this.product.product_category_text || '肆计包装商品';
    },
    priceText() {
      return this.product.priceText || `¥${this.product.min_price || this.product.price || '0.00'}`;
    },
  },
  methods: {
    openDetail() {
      const id = this.product.id || this.product.goods_id;
      if (!id) return;
      navigateToPage(buildProductDetailUrl(id));
    },
  },
};
</script>

<style lang="scss" scoped>
.product-card {
  overflow: hidden;
}

.cover {
  display: block;
  width: 100%;
  height: 260rpx;
  background: #ede7dd;
}

.info {
  padding: 18rpx;
}

.title {
  min-height: 76rpx;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 38rpx;
}

.desc {
  height: 34rpx;
  margin-top: 8rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 24rpx;
}

.meta-row {
  display: flex;
  gap: 8rpx;
  min-height: 32rpx;
  margin-top: 8rpx;
  overflow: hidden;
}

.code,
.category {
  max-width: 100%;
  padding: 3rpx 10rpx;
  border-radius: 6rpx;
  overflow: hidden;
  color: #6f5c45;
  background: #f4eee6;
  font-size: 21rpx;
  line-height: 28rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.category {
  color: #7a7a72;
  background: #f2f2ee;
}

.bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18rpx;
}

</style>
