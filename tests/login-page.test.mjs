import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../', import.meta.url);
const componentUrl = new URL('src/components/SjLoginPage.vue', root);
const myPageUrl = new URL('src/pages/my/index.vue', root);
const authApiUrl = new URL('src/api/auth.js', root);
const authStoreUrl = new URL('src/stores/auth.js', root);
const pagesJsonUrl = new URL('src/pages.json', root);

const component = existsSync(componentUrl) ? readFileSync(componentUrl, 'utf8') : '';
const myPage = existsSync(myPageUrl) ? readFileSync(myPageUrl, 'utf8') : '';
const authApi = existsSync(authApiUrl) ? readFileSync(authApiUrl, 'utf8') : '';
const authStore = existsSync(authStoreUrl) ? readFileSync(authStoreUrl, 'utf8') : '';
const pagesJson = existsSync(pagesJsonUrl) ? readFileSync(pagesJsonUrl, 'utf8') : '';

describe('miniapp login page integration', () => {
  it('ships the shared login component from the component library design', () => {
    assert.ok(existsSync(componentUrl));
    assert.match(component, /name:\s*['"]SjLoginPage['"]/);
    assert.match(component, /loginModes/);
    assert.match(component, /currentMode === "phone"/);
    assert.match(component, /currentMode === "account"/);
    assert.match(component, /currentMode === "register"/);
    assert.match(component, /open-type="getPhoneNumber"/);
    assert.match(component, /@getphonenumber="handlePhoneLogin"/);
    assert.match(component, /sj-login-page__panel-note/);
    assert.match(component, /登录后自动匹配客户信息/);
    assert.match(component, /登录后查看销售单记录，继续浏览产品。/);
    assert.doesNotMatch(component, /登录后可同步订单查询权限/);
    assert.doesNotMatch(component, /自动完成客户绑定/);
    assert.match(component, /sj-login-page__agreement/);
    assert.match(component, /登录即表示已阅读并同意/);
    assert.match(component, /《用户协议》/);
    assert.match(component, /《隐私政策》/);
    assert.match(component, /\$emit\(['"]agreement['"]/);
    assert.match(component, /\$emit\(['"]privacy['"]/);
    assert.match(component, /\$emit\(['"]phone-login['"]/);
    assert.match(component, /\$emit\(['"]password-login['"]/);
    assert.match(component, /\$emit\(['"]register['"]/);
    assert.match(component, /\$emit\(['"]guest['"]/);
    assert.match(component, /\$emit\(['"]mode-change['"]/);
    assert.match(component, /sj-login-page__footer-actions/);
    assert.doesNotMatch(component, /phoneNumber/);
    assert.doesNotMatch(component, /sj-login-page__status/);
  });

  it('keeps register and guest buttons inside both login panels', () => {
    assert.match(
      component,
      /v-if='currentMode === "phone"'[\s\S]*class="sj-login-page__panel"[\s\S]*sj-login-page__footer-actions[\s\S]*submitRegister[\s\S]*continueAsGuest[\s\S]*<view v-else-if='currentMode === "account"'/
    );
    assert.match(
      component,
      /v-else-if='currentMode === "account"'[\s\S]*class="sj-login-page__panel"[\s\S]*sj-login-page__footer-actions[\s\S]*submitRegister[\s\S]*continueAsGuest[\s\S]*<\/scroll-view>/
    );
  });

  it('turns register into a real account creation panel instead of a placeholder toast', () => {
    assert.match(component, /registerForm/);
    assert.match(component, /openRegisterPanel/);
    assert.match(component, /submitRegisterAccount/);
    assert.match(component, /注册并登录/);
    assert.match(component, /返回登录/);
    assert.match(component, /registerError/);
    assert.match(component, /\$emit\(['"]register['"],\s*\{/);
    assert.match(myPage, /async handleRegister/);
    assert.match(myPage, /registerAccount/);
    assert.doesNotMatch(myPage, /注册功能待接入/);
    assert.match(authApi, /export function register/);
    assert.match(authApi, /\/api\/auth\/register/);
    assert.match(authStore, /register as apiRegister/);
    assert.match(authStore, /export async function register/);
  });

  it('does not submit a normal register account as a bound phone number', () => {
    assert.match(component, /normalizePhoneAccount/);
    assert.match(component, /const registerPhone = normalizePhoneAccount\(account\)/);
    assert.doesNotMatch(component, /mobile:\s*account/);
    assert.doesNotMatch(component, /phone:\s*account/);
    assert.match(component, /\.\.\.\(registerPhone \? \{ mobile: registerPhone, phone: registerPhone \} : \{\}\)/);
  });

  it('keeps padded login controls inside the phone width', () => {
    assert.match(
      component,
      /\.sj-login-page,\s*\.sj-login-page__nav,\s*\.sj-login-page__body,\s*\.sj-login-page__hero,\s*\.sj-login-page__switch,\s*\.sj-login-page__switch-button,\s*\.sj-login-page__panel,\s*\.sj-login-page__input,\s*\.sj-login-page__primary,\s*\.sj-login-page__secondary\s*\{[\s\S]*box-sizing:\s*border-box/
    );
  });

  it('balances the login form vertically instead of packing it against the top', () => {
    const bodyBlock = component.match(/\.sj-login-page__body\s*\{[^}]*\}/)?.[0] || '';
    const heroBlock = component.match(/\.sj-login-page__hero\s*\{[^}]*\}/)?.[0] || '';
    const panelBlock = component.match(/\.sj-login-page__panel\s*\{[^}]*\}/)?.[0] || '';

    assert.match(bodyBlock, /gap:\s*36rpx/);
    assert.match(bodyBlock, /padding:\s*72rpx 36rpx calc\(160rpx \+ env\(safe-area-inset-bottom\)\)/);
    assert.match(heroBlock, /gap:\s*22rpx/);
    assert.match(panelBlock, /margin-top:\s*24rpx/);
    assert.match(panelBlock, /gap:\s*38rpx/);
    assert.match(panelBlock, /padding:\s*40rpx 36rpx/);
    assert.match(component, /\.sj-login-page__panel-note\s*\{[\s\S]*font-size:\s*23rpx[\s\S]*text-align:\s*center/);
    assert.match(component, /\.sj-login-page__agreement\s*\{[\s\S]*font-size:\s*22rpx[\s\S]*justify-content:\s*center/);
    assert.match(component, /\.sj-login-page__agreement-link\s*\{[\s\S]*color:\s*#18181b/);
  });

  it('renders the login component on the My tab when the user is not logged in', () => {
    assert.match(myPage, /import SjLoginPage/);
    assert.match(myPage, /components:\s*\{[\s\S]*SjLoginPage[\s\S]*\}/);
    assert.match(myPage, /<sj-login-page/);
    assert.match(myPage, /v-if="showLoginPanel"/);
    assert.match(myPage, /@phone-login="handlePhoneLogin"/);
    assert.match(myPage, /@password-login="handlePasswordLogin"/);
    assert.match(myPage, /@register="handleRegister"/);
    assert.match(myPage, /@guest="continueAsGuest"/);
    assert.match(myPage, /@agreement="handleAgreement"/);
    assert.match(myPage, /@privacy="handlePrivacy"/);
  });

  it('uses the existing auth store and routes for real miniapp actions', () => {
    assert.match(myPage, /getAuthState/);
    assert.match(myPage, /loginWithWechat/);
    assert.match(myPage, /login as passwordLogin/);
    assert.match(myPage, /logout as authLogout/);
    assert.match(myPage, /passwordLogin\(\s*\{/);
    assert.match(myPage, /loginWithWechat\(\s*\{/);
    assert.match(myPage, /phone_code/);
    assert.match(myPage, /login_code/);
    assert.match(myPage, /guestMode:\s*false/);
    assert.match(myPage, /continueAsGuest\(\)\s*\{[\s\S]*this\.guestMode = true/);
    assert.match(myPage, /PAGE_ROUTES\.my/);
    assert.match(myPage, /syncCustomTabBar\(PAGE_ROUTES\.my\)/);
    assert.match(myPage, /handleAgreement\(\)/);
    assert.match(myPage, /handlePrivacy\(\)/);
  });

  it('lets the My tab use the same custom navigation shell as the login component', () => {
    assert.match(pagesJson, /"path":\s*"pages\/my\/index"[\s\S]*"navigationStyle":\s*"custom"/);
  });
});
