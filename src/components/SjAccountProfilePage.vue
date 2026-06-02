<template>
  <view class="sj-account-profile">
    <view class="sj-account-profile__nav">
      <button class="sj-account-profile__back" aria-label="返回" @tap="submitBack"></button>
      <text class="sj-account-profile__nav-title">{{ navTitle }}</text>
    </view>

    <scroll-view class="sj-account-profile__body" scroll-y :show-scrollbar="false">
      <view class="sj-account-profile__hero">
        <view :class="['sj-account-profile__avatar', avatarToneClass]">
          <image v-if="avatarUrl" class="sj-account-profile__avatar-image" :src="avatarUrl" mode="aspectFill" />
          <text v-else>{{ avatarLabel }}</text>
        </view>
        <view class="sj-account-profile__hero-main">
          <view class="sj-account-profile__hero-head">
            <text class="sj-account-profile__name">{{ displayName }}</text>
            <text class="sj-account-profile__role">{{ roleText }}</text>
          </view>
          <text class="sj-account-profile__subtitle">{{ summaryText }}</text>
        </view>
      </view>

      <view class="sj-account-profile__section">
        <text class="sj-account-profile__section-title">基本信息</text>
        <view
          v-for="row in accountRows"
          :key="row.label"
          class="sj-account-profile__row"
        >
          <text class="sj-account-profile__row-label">{{ row.label }}</text>
          <text :class="['sj-account-profile__row-value', row.muted ? 'is-muted' : '']">{{ row.value }}</text>
        </view>
      </view>

      <view class="sj-account-profile__section">
        <text class="sj-account-profile__section-title">账号状态</text>
        <view
          v-for="row in permissionRows"
          :key="row.label"
          class="sj-account-profile__row"
        >
          <text class="sj-account-profile__row-label">{{ row.label }}</text>
          <text :class="['sj-account-profile__row-value', row.muted ? 'is-muted' : '']">{{ row.value }}</text>
        </view>
      </view>

      <view class="sj-account-profile__actions">
        <button v-if="!isLoggedIn" class="sj-account-profile__primary" @tap="submitLogin">去登录</button>
        <button v-else class="sj-account-profile__secondary" @tap="submitSettings">账号设置</button>
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

function maskPhone(value) {
  const phone = cleanText(value).replace(/\D+/g, '');
  if (!/^1\d{10}$/.test(phone)) return '';
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export default {
  name: 'SjAccountProfilePage',
  emits: ['back', 'login', 'settings'],
  props: {
    navTitle: { type: String, default: '账号资料' },
    user: { type: Object, default: () => ({}) },
    loggedIn: { type: Boolean, default: false },
    role: { type: String, default: 'guest' },
  },
  computed: {
    normalizedUser() {
      return this.user || {};
    },
    isLoggedIn() {
      return Boolean(this.loggedIn);
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
    roleText() {
      const roleMap = {
        admin: '管理员',
        manager: '管理员',
        staff: '员工',
        employee: '员工',
        customer: '客户',
        guest: '游客',
      };
      return firstText(
        this.normalizedUser.role_text,
        this.normalizedUser.role_label,
        this.normalizedUser.role_name,
        roleMap[this.resolvedRole],
        '用户'
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
        '北极星智能体用户'
      );
    },
    summaryText() {
      if (!this.isLoggedIn) return '登录后查看账号资料。';
      if (this.canEditOrders) return '内部账号，可处理生产订单。';
      return this.boundCustomer ? '已关联客户信息。' : '暂未关联客户信息。';
    },
    avatarUrl() {
      return firstText(this.normalizedUser.avatar, this.normalizedUser.avatar_url, this.normalizedUser.headimgurl);
    },
    avatarLabel() {
      const value = firstText(this.displayName, this.normalizedUser.mobile, this.normalizedUser.phone, 'SJ');
      const first = Array.from(value)[0] || 'S';
      return /[a-z0-9]/i.test(first) ? value.slice(0, 2).toUpperCase() : first;
    },
    avatarSeed() {
      const seed = firstText(
        this.normalizedUser.id,
        this.normalizedUser.user_id,
        this.normalizedUser.mobile,
        this.normalizedUser.phone,
        this.displayName
      );
      return Array.from(seed || 'SJ').reduce((total, char) => total + char.charCodeAt(0), 0);
    },
    avatarToneClass() {
      return `sj-account-profile__avatar--tone-${this.avatarSeed % 4}`;
    },
    phoneText() {
      return maskPhone(this.normalizedUser.phone || this.normalizedUser.mobile) || '未绑定';
    },
    boundCustomer() {
      return firstText(
        this.normalizedUser.linked_party_name,
        this.normalizedUser.party_name,
        this.normalizedUser.customer_name,
        this.normalizedUser.company
      );
    },
    accountStatus() {
      if (!this.isLoggedIn) return '未登录';
      if (Number(this.normalizedUser.is_active) === 0) return '未启用';
      const approval = cleanText(this.normalizedUser.approval_status);
      if (approval === 'pending') return '待审核';
      if (approval === 'rejected') return '已停用';
      return '正常';
    },
    canEditOrders() {
      return ['admin', 'manager', 'staff', 'employee'].includes(this.resolvedRole) || Number(this.normalizedUser.is_admin) === 1;
    },
    accountRows() {
      return [
        { label: '手机号', value: this.isLoggedIn ? this.phoneText : '未登录', muted: !this.isLoggedIn || this.phoneText === '未绑定' },
        { label: '微信绑定', value: this.isLoggedIn ? '可用' : '未登录', muted: !this.isLoggedIn },
        { label: '客户信息', value: this.boundCustomer || '暂无客户信息', muted: !this.boundCustomer },
        { label: '账号状态', value: this.accountStatus, muted: this.accountStatus !== '正常' },
      ];
    },
    permissionRows() {
      if (!this.isLoggedIn) {
        return [
          { label: '账号角色', value: '游客', muted: true },
          { label: '客户信息', value: '登录后查看', muted: true },
          { label: '生产操作', value: '未开放', muted: true },
        ];
      }
      return [
        { label: '账号角色', value: this.roleText, muted: false },
        { label: '客户信息', value: this.boundCustomer || '暂无客户信息', muted: !this.boundCustomer },
        { label: '生产操作', value: this.canEditOrders ? '可用' : '未开放', muted: !this.canEditOrders },
      ];
    },
  },
  methods: {
    submitBack() {
      this.$emit('back');
    },
    submitLogin() {
      this.$emit('login');
    },
    submitSettings() {
      this.$emit('settings');
    },
  },
};
</script>

<style lang="scss" scoped>
.sj-account-profile,
.sj-account-profile__nav,
.sj-account-profile__body,
.sj-account-profile__hero,
.sj-account-profile__section,
.sj-account-profile__row,
.sj-account-profile__actions,
.sj-account-profile__primary,
.sj-account-profile__secondary {
  box-sizing: border-box;
}

.sj-account-profile {
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

.sj-account-profile__nav {
  position: relative;
  height: 210rpx;
  flex: none;
  background: #ffffff;
  border-bottom: 1rpx solid #e4e4e7;
}

.sj-account-profile__back {
  position: absolute;
  left: 24rpx;
  top: 102rpx;
  width: 72rpx;
  height: 72rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 999rpx;
  background: transparent;
}

.sj-account-profile__back::after {
  border: 0;
}

.sj-account-profile__back::before {
  content: "";
  position: absolute;
  left: 28rpx;
  top: 20rpx;
  width: 24rpx;
  height: 24rpx;
  border-left: 4rpx solid #18181b;
  border-bottom: 4rpx solid #18181b;
  transform: rotate(45deg);
}

.sj-account-profile__nav-title {
  position: absolute;
  left: 176rpx;
  right: 176rpx;
  top: 116rpx;
  overflow: hidden;
  color: #18181b;
  font-size: 32rpx;
  line-height: 44rpx;
  font-weight: 600;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-account-profile__body {
  min-height: 0;
  flex: 1 1 auto;
  overflow: auto;
  padding: 24rpx;
  padding-bottom: calc(56rpx + env(safe-area-inset-bottom));
}

.sj-account-profile__hero,
.sj-account-profile__section {
  width: 100%;
  margin-bottom: 40rpx;
  border: 1rpx solid #e4e4e7;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 0 0 1rpx rgba(24, 24, 27, 0.04);
}

.sj-account-profile__hero {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 28rpx;
}

.sj-account-profile__avatar {
  width: 112rpx;
  height: 112rpx;
  flex: 0 0 auto;
  overflow: hidden;
  display: grid;
  place-items: center;
  border-radius: 34rpx;
  background: #18181b;
  color: #ffffff;
  font-size: 36rpx;
  line-height: 1;
  font-weight: 800;
}

.sj-account-profile__avatar--tone-0 { background: #18181b; }
.sj-account-profile__avatar--tone-1 { background: #1f4f46; }
.sj-account-profile__avatar--tone-2 { background: #6b4e16; }
.sj-account-profile__avatar--tone-3 { background: #334155; }

.sj-account-profile__avatar-image {
  width: 100%;
  height: 100%;
  display: block;
}

.sj-account-profile__hero-main {
  min-width: 0;
  flex: 1 1 auto;
  display: grid;
  gap: 10rpx;
}

.sj-account-profile__hero-head {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.sj-account-profile__name {
  min-width: 0;
  overflow: hidden;
  color: #18181b;
  font-size: 36rpx;
  line-height: 50rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-account-profile__role {
  height: 40rpx;
  display: inline-flex;
  align-items: center;
  flex: none;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: #f4f4f5;
  color: #71717a;
  font-size: 22rpx;
  line-height: 40rpx;
  font-weight: 650;
}

.sj-account-profile__subtitle {
  color: #71717a;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 500;
}

.sj-account-profile__section {
  overflow: hidden;
}

.sj-account-profile__section-title {
  display: block;
  padding: 24rpx 24rpx 12rpx;
  color: #71717a;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 700;
}

.sj-account-profile__row {
  min-height: 96rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 18rpx 24rpx;
  border-top: 1rpx solid #e4e4e7;
}

.sj-account-profile__row-label {
  width: 160rpx;
  flex: 0 0 auto;
  color: #71717a;
  font-size: 26rpx;
  line-height: 38rpx;
  font-weight: 700;
}

.sj-account-profile__row-value {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  color: #18181b;
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 750;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-account-profile__row-value.is-muted {
  color: #a1a1aa;
}

.sj-account-profile__actions {
  display: grid;
  gap: 20rpx;
}

.sj-account-profile__primary,
.sj-account-profile__secondary {
  height: 84rpx;
  width: 100%;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  border-radius: 999rpx;
  font-family: inherit;
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 750;
}

.sj-account-profile__primary::after,
.sj-account-profile__secondary::after {
  border: 0;
}

.sj-account-profile__primary {
  border: 1rpx solid #18181b;
  background: #18181b;
  color: #ffffff;
}

.sj-account-profile__secondary {
  border: 1rpx solid #e4e4e7;
  background: #ffffff;
  color: #18181b;
}
</style>
