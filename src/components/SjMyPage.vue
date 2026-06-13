<template>
  <view class="sj-my-page">
    <view class="sj-my-page__nav">
      <text class="sj-my-page__nav-title">{{ navTitle }}</text>
    </view>

    <scroll-view class="sj-my-page__body" scroll-y :show-scrollbar="false">
      <view class="sj-my-page__body-inner">
        <view class="sj-my-page__profile-card" @tap="emitProfileTap">
          <view :class="['sj-my-page__avatar', avatarToneClass]">
            <image v-if="avatarUrl" class="sj-my-page__avatar-image" :src="avatarUrl" mode="aspectFill" />
            <text v-else>{{ avatarLabel }}</text>
          </view>
          <view class="sj-my-page__profile-main">
            <view class="sj-my-page__profile-head">
              <text class="sj-my-page__name">{{ displayName }}</text>
              <text class="sj-my-page__role">{{ roleText }}</text>
            </view>
            <text class="sj-my-page__status">{{ statusText }}</text>
          </view>
          <view class="sj-my-page__chevron"></view>
        </view>

        <view v-if="showCustomerSummary" class="sj-my-page__customer-card">
          <view class="sj-my-page__customer-head">
            <view class="sj-my-page__customer-title-wrap">
              <text class="sj-my-page__customer-eyebrow">客户信息</text>
              <text class="sj-my-page__customer-name">{{ customerSummaryCustomer.name }}</text>
            </view>
            <view :class="['sj-my-page__balance', customerBalanceToneClass]">
              <text class="sj-my-page__balance-label">{{ customerBalance.status_text }}</text>
              <text class="sj-my-page__balance-value">{{ customerBalance.display_amount }}</text>
            </view>
          </view>
          <view class="sj-my-page__recent" v-if="customerRecentOrders.length">
            <text class="sj-my-page__recent-title">最近记录</text>
            <button
              v-for="item in customerRecentOrders"
              :key="item.id || item.order_no"
              class="sj-my-page__recent-order"
              @tap="emitRecentOrderTap(item)"
            >
              <image v-if="item.image" class="sj-my-page__recent-image" :src="item.image" mode="aspectFill" />
              <view v-else class="sj-my-page__recent-image sj-my-page__recent-image--empty">图</view>
              <view class="sj-my-page__recent-main">
                <view class="sj-my-page__recent-line">
                  <text class="sj-my-page__recent-name">{{ recentOrderNo(item) || item.product_name }}</text>
                  <text class="sj-my-page__recent-status">{{ item.status_text }}</text>
                </view>
                <text class="sj-my-page__recent-meta">{{ recentOrderMeta(item) }}</text>
                <text class="sj-my-page__recent-time">{{ item.time }}</text>
              </view>
            </button>
          </view>
          <view class="sj-my-page__recent-empty" v-else>
            <text>暂无近期记录</text>
          </view>
        </view>

        <view class="sj-my-page__menu-card">
          <button
            v-for="item in normalizedMenuItems"
            :key="item.action"
            class="sj-my-page__menu-item"
            @tap="handleMenuTap(item)"
          >
            <view :class="['sj-my-page__menu-icon', `sj-my-page__menu-icon--${item.icon}`]">
              <image class="sj-my-page__menu-icon-image" :src="menuIconSrc(item)" mode="aspectFit" />
            </view>
            <view class="sj-my-page__menu-main">
              <text class="sj-my-page__menu-title">{{ item.label }}</text>
              <text class="sj-my-page__menu-description">{{ item.description }}</text>
            </view>
            <view class="sj-my-page__chevron"></view>
          </button>
        </view>

        <view class="sj-my-page__actions">
          <button v-if="isLoggedIn" class="sj-my-page__secondary" @tap="submitLogout">退出登录</button>
          <button v-else class="sj-my-page__primary" @tap="submitLogin">登录账号</button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { workflowOrderNo } from '../utils/order.js';

function cleanText(value) {
  return String(value || '').trim();
}

function firstText(...values) {
  return values.map(cleanText).find(Boolean) || '';
}

const MY_MENU_ICON_ASSETS = {
  order: '/static/icons/lucide/my-clipboard-list.svg',
  footprint: '/static/icons/lucide/grid-2x2.svg',
  contact: '/static/icons/lucide/my-headset.svg',
  profile: '/static/icons/lucide/my-user-round.svg',
  settings: '/static/icons/lucide/my-settings.svg',
};

function defaultMenuItems() {
  return [
    { label: '销售单', description: '历史开单记录', action: 'orders', icon: 'order' },
    { label: '产品足迹', description: '已保存、最近浏览、常购商品', action: 'footprint', icon: 'footprint' },
    { label: '联系客服', description: '电话、微信、地址', action: 'contact', icon: 'contact' },
    { label: '账号资料', description: '身份与客户信息', action: 'profile', icon: 'profile' },
    { label: '设置', description: '账号与设置', action: 'settings', icon: 'settings' },
  ];
}

export default {
  name: 'SjMyPage',
  emits: ['login', 'logout', 'profile-tap', 'menu-tap', 'recent-order-tap'],
  props: {
    navTitle: { type: String, default: '我的' },
    user: { type: Object, default: () => ({}) },
    loggedIn: { type: Boolean, default: false },
    role: { type: String, default: 'guest' },
    menuItems: { type: Array, default: () => defaultMenuItems() },
    avatarFallback: { type: String, default: 'SJ' },
    customerSummary: { type: Object, default: null },
  },
  computed: {
    normalizedUser() {
      return this.user || {};
    },
    normalizedCustomerSummary() {
      return this.customerSummary || {};
    },
    isLoggedIn() {
      return Boolean(this.loggedIn);
    },
    showCustomerSummary() {
      return this.isLoggedIn && Boolean(this.normalizedCustomerSummary.bound && this.customerSummaryCustomer.id);
    },
    customerSummaryCustomer() {
      const customer = this.normalizedCustomerSummary.customer || {};
      return {
        id: customer.id || customer.customer_id || '',
        name: firstText(customer.name, customer.customer_name, this.normalizedUser.linked_party_name, '已绑定客户'),
      };
    },
    customerBalance() {
      const balance = this.normalizedCustomerSummary.balance || {};
      return {
        status_key: cleanText(balance.status_key || 'settled'),
        status_text: firstText(balance.status_text, '已结清'),
        display_amount: firstText(balance.display_amount, balance.amount, '¥0.00'),
        updated_at: firstText(balance.updated_at),
      };
    },
    customerBalanceToneClass() {
      return `sj-my-page__balance--${this.customerBalance.status_key || 'settled'}`;
    },
    customerRecentOrders() {
      const recent = this.normalizedCustomerSummary.recent;
      if (!Array.isArray(recent)) return [];
      return recent.filter((item) => item && typeof item === 'object').slice(0, 3);
    },
    resolvedRole() {
      return cleanText(
        this.normalizedUser.role
          || this.normalizedUser.role_key
          || this.normalizedUser.roleCode
          || this.normalizedUser.role_code
          || this.role
          || 'guest'
      );
    },
    displayName() {
      if (!this.isLoggedIn) return '游客浏览';
      return firstText(
        this.normalizedUser.display_name,
        this.normalizedUser.nickname,
        this.normalizedUser.name,
        this.normalizedUser.linked_party_name,
        this.normalizedUser.company,
        this.normalizedUser.party_name,
        this.normalizedUser.customer_name,
        this.normalizedUser.username,
        this.normalizedUser.mobile,
        this.normalizedUser.phone,
        '肆计包装用户'
      );
    },
    roleText() {
      const roleMap = {
        guest: '游客',
        customer: '客户',
        employee: '员工',
        staff: '员工',
        admin: '管理员',
        manager: '管理员',
      };
      return firstText(this.normalizedUser.role_label, this.normalizedUser.role_name, this.normalizedUser.roleName, roleMap[this.resolvedRole], '用户');
    },
    statusText() {
      if (!this.isLoggedIn) return '登录后查看销售单记录。';
      if (['employee', 'staff', 'admin', 'manager'].includes(this.resolvedRole)) {
        return '查看生产订单和销售记录。';
      }
      return '查看自己的销售单记录。';
    },
    avatarUrl() {
      return firstText(this.normalizedUser.avatar, this.normalizedUser.avatar_url, this.normalizedUser.headimgurl);
    },
    avatarLabel() {
      if (!this.isLoggedIn) return this.avatarFallback;
      const value = firstText(this.displayName, this.normalizedUser.mobile, this.normalizedUser.phone, this.avatarFallback);
      const first = Array.from(value)[0] || this.avatarFallback;
      return /[a-z0-9]/i.test(first) ? value.slice(0, 2).toUpperCase() : first;
    },
    avatarSeed() {
      const seed = firstText(
        this.normalizedUser.id,
        this.normalizedUser.user_id,
        this.normalizedUser.mobile,
        this.normalizedUser.phone,
        this.displayName,
        this.avatarFallback
      );
      return Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
    },
    avatarToneClass() {
      return `sj-my-page__avatar--tone-${this.avatarSeed % 4}`;
    },
    normalizedMenuItems() {
      const source = this.menuItems && this.menuItems.length ? this.menuItems : defaultMenuItems();
      return source.map((item, index) => ({
        label: item.label || item.title || '',
        description: item.description || item.desc || '',
        action: item.action || item.value || String(index),
        icon: item.icon || 'settings',
        raw: item,
      })).filter((item) => item.label);
    },
  },
  methods: {
    defaultMenuItems,
    menuIconSrc(item = {}) {
      return MY_MENU_ICON_ASSETS[item.icon || 'settings'] || MY_MENU_ICON_ASSETS.settings;
    },
    submitLogin() {
      this.$emit('login');
    },
    submitLogout() {
      this.$emit('logout');
    },
    emitProfileTap() {
      this.$emit('profile-tap', this.normalizedUser);
    },
    handleMenuTap(item) {
      this.$emit('menu-tap', item);
    },
    recentOrderNo(item) {
      return workflowOrderNo(item);
    },
    recentOrderMeta(item = {}) {
      const product = firstText(item.product_name, item.goods_name, item.productSummary, item.product_summary);
      const color = firstText(item.color, item.goods_color, item.color_text, '未填颜色');
      const quantity = firstText(item.quantity_text, item.quantityText, item.quantity);
      return [product, color, quantity].filter(Boolean).join(' · ');
    },
    emitRecentOrderTap(item) {
      this.$emit('recent-order-tap', item);
    },
  },
};
</script>

<style lang="scss" scoped>
.sj-my-page {
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

.sj-my-page__nav {
  position: relative;
  height: 105px;
  flex: none;
  background: #ffffff;
  border-bottom: 1rpx solid #e4e4e7;
}

.sj-my-page__nav-title {
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

.sj-my-page__body {
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.sj-my-page__body-inner {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 24rpx;
  padding: 24rpx 24rpx calc(172rpx + env(safe-area-inset-bottom));
}

.sj-my-page__profile-card,
.sj-my-page__customer-card,
.sj-my-page__menu-card {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border: 1rpx solid #e4e4e7;
  background: #ffffff;
}

.sj-my-page__profile-card {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  box-shadow: 0 0 0 1rpx rgba(24, 24, 27, 0.04);
}

.sj-my-page__avatar {
  width: 104rpx;
  height: 104rpx;
  flex: 0 0 auto;
  overflow: hidden;
  display: grid;
  place-items: center;
  border-radius: 32rpx;
  background: #18181b;
  color: #ffffff;
  font-size: 34rpx;
  line-height: 1;
  font-weight: 800;
}

.sj-my-page__avatar--tone-0 { background: #18181b; }
.sj-my-page__avatar--tone-1 { background: #1f4f46; }
.sj-my-page__avatar--tone-2 { background: #6b4e16; }
.sj-my-page__avatar--tone-3 { background: #334155; }

.sj-my-page__avatar-image {
  width: 100%;
  height: 100%;
  display: block;
}

.sj-my-page__profile-main,
.sj-my-page__menu-main {
  min-width: 0;
  flex: 1 1 auto;
  display: grid;
}

.sj-my-page__profile-main {
  gap: 10rpx;
}

.sj-my-page__profile-head {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.sj-my-page__name {
  min-width: 0;
  overflow: hidden;
  color: #18181b;
  font-size: 34rpx;
  line-height: 48rpx;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-my-page__role {
  height: 40rpx;
  display: inline-flex;
  align-items: center;
  flex: none;
  padding: 0 14rpx;
  border-radius: 999px;
  background: #f4f4f5;
  color: #71717a;
  font-size: 22rpx;
  line-height: 40rpx;
  font-weight: 650;
}

.sj-my-page__status,
.sj-my-page__menu-description {
  color: #71717a;
  font-weight: 500;
}

.sj-my-page__status {
  min-width: 0;
  font-size: 23rpx;
  line-height: 34rpx;
}

.sj-my-page__chevron {
  position: relative;
  width: 32rpx;
  height: 32rpx;
  flex: 0 0 auto;
}

.sj-my-page__chevron::after {
  content: "";
  position: absolute;
  top: 6rpx;
  left: 8rpx;
  width: 16rpx;
  height: 16rpx;
  border-top: 3rpx solid #a1a1aa;
  border-right: 3rpx solid #a1a1aa;
  transform: rotate(45deg);
}

.sj-my-page__customer-card {
  display: grid;
  gap: 22rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  box-shadow: 0 0 0 1rpx rgba(24, 24, 27, 0.04);
}

.sj-my-page__customer-head {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.sj-my-page__customer-title-wrap {
  min-width: 0;
  flex: 1 1 auto;
  display: grid;
  gap: 6rpx;
}

.sj-my-page__customer-eyebrow {
  color: #71717a;
  font-size: 22rpx;
  line-height: 30rpx;
  font-weight: 650;
}

.sj-my-page__customer-name {
  overflow: hidden;
  color: #18181b;
  font-size: 32rpx;
  line-height: 44rpx;
  font-weight: 780;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-my-page__balance {
  min-width: 156rpx;
  flex: 0 0 auto;
  display: grid;
  justify-items: end;
  gap: 4rpx;
}

.sj-my-page__balance-label {
  height: 36rpx;
  display: inline-flex;
  align-items: center;
  padding: 0 14rpx;
  border-radius: 999px;
  background: #f4f4f5;
  color: #71717a;
  font-size: 21rpx;
  line-height: 36rpx;
  font-weight: 700;
}

.sj-my-page__balance-value {
  color: #18181b;
  font-size: 38rpx;
  line-height: 46rpx;
  font-weight: 820;
}

.sj-my-page__balance--debt .sj-my-page__balance-label {
  background: #fef2f2;
  color: #b91c1c;
}

.sj-my-page__balance--credit .sj-my-page__balance-label {
  background: #ecfdf5;
  color: #047857;
}

.sj-my-page__recent {
  display: grid;
  gap: 14rpx;
}

.sj-my-page__recent-title {
  color: #71717a;
  font-size: 23rpx;
  line-height: 32rpx;
  font-weight: 700;
}

.sj-my-page__recent-order {
  width: 100%;
  min-width: 0;
  min-height: 116rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 0;
  padding: 14rpx;
  border: 1rpx solid #e4e4e7;
  border-radius: 22rpx;
  background: #fafafa;
  color: inherit;
  font-family: inherit;
  text-align: left;
}

.sj-my-page__recent-order::after {
  border: 0;
}

.sj-my-page__recent-image {
  width: 88rpx;
  height: 88rpx;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 18rpx;
  background: #f4f4f5;
}

.sj-my-page__recent-image--empty {
  display: grid;
  place-items: center;
  color: #a1a1aa;
  font-size: 24rpx;
  font-weight: 700;
}

.sj-my-page__recent-main {
  min-width: 0;
  flex: 1 1 auto;
  display: grid;
  gap: 4rpx;
}

.sj-my-page__recent-line {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.sj-my-page__recent-name {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  color: #18181b;
  font-size: 26rpx;
  line-height: 36rpx;
  font-weight: 740;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-my-page__recent-status {
  height: 34rpx;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding: 0 12rpx;
  border-radius: 999px;
  background: #f4f4f5;
  color: #52525b;
  font-size: 20rpx;
  line-height: 34rpx;
  font-weight: 700;
}

.sj-my-page__recent-meta,
.sj-my-page__recent-time,
.sj-my-page__recent-empty {
  color: #71717a;
  font-size: 22rpx;
  line-height: 32rpx;
  font-weight: 560;
}

.sj-my-page__recent-empty {
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: #fafafa;
}

.sj-my-page__menu-title {
  color: #18181b;
  font-weight: 700;
}

.sj-my-page__menu-card {
  overflow: hidden;
  border-radius: 28rpx;
  box-shadow: 0 0 0 1rpx rgba(24, 24, 27, 0.04);
}

.sj-my-page__menu-item {
  min-height: 104rpx;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin: 0;
  padding: 20rpx 24rpx;
  border: 0;
  border-bottom: 1rpx solid #e4e4e7;
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
}

.sj-my-page__menu-item:last-child {
  border-bottom: 0;
}

.sj-my-page__menu-item::after {
  border: 0;
}

.sj-my-page__menu-icon {
  width: 56rpx;
  height: 56rpx;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 20rpx;
  background: #f4f4f5;
}

.sj-my-page__menu-icon-image {
  width: 34rpx;
  height: 34rpx;
  display: block;
}

.sj-my-page__menu-main {
  gap: 4rpx;
}

.sj-my-page__menu-title {
  overflow: hidden;
  font-size: 27rpx;
  line-height: 38rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-my-page__menu-description {
  font-size: 23rpx;
  line-height: 34rpx;
}

.sj-my-page__actions {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  display: grid;
  gap: 16rpx;
}

.sj-my-page__primary,
.sj-my-page__secondary {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  height: 84rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 28rpx;
  border-radius: 999px;
  font-family: inherit;
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 700;
  letter-spacing: 0;
  white-space: nowrap;
}

.sj-my-page__primary {
  border: 0;
  background: #18181b;
  color: #ffffff;
}

.sj-my-page__secondary {
  border: 1rpx solid #e4e4e7;
  background: #ffffff;
  color: #18181b;
}

.sj-my-page__primary::after,
.sj-my-page__secondary::after {
  border: 0;
}
</style>
