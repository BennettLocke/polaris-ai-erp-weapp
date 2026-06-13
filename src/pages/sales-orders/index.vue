<template>
  <view class="sales-orders-page">
    <sj-sales-orders-page
      :orders="orders"
      :keyword="keyword"
      :total="total"
      :loading="loading"
      :logged-in="isLoggedIn"
      :has-bound-customer="hasBoundCustomer"
      :internal="isInternalUser"
      @back="goBack"
      @login="goLogin"
      @keyword-input="keyword = $event"
      @search="handleSearch"
      @order-tap="handleOrderTap"
    />
  </view>
</template>

<script>
import SjSalesOrdersPage from '../../components/SjSalesOrdersPage.vue';
import { getMySalesOrders } from '../../api/sales-orders';
import { getAuthState } from '../../stores/auth';
import { PAGE_ROUTES, navigateToPage } from '../../utils/route';
import { buildShareOptions, buildTimelineShareOptions, enablePageShare } from '../../utils/share.js';

const LOGIN_PANEL_FLAG = 'sj_show_login_panel';
const SALES_ORDER_KEYWORD = 'sj_sales_order_keyword';

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

function toast(title) {
  if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
    uni.showToast({ title, icon: 'none' });
  }
}

export default {
  components: { SjSalesOrdersPage },
  data() {
    return {
      authState: authSnapshot(),
      orders: [],
      total: 0,
      page: 1,
      pageSize: 20,
      keyword: '',
      loading: false,
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
      ).toLowerCase();
    },
    isInternalUser() {
      return Boolean(Number(this.currentUser.is_admin || 0))
        || ['admin', 'manager', 'staff', 'employee', 'warehouse', 'designer'].includes(this.currentRole);
    },
    hasBoundCustomer() {
      return Boolean(this.currentUser.linked_party_id || this.currentUser.customer_id || this.isInternalUser);
    },
  },
  onLoad(options = {}) {
    this.keyword = cleanText(options.keyword);
  },
  onShow() {
    enablePageShare();
    this.syncAuthState();
    this.consumeStoredKeyword();
    this.loadSalesOrders();
  },
  onPullDownRefresh() {
    this.loadSalesOrders({ refresh: true }).finally(() => {
      if (typeof uni !== 'undefined' && typeof uni.stopPullDownRefresh === 'function') {
        uni.stopPullDownRefresh();
      }
    });
  },
  onShareAppMessage() {
    return buildShareOptions({
      title: '肆计包装销售单查询',
      path: PAGE_ROUTES.salesOrders,
    });
  },
  onShareTimeline() {
    return buildTimelineShareOptions({
      title: '肆计包装销售单查询',
      path: PAGE_ROUTES.salesOrders,
    });
  },
  methods: {
    syncAuthState() {
      this.authState = authSnapshot();
    },
    consumeStoredKeyword() {
      if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') return;
      const stored = cleanText(uni.getStorageSync(SALES_ORDER_KEYWORD));
      if (!stored) return;
      this.keyword = stored;
      if (typeof uni.removeStorageSync === 'function') {
        uni.removeStorageSync(SALES_ORDER_KEYWORD);
      }
    },
    async loadSalesOrders() {
      this.syncAuthState();
      if (!this.isLoggedIn) {
        this.orders = [];
        this.total = 0;
        return;
      }
      if (this.loading) return;
      this.loading = true;
      try {
        const data = await getMySalesOrders({
          page: this.page,
          page_size: this.pageSize,
          keyword: this.keyword,
        });
        const list = Array.isArray(data.list) ? data.list : Array.isArray(data.sales) ? data.sales : [];
        this.orders = list;
        this.total = Number(data.total || list.length || 0);
      } catch (error) {
        this.orders = [];
        this.total = 0;
        if (error.statusCode === 401) {
          toast('请先登录账号');
        } else {
          toast(error.msg || '销售单加载失败');
        }
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      this.page = 1;
      this.loadSalesOrders();
    },
    handleOrderTap(order = {}) {
      const no = cleanText(order.sales_no || order.order_no || order.id);
      if (no) toast(`销售单 ${no}`);
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
  },
};
</script>

<style lang="scss" scoped>
.sales-orders-page {
  min-height: 100vh;
  background: #f4f4f5;
}
</style>
