<template>
  <view
    class="sj-product-param-list"
    :class="[cardClass, compactClass, plainClass, customClass]"
    :style="scaleStyle"
  >
    <view v-if="title || description || $slots.header" class="sj-product-param-list__header">
      <slot name="header">
        <view v-if="title" class="sj-product-param-list__title">{{ title }}</view>
        <view v-if="description" class="sj-product-param-list__description">{{ description }}</view>
      </slot>
    </view>

    <view v-if="normalizedItems.length" class="sj-product-param-list__body">
      <view v-for="(item, index) in normalizedItems" :key="item.label + index" class="sj-product-param-list__row">
        <text class="sj-product-param-list__label">{{ item.label }}</text>
        <text class="sj-product-param-list__value">{{ item.value }}</text>
      </view>
    </view>

    <view v-else class="sj-product-param-list__empty">
      <slot name="empty">{{ emptyText }}</slot>
    </view>
  </view>
</template>

<script>
function normalizeItem(item) {
  if (!item) return null;
  const label = item.label || item.name || item.title || "";
  const value = item.value || item.text || item.content || "";
  if (!label && !value) return null;
  return {
    label: String(label || "参数"),
    value: String(value || "-"),
  };
}

export default {
  name: "SjProductParamList",
  props: {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    items: { type: Array, default: () => [] },
    card: { type: Boolean, default: true },
    compact: { type: Boolean, default: false },
    plain: { type: Boolean, default: false },
    emptyText: { type: String, default: "暂无参数" },
    scale: { type: Number, default: 1 },
    customClass: { type: String, default: "" },
  },
  computed: {
    normalizedItems() {
      return this.items.map(normalizeItem).filter(Boolean);
    },
    cardClass() {
      return this.card && !this.plain ? "sj-product-param-list--card" : "";
    },
    compactClass() {
      return this.compact ? "sj-product-param-list--compact" : "";
    },
    plainClass() {
      return this.plain ? "sj-product-param-list--plain" : "";
    },
    scaleStyle() {
      return {
        "--sj-product-param-list-scale": this.scale,
      };
    },
  },
};
</script>

<style scoped>
.sj-product-param-list {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  display: grid;
  gap: calc(12px * var(--sj-product-param-list-scale, 1));
  overflow: hidden;
  color: #18181b;
  font-family: "PingFang SC", "PingFang TC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

.sj-product-param-list--card {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  padding: calc(16px * var(--sj-product-param-list-scale, 1)) 0;
  border-radius: calc(14px * var(--sj-product-param-list-scale, 1));
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(24, 24, 27, 0.1);
}

.sj-product-param-list__header {
  display: grid;
  gap: calc(4px * var(--sj-product-param-list-scale, 1));
  padding: 0 calc(16px * var(--sj-product-param-list-scale, 1));
}

.sj-product-param-list__title {
  color: #18181b;
  font-size: calc(16px * var(--sj-product-param-list-scale, 1));
  line-height: calc(22px * var(--sj-product-param-list-scale, 1));
  font-weight: 500;
}

.sj-product-param-list__description {
  color: #71717a;
  font-size: calc(14px * var(--sj-product-param-list-scale, 1));
  line-height: calc(20px * var(--sj-product-param-list-scale, 1));
}

.sj-product-param-list__body {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  display: grid;
  overflow: hidden;
}

.sj-product-param-list--card .sj-product-param-list__body {
  padding: 0 calc(16px * var(--sj-product-param-list-scale, 1));
}

.sj-product-param-list__row {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(76px, 0.38fr) minmax(0, 1fr);
  gap: calc(16px * var(--sj-product-param-list-scale, 1));
  align-items: start;
  padding: calc(10px * var(--sj-product-param-list-scale, 1)) 0;
  border-top: 1px solid #e4e4e7;
}

.sj-product-param-list__row:first-child {
  border-top: 0;
}

.sj-product-param-list__label {
  min-width: 0;
  color: #71717a;
  font-size: calc(13px * var(--sj-product-param-list-scale, 1));
  line-height: calc(20px * var(--sj-product-param-list-scale, 1));
}

.sj-product-param-list__value {
  min-width: 0;
  color: #18181b;
  font-size: calc(14px * var(--sj-product-param-list-scale, 1));
  line-height: calc(20px * var(--sj-product-param-list-scale, 1));
  font-weight: 500;
  word-break: break-all;
}

.sj-product-param-list__empty {
  padding: calc(20px * var(--sj-product-param-list-scale, 1)) calc(16px * var(--sj-product-param-list-scale, 1));
  color: #71717a;
  font-size: calc(14px * var(--sj-product-param-list-scale, 1));
  line-height: calc(20px * var(--sj-product-param-list-scale, 1));
  text-align: center;
}

.sj-product-param-list--compact {
  gap: calc(8px * var(--sj-product-param-list-scale, 1));
}

.sj-product-param-list--compact.sj-product-param-list--card {
  padding-top: calc(12px * var(--sj-product-param-list-scale, 1));
  padding-bottom: calc(12px * var(--sj-product-param-list-scale, 1));
}

.sj-product-param-list--compact .sj-product-param-list__row {
  padding-top: calc(8px * var(--sj-product-param-list-scale, 1));
  padding-bottom: calc(8px * var(--sj-product-param-list-scale, 1));
}

.sj-product-param-list--plain {
  gap: 0;
}
</style>
