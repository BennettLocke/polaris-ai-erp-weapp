<template>
  <view class="sj-sales-orders">
    <view class="sj-sales-orders__nav">
      <button class="sj-sales-orders__back" aria-label="返回" @tap="submitBack"></button>
      <text class="sj-sales-orders__nav-title">{{ navTitle }}</text>
    </view>

    <view class="sj-sales-orders__toolbar">
      <view class="sj-sales-orders__search">
        <view class="sj-sales-orders__search-icon"></view>
        <input
          class="sj-sales-orders__input"
          :value="keyword"
          confirm-type="search"
          placeholder="搜索销售单号、产品名称"
          placeholder-class="sj-sales-orders__placeholder"
          @input="handleKeywordInput"
          @confirm="submitSearch"
        />
      </view>
      <button class="sj-sales-orders__search-button" @tap="submitSearch">查询</button>
    </view>

    <scroll-view class="sj-sales-orders__body" scroll-y :show-scrollbar="false">
      <view class="sj-sales-orders__content">
        <view class="sj-sales-orders__summary">
          <view>
            <text class="sj-sales-orders__summary-title">{{ summaryTitle }}</text>
            <text class="sj-sales-orders__summary-subtitle">{{ summarySubtitle }}</text>
          </view>
          <text class="sj-sales-orders__summary-count">{{ totalText }}</text>
        </view>

        <view v-if="loading" class="sj-sales-orders__empty">
          <view class="sj-sales-orders__empty-mark"></view>
          <text class="sj-sales-orders__empty-title">正在加载销售单</text>
          <text class="sj-sales-orders__empty-text">请稍等</text>
        </view>

        <view v-else-if="!orders.length" class="sj-sales-orders__empty">
          <view class="sj-sales-orders__empty-mark">?</view>
          <text class="sj-sales-orders__empty-title">{{ emptyTitle }}</text>
          <text class="sj-sales-orders__empty-text">{{ emptyText }}</text>
          <button v-if="!loggedIn" class="sj-sales-orders__primary" @tap="submitLogin">去登录</button>
        </view>

        <view v-else class="sj-sales-orders__list">
          <button
            v-for="order in orders"
            :key="order.id || order.sales_no"
            class="sj-sales-orders__card"
            @tap="submitOrderTap(order)"
          >
            <view class="sj-sales-orders__card-head">
              <text class="sj-sales-orders__code">{{ order.sales_no || order.order_no || order.id }}</text>
              <text class="sj-sales-orders__date">{{ order.date_text || order.sales_at }}</text>
            </view>
            <view class="sj-sales-orders__card-body">
              <image
                v-if="orderImage(order)"
                class="sj-sales-orders__product-image"
                :src="orderImage(order)"
                mode="aspectFill"
              />
              <view v-else class="sj-sales-orders__product-image sj-sales-orders__product-image--empty">图</view>
              <view class="sj-sales-orders__main">
                <text class="sj-sales-orders__customer">{{ order.customer_name || '客户未识别' }}</text>
                <text class="sj-sales-orders__product">{{ orderTitle(order) }}</text>
                <text class="sj-sales-orders__meta">{{ orderMeta(order) }}</text>
              </view>
            </view>
            <view class="sj-sales-orders__foot">
              <view class="sj-sales-orders__pay">
                <text class="sj-sales-orders__pay-status">{{ order.pay_status_text || order.status_text || '已记录' }}</text>
                <text class="sj-sales-orders__pay-type">{{ order.pay_type_text || '销售单' }}</text>
              </view>
              <text class="sj-sales-orders__amount">¥{{ order.receivable_amount || order.total_price || '0.00' }}</text>
            </view>
          </button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
function cleanText(value) {
  return String(value || '').trim();
}

function firstText(...values) {
  return values.map(cleanText).find(Boolean) || '';
}

function firstProduct(order = {}) {
  const products = Array.isArray(order.products) ? order.products : [];
  return products.find((item) => item && typeof item === 'object') || {};
}

export default {
  name: 'SjSalesOrdersPage',
  emits: ['back', 'login', 'keyword-input', 'search', 'order-tap'],
  props: {
    navTitle: { type: String, default: '销售单' },
    orders: { type: Array, default: () => [] },
    keyword: { type: String, default: '' },
    total: { type: Number, default: 0 },
    loading: { type: Boolean, default: false },
    loggedIn: { type: Boolean, default: false },
    hasBoundCustomer: { type: Boolean, default: false },
    internal: { type: Boolean, default: false },
  },
  computed: {
    summaryTitle() {
      return this.internal ? '销售单列表' : '我的销售单';
    },
    summarySubtitle() {
      if (!this.loggedIn) return '登录后查看销售单';
      if (!this.internal && !this.hasBoundCustomer) return '暂无客户信息';
      return '开单记录';
    },
    totalText() {
      return `${Number(this.total || this.orders.length || 0)} 条`;
    },
    emptyTitle() {
      if (!this.loggedIn) return '登录后查看销售单';
      if (!this.internal && !this.hasBoundCustomer) return '暂无客户信息';
      return '暂无销售单';
    },
    emptyText() {
      if (!this.loggedIn) return '登录后显示你的销售记录';
      if (!this.internal && !this.hasBoundCustomer) return '联系客服确认客户信息';
      return '搜索销售单号或产品名称';
    },
  },
  methods: {
    submitBack() {
      this.$emit('back');
    },
    submitLogin() {
      this.$emit('login');
    },
    submitSearch() {
      this.$emit('search');
    },
    handleKeywordInput(event = {}) {
      const value = event.detail && Object.prototype.hasOwnProperty.call(event.detail, 'value')
        ? event.detail.value
        : event.target && event.target.value;
      this.$emit('keyword-input', cleanText(value));
    },
    submitOrderTap(order) {
      this.$emit('order-tap', order);
    },
    orderImage(order) {
      const product = firstProduct(order);
      return firstText(order.image, product.image, product.cover, product.main_image_url);
    },
    orderTitle(order) {
      const product = firstProduct(order);
      return firstText(order.product_summary, product.title, order.title, '商品信息');
    },
    orderMeta(order) {
      const product = firstProduct(order);
      const products = Array.isArray(order.products) ? order.products : [];
      const quantity = firstText(order.total_quantity, order.buy_number_count, product.quantity);
      const spec = firstText(product.spec, product.color, order.spec);
      const parts = [];
      if (products.length > 1) parts.push(`${products.length} 款商品`);
      if (quantity) parts.push(`${quantity} 件`);
      if (spec) parts.push(spec);
      return parts.join(' · ') || '销售明细';
    },
  },
};
</script>

<style lang="scss" scoped>
.sj-sales-orders {
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f4f4f5;
  color: #18181b;
  font-family: "PingFang SC", "PingFang TC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

.sj-sales-orders__nav {
  position: relative;
  height: 105px;
  flex: none;
  background: #ffffff;
  border-bottom: 1rpx solid #e4e4e7;
}

.sj-sales-orders__nav-title {
  position: absolute;
  left: 176rpx;
  right: 176rpx;
  top: 104rpx;
  overflow: hidden;
  color: #18181b;
  font-size: 32rpx;
  line-height: 44rpx;
  font-weight: 600;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-sales-orders__back {
  position: absolute;
  left: 32rpx;
  top: 96rpx;
  width: 56rpx;
  height: 56rpx;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
}

.sj-sales-orders__back::after {
  border: 0;
}

.sj-sales-orders__back::before {
  content: "";
  position: absolute;
  left: 22rpx;
  top: 15rpx;
  width: 20rpx;
  height: 20rpx;
  border-left: 4rpx solid #18181b;
  border-bottom: 4rpx solid #18181b;
  transform: rotate(45deg);
}

.sj-sales-orders__toolbar {
  box-sizing: border-box;
  flex: none;
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx 28rpx 18rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #e4e4e7;
}

.sj-sales-orders__search {
  box-sizing: border-box;
  min-width: 0;
  flex: 1 1 auto;
  height: 64rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 0 24rpx;
  border: 1rpx solid #d4d4d8;
  border-radius: 999px;
  background: #ffffff;
}

.sj-sales-orders__search-icon {
  position: relative;
  width: 30rpx;
  height: 30rpx;
  flex: 0 0 auto;
  border: 4rpx solid #a1a1aa;
  border-radius: 999px;
}

.sj-sales-orders__search-icon::after {
  content: "";
  position: absolute;
  right: -9rpx;
  bottom: -7rpx;
  width: 14rpx;
  height: 4rpx;
  border-radius: 999px;
  background: #a1a1aa;
  transform: rotate(45deg);
}

.sj-sales-orders__input {
  min-width: 0;
  flex: 1 1 auto;
  height: 60rpx;
  color: #18181b;
  font-size: 26rpx;
  line-height: 60rpx;
  font-weight: 520;
}

.sj-sales-orders__placeholder {
  color: #a1a1aa;
}

.sj-sales-orders__search-button {
  height: 64rpx;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 12rpx;
  border: 0;
  background: transparent;
  color: #18181b;
  font-size: 26rpx;
  line-height: 64rpx;
  font-weight: 700;
}

.sj-sales-orders__search-button::after {
  border: 0;
}

.sj-sales-orders__body {
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.sj-sales-orders__content {
  box-sizing: border-box;
  display: grid;
  gap: 24rpx;
  padding: 24rpx 24rpx calc(56rpx + env(safe-area-inset-bottom));
}

.sj-sales-orders__summary,
.sj-sales-orders__card,
.sj-sales-orders__empty {
  box-sizing: border-box;
  width: 100%;
  border: 1rpx solid #e4e4e7;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 0 0 1rpx rgba(24, 24, 27, 0.04);
}

.sj-sales-orders__summary {
  min-height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 24rpx;
}

.sj-sales-orders__summary-title {
  display: block;
  color: #18181b;
  font-size: 32rpx;
  line-height: 44rpx;
  font-weight: 760;
}

.sj-sales-orders__summary-subtitle,
.sj-sales-orders__summary-count,
.sj-sales-orders__date,
.sj-sales-orders__meta,
.sj-sales-orders__pay-type,
.sj-sales-orders__empty-text {
  color: #71717a;
  font-size: 23rpx;
  line-height: 34rpx;
  font-weight: 560;
}

.sj-sales-orders__summary-count {
  flex: 0 0 auto;
  font-weight: 700;
}

.sj-sales-orders__list {
  display: grid;
  gap: 24rpx;
}

.sj-sales-orders__card {
  display: grid;
  gap: 18rpx;
  margin: 0;
  padding: 22rpx;
  color: inherit;
  font-family: inherit;
  text-align: left;
}

.sj-sales-orders__card::after {
  border: 0;
}

.sj-sales-orders__card-head,
.sj-sales-orders__foot {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.sj-sales-orders__code,
.sj-sales-orders__pay-status {
  min-width: 0;
  height: 40rpx;
  display: inline-flex;
  align-items: center;
  padding: 0 16rpx;
  border-radius: 999px;
  background: #18181b;
  color: #ffffff;
  font-size: 22rpx;
  line-height: 40rpx;
  font-weight: 760;
}

.sj-sales-orders__date {
  flex: 0 0 auto;
}

.sj-sales-orders__card-body {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.sj-sales-orders__product-image {
  width: 128rpx;
  height: 128rpx;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 24rpx;
  background: #f4f4f5;
}

.sj-sales-orders__product-image--empty {
  display: grid;
  place-items: center;
  color: #a1a1aa;
  font-size: 24rpx;
  font-weight: 700;
}

.sj-sales-orders__main {
  min-width: 0;
  flex: 1 1 auto;
  display: grid;
  gap: 6rpx;
}

.sj-sales-orders__customer {
  overflow: hidden;
  color: #18181b;
  font-size: 30rpx;
  line-height: 42rpx;
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-sales-orders__product {
  overflow: hidden;
  color: #18181b;
  font-size: 27rpx;
  line-height: 38rpx;
  font-weight: 680;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-sales-orders__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-sales-orders__pay {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.sj-sales-orders__pay-status {
  background: #f4f4f5;
  color: #52525b;
}

.sj-sales-orders__amount {
  flex: 0 0 auto;
  color: #18181b;
  font-size: 38rpx;
  line-height: 46rpx;
  font-weight: 820;
}

.sj-sales-orders__empty {
  min-height: 520rpx;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 12rpx;
  padding: 48rpx 36rpx;
  text-align: center;
}

.sj-sales-orders__empty-mark {
  width: 76rpx;
  height: 76rpx;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #f4f4f5;
  color: #71717a;
  font-size: 38rpx;
  line-height: 1;
  font-weight: 800;
}

.sj-sales-orders__empty-title {
  color: #18181b;
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 760;
}

.sj-sales-orders__primary {
  height: 76rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 18rpx 0 0;
  padding: 0 44rpx;
  border: 0;
  border-radius: 999px;
  background: #18181b;
  color: #ffffff;
  font-size: 26rpx;
  line-height: 38rpx;
  font-weight: 720;
}

.sj-sales-orders__primary::after {
  border: 0;
}
</style>
