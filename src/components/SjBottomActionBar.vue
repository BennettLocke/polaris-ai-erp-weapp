<template>
  <view
    class="sj-bottom-action-bar"
    :class="[fixedClass, safeClass, customClass]"
    :style="barStyle"
  >
    <view class="sj-bottom-action-bar__inner">
      <view v-if="title || description || $slots.meta" class="sj-bottom-action-bar__meta">
        <slot name="meta">
          <view v-if="title" class="sj-bottom-action-bar__title">{{ title }}</view>
          <view v-if="description" class="sj-bottom-action-bar__description">{{ description }}</view>
        </slot>
      </view>

      <view class="sj-bottom-action-bar__actions">
        <button
          v-for="(action, index) in normalizedActions"
          :key="action.text + index"
          class="sj-bottom-action-bar__button"
          :class="[`sj-bottom-action-bar__button--${action.variant}`, { 'is-disabled': action.disabled }]"
          :disabled="action.disabled"
          @tap="handleAction(action, index)"
        >
          {{ action.text }}
        </button>
        <slot name="actions"></slot>
      </view>
    </view>
  </view>
</template>

<script>
function normalizeAction(action) {
  if (!action) return null;
  if (typeof action === "string") {
    return { text: action, variant: "default", disabled: false };
  }
  return {
    ...action,
    text: action.text || action.label || "操作",
    variant: action.variant || "default",
    disabled: Boolean(action.disabled),
  };
}

export default {
  name: "SjBottomActionBar",
  emits: ["action"],
  props: {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    actions: {
      type: Array,
      default: () => [
        { text: "返回分类", variant: "outline" },
        { text: "联系咨询", variant: "default" },
      ],
    },
    fixed: { type: Boolean, default: true },
    safeArea: { type: Boolean, default: true },
    maxWidth: { type: String, default: "430px" },
    scale: { type: Number, default: 1 },
    customClass: { type: String, default: "" },
  },
  computed: {
    normalizedActions() {
      return this.actions.map(normalizeAction).filter(Boolean);
    },
    fixedClass() {
      return this.fixed ? "sj-bottom-action-bar--fixed" : "sj-bottom-action-bar--static";
    },
    safeClass() {
      return this.safeArea ? "sj-bottom-action-bar--safe" : "";
    },
    barStyle() {
      return {
        "--sj-bottom-action-bar-scale": this.scale,
        "--sj-bottom-action-bar-max-width": this.maxWidth,
      };
    },
  },
  methods: {
    handleAction(action, index) {
      if (action.disabled) return;
      this.$emit("action", { action, index });
    },
  },
};
</script>

<style scoped>
.sj-bottom-action-bar {
  box-sizing: border-box;
  width: 100%;
  max-width: 100vw;
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
  color: #18181b;
  font-family: "PingFang SC", "PingFang TC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

.sj-bottom-action-bar--fixed {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  border-top: 1px solid #e4e4e7;
  box-shadow: 0 -8px 24px rgba(24, 24, 27, 0.06);
}

.sj-bottom-action-bar--static {
  border: 1px solid #e4e4e7;
  border-radius: calc(14px * var(--sj-bottom-action-bar-scale, 1));
  box-shadow: 0 0 0 1px rgba(24, 24, 27, 0.02);
}

.sj-bottom-action-bar__inner {
  box-sizing: border-box;
  width: min(100%, var(--sj-bottom-action-bar-max-width, 430px));
  max-width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: calc(12px * var(--sj-bottom-action-bar-scale, 1));
  align-items: center;
  margin: 0 auto;
  padding: calc(12px * var(--sj-bottom-action-bar-scale, 1)) calc(16px * var(--sj-bottom-action-bar-scale, 1));
}

.sj-bottom-action-bar--safe .sj-bottom-action-bar__inner {
  padding-bottom: calc((12px * var(--sj-bottom-action-bar-scale, 1)) + env(safe-area-inset-bottom));
}

.sj-bottom-action-bar__meta {
  min-width: 0;
  display: grid;
  gap: calc(2px * var(--sj-bottom-action-bar-scale, 1));
}

.sj-bottom-action-bar__title {
  min-width: 0;
  color: #18181b;
  font-size: calc(14px * var(--sj-bottom-action-bar-scale, 1));
  line-height: calc(20px * var(--sj-bottom-action-bar-scale, 1));
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-bottom-action-bar__description {
  min-width: 0;
  color: #71717a;
  font-size: calc(12px * var(--sj-bottom-action-bar-scale, 1));
  line-height: calc(16px * var(--sj-bottom-action-bar-scale, 1));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-bottom-action-bar__actions {
  box-sizing: border-box;
  max-width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: calc(8px * var(--sj-bottom-action-bar-scale, 1));
}

.sj-bottom-action-bar__button {
  box-sizing: border-box;
  min-width: calc(86px * var(--sj-bottom-action-bar-scale, 1));
  height: calc(36px * var(--sj-bottom-action-bar-scale, 1));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 calc(14px * var(--sj-bottom-action-bar-scale, 1));
  border: 1px solid transparent;
  border-radius: calc(10px * var(--sj-bottom-action-bar-scale, 1));
  background: #18181b;
  color: #fafafa;
  font-family: inherit;
  font-size: calc(14px * var(--sj-bottom-action-bar-scale, 1));
  line-height: calc(20px * var(--sj-bottom-action-bar-scale, 1));
  font-weight: 500;
  letter-spacing: 0;
  white-space: nowrap;
}

.sj-bottom-action-bar__button::after {
  border: 0;
}

.sj-bottom-action-bar__button--outline {
  border-color: #e4e4e7;
  background: #ffffff;
  color: #18181b;
}

.sj-bottom-action-bar__button--secondary {
  border-color: transparent;
  background: #f4f4f5;
  color: #18181b;
}

.sj-bottom-action-bar__button.is-disabled,
.sj-bottom-action-bar__button[disabled] {
  opacity: 0.5;
}
</style>
