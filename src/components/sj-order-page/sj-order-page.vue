<template>
  <view class="sj-order-page">
    <view class="sj-order-page__nav" :style="navShellStyle">
      <view class="sj-order-page__search" :style="navSearchStyle">
        <view class="sj-order-page__search-icon" @tap.stop="submit"></view>
        <input
          v-model="localKeyword"
          class="sj-order-page__input"
          :style="navInputStyle"
          confirm-type="search"
          :placeholder="placeholder"
          placeholder-class="sj-order-page__placeholder"
          @confirm="submit"
        />
      </view>
    </view>

    <scroll-view class="sj-order-page__body" scroll-y :show-scrollbar="false" :style="bodyStyle">
      <view class="sj-order-page__content">
        <view class="sj-order-page__tabs">
          <view
            v-for="item in statusOptions"
            :key="item.value"
            :class="['sj-order-page__tab', activeStatus === item.value ? 'is-active' : '']"
            @tap="selectStatus(item.value)"
          >
            <image class="sj-order-page__tab-icon" :src="statusIconSrc(item)" mode="aspectFit" />
            <text class="sj-order-page__tab-text">{{ item.label }}</text>
            <view v-if="activeStatus === item.value" class="sj-order-page__tab-indicator"></view>
          </view>
        </view>

        <view class="sj-order-page__panel">
          <view v-if="shouldShowInitialEmpty" class="sj-order-page__empty">
            <view class="sj-order-page__empty-inner">
              <view class="sj-order-page__empty-mark">?</view>
              <text class="sj-order-page__empty-title">搜索生产订单</text>
              <text class="sj-order-page__empty-text">输入订单号、客户或产品名称</text>
            </view>
          </view>

          <view v-else-if="loading" class="sj-order-page__skeleton">
            <view class="sj-order-page__skeleton-card"></view>
            <view class="sj-order-page__skeleton-card"></view>
          </view>

          <view v-else-if="displayOrders.length" class="sj-order-page__panel">
            <view class="sj-order-page__summary">
              <text class="sj-order-page__title">{{ listTitle }}</text>
              <text class="sj-order-page__count">{{ resultText }}</text>
            </view>
            <view class="sj-order-page__list">
              <sj-order-card
                v-for="item in displayOrders"
                :key="item.id || item.order_no || item.orderNo"
                :order="item"
                :can-edit="canEditOrders"
                @tap="emitOrderTap(item)"
                @detail="emitOrderTap(item)"
                @make-done="emitMakeDone(item)"
                @delivery-done="emitDeliveryDone(item)"
                @cancel-make="emitCancelMake(item)"
                @cancel-delivery="emitCancelDelivery(item)"
                @edit="emitEdit(item)"
              />
            </view>
          </view>

          <view v-else class="sj-order-page__empty">
            <view class="sj-order-page__empty-inner">
              <view class="sj-order-page__empty-mark">0</view>
              <text class="sj-order-page__empty-title">未找到订单</text>
              <text class="sj-order-page__empty-text">换个关键词再试</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import SjOrderCard from "../sj-order-card/sj-order-card.vue";

function cleanText(value) {
  return String(value || "").trim();
}

const STATUS_ICON_ASSETS = {
  all: {
    normal: "/static/icons/lucide/grid-2x2.svg",
    active: "/static/icons/lucide/grid-2x2-active.svg",
  },
  make: {
    normal: "/static/icons/lucide/pencil-ruler.svg",
    active: "/static/icons/lucide/pencil-ruler-active.svg",
  },
  delivery: {
    normal: "/static/icons/lucide/truck.svg",
    active: "/static/icons/lucide/truck-active.svg",
  },
  done: {
    normal: "/static/icons/lucide/circle-check.svg",
    active: "/static/icons/lucide/circle-check-active.svg",
  },
};

export default {
  name: "SjOrderPage",
  components: { SjOrderCard },
  emits: ["search", "status-change", "order-tap", "make-done", "delivery-done", "cancel-make", "cancel-delivery", "edit", "refresh"],
  props: {
    keyword: { type: String, default: "" },
    placeholder: { type: String, default: "搜索订单号、客户名称、商品名称" },
    role: { type: String, default: "guest" },
    orders: { type: Array, default: () => [] },
    searched: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    total: { type: Number, default: 0 },
    listTitle: { type: String, default: "订单" },
    activeStatus: { type: String, default: "all" },
    statusOptions: {
      type: Array,
      default: () => [
        { label: "全部", value: "all", icon: "all" },
        { label: "待制作", value: "pending_make", icon: "make" },
        { label: "待配送", value: "pending_delivery", icon: "delivery" },
        { label: "已完成", value: "done", icon: "done" },
      ],
    },
  },
  data() {
    return {
      localKeyword: this.keyword,
      navLayout: {
        left: 16,
        right: 112,
        top: 28,
        height: 32,
        navHeight: 105,
      },
    };
  },
  computed: {
    navShellStyle() {
      return {
        height: `${this.navLayout.navHeight}px`,
        '--sj-order-page-nav-height': `${this.navLayout.navHeight}px`,
      };
    },
    bodyStyle() {
      return {
        '--sj-order-page-nav-height': `${this.navLayout.navHeight}px`,
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
    navInputStyle() {
      const height = `${this.navLayout.height}px`;
      return { height, lineHeight: height };
    },
    isInternalUser() {
      return ["employee", "staff", "admin", "manager"].includes(cleanText(this.role));
    },
    roleIsCustomer() {
      return cleanText(this.role) === "customer";
    },
    canEditOrders() {
      return ["employee", "staff", "admin", "manager"].includes(cleanText(this.role));
    },
    shouldShowInitialEmpty() {
      return !this.isInternalUser && !this.roleIsCustomer && !this.searched && !this.loading;
    },
    displayOrders() {
      return this.orders || [];
    },
    resultText() {
      const total = Number(this.total || this.displayOrders.length || 0);
      return total ? `${total} 条订单` : "";
    },
  },
  watch: {
    keyword(nextValue) {
      this.localKeyword = nextValue;
    },
  },
  mounted() {
    this.setupNavLayout();
  },
  methods: {
    setupNavLayout() {
      const fallbackWidth = 375;
      let systemInfo = {};
      if (typeof uni !== "undefined" && typeof uni.getSystemInfoSync === "function") {
        try {
          systemInfo = uni.getSystemInfoSync() || {};
        } catch (error) {
          systemInfo = {};
        }
      }

      const windowWidth = Number(systemInfo.windowWidth || fallbackWidth);
      const statusBarHeight = Number(systemInfo.statusBarHeight || 20);
      let capsule = null;
      if (typeof uni !== "undefined" && typeof uni.getMenuButtonBoundingClientRect === "function") {
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
    submit() {
      this.$emit("search", cleanText(this.localKeyword));
    },
    selectStatus(value) {
      this.$emit("status-change", value);
    },
    statusIconSrc(item = {}) {
      const key = item.icon || item.value || "all";
      const icon = STATUS_ICON_ASSETS[key] || STATUS_ICON_ASSETS.all;
      return icon[this.activeStatus === item.value ? "active" : "normal"];
    },
    emitOrderTap(item) {
      this.$emit("order-tap", item);
    },
    emitMakeDone(item) {
      this.$emit("make-done", item);
    },
    emitDeliveryDone(item) {
      this.$emit("delivery-done", item);
    },
    emitCancelMake(item) {
      this.$emit("cancel-make", item);
    },
    emitCancelDelivery(item) {
      this.$emit("cancel-delivery", item);
    },
    emitEdit(item) {
      this.$emit("edit", item);
    },
  },
};
</script>

<style scoped>
.sj-order-page {
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

.sj-order-page__nav {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  flex: none;
  background: #ffffff;
  border-bottom: 1px solid #e4e4e7;
}

.sj-order-page__search {
  box-sizing: border-box;
  position: absolute;
  height: 32px;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 0 22rpx;
  border: 1rpx solid #d9d9d9;
  border-radius: 20px;
  background: #ffffff;
}

.sj-order-page__search-icon {
  position: relative;
  width: 24rpx;
  height: 24rpx;
  flex: 0 0 auto;
  border: 3rpx solid #a1a1aa;
  border-radius: 999px;
}

.sj-order-page__search-icon::after {
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

.sj-order-page__input {
  min-width: 0;
  flex: 1 1 auto;
  border: 0;
  outline: 0;
  padding: 0;
  background: transparent;
  color: #18181b;
  font-size: 24rpx;
  font-weight: 500;
}

.sj-order-page__placeholder {
  color: #a1a1aa;
  font-weight: 500;
}

.sj-order-page__tabs {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 12px;
  padding: 2px 0 14px;
}

.sj-order-page__tab {
  position: relative;
  box-sizing: border-box;
  min-width: 66px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #71717a;
  font-family: inherit;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}

.sj-order-page__tab.is-active {
  color: #18181b;
  font-weight: 800;
}

.sj-order-page__tab-text {
  display: block;
}

.sj-order-page__tab-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  display: block;
}

.sj-order-page__tab-indicator {
  position: absolute;
  left: 50%;
  bottom: -7px;
  width: 18px;
  height: 3px;
  border-radius: 2px;
  background: #18181b;
  transform: translateX(-50%);
}

.sj-order-page__body {
  box-sizing: border-box;
  height: calc(100vh - var(--sj-order-page-nav-height, 105px));
  min-height: 0;
  flex: 1 1 auto;
  overflow: auto;
}

.sj-order-page__content {
  box-sizing: border-box;
  padding: 24rpx 24rpx calc(260rpx + env(safe-area-inset-bottom));
}

.sj-order-page__panel,
.sj-order-page__list,
.sj-order-page__skeleton {
  display: grid;
  gap: 12px;
}

.sj-order-page__title,
.sj-order-page__empty-title {
  color: #18181b;
  font-weight: 700;
}

.sj-order-page__empty-text,
.sj-order-page__count {
  color: #71717a;
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
}

.sj-order-page__summary {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 2px 0;
}

.sj-order-page__title {
  font-size: 17px;
  line-height: 24px;
}

.sj-order-page__empty {
  box-sizing: border-box;
  min-height: 360px;
  display: grid;
  place-items: center;
  padding: 48px 22px;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(24, 24, 27, 0.08);
}

.sj-order-page__empty-inner {
  display: grid;
  justify-items: center;
  gap: 8px;
  text-align: center;
}

.sj-order-page__empty-mark {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #f4f4f5;
  color: #71717a;
  font-size: 22px;
  line-height: 1;
  font-weight: 800;
}

.sj-order-page__skeleton-card {
  height: 236px;
  border-radius: 14px;
  background: linear-gradient(110deg, #ffffff 8%, #ececef 18%, #ffffff 33%);
  background-size: 200% 100%;
  box-shadow: 0 0 0 1px rgba(24, 24, 27, 0.08);
  animation: sj-order-page-skeleton 1.15s ease-in-out infinite;
}

@keyframes sj-order-page-skeleton {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>
