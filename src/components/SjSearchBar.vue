<template>
  <view class="sj-search-bar" :style="rootStyle">
    <view class="sj-search-bar__icon" @tap.stop="submit"></view>
    <input
      v-model="keyword"
      class="sj-search-bar__input"
      :style="inputStyle"
      confirm-type="search"
      :placeholder="placeholder"
      placeholder-class="sj-search-bar__placeholder"
      @confirm="submit"
    />
  </view>
</template>

<script>
function cleanText(value) {
  return String(value || '').trim();
}

function resolvePxSize(value) {
  const size = Number(value);
  if (!Number.isFinite(size) || size <= 0) return '';
  return `${Math.round(size)}px`;
}

export default {
  name: 'SjSearchBar',
  props: {
    placeholder: {
      type: String,
      default: '搜索产品编号、名称、规格',
    },
    value: {
      type: String,
      default: '',
    },
    height: {
      type: [Number, String],
      default: '',
    },
  },
  emits: ['search'],
  data() {
    return {
      keyword: this.value,
    };
  },
  computed: {
    rootStyle() {
      const height = resolvePxSize(this.height);
      return height ? { height } : {};
    },
    inputStyle() {
      const height = resolvePxSize(this.height);
      return height ? { height, lineHeight: height } : {};
    },
  },
  watch: {
    value(nextValue) {
      this.keyword = nextValue;
    },
  },
  methods: {
    submit() {
      this.$emit('search', cleanText(this.keyword));
    },
  },
};
</script>

<style lang="scss" scoped>
.sj-search-bar {
  box-sizing: border-box;
  width: 100%;
  height: 72rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 0 22rpx;
  border: 1rpx solid #d9d9d9;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: none;
  color: #18181b;
  font-family: "PingFang SC", "PingFang TC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

.sj-search-bar__icon {
  position: relative;
  width: 24rpx;
  height: 24rpx;
  flex: 0 0 auto;
  border: 3rpx solid #a1a1aa;
  border-radius: 999px;
}

.sj-search-bar__icon::after {
  content: "";
  position: absolute;
  right: -8rpx;
  bottom: -6rpx;
  width: 11rpx;
  height: 3rpx;
  border-radius: 999px;
  background: #a1a1aa;
  transform: rotate(45deg);
  transform-origin: center;
}

.sj-search-bar__input {
  min-width: 0;
  height: 70rpx;
  flex: 1 1 auto;
  color: #18181b;
  font-size: 24rpx;
  line-height: 70rpx;
  font-weight: 500;
}

.sj-search-bar__placeholder {
  color: #a1a1aa;
  font-weight: 500;
}
</style>
