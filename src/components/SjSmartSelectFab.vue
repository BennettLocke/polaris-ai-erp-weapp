<template>
  <view class="sj-smart-select-fab">
    <button
      class="sj-smart-select-fab__action sj-smart-select-fab__action--select"
      hover-class="none"
      @tap.stop="openSmartSelect"
    >
      <view class="sj-smart-select-fab__icon-wrap">
        <image class="sj-smart-select-fab__icon" src="/static/icons/lucide/pencil-ruler.svg" mode="aspectFit" />
      </view>
      <text class="sj-smart-select-fab__text">智能选品</text>
    </button>
    <view class="sj-smart-select-fab__divider"></view>
    <button
      class="sj-smart-select-fab__action sj-smart-select-fab__action--top"
      hover-class="none"
      @tap.stop="emitBackTop"
    >
      <text class="sj-smart-select-fab__top-icon"></text>
      <text class="sj-smart-select-fab__top-text">顶部</text>
    </button>
  </view>
</template>

<script>
import { buildProductSmartSelectUrl, navigateToPage } from '../utils/route';

export default {
  name: 'SjSmartSelectFab',
  emits: ['back-top'],
  methods: {
    openSmartSelect() {
      navigateToPage(buildProductSmartSelectUrl());
    },
    emitBackTop() {
      this.$emit('back-top');
    },
  },
};
</script>

<style lang="scss" scoped>
.sj-smart-select-fab {
  position: fixed;
  right: 48rpx;
  bottom: calc(214rpx + env(safe-area-inset-bottom));
  z-index: 72;
  box-sizing: border-box;
  width: 90rpx;
  min-height: 184rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
  background: #ffffff;
  color: #18181b;
  box-shadow: 0 16rpx 42rpx rgba(24, 24, 27, 0.14), 0 4rpx 12rpx rgba(24, 24, 27, 0.06);
  font-family: "PingFang SC", "PingFang TC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

.sj-smart-select-fab__action {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
}

.sj-smart-select-fab__action::after {
  border: 0;
}

.sj-smart-select-fab__action--select {
  min-height: 106rpx;
  flex-direction: column;
  gap: 6rpx;
}

.sj-smart-select-fab__action--top {
  min-height: 76rpx;
  flex-direction: column;
  gap: 5rpx;
}

.sj-smart-select-fab__divider {
  width: 44rpx;
  height: 1rpx;
  flex: none;
  background: linear-gradient(90deg, rgba(24, 24, 27, 0), rgba(24, 24, 27, 0.12), rgba(24, 24, 27, 0));
}

.sj-smart-select-fab__icon-wrap {
  width: 34rpx;
  height: 34rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #f4f4f5;
}

.sj-smart-select-fab__icon {
  width: 22rpx;
  height: 22rpx;
  display: block;
  flex: 0 0 auto;
}

.sj-smart-select-fab__text {
  display: block;
  color: inherit;
  font-size: 20rpx;
  line-height: 28rpx;
  font-weight: 800;
}

.sj-smart-select-fab__top-icon {
  width: 14rpx;
  height: 14rpx;
  display: block;
  border-left: 3rpx solid #18181b;
  border-top: 3rpx solid #18181b;
  transform: rotate(45deg);
}

.sj-smart-select-fab__top-text {
  display: block;
  color: #52525b;
  font-size: 20rpx;
  line-height: 28rpx;
  font-weight: 700;
}
</style>
