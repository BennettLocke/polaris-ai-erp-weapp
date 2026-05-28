import { API_BASE_URL, TOKEN_STORAGE_KEY } from '../config';

export function buildApiUrl(path) {
  if (/^https?:\/\//.test(path)) return path;
  const cleanPath = String(path || '').replace(/^\/?/, '/');
  return `${API_BASE_URL}${cleanPath}`;
}

export function getAuthToken() {
  try {
    return uni.getStorageSync(TOKEN_STORAGE_KEY) || '';
  } catch (error) {
    return '';
  }
}

export function request(path, options = {}) {
  const url = buildApiUrl(path);
  const token = options.auth === false ? '' : options.token || getAuthToken();
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'X-SJ-Client': 'miniapp',
        ...(token ? { 'X-SJ-Token': token } : {}),
        ...(options.header || {}),
      },
      success(res) {
        const body = res.data || {};
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 0) {
          resolve(body.data);
          return;
        }
        if (res.statusCode === 401) {
          try {
            uni.removeStorageSync(TOKEN_STORAGE_KEY);
          } catch (error) {
            // Ignore storage cleanup failures in non-miniapp runtimes.
          }
        }
        reject({
          statusCode: res.statusCode,
          code: body.code,
          msg: body.msg || '请求失败',
          data: body,
        });
      },
      fail(error) {
        reject({ msg: error.errMsg || '网络连接失败', error });
      },
    });
  });
}
