<template>
  <view class="profile-page">
    <sj-account-profile-page
      :user="currentUser"
      :logged-in="isLoggedIn"
      :role="currentRole"
      @back="goBack"
      @login="goLogin"
      @settings="goSettings"
    />
  </view>
</template>

<script>
import SjAccountProfilePage from '../../components/SjAccountProfilePage.vue';
import { getAuthState, refreshCurrentUser } from '../../stores/auth';
import { PAGE_ROUTES, navigateToPage } from '../../utils/route';
import { buildShareOptions, buildTimelineShareOptions, enablePageShare } from '../../utils/share.js';

const LOGIN_PANEL_FLAG = 'sj_show_login_panel';

function cleanText(value) {
  return String(value || '').trim();
}

function authSnapshot() {
  const state = getAuthState();
  return {
    token: state.token || '',
    user: state.user || null,
  };
}

export default {
  components: { SjAccountProfilePage },
  data() {
    return {
      authState: authSnapshot(),
    };
  },
  computed: {
    isLoggedIn() {
      return Boolean(this.authState.token);
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
          || 'guest'
      );
    },
  },
  onShow() {
    enablePageShare();
    this.syncAuthState();
    if (this.isLoggedIn) this.refreshProfile();
  },
  onShareAppMessage() {
    return buildShareOptions({
      title: '北极星智能体账号资料',
      path: PAGE_ROUTES.profile,
    });
  },
  onShareTimeline() {
    return buildTimelineShareOptions({
      title: '北极星智能体账号资料',
      path: PAGE_ROUTES.profile,
    });
  },
  methods: {
    syncAuthState() {
      this.authState = authSnapshot();
    },
    async refreshProfile() {
      try {
        await refreshCurrentUser({ force: 1 });
      } catch (error) {
        // Token expiration is already handled by the auth store.
      } finally {
        this.syncAuthState();
      }
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
    goSettings() {
      navigateToPage(PAGE_ROUTES.settings);
    },
  },
};
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: #f4f4f5;
}
</style>
