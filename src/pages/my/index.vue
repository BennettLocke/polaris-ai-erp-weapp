<template>
  <view class="my-page">
    <sj-login-page
      v-if="showLoginPanel"
      :loading="loginLoading"
      :mode="loginMode"
      @mode-change="loginMode = $event"
      @phone-login="handlePhoneLogin"
      @password-login="handlePasswordLogin"
      @register="handleRegister"
      @guest="continueAsGuest"
      @agreement="handleAgreement"
      @privacy="handlePrivacy"
    />

    <sj-my-page
      v-else-if="showMyPanel"
      :user="currentUser"
      :logged-in="isLoggedIn"
      :role="currentRole"
      :customer-summary="customerSummary"
      @login="handleLoginRequest"
      @logout="handleLogout"
      @profile-tap="handleProfileTap"
      @menu-tap="handleMyMenu"
      @recent-order-tap="handleRecentOrderTap"
    />
  </view>
</template>

<script>
import SjLoginPage from '../../components/SjLoginPage.vue';
import SjMyPage from '../../components/SjMyPage.vue';
import { getCustomerSummary } from '../../api/customer';
import {
  getAuthState,
  login as passwordLogin,
  loginWithWechat,
  logout as authLogout,
  register as registerAccount,
} from '../../stores/auth';
import { workflowOrderNo } from '../../utils/order';
import { PAGE_ROUTES, buildPolicyUrl, buildProductFootprintUrl, navigateToPage, openCustomerService, syncCustomTabBar } from '../../utils/route';
import { buildShareOptions, buildTimelineShareOptions, enablePageShare } from '../../utils/share.js';

function cleanText(value) {
  return String(value || '').trim();
}

function authSnapshot() {
  const state = getAuthState();
  return {
    token: state.token || '',
    user: state.user || null,
    loading: Boolean(state.loading),
    ready: Boolean(state.ready),
  };
}

function toast(title) {
  if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
    uni.showToast({ title, icon: 'none' });
  }
}

const LOGIN_PANEL_FLAG = 'sj_show_login_panel';

export default {
  components: { SjLoginPage, SjMyPage },
  data() {
    return {
      authState: authSnapshot(),
      loginLoading: false,
      loginMode: 'phone',
      guestMode: false,
      customerSummary: null,
      customerSummaryLoading: false,
    };
  },
  computed: {
    isLoggedIn() {
      return Boolean(this.authState.token);
    },
    showLoginPanel() {
      return !this.isLoggedIn && !this.guestMode;
    },
    showMyPanel() {
      return this.isLoggedIn || this.guestMode;
    },
    currentUser() {
      return this.authState.user || {};
    },
    currentRole() {
      return cleanText(
        this.currentUser.role
          || this.currentUser.role_key
          || this.currentUser.roleCode
          || this.currentUser.role_code
          || (this.guestMode ? 'guest' : '')
          || 'customer'
      );
    },
  },
  onShow() {
    enablePageShare();
    syncCustomTabBar(PAGE_ROUTES.my);
    if (typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function' && uni.getStorageSync(LOGIN_PANEL_FLAG)) {
      uni.removeStorageSync(LOGIN_PANEL_FLAG);
      this.guestMode = false;
    }
    this.syncAuthState();
    this.loadCustomerSummary();
  },
  onShareAppMessage() {
    return buildShareOptions({
      title: '肆计包装｜产品、订单与客户服务',
      path: PAGE_ROUTES.my,
    });
  },
  onShareTimeline() {
    return buildTimelineShareOptions({
      title: '肆计包装｜产品、订单与客户服务',
      path: PAGE_ROUTES.my,
    });
  },
  methods: {
    syncAuthState() {
      this.authState = authSnapshot();
    },
    async loadCustomerSummary() {
      if (this.customerSummaryLoading) return;
      if (!this.isLoggedIn || !this.currentUser.linked_party_id) {
        this.customerSummary = null;
        return;
      }
      this.customerSummaryLoading = true;
      try {
        const summary = await getCustomerSummary();
        this.customerSummary = summary && summary.bound ? summary : null;
      } catch (error) {
        this.customerSummary = null;
      } finally {
        this.customerSummaryLoading = false;
      }
    },
    async getWechatLoginCode() {
      if (typeof uni === 'undefined' || typeof uni.login !== 'function') return '';
      return new Promise((resolve) => {
        uni.login({
          provider: 'weixin',
          success: (result = {}) => resolve(result.code || ''),
          fail: () => resolve(''),
        });
      });
    },
    async handlePhoneLogin(detail = {}) {
      if (this.loginLoading) return;
      const errMsg = cleanText(detail.errMsg);
      if (errMsg && !/ok/i.test(errMsg)) {
        toast('需要授权手机号');
        return;
      }

      this.loginLoading = true;
      try {
        const loginCode = await this.getWechatLoginCode();
        await loginWithWechat({
          ...detail,
          phone_code: detail.code || detail.phoneCode || '',
          login_code: loginCode,
          code: loginCode || detail.code || '',
          client_type: 'miniapp',
        });
        this.syncAuthState();
        await this.loadCustomerSummary();
        toast('登录成功');
      } catch (error) {
        toast(error.msg || error.message || '登录失败');
      } finally {
        this.loginLoading = false;
      }
    },
    async handlePasswordLogin(payload = {}) {
      const username = cleanText(payload.username);
      const password = String(payload.password || '');
      if (!username || !password) {
        toast('请输入账号和密码');
        return;
      }

      this.loginLoading = true;
      try {
        await passwordLogin({
          account: username,
          username,
          phone: username,
          password,
        });
        this.syncAuthState();
        await this.loadCustomerSummary();
        toast('登录成功');
      } catch (error) {
        toast(error.msg || error.message || '登录失败');
      } finally {
        this.loginLoading = false;
      }
    },
    async handleRegister(payload = {}) {
      if (this.loginLoading) return;
      const account = cleanText(payload.account || payload.username || payload.mobile || payload.phone);
      const password = String(payload.password || '');
      if (!account || !password) {
        toast('请输入账号和密码');
        return;
      }

      this.loginLoading = true;
      try {
        await registerAccount({
          ...payload,
          account,
          username: account,
          mobile: account,
          phone: account,
          client_type: 'miniapp',
        });
        this.guestMode = false;
        this.syncAuthState();
        await this.loadCustomerSummary();
        toast('注册成功');
      } catch (error) {
        toast(error.msg || error.message || '注册失败');
      } finally {
        this.loginLoading = false;
      }
    },
    handleAgreement() {
      navigateToPage(buildPolicyUrl('agreement'));
    },
    handlePrivacy() {
      navigateToPage(buildPolicyUrl('privacy'));
    },
    continueAsGuest() {
      this.guestMode = true;
      this.customerSummary = null;
    },
    handleLoginRequest() {
      this.guestMode = false;
      this.syncAuthState();
      this.loadCustomerSummary();
    },
    handleProfileTap() {
      navigateToPage(PAGE_ROUTES.profile);
    },
    handleMyMenu(item = {}) {
      switch (item.action) {
        case 'orders':
          navigateToPage(PAGE_ROUTES.salesOrders);
          break;
        case 'footprint':
          navigateToPage(buildProductFootprintUrl('favorites'));
          break;
        case 'contact':
          openCustomerService();
          break;
        case 'profile':
          navigateToPage(PAGE_ROUTES.profile);
          break;
        case 'settings':
          navigateToPage(PAGE_ROUTES.settings);
          break;
        default:
          break;
      }
    },
    handleRecentOrderTap(item = {}) {
      const keyword = workflowOrderNo(item) || cleanText(item.product_name || item.customer_name);
      if (keyword && typeof uni !== 'undefined' && typeof uni.setStorageSync === 'function') {
        uni.setStorageSync('sj_orderflow_keyword', keyword);
      }
      navigateToPage(PAGE_ROUTES.order);
    },
    async handleLogout() {
      if (this.loginLoading) return;
      this.loginLoading = true;
      try {
        await authLogout();
        this.guestMode = false;
        this.customerSummary = null;
        this.syncAuthState();
        toast('已退出登录');
      } finally {
        this.loginLoading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.my-page {
  min-height: 100vh;
  background: #f4f4f5;
}
</style>
