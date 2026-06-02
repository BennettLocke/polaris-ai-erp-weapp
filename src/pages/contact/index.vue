<template>
  <view class="page">
    <view class="panel contact-card">
      <view class="brand">北极星智能体</view>
      <view class="muted">产品咨询与售后服务</view>
    </view>

    <view class="panel menu">
      <view class="menu-item" @tap="callPhone">
        <view>
          <view class="label">电话咨询</view>
          <view class="muted">{{ servicePhone || '暂未填写' }}</view>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="copyWechat">
        <view>
          <view class="label">微信咨询</view>
          <view class="muted">{{ serviceWechat || '暂未填写' }}</view>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item">
        <view>
          <view class="label">公司地址</view>
          <view class="muted">{{ address || '暂未填写' }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { APP_CONFIG } from '../../config';
import { PAGE_ROUTES } from '../../utils/route';
import { buildShareOptions, buildTimelineShareOptions, enablePageShare } from '../../utils/share.js';

export default {
  data() {
    return {
      servicePhone: APP_CONFIG.servicePhone,
      serviceWechat: APP_CONFIG.serviceWechat,
      address: APP_CONFIG.address,
    };
  },
  onShow() {
    enablePageShare();
  },
  onShareAppMessage() {
    return buildShareOptions({
      title: '联系北极星智能体',
      path: PAGE_ROUTES.contact,
    });
  },
  onShareTimeline() {
    return buildTimelineShareOptions({
      title: '联系北极星智能体',
      path: PAGE_ROUTES.contact,
    });
  },
  methods: {
    callPhone() {
      if (!this.servicePhone) {
          uni.showToast({ title: '暂无电话信息', icon: 'none' });
        return;
      }
      uni.makePhoneCall({ phoneNumber: this.servicePhone });
    },
    copyWechat() {
      if (!this.serviceWechat) {
          uni.showToast({ title: '暂无微信信息', icon: 'none' });
        return;
      }
      uni.setClipboardData({ data: this.serviceWechat });
    },
  },
};
</script>

<style lang="scss" scoped>
.contact-card {
  padding: 34rpx 28rpx;
  margin-bottom: 24rpx;
}

.brand {
  margin-bottom: 12rpx;
  font-size: 40rpx;
  font-weight: 800;
}

.menu {
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0ece4;
}

.label {
  margin-bottom: 8rpx;
  font-size: 30rpx;
  font-weight: 700;
}

.arrow {
  color: #a0a0a0;
  font-size: 42rpx;
}
</style>
