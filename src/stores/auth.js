import {
  clearAuthToken,
  bindPhone as apiBindPhone,
  extractAuthToken,
  extractAuthUser,
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  saveAuthToken,
  updateProfile,
  wechatQuickLogin,
} from '../api/auth';
import { getAuthToken } from '../api/request';
import { PAGE_ROUTES, navigateToPage } from '../utils/route';

const state = {
  token: getAuthToken(),
  user: null,
  loading: false,
  ready: false,
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function looksLikeAuthUser(value) {
  if (!isPlainObject(value)) return false;
  return [
    'id',
    'user_id',
    'username',
    'display_name',
    'nickname',
    'mobile',
    'phone',
    'role',
    'role_key',
  ].some((key) => Object.prototype.hasOwnProperty.call(value, key));
}

export function getAuthState() {
  return state;
}

export function isLoggedIn() {
  return Boolean(state.token);
}

export function setAuthSession(data = {}) {
  const token = extractAuthToken(data);
  const user = extractAuthUser(data);
  if (token) {
    saveAuthToken(token);
    state.token = token;
  }
  if (user) state.user = user;
  state.ready = true;
  return state;
}

export function clearAuthSession() {
  clearAuthToken();
  state.token = '';
  state.user = null;
  state.ready = true;
}

export async function login(payload = {}) {
  state.loading = true;
  try {
    const result = await apiLogin(payload);
    return setAuthSession(result);
  } finally {
    state.loading = false;
  }
}

export async function register(payload = {}) {
  state.loading = true;
  try {
    const result = await apiRegister(payload);
    return setAuthSession(result);
  } finally {
    state.loading = false;
  }
}

export async function loginWithWechat(payload = {}) {
  state.loading = true;
  try {
    const result = await wechatQuickLogin(payload);
    return setAuthSession(result);
  } finally {
    state.loading = false;
  }
}

export async function refreshCurrentUser(params = {}) {
  state.loading = true;
  try {
    const result = await getCurrentUser(params);
    const user = extractAuthUser(result) || result.user || result;
    state.user = user || null;
    state.token = getAuthToken();
    state.ready = true;
    return state;
  } catch (error) {
    if (error.statusCode === 401 || error.code === 401) clearAuthSession();
    throw error;
  } finally {
    state.loading = false;
  }
}

export async function updateCurrentUserProfile(payload = {}) {
  state.loading = true;
  try {
    const result = await updateProfile(payload);
    const user = extractAuthUser(result) || (looksLikeAuthUser(result) ? result : null);
    state.user = {
      ...(state.user || {}),
      ...(user || {}),
      ...payload,
    };
    state.token = getAuthToken();
    state.ready = true;
    return state;
  } finally {
    state.loading = false;
  }
}

export async function bindCurrentUserPhone(payload = {}) {
  state.loading = true;
  try {
    const result = await apiBindPhone(payload);
    const user = extractAuthUser(result) || (looksLikeAuthUser(result) ? result : null);
    state.user = {
      ...(state.user || {}),
      ...(user || {}),
    };
    state.token = getAuthToken();
    state.ready = true;
    return state;
  } finally {
    state.loading = false;
  }
}

export function requireLogin(options = {}) {
  if (isLoggedIn()) return true;
  if (options.redirect === false) return false;
  navigateToPage(options.url || PAGE_ROUTES.my);
  return false;
}

export async function logout() {
  await apiLogout();
  clearAuthSession();
}
