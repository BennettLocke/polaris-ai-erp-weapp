import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../', import.meta.url);
const componentUrl = new URL('src/components/SjSalesOrdersPage.vue', root);
const pageUrl = new URL('src/pages/sales-orders/index.vue', root);
const apiUrl = new URL('src/api/sales-orders.js', root);
const pagesUrl = new URL('src/pages.json', root);
const routesUrl = new URL('src/utils/route.js', root);
const myPageUrl = new URL('src/pages/my/index.vue', root);

const component = existsSync(componentUrl) ? readFileSync(componentUrl, 'utf8') : '';
const page = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf8') : '';
const api = existsSync(apiUrl) ? readFileSync(apiUrl, 'utf8') : '';
const pages = existsSync(pagesUrl) ? readFileSync(pagesUrl, 'utf8') : '';
const routes = existsSync(routesUrl) ? readFileSync(routesUrl, 'utf8') : '';
const myPage = existsSync(myPageUrl) ? readFileSync(myPageUrl, 'utf8') : '';

describe('miniapp sales order page integration', () => {
  it('registers a non-tab sales-order page for the My page order entry', () => {
    assert.ok(existsSync(componentUrl));
    assert.ok(existsSync(pageUrl));
    assert.match(pages, /"path":\s*"pages\/sales-orders\/index"/);
    assert.match(routes, /salesOrders:\s*['"]\/pages\/sales-orders\/index['"]/);
    assert.doesNotMatch(routes, /TAB_BAR_PATHS[\s\S]*PAGE_ROUTES\.salesOrders/);
    assert.match(myPage, /case ['"]orders['"]:[\s\S]*navigateToPage\(PAGE_ROUTES\.salesOrders\)/);
  });

  it('loads customer sales orders from the dedicated miniapp API', () => {
    assert.ok(existsSync(apiUrl));
    assert.match(api, /export function getMySalesOrders/);
    assert.match(api, /\/api\/mini\/sales-orders/);
    assert.match(page, /import \{ getMySalesOrders \}/);
    assert.match(page, /async loadSalesOrders/);
    assert.match(page, /getMySalesOrders\(\{/);
    assert.doesNotMatch(page, /getOrderFlow/);
    assert.doesNotMatch(page, /WorkflowOrder/);
  });

  it('renders sales-order cards with sales fields instead of production workflow actions', () => {
    assert.match(component, /name:\s*['"]SjSalesOrdersPage['"]/);
    assert.match(component, /销售单/);
    assert.match(component, /sales_no/);
    assert.match(component, /customer_name/);
    assert.match(component, /products/);
    assert.match(component, /receivable_amount/);
    assert.match(component, /pay_status_text/);
    assert.match(component, /sj-sales-orders__card/);
    assert.match(component, /sj-sales-orders__product-image/);
    assert.doesNotMatch(component, /制作完成|配送完成|取消制作|取消配送|设计稿/);
  });

  it('uses production-ready customer-facing sales order copy', () => {
    assert.match(component, /开单记录/);
    assert.match(component, /登录后查看销售单/);
    assert.match(component, /联系客服确认客户信息/);
    assert.match(component, /搜索销售单号或产品名称/);
    assert.doesNotMatch(component, /绑定客户后会自动同步销售记录/);
    assert.doesNotMatch(component, /登录后可查看自己的销售单/);
  });
});
