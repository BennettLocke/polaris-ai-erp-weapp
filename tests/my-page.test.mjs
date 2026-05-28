import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../', import.meta.url);
const componentUrl = new URL('src/components/SjMyPage.vue', root);
const pageUrl = new URL('src/pages/my/index.vue', root);
const customerApiUrl = new URL('src/api/customer.js', root);
const profileComponentUrl = new URL('src/components/SjAccountProfilePage.vue', root);
const profilePageUrl = new URL('src/pages/profile/index.vue', root);
const pagesUrl = new URL('src/pages.json', root);
const routesUrl = new URL('src/utils/route.js', root);
const myLucideIconNames = [
  'my-clipboard-list',
  'my-headset',
  'my-user-round',
  'my-settings',
];

const component = existsSync(componentUrl) ? readFileSync(componentUrl, 'utf8') : '';
const page = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf8') : '';
const customerApi = existsSync(customerApiUrl) ? readFileSync(customerApiUrl, 'utf8') : '';
const profileComponent = existsSync(profileComponentUrl) ? readFileSync(profileComponentUrl, 'utf8') : '';
const profilePage = existsSync(profilePageUrl) ? readFileSync(profilePageUrl, 'utf8') : '';
const pages = existsSync(pagesUrl) ? readFileSync(pagesUrl, 'utf8') : '';
const routes = existsSync(routesUrl) ? readFileSync(routesUrl, 'utf8') : '';

describe('miniapp my page integration', () => {
  it('ships a reusable My page component from the component library design', () => {
    assert.ok(existsSync(componentUrl));
    assert.match(component, /name:\s*['"]SjMyPage['"]/);
    assert.match(component, /sj-my-page__profile-card/);
    assert.match(component, /sj-my-page__avatar/);
    assert.match(component, /sj-my-page__menu-card/);
    assert.match(component, /sj-my-page__primary/);
    assert.match(component, /avatarSeed/);
    assert.match(component, /avatarToneClass/);
    assert.match(component, /roleText/);
    assert.match(component, /statusText/);
    assert.doesNotMatch(component, /sj-my-page__notice/);
    assert.doesNotMatch(component, /客户查询/);
    assert.doesNotMatch(component, /客户只查看与自己绑定的订单/);
  });

  it('keeps the My page menu focused on useful account actions', () => {
    assert.match(component, /defaultMenuItems/);
    assert.match(component, /销售单/);
    assert.match(component, /历史开单记录/);
    assert.match(component, /联系客服/);
    assert.match(component, /账号资料/);
    assert.match(component, /设置/);
    assert.doesNotMatch(component, /订单进度/);
    assert.doesNotMatch(component, /权限/);
    assert.doesNotMatch(component, /购物车|优惠券|积分|收藏/);
    assert.match(component, /\$emit\(['"]logout['"]/);
    assert.match(component, /\$emit\(['"]login['"]/);
    assert.match(component, /\$emit\(['"]profile-tap['"]/);
    assert.match(component, /\$emit\(['"]menu-tap['"]/);
  });

  it('renders My page menu actions with local Lucide SVG icons', () => {
    assert.match(component, /MY_MENU_ICON_ASSETS/);
    assert.match(component, /menuIconSrc\(item = \{\}\)/);
    assert.match(component, /<image[\s\S]*class="sj-my-page__menu-icon-image"[\s\S]*:src="menuIconSrc\(item\)"[\s\S]*mode="aspectFit"/);
    assert.match(component, /\/static\/icons\/lucide\/my-clipboard-list\.svg/);
    assert.match(component, /\/static\/icons\/lucide\/my-headset\.svg/);
    assert.match(component, /\/static\/icons\/lucide\/my-user-round\.svg/);
    assert.match(component, /\/static\/icons\/lucide\/my-settings\.svg/);
    assert.doesNotMatch(component, /sj-my-page__menu-icon--order::before/);
    assert.doesNotMatch(component, /sj-my-page__menu-icon--contact::before/);
    assert.doesNotMatch(component, /sj-my-page__menu-icon--profile::before/);
    assert.doesNotMatch(component, /sj-my-page__menu-icon--settings::before/);
    assert.doesNotMatch(component, /sj-my-page__menu-icon::before/);

    for (const name of myLucideIconNames) {
      const iconUrl = new URL(`src/static/icons/lucide/${name}.svg`, root);
      assert.ok(existsSync(iconUrl), `${name}.svg should exist`);
      const icon = readFileSync(iconUrl, 'utf8');
      assert.match(icon, /@license lucide-static/);
      assert.match(icon, /viewBox="0 0 24 24"/);
      assert.match(icon, /stroke-width="2"/);
      assert.match(icon, /stroke="#18181b"/);
    }
  });

  it('uses compact mobile proportions that match the component library direction', () => {
    const bodyBlock = component.match(/\.sj-my-page__body\s*\{[^}]*\}/)?.[0] || '';
    const bodyInnerBlock = component.match(/\.sj-my-page__body-inner\s*\{[^}]*\}/)?.[0] || '';
    const profileBlock = component.match(/\.sj-my-page__profile-card\s*\{[^}]*\}/)?.[0] || '';
    const avatarBlock = component.match(/\.sj-my-page__avatar\s*\{[^}]*\}/)?.[0] || '';
    const menuItemBlock = component.match(/\.sj-my-page__menu-item\s*\{[^}]*\}/)?.[0] || '';
    const actionsBlock = component.match(/\.sj-my-page__actions\s*\{[^}]*\}/)?.[0] || '';
    const actionBlock = component.match(/\.sj-my-page__primary,\s*\.sj-my-page__secondary\s*\{[^}]*\}/)?.[0] || '';

    assert.match(component, /sj-my-page__body-inner/);
    assert.doesNotMatch(bodyBlock, /display:\s*grid/);
    assert.doesNotMatch(bodyBlock, /padding:/);
    assert.match(bodyInnerBlock, /box-sizing:\s*border-box/);
    assert.match(bodyInnerBlock, /width:\s*100%/);
    assert.match(bodyInnerBlock, /display:\s*grid/);
    assert.match(bodyInnerBlock, /gap:\s*24rpx/);
    assert.match(bodyInnerBlock, /padding:\s*24rpx 24rpx calc\(172rpx \+ env\(safe-area-inset-bottom\)\)/);
    assert.match(profileBlock, /padding:\s*24rpx/);
    assert.match(profileBlock, /border-radius:\s*28rpx/);
    assert.match(avatarBlock, /width:\s*104rpx/);
    assert.match(avatarBlock, /height:\s*104rpx/);
    assert.match(menuItemBlock, /min-height:\s*104rpx/);
    assert.match(actionsBlock, /width:\s*100%/);
    assert.match(actionsBlock, /box-sizing:\s*border-box/);
    assert.match(actionBlock, /height:\s*84rpx/);
    assert.match(actionBlock, /max-width:\s*100%/);
  });

  it('renders SjMyPage after login while keeping SjLoginPage for guests', () => {
    assert.match(page, /import SjLoginPage/);
    assert.match(page, /import SjMyPage/);
    assert.match(page, /components:\s*\{\s*SjLoginPage,\s*SjMyPage\s*\}/);
    assert.match(page, /<sj-login-page[\s\S]*v-if="showLoginPanel"/);
    assert.match(page, /<sj-my-page[\s\S]*v-else-if="showMyPanel"/);
    assert.match(page, /:user="currentUser"/);
    assert.match(page, /:logged-in="isLoggedIn"/);
    assert.match(page, /:role="currentRole"/);
    assert.match(page, /@logout="handleLogout"/);
    assert.match(page, /@menu-tap="handleMyMenu"/);
    assert.match(page, /@profile-tap="handleProfileTap"/);
  });

  it('lets Continue as guest enter the My page guest state without creating a login session', () => {
    assert.match(page, /guestMode:\s*false/);
    assert.match(page, /showLoginPanel\(\)/);
    assert.match(page, /showMyPanel\(\)/);
    assert.match(page, /v-if="showLoginPanel"/);
    assert.match(page, /v-else-if="showMyPanel"/);
    assert.match(page, /:logged-in="isLoggedIn"/);
    assert.match(page, /:role="currentRole"/);
    assert.match(page, /continueAsGuest\(\)\s*\{[\s\S]*this\.guestMode = true/);
    assert.doesNotMatch(page, /continueAsGuest\(\)\s*\{[\s\S]*navigateToPage\(PAGE_ROUTES\.category\)/);
    assert.match(page, /handleLoginRequest\(\)\s*\{[\s\S]*this\.guestMode = false/);
  });

  it('shows bound customer balance and recent workflow orders on the My page', () => {
    assert.ok(existsSync(customerApiUrl));
    assert.match(customerApi, /getCustomerSummary/);
    assert.match(customerApi, /\/api\/mini\/customer\/summary/);
    assert.match(component, /customerSummary/);
    assert.match(component, /showCustomerSummary/);
    assert.match(component, /sj-my-page__customer-card/);
    assert.match(component, /sj-my-page__balance/);
    assert.match(component, /sj-my-page__recent-order/);
    assert.match(component, /\$emit\(['"]recent-order-tap['"]/);
    assert.match(page, /import \{ getCustomerSummary \}/);
    assert.match(page, /:customer-summary="customerSummary"/);
    assert.match(page, /@recent-order-tap="handleRecentOrderTap"/);
    assert.match(page, /loadCustomerSummary/);
    assert.match(page, /handleRecentOrderTap/);
    assert.match(page, /PAGE_ROUTES\.salesOrders/);
  });

  it('maps My page actions to the existing miniapp routes without duplicating tabbar UI', () => {
    const contactCase = page.match(/case ['"]contact['"]:[\s\S]*?break;/)?.[0] || '';

    assert.match(page, /PAGE_ROUTES\.salesOrders/);
    assert.match(page, /PAGE_ROUTES\.profile/);
    assert.match(page, /import\s*\{[\s\S]*openCustomerService[\s\S]*\}\s*from ['"]\.\.\/\.\.\/utils\/route['"]/);
    assert.match(page, /handleMyMenu/);
    assert.match(page, /case ['"]orders['"]/);
    assert.match(page, /case ['"]orders['"]:[\s\S]*navigateToPage\(PAGE_ROUTES\.salesOrders\)/);
    assert.doesNotMatch(page, /case ['"]orders['"]:[\s\S]*navigateToPage\(PAGE_ROUTES\.order\)/);
    assert.match(page, /case ['"]contact['"]/);
    assert.match(contactCase, /openCustomerService\(\)/);
    assert.doesNotMatch(contactCase, /navigateToPage\(PAGE_ROUTES\.contact\)/);
    assert.match(page, /case ['"]profile['"]/);
    assert.match(page, /case ['"]settings['"]/);
    assert.match(page, /handleProfileTap\(\)\s*\{[\s\S]*navigateToPage\(PAGE_ROUTES\.profile\)/);
    assert.match(page, /case ['"]profile['"]:[\s\S]*navigateToPage\(PAGE_ROUTES\.profile\)/);
    assert.doesNotMatch(page, /openProducts/);
    assert.doesNotMatch(page, /全部产品/);
  });

  it('adds an account profile page for customer binding and account permissions', () => {
    assert.ok(existsSync(profileComponentUrl));
    assert.ok(existsSync(profilePageUrl));
    assert.match(profileComponent, /name:\s*['"]SjAccountProfilePage['"]/);
    assert.match(profileComponent, /sj-account-profile__hero/);
    assert.match(profileComponent, /accountRows/);
    assert.match(profileComponent, /permissionRows/);
    assert.match(profileComponent, /手机号/);
    assert.match(profileComponent, /微信绑定/);
    assert.match(profileComponent, /客户信息/);
    assert.doesNotMatch(profileComponent, /绑定客户/);
    assert.match(profileComponent, /账号状态/);
    assert.match(profileComponent, /基本信息/);
    assert.doesNotMatch(profileComponent, /订单权限/);
    assert.doesNotMatch(profileComponent, /编辑权限/);
    assert.doesNotMatch(profileComponent, /登录账号/);
    assert.doesNotMatch(profileComponent, /accountText/);
    assert.match(profilePage, /refreshCurrentUser/);
    assert.match(profilePage, /<sj-account-profile-page/);
    assert.match(profilePage, /@back="goBack"/);
    assert.match(profilePage, /@login="goLogin"/);
    assert.match(profilePage, /@settings="goSettings"/);
    assert.match(pages, /"path":\s*"pages\/profile\/index"/);
    assert.match(routes, /profile:\s*['"]\/pages\/profile\/index['"]/);
    assert.doesNotMatch(routes, /TAB_BAR_PATHS[\s\S]*PAGE_ROUTES\.profile/);
  });

  it('does not display the login account as the account profile phone value', () => {
    const phoneTextBlock = profileComponent.match(/phoneText\(\)\s*\{[\s\S]*?\n    \},/)?.[0] || '';
    const maskPhoneBlock = profileComponent.match(/function maskPhone\(value\)\s*\{[\s\S]*?\n\}/)?.[0] || '';

    assert.match(phoneTextBlock, /normalizedUser\.phone/);
    assert.match(phoneTextBlock, /normalizedUser\.mobile/);
    assert.doesNotMatch(phoneTextBlock, /normalizedUser\.account/);
    assert.doesNotMatch(phoneTextBlock, /normalizedUser\.username/);
    assert.match(maskPhoneBlock, /\^1\\d\{10\}\$/);
    assert.match(phoneTextBlock, /\|\| ['"]未绑定['"]/);
  });

  it('uses the editable display username before bound customer names on account screens', () => {
    const myDisplayName = component.match(/displayName\(\)\s*\{[\s\S]*?\n    \},/)?.[0] || '';
    const profileDisplayName = profileComponent.match(/displayName\(\)\s*\{[\s\S]*?\n    \},/)?.[0] || '';

    assert.match(myDisplayName, /this\.normalizedUser\.display_name/);
    assert.ok(
      myDisplayName.indexOf('this.normalizedUser.display_name') < myDisplayName.indexOf('this.normalizedUser.company'),
      'My page should show the edited username before company/customer names'
    );
    assert.ok(
      profileDisplayName.indexOf('this.normalizedUser.display_name') < profileDisplayName.indexOf('this.normalizedUser.linked_party_name'),
      'Account profile should show the edited username before bound customer names'
    );
  });
});
