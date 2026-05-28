const ENV = import.meta.env || {};

export const API_ENV = ENV.VITE_SJ_API_ENV || 'prod';

export const API_HOSTS = {
  local: 'http://127.0.0.1:8080',
  test: 'https://sj.513sjbz.com',
  prod: 'https://ai.513sjbz.com',
};

function normalizeBaseUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

export const API_BASE_URL = normalizeBaseUrl(
  ENV.VITE_SJ_API_BASE_URL || API_HOSTS[API_ENV] || API_HOSTS.prod,
);

export const TOKEN_STORAGE_KEY = 'sj_token';

export const APP_CONFIG = {
  name: '肆计包装',
  description: '茶包装产品展示',
  servicePhone: '',
  serviceWechat: '',
  address: '',
  customerServiceUrl: 'https://work.weixin.qq.com/kfid/kfc62a96632110ba596',
  customerServiceCorpId: 'ww32faf883416778d9',
};
