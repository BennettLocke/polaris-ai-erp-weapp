<template>
  <view class="sj-login-page">
    <view class="sj-login-page__nav">
      <text class="sj-login-page__nav-title">{{ navTitle }}</text>
    </view>

    <scroll-view class="sj-login-page__body" scroll-y :show-scrollbar="false">
      <view class="sj-login-page__hero">
        <view class="sj-login-page__brand">
          <view class="sj-login-page__brand-mark">SJ</view>
          <text>{{ brand }}</text>
        </view>
        <text class="sj-login-page__title">{{ title }}</text>
        <text class="sj-login-page__description">{{ description }}</text>
      </view>

      <view class="sj-login-page__switch">
        <button
          v-for="item in loginModes"
          :key="item.value"
          :class="['sj-login-page__switch-button', currentMode === item.value ? 'is-active' : '']"
          :disabled="loading"
          @tap="selectMode(item.value)"
        >
          {{ item.label }}
        </button>
      </view>

      <view v-if='currentMode === "phone"' class="sj-login-page__panel">
        <view class="sj-login-page__panel-head">
          <text class="sj-login-page__panel-title">手机号登录</text>
          <text class="sj-login-page__panel-text">使用微信手机号快速登录。</text>
        </view>

        <button
          :class="['sj-login-page__primary', loading ? 'is-loading' : '']"
          :open-type="agreementChecked ? 'getPhoneNumber' : ''"
          :disabled="loading"
          @tap="guardAgreementTap"
          @getphonenumber="handlePhoneLogin"
        >
          <view v-if="loading" class="sj-login-page__spinner"></view>
          <view v-else class="sj-login-page__phone-icon"></view>
          <text>{{ loading ? loadingText : "手机号快捷登录" }}</text>
        </button>
        <text class="sj-login-page__panel-note">登录后自动匹配客户信息</text>

        <view class="sj-login-page__footer-actions">
          <button class="sj-login-page__secondary sj-login-page__footer-button" :disabled="loading" @tap="submitRegister">
            注册账号
          </button>
          <button class="sj-login-page__secondary sj-login-page__footer-button" :disabled="loading" @tap="continueAsGuest">
            暂不登录
          </button>
        </view>

        <label class="sj-login-page__agreement" @tap="toggleAgreement">
          <checkbox class="sj-login-page__agreement-checkbox" :checked="agreementChecked" color="#18181b" @tap.stop="toggleAgreement" />
          <text>我已阅读并同意</text>
          <text class="sj-login-page__agreement-link" @tap.stop="openAgreement">《用户协议》</text>
          <text>和</text>
          <text class="sj-login-page__agreement-link" @tap.stop="openPrivacy">《隐私政策》</text>
        </label>
      </view>

      <view v-else-if='currentMode === "account"' class="sj-login-page__panel">
        <view class="sj-login-page__panel-head">
          <text class="sj-login-page__panel-title">账号密码登录</text>
          <text class="sj-login-page__panel-text">输入账号或手机号登录。</text>
        </view>

        <view class="sj-login-page__fields">
          <label class="sj-login-page__field">
            <text class="sj-login-page__label">账号或手机号</text>
            <input v-model="username" class="sj-login-page__input" placeholder="请输入账号或手机号" />
          </label>
          <label class="sj-login-page__field">
            <text class="sj-login-page__label">密码</text>
            <input v-model="password" class="sj-login-page__input" password placeholder="请输入密码" />
          </label>
        </view>

        <button :class="['sj-login-page__primary', loading ? 'is-loading' : '']" :disabled="loading" @tap="submitPasswordLogin">
          <view v-if="loading" class="sj-login-page__spinner"></view>
          <text>{{ loading ? loadingText : "账号密码登录" }}</text>
        </button>
        <text class="sj-login-page__panel-note">登录后自动匹配客户信息</text>

        <view class="sj-login-page__footer-actions">
          <button class="sj-login-page__secondary sj-login-page__footer-button" :disabled="loading" @tap="submitRegister">
            注册账号
          </button>
          <button class="sj-login-page__secondary sj-login-page__footer-button" :disabled="loading" @tap="continueAsGuest">
            暂不登录
          </button>
        </view>

        <label class="sj-login-page__agreement" @tap="toggleAgreement">
          <checkbox class="sj-login-page__agreement-checkbox" :checked="agreementChecked" color="#18181b" @tap.stop="toggleAgreement" />
          <text>我已阅读并同意</text>
          <text class="sj-login-page__agreement-link" @tap.stop="openAgreement">《用户协议》</text>
          <text>和</text>
          <text class="sj-login-page__agreement-link" @tap.stop="openPrivacy">《隐私政策》</text>
        </label>
      </view>

      <view v-else-if='currentMode === "register"' class="sj-login-page__panel">
        <view class="sj-login-page__panel-head">
          <text class="sj-login-page__panel-title">注册账号</text>
          <text class="sj-login-page__panel-text">创建北极星智能体账号，后续可绑定手机号。</text>
        </view>

        <view class="sj-login-page__fields">
          <label class="sj-login-page__field">
            <text class="sj-login-page__label">手机号或账号</text>
            <input v-model="registerForm.account" class="sj-login-page__input" placeholder="请输入手机号或账号" />
          </label>
          <label class="sj-login-page__field">
            <text class="sj-login-page__label">显示名称</text>
            <input v-model="registerForm.display_name" class="sj-login-page__input" placeholder="请输入你的名称" />
          </label>
          <label class="sj-login-page__field">
            <text class="sj-login-page__label">密码</text>
            <input v-model="registerForm.password" class="sj-login-page__input" password placeholder="至少 6 位" />
          </label>
          <label class="sj-login-page__field">
            <text class="sj-login-page__label">确认密码</text>
            <input v-model="registerForm.confirm_password" class="sj-login-page__input" password placeholder="再次输入密码" />
          </label>
        </view>

        <text v-if="registerError" class="sj-login-page__error">{{ registerError }}</text>

        <button :class="['sj-login-page__primary', loading ? 'is-loading' : '']" :disabled="loading" @tap="submitRegisterAccount">
          <view v-if="loading" class="sj-login-page__spinner"></view>
          <text>{{ loading ? loadingText : "注册并登录" }}</text>
        </button>

        <view class="sj-login-page__footer-actions">
          <button class="sj-login-page__secondary sj-login-page__footer-button" :disabled="loading" @tap="backToAccountLogin">
            返回登录
          </button>
          <button class="sj-login-page__secondary sj-login-page__footer-button" :disabled="loading" @tap="continueAsGuest">
            暂不登录
          </button>
        </view>

        <label class="sj-login-page__agreement" @tap="toggleAgreement">
          <checkbox class="sj-login-page__agreement-checkbox" :checked="agreementChecked" color="#18181b" @tap.stop="toggleAgreement" />
          <text>我已阅读并同意</text>
          <text class="sj-login-page__agreement-link" @tap.stop="openAgreement">《用户协议》</text>
          <text>和</text>
          <text class="sj-login-page__agreement-link" @tap.stop="openPrivacy">《隐私政策》</text>
        </label>
      </view>
    </scroll-view>
  </view>
</template>

<script>
function cleanText(value) {
  return String(value || '').trim();
}

function normalizePhoneAccount(value) {
  const digits = cleanText(value).replace(/\D+/g, '');
  return /^1\d{10}$/.test(digits) ? digits : '';
}

export default {
  name: 'SjLoginPage',
  emits: ['phone-login', 'password-login', 'register', 'guest', 'mode-change', 'agreement', 'privacy'],
  props: {
    navTitle: { type: String, default: '登录' },
    brand: { type: String, default: '北极星智能体' },
    title: { type: String, default: '登录北极星智能体账号' },
    description: { type: String, default: '登录后查看销售单记录，继续浏览产品。' },
    mode: { type: String, default: 'phone' },
    loadingText: { type: String, default: '正在确认' },
    loading: { type: Boolean, default: false },
  },
  data() {
    return {
      activeMode: this.mode,
      username: '',
      password: '',
      registerForm: {
        account: '',
        display_name: '',
        password: '',
        confirm_password: '',
      },
      agreementChecked: false,
      registerError: '',
    };
  },
  computed: {
    loginModes() {
      return [
        { label: '手机号登录', value: 'phone' },
        { label: '账号密码', value: 'account' },
      ];
    },
    currentMode() {
      return ['phone', 'account', 'register'].includes(this.activeMode) ? this.activeMode : 'phone';
    },
  },
  watch: {
    mode(nextValue) {
      this.activeMode = nextValue;
    },
  },
  methods: {
    selectMode(value) {
      if (this.loading || value === this.currentMode) return;
      this.activeMode = value;
      this.$emit('mode-change', value);
    },
    handlePhoneLogin(event) {
      if (this.loading) return;
      if (!this.ensureAgreementAccepted()) return;
      this.$emit('phone-login', (event && event.detail) || {});
    },
    submitPasswordLogin() {
      if (this.loading) return;
      if (!this.ensureAgreementAccepted()) return;
      this.$emit('password-login', {
        username: cleanText(this.username),
        password: this.password,
      });
    },
    openRegisterPanel() {
      if (this.loading) return;
      this.registerError = '';
      this.activeMode = 'register';
      this.$emit('mode-change', 'register');
    },
    submitRegister() {
      this.openRegisterPanel();
    },
    backToAccountLogin() {
      if (this.loading) return;
      this.registerError = '';
      this.activeMode = 'account';
      this.$emit('mode-change', 'account');
    },
    submitRegisterAccount() {
      if (this.loading) return;
      if (!this.ensureAgreementAccepted()) return;
      const account = cleanText(this.registerForm.account);
      const displayName = cleanText(this.registerForm.display_name) || account;
      const password = String(this.registerForm.password || '');
      const confirmPassword = String(this.registerForm.confirm_password || '');
      if (!account) {
        this.registerError = '请输入手机号或账号';
        return;
      }
      if (password.length < 6) {
        this.registerError = '密码至少 6 位';
        return;
      }
      if (password !== confirmPassword) {
        this.registerError = '两次密码不一致';
        return;
      }
      const registerPhone = normalizePhoneAccount(account);
      this.registerError = '';
      this.$emit('register', {
        account,
        username: account,
        ...(registerPhone ? { mobile: registerPhone, phone: registerPhone } : {}),
        display_name: displayName,
        nickname: displayName,
        password,
      });
    },
    continueAsGuest() {
      if (this.loading) return;
      this.$emit('guest');
    },
    toggleAgreement() {
      if (this.loading) return;
      this.agreementChecked = !this.agreementChecked;
      if (this.agreementChecked) this.registerError = '';
    },
    guardAgreementTap() {
      if (!this.agreementChecked) this.ensureAgreementAccepted();
    },
    ensureAgreementAccepted() {
      if (this.agreementChecked) return true;
      const message = '请先勾选同意用户协议和隐私政策';
      if (this.currentMode === 'register') this.registerError = message;
      if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
        uni.showToast({ title: message, icon: 'none' });
      }
      return false;
    },
    openAgreement() {
      this.$emit('agreement');
    },
    openPrivacy() {
      this.$emit('privacy');
    },
  },
};
</script>

<style lang="scss" scoped>
.sj-login-page,
.sj-login-page__nav,
.sj-login-page__body,
.sj-login-page__hero,
.sj-login-page__switch,
.sj-login-page__switch-button,
.sj-login-page__panel,
.sj-login-page__input,
.sj-login-page__primary,
.sj-login-page__secondary {
  box-sizing: border-box;
}

.sj-login-page {
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

.sj-login-page__nav {
  position: relative;
  height: 105px;
  flex: none;
  background: #ffffff;
  border-bottom: 1rpx solid #e4e4e7;
}

.sj-login-page__nav-title {
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

.sj-login-page__body {
  min-height: 0;
  flex: 1 1 auto;
  overflow: auto;
  display: grid;
  align-content: start;
  gap: 36rpx;
  padding: 72rpx 36rpx calc(160rpx + env(safe-area-inset-bottom));
}

.sj-login-page__hero,
.sj-login-page__switch,
.sj-login-page__panel,
.sj-login-page__panel-head,
.sj-login-page__fields,
.sj-login-page__field,
.sj-login-page__footer-actions {
  display: grid;
}

.sj-login-page__hero {
  justify-items: start;
  gap: 22rpx;
  padding: 16rpx 4rpx 6rpx;
}

.sj-login-page__brand {
  display: inline-flex;
  align-items: center;
  gap: 16rpx;
  color: #71717a;
  font-size: 24rpx;
  line-height: 36rpx;
  font-weight: 600;
}

.sj-login-page__brand-mark {
  width: 60rpx;
  height: 60rpx;
  display: grid;
  place-items: center;
  border-radius: 20rpx;
  background: #18181b;
  color: #ffffff;
  font-size: 24rpx;
  line-height: 1;
  font-weight: 800;
}

.sj-login-page__title {
  color: #18181b;
  font-size: 52rpx;
  line-height: 66rpx;
  font-weight: 800;
}

.sj-login-page__description,
.sj-login-page__panel-text {
  color: #71717a;
  font-weight: 500;
}

.sj-login-page__description {
  max-width: 608rpx;
  font-size: 28rpx;
  line-height: 42rpx;
}

.sj-login-page__switch {
  height: 80rpx;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4rpx;
  padding: 4rpx;
  border: 1rpx solid #e4e4e7;
  border-radius: 999px;
  background: #ffffff;
}

.sj-login-page__switch-button {
  height: 70rpx;
  margin: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #71717a;
  font-family: inherit;
  font-size: 26rpx;
  line-height: 70rpx;
  font-weight: 700;
  letter-spacing: 0;
}

.sj-login-page__switch-button.is-active {
  background: #18181b;
  color: #ffffff;
}

.sj-login-page__panel {
  width: 100%;
  margin-top: 24rpx;
  gap: 38rpx;
  padding: 40rpx 36rpx;
  border: 1rpx solid #e4e4e7;
  border-radius: 36rpx;
  background: #ffffff;
  box-shadow: 0 0 0 1rpx rgba(24, 24, 27, 0.04);
}

.sj-login-page__panel-head,
.sj-login-page__fields,
.sj-login-page__field {
  gap: 10rpx;
}

.sj-login-page__panel-title {
  color: #18181b;
  font-size: 34rpx;
  line-height: 48rpx;
  font-weight: 750;
}

.sj-login-page__panel-text {
  font-size: 24rpx;
  line-height: 36rpx;
}

.sj-login-page__panel-note {
  color: #71717a;
  font-size: 23rpx;
  line-height: 32rpx;
  font-weight: 500;
  text-align: center;
}

.sj-login-page__error {
  padding: 0 8rpx;
  color: #dc2626;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 650;
}

.sj-login-page__agreement {
  display: flex;
  color: #a1a1aa;
  font-size: 22rpx;
  line-height: 32rpx;
  font-weight: 500;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4rpx;
  text-align: center;
}

.sj-login-page__agreement-checkbox {
  flex: none;
  margin-right: 2rpx;
  transform: scale(0.72);
  transform-origin: center;
}

.sj-login-page__agreement-checkbox :deep(.wx-checkbox-input) {
  width: 28rpx;
  height: 28rpx;
  border-radius: 7rpx;
  border-color: #d4d4d8;
}

.sj-login-page__agreement-checkbox :deep(.wx-checkbox-input.wx-checkbox-input-checked) {
  border-color: #18181b;
  background: #18181b;
}

.sj-login-page__agreement-link {
  color: #18181b;
  font-weight: 650;
}

.sj-login-page__label {
  color: #71717a;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 650;
}

.sj-login-page__input {
  width: 100%;
  height: 80rpx;
  min-width: 0;
  padding: 0 24rpx;
  border: 1rpx solid #e4e4e7;
  border-radius: 20rpx;
  background: #ffffff;
  color: #18181b;
  font-family: inherit;
  font-size: 28rpx;
  line-height: 80rpx;
  font-weight: 500;
}

.sj-login-page__footer-actions {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}

.sj-login-page__primary,
.sj-login-page__secondary,
.sj-login-page__switch-button {
  letter-spacing: 0;
}

.sj-login-page__primary {
  width: 100%;
  height: 96rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin: 0;
  padding: 0 32rpx;
  border: 0;
  border-radius: 999px;
  background: #18181b;
  color: #ffffff;
  font-family: inherit;
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 700;
  white-space: nowrap;
}

.sj-login-page__secondary {
  width: 100%;
  height: 84rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 32rpx;
  border: 1rpx solid #e4e4e7;
  border-radius: 999px;
  background: #ffffff;
  color: #18181b;
  font-family: inherit;
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 700;
  white-space: nowrap;
}

.sj-login-page__primary::after,
.sj-login-page__secondary::after,
.sj-login-page__switch-button::after {
  border: 0;
}

.sj-login-page__primary.is-loading {
  opacity: 0.72;
}

.sj-login-page__phone-icon {
  position: relative;
  width: 30rpx;
  height: 40rpx;
  border: 4rpx solid currentColor;
  border-radius: 10rpx;
}

.sj-login-page__phone-icon::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 4rpx;
  width: 6rpx;
  height: 6rpx;
  border-radius: 999px;
  background: currentColor;
  transform: translateX(-50%);
}

.sj-login-page__spinner {
  width: 32rpx;
  height: 32rpx;
  border: 4rpx solid currentColor;
  border-top-color: transparent;
  border-radius: 999px;
  animation: sj-login-page-spin 0.8s linear infinite;
}

@keyframes sj-login-page-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
