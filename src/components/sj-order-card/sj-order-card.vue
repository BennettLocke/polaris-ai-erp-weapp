<template>
  <view class="sj-order-card" :style="cardStyle" @tap="$emit('tap', order)">
    <view class="sj-order-card__top">
      <view class="sj-order-card__badges">
        <text v-if="orderNo" class="sj-order-card__badge sj-order-card__badge--code">{{ orderNo }}</text>
        <text class="sj-order-card__status" :class="statusClass">{{ statusText }}</text>
        <text v-if="priorityText" class="sj-order-card__priority">{{ priorityText }}</text>
      </view>
      <text v-if="createdTime" class="sj-order-card__time">{{ createdTime }}</text>
    </view>

    <view class="sj-order-card__design">
      <image v-if="designImageUrl" class="sj-order-card__design-image" :src="designImageUrl" mode="aspectFit" />
      <view v-else class="sj-order-card__design-placeholder">暂无设计稿</view>
      <text class="sj-order-card__design-caption">设计稿</text>
    </view>

    <view class="sj-order-card__field-grid">
      <view v-for="row in displayRows" :key="row.label" class="sj-order-card__field">
        <text class="sj-order-card__label">{{ row.label }}</text>
        <text class="sj-order-card__value">{{ row.value }}</text>
      </view>
    </view>

    <view class="sj-order-card__flow">
      <view
        v-for="step in flowSteps"
        :key="step.key"
        class="sj-order-card__flow-step"
        :class="{ 'is-active': step.active, 'is-current': step.current }"
      >
        <view class="sj-order-card__flow-line"></view>
        <text class="sj-order-card__flow-label">{{ step.label }}</text>
      </view>
    </view>

    <text v-if="remarkText" class="sj-order-card__remark">{{ remarkText }}</text>

    <view class="sj-order-card__actions">
      <button
        v-for="item in actionItems"
        :key="item.event"
        :class="['sj-order-card__action', item.primary ? 'sj-order-card__action--primary' : '', item.ghost ? 'sj-order-card__action--ghost' : '', item.disabled ? 'is-disabled' : '']"
        :disabled="item.disabled"
        @tap.stop="handleAction(item)"
      >
        {{ item.label }}
      </button>
    </view>
  </view>
</template>

<script>
function cleanText(value) {
  return String(value || "").trim();
}

function firstText(...values) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
}

function boolText(value) {
  if (value === true || value === 1 || value === "1" || value === "true" || value === "yes") return "是";
  if (value === false || value === 0 || value === "0" || value === "false" || value === "no") return "否";
  return firstText(value) || "否";
}

function isTruthy(value) {
  return value === true || value === 1 || value === "1" || value === "true" || value === "yes";
}

function normalizeCardStatusKey(value) {
  const key = cleanText(value).toLowerCase();
  if (!key) return "";
  if (["待制作", "未制作", "待生产"].includes(key)) return "pending_make";
  if (["制作完成", "待配送"].includes(key)) return "pending_delivery";
  if (["配送完成", "已配送", "已完成", "完成", "完工"].includes(key)) return "done";
  if (STATUS_MAP[key]) return key;
  return "";
}

function inferCardStatusKeyFromText(value) {
  const text = cleanText(value).toLowerCase();
  if (!text) return "";
  if (/待完成|未完成|未制作|待制作|待生产|生产中|制作中|making|processing|waiting/.test(text)) return "pending_make";
  if (/待配送|制作完成|待发货|待送|delivery/.test(text)) return "pending_delivery";
  if (/已完成|配送完成|已配送|送达|完工|delivered|completed|done/.test(text) || text === "完成") return "done";
  if (/已下单|新订单|下单|ordered|placed|created|pending/.test(text)) return "ordered";
  return "";
}

const STATUS_MAP = {
  ordered: { label: "已下单", className: "is-warning", level: 1 },
  placed: { label: "已下单", className: "is-warning", level: 1 },
  created: { label: "已下单", className: "is-warning", level: 1 },
  pending: { label: "已下单", className: "is-warning", level: 1 },
  pending_make: { label: "待制作", className: "is-warning", level: 2 },
  make_pending: { label: "待制作", className: "is-warning", level: 2 },
  waiting: { label: "待制作", className: "is-warning", level: 2 },
  processing: { label: "待制作", className: "is-warning", level: 2 },
  making: { label: "待制作", className: "is-warning", level: 2 },
  make_done: { label: "待配送", className: "is-warning", level: 4 },
  made: { label: "待配送", className: "is-warning", level: 4 },
  pending_delivery: { label: "待配送", className: "is-warning", level: 4 },
  delivery_pending: { label: "待配送", className: "is-warning", level: 4 },
  delivery: { label: "待配送", className: "is-warning", level: 4 },
  delivered: { label: "已完成", className: "is-done", level: 5 },
  done: { label: "已完成", className: "is-done", level: 5 },
  completed: { label: "已完成", className: "is-done", level: 5 },
};

const DEFAULT_FLOW = [
  { key: "ordered", label: "已下单" },
  { key: "pending_make", label: "待制作" },
  { key: "make_done", label: "制作完成" },
  { key: "pending_delivery", label: "待配送" },
  { key: "done", label: "已完成" },
];

export default {
  name: "SjOrderCard",
  emits: ["tap", "detail", "make-done", "delivery-done", "cancel-make", "cancel-delivery", "edit"],
  props: {
    order: {
      type: Object,
      default: () => ({}),
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
    scale: {
      type: Number,
      default: 1,
    },
  },
  computed: {
    cardStyle() {
      return { "--sj-order-card-scale": this.scale };
    },
    orderNo() {
      return firstText(this.order.order_no, this.order.orderNo, this.order.workflow_no, this.order.code, this.order.id);
    },
    rawStatusKey() {
      return normalizeCardStatusKey(this.order.status_key || this.order.status?.key || this.order.status || this.order.stage || this.order.flow_status);
    },
    inferredStatusKey() {
      const textKey = inferCardStatusKeyFromText(firstText(this.order.status_text, this.order.statusText, this.order.status_name, this.order.state_text));
      if (textKey === "done") return "done";
      if (isTruthy(this.order.order_type) || isTruthy(this.order.is_completed) || isTruthy(this.order.completed)) return "done";
      if (isTruthy(this.order.is_delivered) || isTruthy(this.order.delivery_done) || isTruthy(this.order.delivered)) return "done";
      if (isTruthy(this.order.is_made) || isTruthy(this.order.make_done) || isTruthy(this.order.production_done)) return "pending_delivery";
      return textKey || "ordered";
    },
    statusData() {
      const key = this.rawStatusKey || this.inferredStatusKey;
      return STATUS_MAP[key] || STATUS_MAP[this.inferredStatusKey];
    },
    currentStatusKey() {
      return this.rawStatusKey || this.inferredStatusKey;
    },
    statusText() {
      return firstText(this.statusData.label, this.order.status_text, this.order.statusText);
    },
    statusClass() {
      return this.statusData.className;
    },
    flowLevel() {
      const explicit = Number(this.order.progress_level || this.order.progressLevel);
      if (Number.isFinite(explicit) && explicit > 0) return Math.min(explicit, DEFAULT_FLOW.length);
      return this.statusData.level;
    },
    flowSteps() {
      return DEFAULT_FLOW.map((item, index) => {
        const level = index + 1;
        return {
          ...item,
          active: level <= this.flowLevel,
          current: level === this.flowLevel,
        };
      });
    },
    customerName() {
      return firstText(this.order.customer_name, this.order.customerName, this.order.customer, this.order.party_name, "未知客户");
    },
    productName() {
      return firstText(this.order.goods_name, this.order.product_name, this.order.productName, this.order.product_summary, this.order.title, "产品信息待确认");
    },
    productColor() {
      return firstText(this.order.goods_color, this.order.color, this.order.color_text, "待确认");
    },
    orderQuantity() {
      return firstText(this.order.order_quantity, this.order.quantity_text, this.order.quantityText, this.order.quantity, this.order.qty, "待确认");
    },
    screenPrintText() {
      return boolText(this.order.is_screen_print ?? this.order.screen_print ?? this.order.screenPrint);
    },
    createdTime() {
      return firstText(this.order.order_time_text, this.order.created_at, this.order.createdAt, this.order.date_text, this.order.updated_at);
    },
    designImageUrl() {
      return firstText(this.order.design_image, this.order.designImage, this.order.design_draft_url, this.order.draft_image, this.order.artwork_url, this.order.cover, this.order.image);
    },
    priorityText() {
      return firstText(this.order.priority_text, this.order.priorityText);
    },
    displayRows() {
      return [
        { label: "客户名称", value: this.customerName },
        { label: "商品名称", value: this.productName },
        { label: "商品颜色", value: this.productColor },
        { label: "订单数量", value: this.orderQuantity },
        { label: "是否丝印", value: this.screenPrintText },
        { label: "下单时间", value: this.createdTime || "未记录" },
      ];
    },
    remarkText() {
      return firstText(this.order.remark, this.order.note, this.order.requirement, this.order.memo);
    },
    canMakeDone() {
      return this.canEdit && this.flowLevel < 4;
    },
    canDeliveryDone() {
      return this.canEdit && this.flowLevel < 5;
    },
    canCancelMake() {
      return this.canEdit && this.flowLevel >= 4;
    },
    canCancelDelivery() {
      return this.canEdit && this.flowLevel >= 5;
    },
    actionItems() {
      const items = [];

      if (this.canEdit) {
        if (this.canMakeDone) items.push({ label: "制作完成", event: "make-done", primary: true });
        if (this.canCancelDelivery) items.push({ label: "取消配送", event: "cancel-delivery" });
        if (this.canCancelMake) items.push({ label: "取消制作", event: "cancel-make" });
        if (this.canDeliveryDone) items.push({ label: "配送完成", event: "delivery-done", primary: !this.canMakeDone });
        items.push({ label: "编辑", event: "edit", ghost: true });
      }

      return items;
    },
  },
  methods: {
    handleAction(item) {
      if (item.disabled) return;
      if (item.event === "detail") this.$emit("detail", this.order);
      if (item.event === "make-done") this.$emit("make-done", this.order);
      if (item.event === "delivery-done") this.$emit("delivery-done", this.order);
      if (item.event === "cancel-make") this.$emit("cancel-make", this.order);
      if (item.event === "cancel-delivery") this.$emit("cancel-delivery", this.order);
      if (item.event === "edit") this.$emit("edit", this.order);
    },
  },
};
</script>

<style scoped>
.sj-order-card {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  display: grid;
  gap: calc(12px * var(--sj-order-card-scale, 1));
  overflow: hidden;
  padding: calc(14px * var(--sj-order-card-scale, 1));
  border: 0;
  border-radius: 14px;
  background: #ffffff;
  color: #18181b;
  box-shadow: 0 0 0 1px rgba(24, 24, 27, 0.1);
  font-family: "PingFang SC", "PingFang TC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

.sj-order-card__top {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(10px * var(--sj-order-card-scale, 1));
}

.sj-order-card__badges {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: calc(6px * var(--sj-order-card-scale, 1));
  overflow: hidden;
}

.sj-order-card__badge,
.sj-order-card__status,
.sj-order-card__priority {
  box-sizing: border-box;
  max-width: 100%;
  height: calc(20px * var(--sj-order-card-scale, 1));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: calc(2px * var(--sj-order-card-scale, 1)) calc(8px * var(--sj-order-card-scale, 1));
  border-radius: 999px;
  font-size: calc(11px * var(--sj-order-card-scale, 1));
  line-height: calc(16px * var(--sj-order-card-scale, 1));
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sj-order-card__badge--code {
  flex: 0 0 auto;
  background: #18181b;
  color: #fafafa;
}

.sj-order-card__status {
  background: #f4f4f5;
  color: #3f3f46;
}

.sj-order-card__status.is-warning {
  background: #fffbeb;
  color: #92400e;
}

.sj-order-card__status.is-done {
  background: #ecfdf5;
  color: #166534;
}

.sj-order-card__priority {
  flex: 0 0 auto;
  background: #fef2f2;
  color: #991b1b;
}

.sj-order-card__time {
  flex: 0 0 auto;
  color: #71717a;
  font-size: calc(11px * var(--sj-order-card-scale, 1));
  line-height: calc(16px * var(--sj-order-card-scale, 1));
  font-weight: 500;
  white-space: nowrap;
}

.sj-order-card__design {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  height: 168px;
  overflow: hidden;
  border-radius: 12px;
  background: #f4f4f5;
  box-shadow: inset 0 0 0 1px rgba(24, 24, 27, 0.08);
}

.sj-order-card__design-image,
.sj-order-card__design-placeholder {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.sj-order-card__design-image {
  display: block;
}

.sj-order-card__design-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #71717a;
  font-size: calc(13px * var(--sj-order-card-scale, 1));
  line-height: calc(19px * var(--sj-order-card-scale, 1));
  font-weight: 600;
}

.sj-order-card__design-caption {
  position: absolute;
  left: calc(8px * var(--sj-order-card-scale, 1));
  top: calc(8px * var(--sj-order-card-scale, 1));
  height: calc(22px * var(--sj-order-card-scale, 1));
  display: inline-flex;
  align-items: center;
  padding: 0 calc(8px * var(--sj-order-card-scale, 1));
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #18181b;
  font-size: calc(11px * var(--sj-order-card-scale, 1));
  line-height: calc(16px * var(--sj-order-card-scale, 1));
  font-weight: 700;
}

.sj-order-card__field-grid {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: calc(9px * var(--sj-order-card-scale, 1)) calc(12px * var(--sj-order-card-scale, 1));
  padding: calc(10px * var(--sj-order-card-scale, 1));
  border-radius: 12px;
  background: #f4f4f5;
}

.sj-order-card__field {
  min-width: 0;
  display: grid;
  gap: calc(2px * var(--sj-order-card-scale, 1));
}

.sj-order-card__label {
  color: #71717a;
  font-size: calc(11px * var(--sj-order-card-scale, 1));
  line-height: calc(16px * var(--sj-order-card-scale, 1));
  font-weight: 500;
}

.sj-order-card__value {
  min-width: 0;
  overflow: hidden;
  color: #18181b;
  font-size: calc(12px * var(--sj-order-card-scale, 1));
  line-height: calc(18px * var(--sj-order-card-scale, 1));
  font-weight: 650;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sj-order-card__flow {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: calc(4px * var(--sj-order-card-scale, 1));
}

.sj-order-card__flow-step {
  min-width: 0;
  display: grid;
  justify-items: center;
  gap: calc(5px * var(--sj-order-card-scale, 1));
  color: #71717a;
}

.sj-order-card__flow-line {
  width: 100%;
  height: calc(4px * var(--sj-order-card-scale, 1));
  border-radius: 999px;
  background: #e4e4e7;
}

.sj-order-card__flow-step.is-active .sj-order-card__flow-line {
  background: #18181b;
}

.sj-order-card__flow-step.is-current .sj-order-card__flow-line {
  height: calc(6px * var(--sj-order-card-scale, 1));
}

.sj-order-card__flow-label {
  max-width: 100%;
  overflow: hidden;
  font-size: calc(10px * var(--sj-order-card-scale, 1));
  line-height: calc(14px * var(--sj-order-card-scale, 1));
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sj-order-card__flow-step.is-active .sj-order-card__flow-label {
  color: #18181b;
}

.sj-order-card__remark {
  min-width: 0;
  overflow: hidden;
  color: #71717a;
  font-size: calc(12px * var(--sj-order-card-scale, 1));
  line-height: calc(18px * var(--sj-order-card-scale, 1));
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sj-order-card__actions {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: calc(8px * var(--sj-order-card-scale, 1));
  padding-top: calc(2px * var(--sj-order-card-scale, 1));
}

.sj-order-card__action {
  box-sizing: border-box;
  height: calc(32px * var(--sj-order-card-scale, 1));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e4e4e7;
  border-radius: 999px;
  padding: 0 calc(12px * var(--sj-order-card-scale, 1));
  background: #ffffff;
  color: #18181b;
  font-family: inherit;
  font-size: calc(12px * var(--sj-order-card-scale, 1));
  line-height: calc(18px * var(--sj-order-card-scale, 1));
  font-weight: 600;
}

.sj-order-card__action--primary {
  border-color: #18181b;
  background: #18181b;
  color: #fafafa;
}

.sj-order-card__action--ghost {
  border-color: transparent;
  background: transparent;
  color: #71717a;
}

.sj-order-card__action.is-disabled,
.sj-order-card__action[disabled] {
  opacity: 0.55;
}
</style>
