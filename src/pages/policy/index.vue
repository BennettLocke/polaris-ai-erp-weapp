<template>
  <view class="policy-page">
    <view class="policy-page__nav">
      <button class="policy-page__back" aria-label="返回" @tap="goBack"></button>
      <text class="policy-page__nav-title">{{ policy.title }}</text>
    </view>

    <scroll-view class="policy-page__body" scroll-y :show-scrollbar="false">
      <view class="policy-page__header">
        <text class="policy-page__title">{{ policy.title }}</text>
        <text class="policy-page__subtitle">{{ policy.subtitle }}</text>
        <text class="policy-page__date">更新日期：{{ updatedAt }}</text>
      </view>

      <view
        v-for="section in policy.sections"
        :key="section.heading"
        class="policy-page__section"
      >
        <text class="policy-page__section-title">{{ section.heading }}</text>
        <text
          v-for="paragraph in section.body"
          :key="paragraph"
          class="policy-page__paragraph"
        >{{ paragraph }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { buildPolicyUrl, getPolicyDocument, POLICY_UPDATED_AT } from '../../utils/policies';
import { buildShareOptions, buildTimelineShareOptions, enablePageShare } from '../../utils/share.js';

export default {
  data() {
    return {
      type: 'agreement',
      updatedAt: POLICY_UPDATED_AT,
    };
  },
  computed: {
    policy() {
      return getPolicyDocument(this.type);
    },
  },
  onLoad(query = {}) {
    this.type = query.type === 'privacy' ? 'privacy' : 'agreement';
  },
  onShow() {
    enablePageShare();
  },
  onShareAppMessage() {
    const path = buildPolicyUrl(this.type);
    return buildShareOptions({
      title: `${this.policy.title}｜北极星智能体`,
      path,
    });
  },
  onShareTimeline() {
    const path = buildPolicyUrl(this.type);
    return buildTimelineShareOptions({
      title: `${this.policy.title}｜北极星智能体`,
      path,
    });
  },
  methods: {
    goBack() {
      if (typeof getCurrentPages === 'function' && typeof uni !== 'undefined') {
        const pages = getCurrentPages();
        if (pages && pages.length > 1 && typeof uni.navigateBack === 'function') {
          uni.navigateBack({ delta: 1 });
          return;
        }
      }
      if (typeof uni !== 'undefined' && typeof uni.switchTab === 'function') {
        uni.switchTab({ url: '/pages/my/index' });
      }
    },
  },
};
</script>

<style scoped>
.policy-page,
.policy-page__nav,
.policy-page__body,
.policy-page__header,
.policy-page__section {
  box-sizing: border-box;
}

.policy-page {
  min-height: 100vh;
  background: #f4f4f5;
  color: #18181b;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
}

.policy-page__nav {
  position: sticky;
  top: 0;
  z-index: 10;
  height: 176rpx;
  padding: 88rpx 32rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1rpx solid rgba(24, 24, 27, 0.08);
}

.policy-page__back {
  position: absolute;
  left: 24rpx;
  bottom: 16rpx;
  width: 72rpx;
  height: 72rpx;
  padding: 0;
  border: 0;
  background: transparent;
}

.policy-page__back::before,
.policy-page__back::after {
  content: "";
  position: absolute;
  left: 28rpx;
  top: 24rpx;
  width: 20rpx;
  height: 4rpx;
  background: #18181b;
  border-radius: 999rpx;
  transform-origin: left center;
}

.policy-page__back::before {
  transform: rotate(-45deg);
}

.policy-page__back::after {
  transform: rotate(45deg);
  top: 38rpx;
}

.policy-page__nav-title {
  max-width: 420rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.3;
}

.policy-page__body {
  height: calc(100vh - 176rpx);
  padding: 24rpx 24rpx 64rpx;
}

.policy-page__header,
.policy-page__section {
  width: 100%;
  background: #ffffff;
  border: 1rpx solid rgba(24, 24, 27, 0.08);
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 10rpx 28rpx rgba(24, 24, 27, 0.04);
}

.policy-page__header {
  margin-bottom: 20rpx;
}

.policy-page__section {
  margin-bottom: 18rpx;
}

.policy-page__title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1.25;
}

.policy-page__subtitle {
  display: block;
  margin-top: 12rpx;
  color: #71717a;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.5;
}

.policy-page__date {
  display: block;
  margin-top: 18rpx;
  color: #a16207;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1.4;
}

.policy-page__section-title {
  display: block;
  margin-bottom: 16rpx;
  color: #18181b;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.4;
}

.policy-page__paragraph {
  display: block;
  color: #52525b;
  font-size: 26rpx;
  font-weight: 500;
  line-height: 1.72;
  margin-top: 12rpx;
  text-align: justify;
}
</style>
