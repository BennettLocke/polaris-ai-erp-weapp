<template>
  <view class="sj-loading-state" :class="[`sj-loading-state--${size}`]">
    <view class="sj-loading-state__spinner"></view>
    <text v-if="text" class="sj-loading-state__text">{{ text }}</text>
  </view>
</template>

<script>
export default {
  name: 'SjLoadingState',
  props: {
    text: { type: String, default: '' },
    size: { type: String, default: 'normal' },
  },
};
</script>

<style scoped>
.sj-loading-state {
  box-sizing: border-box;
  min-height: 128rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  color: #71717a;
  font-family: "PingFang SC", "PingFang TC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.sj-loading-state--compact {
  min-height: 92rpx;
}

.sj-loading-state--large {
  min-height: 196rpx;
}

.sj-loading-state__spinner {
  box-sizing: border-box;
  width: 34rpx;
  height: 34rpx;
  border: 4rpx solid #e4e4e7;
  border-top-color: #18181b;
  border-radius: 999px;
  animation: sj-loading-state-spin 760ms linear infinite;
}

.sj-loading-state--compact .sj-loading-state__spinner {
  width: 28rpx;
  height: 28rpx;
  border-width: 3rpx;
}

.sj-loading-state--large .sj-loading-state__spinner {
  width: 42rpx;
  height: 42rpx;
}

.sj-loading-state__text {
  color: #71717a;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 600;
}

@keyframes sj-loading-state-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
