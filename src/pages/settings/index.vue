<template>
  <view class="settings-page">
    <sj-settings-page
      ref="settingsPage"
      :user="currentUser"
      :logged-in="isLoggedIn"
      :password-busy="busy"
      version="0.1.0"
      @back="goBack"
      @item-tap="handleSettingItem"
      @phone-bind="handlePhoneBind"
      @password-submit="handlePasswordSubmit"
      @username-submit="handleUsernameSubmit"
      @logout="handleLogout"
      @login="goLogin"
    />
  </view>
</template>

<script>
import SjSettingsPage from '../../components/SjSettingsPage.vue';
import { changePassword, saveAuthToken } from '../../api/auth';
import { getAuthToken } from '../../api/request';
import { bindCurrentUserPhone, getAuthState, logout as authLogout, updateCurrentUserProfile } from '../../stores/auth';
import { PAGE_ROUTES, buildPolicyUrl, navigateToPage, openCustomerService } from '../../utils/route';
import { buildShareOptions, buildTimelineShareOptions, enablePageShare } from '../../utils/share.js';

const LOGIN_PANEL_FLAG = 'sj_show_login_panel';

function authSnapshot() {
  const state = getAuthState();
  return {
    token: state.token || '',
    user: state.user || null,
  };
}

function toast(title) {
  if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
    uni.showToast({ title, icon: 'none' });
  }
}

function cleanText(value) {
  return String(value || '').trim();
}

export default {
  components: { SjSettingsPage },
  data() {
    return {
      authState: authSnapshot(),
      busy: false,
    };
  },
  computed: {
    isLoggedIn() {
      return Boolean(this.authState.token);
    },
    currentUser() {
      return this.authState.user || {};
    },
  },
  onShow() {
    enablePageShare();
    this.syncAuthState();
  },
  onShareAppMessage() {
    return buildShareOptions({
      title: '肆计包装账号设置',
      path: PAGE_ROUTES.settings,
    });
  },
  onShareTimeline() {
    return buildTimelineShareOptions({
      title: '肆计包装账号设置',
      path: PAGE_ROUTES.settings,
    });
  },
  methods: {
    syncAuthState() {
      this.authState = authSnapshot();
    },
    goBack() {
      if (typeof getCurrentPages === 'function' && typeof uni !== 'undefined') {
        const pages = getCurrentPages();
        if (pages && pages.length > 1 && typeof uni.navigateBack === 'function') {
          uni.navigateBack({ delta: 1 });
          return;
        }
      }
      navigateToPage(PAGE_ROUTES.my);
    },
    goLogin() {
      if (typeof uni !== 'undefined' && typeof uni.setStorageSync === 'function') {
        uni.setStorageSync(LOGIN_PANEL_FLAG, '1');
      }
      navigateToPage(PAGE_ROUTES.my);
    },
    handleSettingItem(item = {}) {
      switch (item.action) {
        case 'contact':
          openCustomerService();
          break;
        case 'agreement':
          navigateToPage(buildPolicyUrl('agreement'));
          break;
        case 'privacy':
          navigateToPage(buildPolicyUrl('privacy'));
          break;
        case 'clear-cache':
          this.clearCache();
          break;
        case 'password':
        case 'username':
          if (!this.isLoggedIn) {
            toast('请先登录');
            this.goLogin();
          }
          break;
        case 'phone':
        case 'wechat':
          if (!this.isLoggedIn) {
            toast('请先登录');
            this.goLogin();
          } else {
            toast(item.action === 'phone' ? '请授权手机号' : '微信登录已启用');
          }
          break;
        default:
          break;
      }
    },
    clearCache() {
      if (typeof uni === 'undefined') return;
      const token = getAuthToken();
      if (typeof uni.clearStorageSync === 'function') {
        uni.clearStorageSync();
        if (token) saveAuthToken(token);
      } else if (typeof uni.clearStorage === 'function') {
        uni.clearStorage({
          success: () => {
            if (token) saveAuthToken(token);
          },
        });
      }
      toast('缓存已清除');
    },
    async handlePasswordSubmit(payload = {}) {
      if (!this.isLoggedIn) {
        this.finishPasswordPanel(false, '请先登录');
        this.goLogin();
        return;
      }
      if (this.busy) return;
      this.busy = true;
      try {
        await changePassword({
          old_password: payload.old_password || payload.current_password || '',
          new_password: payload.new_password || payload.password || '',
        });
        this.finishPasswordPanel(true);
        toast('密码已保存');
      } catch (error) {
        this.finishPasswordPanel(false, error.msg || '密码保存失败');
      } finally {
        this.busy = false;
      }
    },
    async handleUsernameSubmit(payload = {}) {
      if (!this.isLoggedIn) {
        this.finishUsernamePanel(false, '请先登录');
        this.goLogin();
        return;
      }
      if (this.busy) return;
      this.busy = true;
      try {
        await updateCurrentUserProfile({
          display_name: payload.display_name || payload.nickname || '',
        });
        this.syncAuthState();
        this.finishUsernamePanel(true);
        toast('用户名已保存');
      } catch (error) {
        this.finishUsernamePanel(false, error.msg || '用户名保存失败');
      } finally {
        this.busy = false;
      }
    },
    async handlePhoneBind(detail = {}) {
      if (!this.isLoggedIn) {
        toast('请先登录');
        this.goLogin();
        return;
      }
      const phoneCode = cleanText(detail.code || detail.phoneCode || '');
      if (!phoneCode) {
        toast('未授权手机号');
        return;
      }
      if (this.busy) return;
      this.busy = true;
      try {
        await bindCurrentUserPhone({
          phone_code: phoneCode,
          phoneCode,
        });
        this.syncAuthState();
        toast('手机号已绑定');
      } catch (error) {
        toast(error.msg || '手机号绑定失败');
      } finally {
        this.busy = false;
      }
    },
    finishPasswordPanel(success, message = '') {
      const child = this.$refs && this.$refs.settingsPage;
      if (child && typeof child.finishPasswordSubmit === 'function') {
        child.finishPasswordSubmit({ success, message });
      }
    },
    finishUsernamePanel(success, message = '') {
      const child = this.$refs && this.$refs.settingsPage;
      if (child && typeof child.finishUsernameSubmit === 'function') {
        child.finishUsernameSubmit({ success, message });
      }
    },
    async handleLogout() {
      if (this.busy) return;
      this.busy = true;
      try {
        await authLogout();
        this.syncAuthState();
        toast('已退出登录');
        navigateToPage(PAGE_ROUTES.my);
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: #f4f4f5;
}
</style>
