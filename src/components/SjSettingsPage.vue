<template>
  <view class="sj-settings-page">
    <view class="sj-settings-page__nav">
      <button class="sj-settings-page__back" aria-label="返回" @tap="submitBack"></button>
      <text class="sj-settings-page__nav-title">{{ navTitle }}</text>
    </view>

    <scroll-view class="sj-settings-page__body" scroll-y :show-scrollbar="false">
      <view class="sj-settings-page__summary">
        <text class="sj-settings-page__summary-title">{{ summaryTitle }}</text>
        <text class="sj-settings-page__summary-text">{{ summaryText }}</text>
      </view>

      <view class="sj-settings-page__section">
        <text class="sj-settings-page__section-title">账号设置</text>
        <template v-for="item in accountItems" :key="item.action">
          <button
            v-if="item.openType === 'getPhoneNumber'"
            :class="['sj-settings-page__item', item.static ? 'is-static' : '']"
            open-type="getPhoneNumber"
            @getphonenumber="handlePhoneNumber(item, $event)"
            @tap="handleItemTap(item)"
          >
            <view :class="iconClass(item)">
              <image class="sj-settings-page__icon-image" :src="iconSrc(item)" mode="aspectFit" />
            </view>
            <view class="sj-settings-page__main">
              <text class="sj-settings-page__label">{{ item.label }}</text>
              <text class="sj-settings-page__description">{{ item.description }}</text>
            </view>
            <text v-if="item.value" class="sj-settings-page__value">{{ item.value }}</text>
            <view v-if="!item.static" class="sj-settings-page__chevron"></view>
          </button>
          <button
            v-else
            :class="['sj-settings-page__item', item.static ? 'is-static' : '']"
            @tap="handleItemTap(item)"
          >
            <view :class="iconClass(item)">
              <image class="sj-settings-page__icon-image" :src="iconSrc(item)" mode="aspectFit" />
            </view>
            <view class="sj-settings-page__main">
              <text class="sj-settings-page__label">{{ item.label }}</text>
              <text class="sj-settings-page__description">{{ item.description }}</text>
            </view>
            <text v-if="item.value" class="sj-settings-page__value">{{ item.value }}</text>
            <view v-if="!item.static" class="sj-settings-page__chevron"></view>
          </button>
        </template>
      </view>

      <view v-if="passwordPanelOpen" class="sj-settings-page__password-panel">
        <view class="sj-settings-page__password-head">
          <view class="sj-settings-page__password-copy">
            <text class="sj-settings-page__password-title">设置登录密码</text>
            <text class="sj-settings-page__password-text">下次可用账号密码登录。</text>
          </view>
          <button class="sj-settings-page__password-close" @tap="closePasswordPanel">取消</button>
        </view>
        <view class="sj-settings-page__field">
          <text class="sj-settings-page__field-label">当前密码</text>
          <input
            class="sj-settings-page__field-input"
            password
            :value="passwordForm.old_password"
            placeholder="首次设置可不填"
            placeholder-class="sj-settings-page__field-placeholder"
            @input="updatePasswordField('old_password', $event)"
          />
        </view>
        <view class="sj-settings-page__field">
          <text class="sj-settings-page__field-label">新密码</text>
          <input
            class="sj-settings-page__field-input"
            password
            :value="passwordForm.new_password"
            placeholder="至少 6 位"
            placeholder-class="sj-settings-page__field-placeholder"
            @input="updatePasswordField('new_password', $event)"
          />
        </view>
        <view class="sj-settings-page__field">
          <text class="sj-settings-page__field-label">确认密码</text>
          <input
            class="sj-settings-page__field-input"
            password
            :value="passwordForm.confirm_password"
            placeholder="再次输入新密码"
            placeholder-class="sj-settings-page__field-placeholder"
            @input="updatePasswordField('confirm_password', $event)"
          />
        </view>
        <text v-if="passwordError" class="sj-settings-page__password-error">{{ passwordError }}</text>
        <button
          class="sj-settings-page__password-submit"
          :disabled="passwordBusyState"
          @tap="submitPassword"
        >{{ passwordBusyState ? '保存中' : '保存密码' }}</button>
      </view>

      <view v-if="usernamePanelOpen" class="sj-settings-page__username-panel">
        <view class="sj-settings-page__password-head">
          <view class="sj-settings-page__password-copy">
            <text class="sj-settings-page__password-title">修改用户名</text>
            <text class="sj-settings-page__password-text">用于页面显示。</text>
          </view>
          <button class="sj-settings-page__password-close" @tap="closeUsernamePanel">取消</button>
        </view>
        <view class="sj-settings-page__field">
          <text class="sj-settings-page__field-label">用户名</text>
          <input
            class="sj-settings-page__field-input"
            :value="usernameForm.display_name"
            placeholder="请输入用户名"
            placeholder-class="sj-settings-page__field-placeholder"
            @input="updateUsernameField('display_name', $event)"
          />
        </view>
        <text v-if="usernameError" class="sj-settings-page__password-error">{{ usernameError }}</text>
        <button
          class="sj-settings-page__password-submit"
          :disabled="usernameBusyState"
          @tap="submitUsername"
        >{{ usernameBusyState ? '保存中' : '保存用户名' }}</button>
      </view>

      <view class="sj-settings-page__section">
        <text class="sj-settings-page__section-title">通用设置</text>
        <button
          v-for="item in generalItems"
          :key="item.action"
          :class="['sj-settings-page__item', item.static ? 'is-static' : '']"
          @tap="handleItemTap(item)"
        >
          <view :class="iconClass(item)">
            <image class="sj-settings-page__icon-image" :src="iconSrc(item)" mode="aspectFit" />
          </view>
          <view class="sj-settings-page__main">
            <text class="sj-settings-page__label">{{ item.label }}</text>
            <text class="sj-settings-page__description">{{ item.description }}</text>
          </view>
          <text v-if="item.value" class="sj-settings-page__value">{{ item.value }}</text>
          <view v-if="!item.static" class="sj-settings-page__chevron"></view>
        </button>
      </view>

      <view class="sj-settings-page__actions">
        <button v-if="loggedIn" class="sj-settings-page__logout" @tap="submitLogout">退出登录</button>
        <button v-else class="sj-settings-page__login" @tap="submitLogin">去登录</button>
      </view>
    </scroll-view>
  </view>
</template>

<script>
function cleanText(value) {
  return String(value || '').trim();
}

function maskPhone(value) {
  const phone = cleanText(value).replace(/\D+/g, '');
  if (!/^1\d{10}$/.test(phone)) return '';
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

const SETTINGS_ICON_ASSETS = {
  username: '/static/icons/lucide/settings-user-round.svg',
  phone: '/static/icons/lucide/settings-smartphone.svg',
  password: '/static/icons/lucide/settings-lock-keyhole.svg',
  wechat: '/static/icons/lucide/settings-message-circle.svg',
  contact: '/static/icons/lucide/settings-headset.svg',
  document: '/static/icons/lucide/settings-file-text.svg',
  trash: '/static/icons/lucide/settings-trash-2.svg',
  info: '/static/icons/lucide/settings-circle-info.svg',
};

export default {
  name: 'SjSettingsPage',
  emits: ['back', 'item-tap', 'logout', 'login', 'password-submit', 'username-submit', 'phone-bind'],
  props: {
    navTitle: { type: String, default: '设置' },
    user: { type: Object, default: () => ({}) },
    loggedIn: { type: Boolean, default: false },
    version: { type: String, default: '0.1.0' },
    passwordBusy: { type: Boolean, default: false },
  },
  data() {
    return {
      passwordPanelOpen: false,
      passwordSubmitting: false,
      passwordError: '',
      usernamePanelOpen: false,
      usernameSubmitting: false,
      usernameError: '',
      passwordForm: {
        old_password: '',
        new_password: '',
        confirm_password: '',
      },
      usernameForm: {
        display_name: '',
      },
    };
  },
  computed: {
    normalizedUser() {
      return this.user || {};
    },
    displayPhone() {
      return maskPhone(this.normalizedUser.phone || this.normalizedUser.mobile);
    },
    displayUsername() {
      return cleanText(this.normalizedUser.display_name || this.normalizedUser.nickname || this.normalizedUser.name);
    },
    canEditDisplayName() {
      if (!this.loggedIn) return false;
      if (Object.prototype.hasOwnProperty.call(this.normalizedUser, 'can_edit_display_name')) {
        return this.normalizedUser.can_edit_display_name !== false;
      }
      if (this.normalizedUser.display_name_source === 'customer' || this.normalizedUser.linked_party_id) {
        return false;
      }
      return true;
    },
    summaryTitle() {
      return '账号与设置';
    },
    summaryText() {
      return this.loggedIn
        ? '管理登录方式和常用信息。'
        : '登录后查看账号信息。';
    },
    passwordBusyState() {
      return this.passwordBusy || this.passwordSubmitting;
    },
    usernameBusyState() {
      return this.passwordBusy || this.usernameSubmitting;
    },
    accountItems() {
      return [
        {
          label: '用户名',
          description: this.loggedIn
            ? (this.canEditDisplayName ? '显示名称' : '客户名称')
            : '登录后设置',
          value: this.loggedIn ? (this.displayUsername || '未设置') : '',
          action: this.canEditDisplayName ? 'username' : 'customer-name',
          icon: 'username',
          static: !this.canEditDisplayName,
        },
        {
          label: '手机号登录',
          description: this.loggedIn ? '手机号登录' : '登录后设置',
          value: this.displayPhone || (this.loggedIn ? '未绑定' : ''),
          action: 'phone',
          openType: this.loggedIn ? 'getPhoneNumber' : '',
          icon: 'phone',
        },
        {
          label: '账号密码',
          description: '修改密码',
          value: this.loggedIn ? '设置' : '',
          action: 'password',
          icon: 'password',
        },
        {
          label: '微信登录',
          description: '微信登录',
          value: this.loggedIn ? '可用' : '',
          action: 'wechat',
          icon: 'wechat',
        },
      ];
    },
    generalItems() {
      return [
        { label: '联系客服', description: '联系客服', action: 'contact', icon: 'contact' },
        { label: '用户协议', description: '用户协议', action: 'agreement', icon: 'document' },
        { label: '隐私政策', description: '隐私政策', action: 'privacy', icon: 'document' },
        { label: '清理缓存', description: '清理缓存', action: 'clear-cache', icon: 'trash' },
        { label: '当前版本', description: '北极星智能体', value: this.version, action: 'version', icon: 'info', static: true },
      ];
    },
  },
  methods: {
    iconClass(item) {
      return ['sj-settings-page__icon', `sj-settings-page__icon--${item.icon || 'info'}`];
    },
    iconSrc(item = {}) {
      return SETTINGS_ICON_ASSETS[item.icon || 'info'] || SETTINGS_ICON_ASSETS.info;
    },
    submitBack() {
      this.$emit('back');
    },
    handleItemTap(item) {
      if (!item) return;
      if (item.action === 'customer-name') return;
      if (item.static) return;
      if (item.action === 'username' && this.loggedIn) {
        this.openUsernamePanel();
        return;
      }
      if (item.action === 'password' && this.loggedIn) {
        this.openPasswordPanel();
        return;
      }
      if (item.action === 'phone' && this.loggedIn) return;
      this.$emit('item-tap', item);
    },
    handlePhoneNumber(item, event) {
      if (!item || item.action !== 'phone') return;
      if (!this.loggedIn) {
        this.$emit('item-tap', item);
        return;
      }
      this.$emit('phone-bind', (event && event.detail) || {});
    },
    submitLogout() {
      this.$emit('logout');
    },
    submitLogin() {
      this.$emit('login');
    },
    openPasswordPanel() {
      this.passwordPanelOpen = true;
      this.passwordError = '';
    },
    openUsernamePanel() {
      this.usernamePanelOpen = true;
      this.usernameError = '';
      this.usernameForm = {
        display_name: this.displayUsername,
      };
    },
    closePasswordPanel() {
      if (this.passwordBusyState) return;
      this.passwordPanelOpen = false;
      this.resetPasswordForm();
    },
    closeUsernamePanel() {
      if (this.usernameBusyState) return;
      this.usernamePanelOpen = false;
      this.resetUsernameForm();
    },
    resetPasswordForm() {
      this.passwordSubmitting = false;
      this.passwordError = '';
      this.passwordForm = {
        old_password: '',
        new_password: '',
        confirm_password: '',
      };
    },
    resetUsernameForm() {
      this.usernameSubmitting = false;
      this.usernameError = '';
      this.usernameForm = {
        display_name: '',
      };
    },
    updatePasswordField(field, event) {
      const value = event && event.detail ? event.detail.value : event;
      this.passwordForm = {
        ...this.passwordForm,
        [field]: String(value || ''),
      };
    },
    updateUsernameField(field, event) {
      const value = event && event.detail ? event.detail.value : event;
      this.usernameForm = {
        ...this.usernameForm,
        [field]: String(value || ''),
      };
    },
    submitPassword() {
      if (this.passwordBusyState) return;
      const oldPassword = cleanText(this.passwordForm.old_password);
      const newPassword = cleanText(this.passwordForm.new_password);
      const confirmPassword = cleanText(this.passwordForm.confirm_password);
      if (newPassword.length < 6) {
        this.passwordError = '新密码至少 6 位';
        return;
      }
      if (newPassword !== confirmPassword) {
        this.passwordError = '两次密码不一致';
        return;
      }
      this.passwordError = '';
      this.passwordSubmitting = true;
      this.$emit('password-submit', {
        old_password: oldPassword,
        current_password: oldPassword,
        new_password: newPassword,
        password: newPassword,
      });
    },
    submitUsername() {
      if (this.usernameBusyState) return;
      const displayName = cleanText(this.usernameForm.display_name);
      if (!displayName) {
        this.usernameError = '请输入用户名';
        return;
      }
      if (displayName.length > 40) {
        this.usernameError = '用户名不能超过 40 个字';
        return;
      }
      this.usernameError = '';
      this.usernameSubmitting = true;
      this.$emit('username-submit', {
        display_name: displayName,
        nickname: displayName,
      });
    },
    finishPasswordSubmit(result = {}) {
      this.passwordSubmitting = false;
      if (result.success) {
        this.passwordPanelOpen = false;
        this.resetPasswordForm();
        return;
      }
      this.passwordError = result.message || '保存失败';
    },
    finishUsernameSubmit(result = {}) {
      this.usernameSubmitting = false;
      if (result.success) {
        this.usernamePanelOpen = false;
        this.resetUsernameForm();
        return;
      }
      this.usernameError = result.message || '保存失败';
    },
  },
};
</script>

<style lang="scss" scoped>
.sj-settings-page,
.sj-settings-page__nav,
.sj-settings-page__body,
.sj-settings-page__summary,
.sj-settings-page__section,
.sj-settings-page__item,
.sj-settings-page__password-panel,
.sj-settings-page__username-panel,
.sj-settings-page__password-close,
.sj-settings-page__password-submit,
.sj-settings-page__logout,
.sj-settings-page__login {
  box-sizing: border-box;
}

.sj-settings-page {
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

.sj-settings-page__nav {
  position: relative;
  height: 210rpx;
  flex: none;
  background: #ffffff;
  border-bottom: 1rpx solid #e4e4e7;
}

.sj-settings-page__back {
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

.sj-settings-page__back::after {
  border: 0;
}

.sj-settings-page__back::before {
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

.sj-settings-page__nav-title {
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

.sj-settings-page__body {
  min-height: 0;
  flex: 1 1 auto;
  overflow: auto;
  display: block;
  padding: 24rpx;
  padding-bottom: calc(56rpx + env(safe-area-inset-bottom));
}

.sj-settings-page__summary,
.sj-settings-page__section {
  border: 1rpx solid #e4e4e7;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 0 0 1rpx rgba(24, 24, 27, 0.04);
}

.sj-settings-page__summary,
.sj-settings-page__section,
.sj-settings-page__password-panel {
  margin-bottom: 40rpx;
}

.sj-settings-page__username-panel {
  margin-bottom: 40rpx;
}

.sj-settings-page__summary {
  display: grid;
  gap: 8rpx;
  padding: 28rpx;
}

.sj-settings-page__summary-title {
  color: #18181b;
  font-size: 34rpx;
  line-height: 48rpx;
  font-weight: 750;
}

.sj-settings-page__summary-text {
  color: #71717a;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 500;
}

.sj-settings-page__section {
  overflow: hidden;
}

.sj-settings-page__password-panel,
.sj-settings-page__username-panel {
  display: grid;
  gap: 24rpx;
  padding: 28rpx;
  border: 1rpx solid #e4e4e7;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 0 0 1rpx rgba(24, 24, 27, 0.04);
}

.sj-settings-page__password-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}

.sj-settings-page__password-copy {
  min-width: 0;
  display: grid;
  gap: 6rpx;
}

.sj-settings-page__password-title {
  color: #18181b;
  font-size: 32rpx;
  line-height: 44rpx;
  font-weight: 800;
}

.sj-settings-page__password-text,
.sj-settings-page__field-label {
  color: #71717a;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 600;
}

.sj-settings-page__password-close {
  height: 60rpx;
  min-width: 112rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 24rpx;
  border: 1rpx solid #e4e4e7;
  border-radius: 999rpx;
  background: #ffffff;
  color: #18181b;
  font-family: inherit;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 750;
}

.sj-settings-page__password-close::after {
  border: 0;
}

.sj-settings-page__field {
  display: grid;
  gap: 12rpx;
}

.sj-settings-page__field-input {
  width: 100%;
  height: 84rpx;
  padding: 0 28rpx;
  border: 1rpx solid #e4e4e7;
  border-radius: 24rpx;
  background: #ffffff;
  color: #18181b;
  font-family: inherit;
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 650;
  box-sizing: border-box;
}

.sj-settings-page__field-placeholder {
  color: #a1a1aa;
}

.sj-settings-page__password-error {
  color: #b91c1c;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 650;
}

.sj-settings-page__password-submit {
  height: 84rpx;
  width: 100%;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  border: 1rpx solid #18181b;
  border-radius: 999rpx;
  background: #18181b;
  color: #ffffff;
  font-family: inherit;
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 800;
}

.sj-settings-page__password-submit::after {
  border: 0;
}

.sj-settings-page__password-submit[disabled] {
  opacity: 0.6;
}

.sj-settings-page__section-title {
  display: block;
  padding: 24rpx 24rpx 12rpx;
  color: #71717a;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 700;
}

.sj-settings-page__item {
  min-height: 116rpx;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin: 0;
  padding: 20rpx 24rpx;
  border: 0;
  border-top: 1rpx solid #e4e4e7;
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
}

.sj-settings-page__item::after {
  border: 0;
}

.sj-settings-page__item.is-static {
  pointer-events: none;
}

.sj-settings-page__icon {
  width: 64rpx;
  height: 64rpx;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 20rpx;
  background: #f4f4f5;
}

.sj-settings-page__icon-image {
  width: 36rpx;
  height: 36rpx;
  display: block;
}

.sj-settings-page__main {
  min-width: 0;
  flex: 1 1 auto;
  display: grid;
  gap: 4rpx;
}

.sj-settings-page__label {
  overflow: hidden;
  color: #18181b;
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-settings-page__description {
  overflow: hidden;
  color: #71717a;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-settings-page__value {
  max-width: 236rpx;
  overflow: hidden;
  color: #71717a;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 650;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-settings-page__chevron {
  position: relative;
  width: 32rpx;
  height: 32rpx;
  flex: 0 0 auto;
}

.sj-settings-page__chevron::after {
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

.sj-settings-page__actions {
  display: grid;
  gap: 20rpx;
  margin-top: 4rpx;
}

.sj-settings-page__logout,
.sj-settings-page__login {
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

.sj-settings-page__logout::after,
.sj-settings-page__login::after {
  border: 0;
}

.sj-settings-page__logout {
  border: 1rpx solid #e4e4e7;
  background: #ffffff;
  color: #18181b;
}

.sj-settings-page__login {
  border: 1rpx solid #18181b;
  background: #18181b;
  color: #ffffff;
}
</style>
