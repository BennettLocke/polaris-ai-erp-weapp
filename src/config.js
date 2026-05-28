const ENV = import.meta.env || {};

export const API_ENV = ENV.VITE_SJ_API_ENV || 'prod';

export const API_HOSTS = {
  local: ENV.VITE_SJ_API_LOCAL_URL || '',
  test: ENV.VITE_SJ_API_TEST_URL || '',
  prod: ENV.VITE_SJ_API_PROD_URL || '',
};

function normalizeBaseUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

export const API_BASE_URL = normalizeBaseUrl(
  ENV.VITE_SJ_API_BASE_URL || API_HOSTS[API_ENV] || '',
);

export const TOKEN_STORAGE_KEY = 'sj_token';

export const APP_CONFIG = {
  name: '肆计包装',
  description: '茶包装产品展示',
  servicePhone: '',
  serviceWechat: '',
  address: '',
  customerServiceUrl: ENV.VITE_SJ_CUSTOMER_SERVICE_URL || '',
  customerServiceCorpId: ENV.VITE_SJ_CUSTOMER_SERVICE_CORP_ID || '',
};
