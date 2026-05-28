<template>
  <view class="orderflow-page">
    <sj-order-page
      :keyword="keyword"
      :role="orderRole"
      :orders="workflows"
      :searched="searched"
      :loading="loading"
      :total="total"
      :active-status="activeStatus"
      list-title="订单"
      @search="handleSearch"
      @status-change="handleStatusChange"
      @refresh="reload"
      @order-tap="handleOrderTap"
      @make-done="handleMakeDone"
      @delivery-done="handleDeliveryDone"
      @cancel-make="handleCancelMake"
      @cancel-delivery="handleCancelDelivery"
      @edit="handleEdit"
    />

    <view v-if="editingOrder" class="orderflow-editor">
      <view class="orderflow-editor__mask" @tap="closeEdit"></view>
      <view class="orderflow-editor__sheet" @tap.stop>
        <view class="orderflow-editor__head">
          <view>
            <text class="orderflow-editor__title">编辑生产信息</text>
            <text class="orderflow-editor__subtitle">更新客户、产品和生产备注</text>
          </view>
          <button class="orderflow-editor__close" hover-class="none" @tap="closeEdit">取消</button>
        </view>

        <scroll-view class="orderflow-editor__body" scroll-y :show-scrollbar="false">
          <view class="orderflow-editor__field">
            <text class="orderflow-editor__label">客户名称</text>
            <input v-model="editForm.customer_name" class="orderflow-editor__input" placeholder="请输入客户名称" />
          </view>
          <view class="orderflow-editor__field">
            <text class="orderflow-editor__label">商品名称</text>
            <input v-model="editForm.goods_name" class="orderflow-editor__input" placeholder="请输入商品名称" />
          </view>
          <view class="orderflow-editor__field">
            <text class="orderflow-editor__label">商品颜色</text>
            <input v-model="editForm.goods_color" class="orderflow-editor__input" placeholder="请输入颜色" />
          </view>
          <view class="orderflow-editor__field">
            <text class="orderflow-editor__label">订单数量</text>
            <input v-model="editForm.order_quantity" class="orderflow-editor__input" type="number" placeholder="请输入数量" />
          </view>
          <view class="orderflow-editor__switch-row">
            <view>
              <text class="orderflow-editor__label">是否丝印</text>
              <text class="orderflow-editor__hint">生产确认</text>
            </view>
            <switch :checked="editForm.is_screen_print" color="#18181b" @change="handleScreenPrintChange" />
          </view>
          <view class="orderflow-editor__field">
            <text class="orderflow-editor__label">备注</text>
            <textarea v-model="editForm.remark" class="orderflow-editor__textarea" placeholder="填写备注" maxlength="200" />
          </view>
        </scroll-view>

        <view class="orderflow-editor__actions">
          <button class="orderflow-editor__secondary" hover-class="none" :disabled="savingEdit" @tap="closeEdit">取消</button>
          <button class="orderflow-editor__primary" hover-class="none" :disabled="savingEdit" @tap="submitEdit">
            {{ savingEdit ? '保存中' : '保存修改' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { completeWorkflowOrderAction, getOrderFlow, saveWorkflowOrder } from '../../api/orders';
import SjOrderPage from '../../components/sj-order-page/sj-order-page.vue';
import { getAuthState, refreshCurrentUser } from '../../stores/auth';
import {
  buildWorkflowOrderEditForm,
  buildWorkflowOrderSavePayload,
  filterWorkflowOrdersByStatus,
  sortWorkflowOrdersByProgress,
  updateWorkflowOrderFromEditForm,
  updateWorkflowOrderInPlace,
} from '../../utils/order';
import { canLoadOrdersByDefault, canRequestOrderList, getOrderPermissions, hasLinkedCustomer } from '../../utils/permission';
import { PAGE_ROUTES, syncCustomTabBar } from '../../utils/route';
import { buildShareOptions, buildTimelineShareOptions, enablePageShare } from '../../utils/share.js';

function cleanText(value) {
  return String(value || '').trim();
}

function firstText(...values) {
  return values.map(cleanText).find(Boolean) || '';
}

function getDesignImage(order = {}) {
  return firstText(
    order.design_image,
    order.designImage,
    order.design_draft_url,
    order.draft_image,
    order.artwork_url,
    order.cover,
    order.image,
  );
}

function getOrderId(order = {}) {
  return firstText(order.id, order.order_id, order.workflow_order_id, order.workflowOrderId);
}

function actionSuccessText(action) {
  if (action === 'delivery_done') return '已标记配送完成';
  if (action === 'delivery_cancel') return '已取消配送完成';
  if (action === 'make_cancel') return '已取消制作完成';
  return '已标记制作完成';
}

function actionLoadingText(action) {
  if (action === 'delivery_done') return '更新配送状态';
  if (action === 'delivery_cancel') return '取消配送完成';
  if (action === 'make_cancel') return '取消制作完成';
  return '更新制作状态';
}

export default {
  components: { SjOrderPage },
  data() {
    return {
      loading: false,
      keyword: '',
      activeStatus: 'all',
      searched: false,
      workflows: [],
      total: 0,
      updatingOrderId: '',
      updatingAction: '',
      editingOrder: null,
      editForm: buildWorkflowOrderEditForm(),
      savingEdit: false,
      permissions: getOrderPermissions(getAuthState()),
    };
  },
  computed: {
    orderRole() {
      if (this.permissions.canEdit) return 'employee';
      if (hasLinkedCustomer(getAuthState())) return 'customer';
      return 'guest';
    },
  },
  onLoad() {
    this.bootstrapOrders();
  },
  onShow() {
    enablePageShare();
    syncCustomTabBar(PAGE_ROUTES.order);
    this.syncOrdersForPermission();
  },
  onPullDownRefresh() {
    this.reload().finally(() => uni.stopPullDownRefresh());
  },
  onShareAppMessage() {
    return buildShareOptions({
      title: '肆计包装订单查询',
      path: PAGE_ROUTES.order,
    });
  },
  onShareTimeline() {
    return buildTimelineShareOptions({
      title: '肆计包装订单查询',
      path: PAGE_ROUTES.order,
    });
  },
  methods: {
    updatePermissions() {
      this.permissions = getOrderPermissions(getAuthState());
    },
    async ensureAuthState() {
      const authState = getAuthState();
      if (authState.token && (!authState.ready || !authState.user)) {
        try {
          await refreshCurrentUser();
        } catch (error) {
          // 401 token cleanup is handled in the auth store.
        }
      }
      this.updatePermissions();
      return getAuthState();
    },
    async bootstrapOrders() {
      const authState = await this.ensureAuthState();
      if (canLoadOrdersByDefault(authState)) {
        return this.reload();
      }
      this.clearOrders();
      return Promise.resolve();
    },
    async syncOrdersForPermission() {
      const authState = await this.ensureAuthState();
      if (!canRequestOrderList({ authState, keyword: this.keyword })) {
        this.clearOrders();
        return;
      }
      if (canLoadOrdersByDefault(authState) && this.workflows.length === 0) {
        this.reload();
      }
    },
    clearOrders() {
      this.workflows = [];
      this.total = 0;
    },
    async reload() {
      const authState = await this.ensureAuthState();
      const keyword = cleanText(this.keyword);
      this.searched = Boolean(cleanText(this.keyword));

      if (!canRequestOrderList({ authState, keyword })) {
        this.clearOrders();
        this.loading = false;
        return Promise.resolve();
      }

      this.loading = true;
      try {
        const data = await getOrderFlow({
          page: 1,
          page_size: 30,
          keyword,
          status: this.activeStatus === 'all' ? '' : this.activeStatus,
        });
        const sourceWorkflows = data.workflows || data.workflow_orders || data.list || [];
        this.workflows = sortWorkflowOrdersByProgress(filterWorkflowOrdersByStatus(sourceWorkflows, this.activeStatus));
        this.total = this.workflows.length;
      } catch (error) {
        this.clearOrders();
        uni.showToast({ title: error.msg || '订单加载失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
      return Promise.resolve();
    },
    handleSearch(value) {
      this.keyword = cleanText(value);
      return this.reload();
    },
    handleStatusChange(value) {
      this.activeStatus = value || 'all';
      return this.reload();
    },
    handleOrderTap(order) {
      const image = getDesignImage(order);
      if (!image) {
        uni.showToast({ title: '暂无设计稿', icon: 'none' });
        return;
      }
      uni.previewImage({ urls: [image], current: image });
    },
    updateLocalWorkflow(order, action) {
      const id = getOrderId(order);
      if (!id) return;
      this.workflows = updateWorkflowOrderInPlace(this.workflows, order, action);
      this.total = this.workflows.length;
    },
    async handleWorkflowAction(order, action) {
      if (!this.permissions.canEdit) {
        uni.showToast({ title: '当前账号不能编辑', icon: 'none' });
        return;
      }
      const id = getOrderId(order);
      if (!id) {
        uni.showToast({ title: '缺少订单ID', icon: 'none' });
        return;
      }

      this.updatingOrderId = id;
      this.updatingAction = action;
      if (typeof uni.showLoading === 'function') {
        uni.showLoading({ title: actionLoadingText(action), mask: true });
      }
      try {
        await completeWorkflowOrderAction(order, action);
        this.updateLocalWorkflow(order, action);
        if (typeof uni.hideLoading === 'function') uni.hideLoading();
        uni.showToast({ title: actionSuccessText(action), icon: 'success' });
      } catch (error) {
        if (typeof uni.hideLoading === 'function') uni.hideLoading();
        uni.showToast({ title: error.msg || '订单状态更新失败', icon: 'none' });
      } finally {
        this.updatingOrderId = '';
        this.updatingAction = '';
      }
    },
    handleMakeDone(order) {
      return this.handleWorkflowAction(order, 'make_done');
    },
    handleDeliveryDone(order) {
      return this.handleWorkflowAction(order, 'delivery_done');
    },
    handleCancelMake(order) {
      return this.handleWorkflowAction(order, 'make_cancel');
    },
    handleCancelDelivery(order) {
      return this.handleWorkflowAction(order, 'delivery_cancel');
    },
    handleEdit(order) {
      if (!this.permissions.canEdit) {
        uni.showToast({ title: '当前账号不能编辑', icon: 'none' });
        return;
      }
      this.editingOrder = order;
      this.editForm = buildWorkflowOrderEditForm(order);
    },
    closeEdit() {
      if (this.savingEdit) return;
      this.editingOrder = null;
      this.editForm = buildWorkflowOrderEditForm();
    },
    handleScreenPrintChange(event) {
      this.editForm = {
        ...this.editForm,
        is_screen_print: Boolean(event?.detail?.value),
      };
    },
    async submitEdit() {
      const payload = buildWorkflowOrderSavePayload(this.editForm);
      if (!payload.customer_name) {
        uni.showToast({ title: '请输入客户名称', icon: 'none' });
        return;
      }
      if (!payload.goods_name) {
        uni.showToast({ title: '请输入商品名称', icon: 'none' });
        return;
      }
      if (!payload.order_quantity) {
        uni.showToast({ title: '请输入订单数量', icon: 'none' });
        return;
      }

      this.savingEdit = true;
      if (typeof uni.showLoading === 'function') {
        uni.showLoading({ title: '保存订单', mask: true });
      }
      try {
        await saveWorkflowOrder(payload);
        this.workflows = updateWorkflowOrderFromEditForm(this.workflows, this.editingOrder, payload);
        this.total = this.workflows.length;
        if (typeof uni.hideLoading === 'function') uni.hideLoading();
        this.editingOrder = null;
        this.editForm = buildWorkflowOrderEditForm();
        uni.showToast({ title: '订单已保存', icon: 'success' });
      } catch (error) {
        if (typeof uni.hideLoading === 'function') uni.hideLoading();
        uni.showToast({ title: error.msg || '订单保存失败', icon: 'none' });
      } finally {
        this.savingEdit = false;
      }
    },
  },
};
</script>

<style scoped>
.orderflow-page {
  min-height: 100vh;
  background: #f4f4f5;
}

.orderflow-editor {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.orderflow-editor__mask {
  position: absolute;
  inset: 0;
  background: rgba(24, 24, 27, 0.38);
}

.orderflow-editor__sheet {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 78vh;
  max-height: calc(100vh - 96rpx);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 28rpx 28rpx calc(24rpx + env(safe-area-inset-bottom));
  border-radius: 32rpx 32rpx 0 0;
  background: #ffffff;
  box-shadow: 0 -12rpx 36rpx rgba(24, 24, 27, 0.16);
}

.orderflow-editor__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  padding-bottom: 22rpx;
}

.orderflow-editor__title,
.orderflow-editor__subtitle,
.orderflow-editor__label,
.orderflow-editor__hint {
  display: block;
  font-family: "PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif;
}

.orderflow-editor__title {
  color: #18181b;
  font-size: 34rpx;
  line-height: 48rpx;
  font-weight: 800;
}

.orderflow-editor__subtitle,
.orderflow-editor__hint {
  color: #71717a;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 500;
}

.orderflow-editor__close,
.orderflow-editor__secondary,
.orderflow-editor__primary {
  box-sizing: border-box;
  height: 72rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  border-radius: 999rpx;
  font-family: inherit;
  font-size: 28rpx;
  line-height: 40rpx;
  font-weight: 700;
}

.orderflow-editor__close {
  flex: 0 0 auto;
  min-width: 112rpx;
  border: 1rpx solid #e4e4e7;
  background: #ffffff;
  color: #18181b;
}

.orderflow-editor__body {
  flex: 1 1 auto;
  min-height: 0;
  height: 0;
  padding-bottom: 12rpx;
}

.orderflow-editor__field {
  display: grid;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.orderflow-editor__label {
  color: #18181b;
  font-size: 26rpx;
  line-height: 38rpx;
  font-weight: 700;
}

.orderflow-editor__input,
.orderflow-editor__textarea {
  box-sizing: border-box;
  width: 100%;
  border: 1rpx solid #e4e4e7;
  border-radius: 18rpx;
  background: #ffffff;
  color: #18181b;
  font-family: inherit;
  font-size: 28rpx;
  font-weight: 600;
}

.orderflow-editor__input {
  height: 82rpx;
  padding: 0 22rpx;
}

.orderflow-editor__textarea {
  min-height: 104rpx;
  padding: 20rpx 22rpx;
  line-height: 40rpx;
}

.orderflow-editor__switch-row {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 20rpx;
  padding: 20rpx 22rpx;
  border: 1rpx solid #e4e4e7;
  border-radius: 18rpx;
  background: #fafafa;
}

.orderflow-editor__actions {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 18rpx;
  padding-top: 18rpx;
  background: #ffffff;
}

.orderflow-editor__secondary {
  border: 1rpx solid #e4e4e7;
  background: #ffffff;
  color: #18181b;
}

.orderflow-editor__primary {
  border: 1rpx solid #18181b;
  background: #18181b;
  color: #ffffff;
}

.orderflow-editor__primary[disabled],
.orderflow-editor__secondary[disabled] {
  opacity: 0.55;
}
</style>
