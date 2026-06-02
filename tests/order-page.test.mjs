import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../', import.meta.url);
const orderPageUrl = new URL('src/pages/orderflow/index.vue', root);
const cardComponentUrl = new URL('src/components/sj-order-card/sj-order-card.vue', root);
const pageComponentUrl = new URL('src/components/sj-order-page/sj-order-page.vue', root);
const pagesJsonUrl = new URL('src/pages.json', root);
const lucideIconNames = [
  'grid-2x2',
  'grid-2x2-active',
  'pencil-ruler',
  'pencil-ruler-active',
  'truck',
  'truck-active',
  'circle-check',
  'circle-check-active',
];

const orderPage = existsSync(orderPageUrl) ? readFileSync(orderPageUrl, 'utf8') : '';
const orderCard = existsSync(cardComponentUrl) ? readFileSync(cardComponentUrl, 'utf8') : '';
const orderComponent = existsSync(pageComponentUrl) ? readFileSync(pageComponentUrl, 'utf8') : '';
const pagesJson = existsSync(pagesJsonUrl) ? readFileSync(pagesJsonUrl, 'utf8') : '';

describe('miniapp order page', () => {
  it('uses the shared order page and card components', () => {
    assert.ok(existsSync(cardComponentUrl));
    assert.ok(existsSync(pageComponentUrl));
    assert.match(orderPage, /import SjOrderPage/);
    assert.match(orderPage, /components:\s*\{\s*SjOrderPage\s*\}/);
    assert.match(orderPage, /<sj-order-page/);
    assert.match(orderPage, /class="orderflow-page"/);
    assert.match(orderPage, /<style scoped>/);
  });

  it('keeps the production workflow actions including edit', () => {
    assert.match(orderCard, /已下单/);
    assert.match(orderCard, /待制作/);
    assert.match(orderCard, /制作完成/);
    assert.match(orderCard, /待配送/);
    assert.match(orderCard, /已完成/);
    assert.match(orderCard, /\$emit\("make-done"/);
    assert.match(orderCard, /\$emit\("delivery-done"/);
    assert.match(orderCard, /\$emit\("cancel-make"/);
    assert.match(orderCard, /\$emit\("cancel-delivery"/);
    assert.match(orderCard, /\$emit\("edit"/);
    assert.match(orderCard, /编辑/);
    assert.match(orderCard, /取消制作/);
    assert.match(orderCard, /取消配送/);
    assert.doesNotMatch(orderCard, /查看设计稿/);
    assert.doesNotMatch(orderCard, /复制单号/);
    assert.doesNotMatch(orderCard, /推进/);
  });

  it('keeps status action buttons tied to the current workflow state', () => {
    assert.match(orderCard, /canMakeDone\(\)/);
    assert.match(orderCard, /canDeliveryDone\(\)/);
    assert.match(orderCard, /this\.canMakeDone/);
    assert.match(orderCard, /this\.canDeliveryDone/);
    assert.match(orderCard, /:disabled="item\.disabled"/);
    assert.match(orderCard, /item\.disabled/);
  });

  it('lets the page own data loading and permission state only', () => {
    assert.match(orderPage, /getOrderFlow/);
    assert.match(orderPage, /completeWorkflowOrderAction/);
    assert.match(orderPage, /saveWorkflowOrder/);
    assert.match(orderPage, /buildWorkflowOrderEditForm/);
    assert.match(orderPage, /buildWorkflowOrderSavePayload/);
    assert.match(orderPage, /updateWorkflowOrderFromEditForm/);
    assert.match(orderPage, /updateWorkflowOrderInPlace/);
    assert.match(orderPage, /getAuthState/);
    assert.match(orderPage, /refreshCurrentUser/);
    assert.match(orderPage, /canRequestOrderList/);
    assert.match(orderPage, /hasLinkedCustomer/);
    assert.match(orderPage, /ensureAuthState/);
    assert.match(orderPage, /orderRole\(\)/);
    assert.match(orderPage, /searched/);
    assert.match(orderPage, /@make-done="handleMakeDone"/);
    assert.match(orderPage, /@delivery-done="handleDeliveryDone"/);
    assert.match(orderPage, /@cancel-make="handleCancelMake"/);
    assert.match(orderPage, /@cancel-delivery="handleCancelDelivery"/);
    assert.match(orderPage, /@edit="handleEdit"/);
    assert.match(orderPage, /editingOrder/);
    assert.match(orderPage, /editForm/);
    assert.match(orderPage, /submitEdit/);
    assert.match(orderPage, /closeEdit/);
    assert.match(orderPage, /handleWorkflowAction/);
    assert.match(orderPage, /make_done/);
    assert.match(orderPage, /delivery_done/);
    assert.match(orderPage, /make_cancel/);
    assert.match(orderPage, /delivery_cancel/);
    assert.match(orderPage, /filterWorkflowOrdersByStatus/);
    assert.match(orderPage, /sortWorkflowOrdersByProgress/);
    assert.doesNotMatch(orderPage, /this\.workflows\s*=\s*sortWorkflowOrdersByProgress\(filterWorkflowOrdersByStatus\(this\.workflows/);
    assert.doesNotMatch(orderPage, /await this\.reload\(\);/);
    assert.doesNotMatch(orderPage, /接口待接入/);
    assert.doesNotMatch(orderPage, /编辑功能待接入/);
    assert.doesNotMatch(orderPage, /activeTab/);
    assert.doesNotMatch(orderPage, /销售单/);
  });

  it('shows an internal order edit sheet with production fields', () => {
    assert.match(orderPage, /class="orderflow-editor"/);
    assert.match(orderPage, /保存修改/);
    assert.match(orderPage, /客户名称/);
    assert.match(orderPage, /商品名称/);
    assert.match(orderPage, /商品颜色/);
    assert.match(orderPage, /订单数量/);
    assert.match(orderPage, /是否丝印/);
    assert.match(orderPage, /备注/);
  });

  it('keeps the order edit actions visible above the custom tabbar', () => {
    assert.match(orderPage, /\.orderflow-editor\s*\{[\s\S]*z-index:\s*10000/);
    assert.match(orderPage, /\.orderflow-editor__sheet\s*\{[\s\S]*height:\s*78vh/);
    assert.match(orderPage, /\.orderflow-editor__sheet\s*\{[\s\S]*overflow:\s*hidden/);
    assert.match(orderPage, /\.orderflow-editor__body\s*\{[\s\S]*flex:\s*1 1 auto/);
    assert.match(orderPage, /\.orderflow-editor__body\s*\{[\s\S]*height:\s*0/);
    assert.match(orderPage, /\.orderflow-editor__actions\s*\{[\s\S]*flex:\s*0 0 auto/);
  });

  it('keeps guests empty until search but lets linked customers load their own orders', () => {
    assert.match(orderComponent, /shouldShowInitialEmpty\(\)/);
    assert.match(orderComponent, /!this\.isInternalUser && !this\.roleIsCustomer && !this\.searched && !this\.loading/);
    assert.match(orderPage, /return 'customer'/);
    assert.match(orderPage, /this\.searched = Boolean\(cleanText\(this\.keyword\)\)/);
    assert.match(orderPage, /this\.clearOrders\(\)/);
    assert.doesNotMatch(orderComponent, /sj-order-page__notice/);
    assert.doesNotMatch(orderComponent, /订单查询/);
    assert.doesNotMatch(orderComponent, /未登录或客户角色不会默认展示订单/);
  });

  it('restores a workflow keyword passed from My page recent records', () => {
    assert.match(orderPage, /ORDERFLOW_KEYWORD/);
    assert.match(orderPage, /sj_orderflow_keyword/);
    assert.match(orderPage, /applyStoredKeyword/);
    assert.match(orderPage, /uni\.getStorageSync\(ORDERFLOW_KEYWORD\)/);
    assert.match(orderPage, /uni\.removeStorageSync\(ORDERFLOW_KEYWORD\)/);
    assert.match(orderPage, /this\.keyword = stored/);
    assert.match(orderPage, /return this\.reload\(\)/);
  });

  it('uses concise production order empty and edit copy', () => {
    assert.match(orderComponent, /搜索生产订单/);
    assert.match(orderComponent, /输入订单号、客户或产品名称/);
    assert.match(orderComponent, /未找到订单/);
    assert.match(orderComponent, /换个关键词再试/);
    assert.match(orderPage, /编辑生产信息/);
    assert.match(orderPage, /更新客户、产品和生产备注/);
    assert.match(orderPage, /生产确认/);
    assert.doesNotMatch(orderComponent, /客户也可以查询订单，但默认不会展示列表/);
    assert.doesNotMatch(orderPage, /修改生产部需要确认的订单信息/);
    assert.doesNotMatch(orderPage, /用于生产确认/);
  });

  it('keeps the order search high and uses category-page text navigation for statuses', () => {
    assert.match(orderComponent, /navShellStyle\(\)/);
    assert.match(orderComponent, /navSearchStyle\(\)/);
    assert.match(orderComponent, /setupNavLayout\(\)/);
    assert.match(orderComponent, /navHeight:\s*105/);
    assert.match(orderComponent, /position:\s*relative/);
    assert.match(orderComponent, /position:\s*absolute/);
    assert.match(orderComponent, /placeholder-class="sj-order-page__placeholder"/);
    assert.match(orderComponent, /width:\s*24rpx/);
    assert.match(orderComponent, /border:\s*3rpx solid #a1a1aa/);
    assert.match(orderComponent, /font-size:\s*24rpx/);
    assert.match(pagesJson, /"path":\s*"pages\/orderflow\/index"[\s\S]*"navigationStyle":\s*"custom"/);
    assert.doesNotMatch(orderComponent, /sj-order-page__search-action/);
    assert.doesNotMatch(orderComponent, /padding:\s*52px/);
    assert.match(orderComponent, /<image[\s\S]*class="sj-order-page__tab-icon"[\s\S]*:src="statusIconSrc\(item\)"[\s\S]*mode="aspectFit"/);
    assert.match(orderComponent, /sj-order-page__tab-text/);
    assert.match(orderComponent, /sj-order-page__tab-indicator/);
    assert.match(orderComponent, /sj-order-page__tab-icon/);
    assert.match(orderComponent, /\.sj-order-page__tab\s*\{[\s\S]*min-width:\s*66px/);
    assert.match(orderComponent, /\.sj-order-page__tab\s*\{[\s\S]*height:\s*40px/);
    assert.match(orderComponent, /\.sj-order-page__tab\s*\{[\s\S]*font-size:\s*14px/);
    assert.match(orderComponent, /\.sj-order-page__tab-icon\s*\{[\s\S]*width:\s*18px/);
    assert.match(orderComponent, /\.sj-order-page__tab-icon\s*\{[\s\S]*height:\s*18px/);
    assert.match(orderComponent, /\.sj-order-page__tab-indicator\s*\{[\s\S]*width:\s*18px/);
    assert.match(orderComponent, /\.sj-order-page__tab-indicator\s*\{[\s\S]*height:\s*3px/);
    assert.match(orderComponent, /icon:\s*"all"/);
    assert.match(orderComponent, /icon:\s*"make"/);
    assert.match(orderComponent, /icon:\s*"delivery"/);
    assert.match(orderComponent, /icon:\s*"done"/);
    assert.match(orderComponent, /statusIconSrc\(item\)/);
    assert.match(orderComponent, /\/static\/icons\/lucide\/grid-2x2\.svg/);
    assert.match(orderComponent, /\/static\/icons\/lucide\/grid-2x2-active\.svg/);
    assert.match(orderComponent, /\/static\/icons\/lucide\/pencil-ruler\.svg/);
    assert.match(orderComponent, /\/static\/icons\/lucide\/truck\.svg/);
    assert.match(orderComponent, /\/static\/icons\/lucide\/circle-check\.svg/);
    assert.doesNotMatch(orderComponent, /sj-order-page__tab-icon--make::before/);
    assert.doesNotMatch(orderComponent, /sj-order-page__tab-icon--delivery::before/);
    assert.doesNotMatch(orderComponent, /label:\s*"已下单"/);
    assert.match(orderComponent, /label:\s*"待制作"/);
    assert.doesNotMatch(orderComponent, /\.sj-order-page__tab\.is-active::after/);
  });

  it('bundles local Lucide SVG assets for order status tabs', () => {
    for (const name of lucideIconNames) {
      const iconUrl = new URL(`src/static/icons/lucide/${name}.svg`, root);
      assert.ok(existsSync(iconUrl), `${name}.svg should exist`);
      const icon = readFileSync(iconUrl, 'utf8');
      assert.match(icon, /@license lucide-static/);
      assert.match(icon, /viewBox="0 0 24 24"/);
      assert.match(icon, /stroke-width="2"/);
    }
  });

  it('leaves enough scroll clearance below the last order card for the floating tabbar', () => {
    assert.match(orderComponent, /\.sj-order-page__body\s*\{[\s\S]*height:\s*calc\(100vh - var\(--sj-order-page-nav-height,\s*105px\)\)/);
    assert.match(orderComponent, /\.sj-order-page__content\s*\{[\s\S]*padding:\s*24rpx 24rpx calc\(260rpx \+ env\(safe-area-inset-bottom\)\)/);
    assert.match(orderComponent, /\.sj-order-page__content\s*\{[\s\S]*box-sizing:\s*border-box/);
  });
});
