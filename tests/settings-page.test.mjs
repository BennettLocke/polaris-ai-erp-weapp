import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../', import.meta.url);
const componentUrl = new URL('src/components/SjSettingsPage.vue', root);
const pageUrl = new URL('src/pages/settings/index.vue', root);
const authApiUrl = new URL('src/api/auth.js', root);
const authStoreUrl = new URL('src/stores/auth.js', root);
const pagesUrl = new URL('src/pages.json', root);
const routesUrl = new URL('src/utils/route.js', root);
const myPageUrl = new URL('src/pages/my/index.vue', root);
const settingsLucideIconNames = [
  'settings-user-round',
  'settings-smartphone',
  'settings-lock-keyhole',
  'settings-message-circle',
  'settings-headset',
  'settings-file-text',
  'settings-trash-2',
  'settings-circle-info',
];

const component = existsSync(componentUrl) ? readFileSync(componentUrl, 'utf8') : '';
const page = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf8') : '';
const authApi = existsSync(authApiUrl) ? readFileSync(authApiUrl, 'utf8') : '';
const authStore = existsSync(authStoreUrl) ? readFileSync(authStoreUrl, 'utf8') : '';
const pages = existsSync(pagesUrl) ? readFileSync(pagesUrl, 'utf8') : '';
const routes = existsSync(routesUrl) ? readFileSync(routesUrl, 'utf8') : '';
const myPage = existsSync(myPageUrl) ? readFileSync(myPageUrl, 'utf8') : '';

describe('miniapp settings page integration', () => {
  it('ships a reusable settings page component without permission status', () => {
    assert.ok(existsSync(componentUrl));
    assert.match(component, /name:\s*['"]SjSettingsPage['"]/);
    assert.match(component, /accountItems/);
    assert.match(component, /generalItems/);
    assert.match(component, /手机号登录/);
    assert.match(component, /账号密码/);
    assert.match(component, /微信登录/);
    assert.match(component, /联系客服/);
    assert.match(component, /用户协议/);
    assert.match(component, /隐私政策/);
    assert.match(component, /清理缓存/);
    assert.match(component, /管理登录方式和常用信息。/);
    assert.doesNotMatch(component, /同步订单查询/);
    assert.doesNotMatch(component, /快捷登录与客户匹配/);
    assert.doesNotMatch(component, /权限状态|权限编辑|当前身份|绑定客户/);
  });

  it('renders settings rows with local Lucide SVG icons instead of CSS-drawn glyphs', () => {
    assert.match(component, /<image[\s\S]*class="sj-settings-page__icon-image"[\s\S]*:src="iconSrc\(item\)"[\s\S]*mode="aspectFit"/);
    assert.match(component, /SETTINGS_ICON_ASSETS/);
    assert.match(component, /iconSrc\(item = \{\}\)/);
    assert.match(component, /\/static\/icons\/lucide\/settings-user-round\.svg/);
    assert.match(component, /\/static\/icons\/lucide\/settings-smartphone\.svg/);
    assert.match(component, /\/static\/icons\/lucide\/settings-lock-keyhole\.svg/);
    assert.match(component, /\/static\/icons\/lucide\/settings-message-circle\.svg/);
    assert.match(component, /\/static\/icons\/lucide\/settings-headset\.svg/);
    assert.match(component, /\/static\/icons\/lucide\/settings-file-text\.svg/);
    assert.match(component, /\/static\/icons\/lucide\/settings-trash-2\.svg/);
    assert.match(component, /\/static\/icons\/lucide\/settings-circle-info\.svg/);
    assert.doesNotMatch(component, /sj-settings-page__icon--phone::before/);
    assert.doesNotMatch(component, /sj-settings-page__icon--password::before/);
    assert.doesNotMatch(component, /sj-settings-page__icon--username::before/);
    assert.doesNotMatch(component, /sj-settings-page__icon::before/);

    for (const name of settingsLucideIconNames) {
      const iconUrl = new URL(`src/static/icons/lucide/${name}.svg`, root);
      assert.ok(existsSync(iconUrl), `${name}.svg should exist`);
      const icon = readFileSync(iconUrl, 'utf8');
      assert.match(icon, /@license lucide-static/);
      assert.match(icon, /viewBox="0 0 24 24"/);
      assert.match(icon, /stroke-width="2"/);
      assert.match(icon, /stroke="#18181b"/);
    }
  });

  it('registers a custom settings subpage and route helper', () => {
    assert.match(pages, /"path":\s*"pages\/settings\/index"/);
    assert.match(pages, /"navigationStyle":\s*"custom"/);
    assert.match(routes, /settings:\s*['"]\/pages\/settings\/index['"]/);
    assert.doesNotMatch(routes, /TAB_BAR_PATHS[\s\S]*PAGE_ROUTES\.settings/);
  });

  it('navigates from My settings row into the settings page', () => {
    assert.match(myPage, /case ['"]settings['"]/);
    assert.match(myPage, /navigateToPage\(PAGE_ROUTES\.settings\)/);
    assert.doesNotMatch(myPage, /case ['"]settings['"]:[\s\S]*toast\(['"]设置功能待接入/);
  });

  it('wires settings actions to existing login, logout, contact, and policy handlers', () => {
    assert.ok(existsSync(pageUrl));
    assert.match(page, /import SjSettingsPage/);
    assert.match(page, /components:\s*\{\s*SjSettingsPage\s*\}/);
    assert.match(page, /<sj-settings-page/);
    assert.match(page, /:logged-in="isLoggedIn"/);
    assert.match(page, /@back="goBack"/);
    assert.match(page, /@item-tap="handleSettingItem"/);
    assert.match(page, /@logout="handleLogout"/);
    assert.match(page, /@login="goLogin"/);
    assert.match(page, /import\s*\{[\s\S]*openCustomerService[\s\S]*\}\s*from ['"]\.\.\/\.\.\/utils\/route['"]/);
    const contactCase = page.match(/case ['"]contact['"]:[\s\S]*?break;/)?.[0] || '';
    assert.match(contactCase, /openCustomerService\(\)/);
    assert.doesNotMatch(contactCase, /navigateToPage\(PAGE_ROUTES\.contact\)/);
    assert.match(page, /clearStorageSync|clearStorage/);
  });

  it('turns account password settings into a real miniapp flow', () => {
    assert.match(component, /passwordPanelOpen/);
    assert.match(component, /sj-settings-page__password-panel/);
    assert.match(component, /passwordForm/);
    assert.match(component, /emits:\s*\[[\s\S]*['"]password-submit['"]/);
    assert.match(component, /\$emit\(['"]password-submit['"]/);
    assert.match(component, /finishPasswordSubmit/);
    assert.match(page, /@password-submit="handlePasswordSubmit"/);
    assert.match(page, /import\s*\{[\s\S]*changePassword[\s\S]*\}\s*from ['"]\.\.\/\.\.\/api\/auth['"]/);
    assert.match(page, /async handlePasswordSubmit/);
    assert.match(page, /case ['"]password['"]/);
    assert.match(authApi, /export function changePassword/);
    assert.match(authApi, /\/api\/auth\/change-password/);
    assert.doesNotMatch(page, /待接入/);
    assert.doesNotMatch(page, /待完善/);
  });

  it('lets logged-in users edit their display username without exposing the login account', () => {
    assert.match(component, /用户名/);
    assert.match(component, /usernamePanelOpen/);
    assert.match(component, /usernameForm/);
    assert.match(component, /canEditDisplayName/);
    assert.match(component, /can_edit_display_name/);
    assert.match(component, /emits:\s*\[[\s\S]*['"]username-submit['"]/);
    assert.match(component, /\$emit\(['"]username-submit['"]/);
    assert.match(component, /finishUsernameSubmit/);
    assert.match(page, /@username-submit="handleUsernameSubmit"/);
    assert.match(page, /updateCurrentUserProfile/);
    assert.match(authStore, /export async function updateCurrentUserProfile/);
    assert.match(authApi, /export function updateProfile/);
    assert.match(authApi, /\/api\/auth\/me/);
    assert.doesNotMatch(component, /登录账号/);
  });

  it('binds the current account phone directly from the settings phone row', () => {
    assert.match(component, /open-type="getPhoneNumber"/);
    assert.match(component, /@getphonenumber="handlePhoneNumber/);
    assert.match(component, /emits:\s*\[[\s\S]*['"]phone-bind['"]/);
    assert.match(component, /\$emit\(['"]phone-bind['"]/);
    assert.match(component, /action:\s*['"]phone['"][\s\S]*openType:\s*this\.loggedIn \? ['"]getPhoneNumber['"] : ['"]['"]/);
    assert.match(page, /@phone-bind="handlePhoneBind"/);
    assert.match(page, /async handlePhoneBind/);
    assert.match(page, /bindCurrentUserPhone/);
    assert.match(authStore, /export async function bindCurrentUserPhone/);
    assert.match(authApi, /export function bindPhone/);
    assert.match(authApi, /\/api\/auth\/bind-phone/);
    assert.doesNotMatch(page, /手机号可通过快捷登录同步/);
  });

  it('does not display the login account as a phone binding fallback', () => {
    const displayPhoneBlock = component.match(/displayPhone\(\)\s*\{[\s\S]*?\n    \},/)?.[0] || '';
    const maskPhoneBlock = component.match(/function maskPhone\(value\)\s*\{[\s\S]*?\n\}/)?.[0] || '';

    assert.match(displayPhoneBlock, /normalizedUser\.phone/);
    assert.match(displayPhoneBlock, /normalizedUser\.mobile/);
    assert.doesNotMatch(displayPhoneBlock, /normalizedUser\.account/);
    assert.doesNotMatch(displayPhoneBlock, /normalizedUser\.username/);
    assert.match(maskPhoneBlock, /\^1\\d\{10\}\$/);
    assert.match(component, /value:\s*this\.displayPhone \|\| \(this\.loggedIn \? ['"]未绑定['"] : ['"]['"]\)/);
  });

  it('keeps customer-bound display names read-only in settings', () => {
    assert.match(component, /display_name_source/);
    assert.match(component, /linked_party_id/);
    assert.match(component, /action:\s*this\.canEditDisplayName \? ['"]username['"] : ['"]customer-name['"]/);
    assert.match(component, /static:\s*!this\.canEditDisplayName/);
    assert.match(component, /if \(item\.action === ['"]customer-name['"]\) return/);
  });

  it('keeps the edited username visible even when the profile update response is partial', () => {
    const updateBlock = authStore.match(/export async function updateCurrentUserProfile[\s\S]*?\n\}/)?.[0] || '';

    assert.match(updateBlock, /\.\.\.\(state\.user \|\| \{\}\)/);
    assert.match(updateBlock, /\.\.\.payload/);
    assert.match(updateBlock, /state\.user\s*=/);
  });

  it('uses explicit block spacing so cards do not touch in WeChat scroll-view', () => {
    assert.match(component, /\.sj-settings-page__body\s*\{[\s\S]*display:\s*block/);
    assert.match(
      component,
      /\.sj-settings-page__summary,\s*\.sj-settings-page__section,\s*\.sj-settings-page__password-panel\s*\{[\s\S]*margin-bottom:\s*40rpx/
    );
    assert.match(component, /\.sj-settings-page__actions\s*\{[\s\S]*margin-top:\s*4rpx/);
  });
});
