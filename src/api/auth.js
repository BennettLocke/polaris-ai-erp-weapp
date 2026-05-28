import { TOKEN_STORAGE_KEY } from '../config';
import { request } from './request';

export function extractAuthToken(data = {}) {
  return (
    data.token ||
    data.access_token ||
    (data.session && data.session.token) ||
    (data.user && data.user.token) ||
    ''
  );
}

export function extractAuthUser(data = {}) {
  return data.user || data.profile || data.account || null;
}

export function saveAuthToken(token) {
  if (!token) return;
  uni.setStorageSync(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  uni.removeStorageSync(TOKEN_STORAGE_KEY);
}

function persistTokenFromResult(data) {
  const token = extractAuthToken(data || {});
  if (token) saveAuthToken(token);
  return data;
}

export function login(data = {}) {
  return request('/api/auth/login', {
    method: 'POST',
    auth: false,
    data: {
      client_type: 'miniapp',
      ...data,
    },
  }).then(persistTokenFromResult);
}

export function register(data = {}) {
  return request('/api/auth/register', {
    method: 'POST',
    auth: false,
    data: {
      client_type: 'miniapp',
      ...data,
    },
  }).then(persistTokenFromResult);
}

export function wechatQuickLogin(data = {}) {
  return request('/api/auth/wechat-quick-login', {
    method: 'POST',
    auth: false,
    data,
  }).then(persistTokenFromResult);
}

export function getCurrentUser(params = {}) {
  return request('/api/auth/me', { data: params });
}

export function updateProfile(data = {}) {
  return request('/api/auth/me', {
    method: 'POST',
    data,
  });
}

export function changePassword(data = {}) {
  return request('/api/auth/change-password', {
    method: 'POST',
    data,
  });
}

export function bindPhone(data = {}) {
  return request('/api/auth/bind-phone', {
    method: 'POST',
    data,
  });
}

export function logout() {
  clearAuthToken();
  return Promise.resolve();
}
