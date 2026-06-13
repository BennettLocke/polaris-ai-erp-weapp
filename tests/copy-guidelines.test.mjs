import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../', import.meta.url);

function read(relativePath) {
  const fileUrl = new URL(relativePath, root);
  return existsSync(fileUrl) ? readFileSync(fileUrl, 'utf8') : '';
}

const productDetail = read('src/pages/product/detail.vue');
const categoryPage = read('src/pages/category/index.vue');
const contactPage = read('src/pages/contact/index.vue');
const myPage = read('src/pages/my/index.vue');
const settingsPage = read('src/pages/settings/index.vue');
const policyPage = read('src/pages/policy/index.vue');
const policies = read('src/utils/policies.js');
const routeUtils = read('src/utils/route.js');
const pagesJson = read('src/pages.json');

describe('miniapp production copy guidelines', () => {
  it('keeps product detail copy concise and customer-facing', () => {
    assert.match(productDetail, /编号、分类、颜色、装箱规格/);
    assert.match(productDetail, /咨询报价与规格/);
    assert.match(productDetail, /暂无详情图文/);
    assert.doesNotMatch(productDetail, /展示产品编号、分类、颜色和装箱规格/);
    assert.doesNotMatch(productDetail, /报价、打样、规格确认/);
    assert.doesNotMatch(productDetail, /暂无详情说明/);
  });

  it('keeps category and contact page copy ready for release', () => {
    assert.match(categoryPage, /搜索编号、名称、规格/);
    assert.match(categoryPage, /暂无产品/);
    assert.match(contactPage, /产品咨询与售后服务/);
    assert.doesNotMatch(categoryPage, /当前分类暂无产品/);
    assert.doesNotMatch(contactPage, /待配置/);
    assert.doesNotMatch(contactPage, /客服电话待配置|客服微信待配置/);
  });

  it('uses full release-ready agreement and privacy pages instead of short modal copy', () => {
    assert.match(pagesJson, /pages\/policy\/index/);
    assert.match(policyPage, /getPolicyDocument/);
    assert.match(routeUtils, /buildPolicyUrl/);
    assert.match(myPage, /navigateToPage\(buildPolicyUrl\('agreement'\)\)/);
    assert.match(myPage, /navigateToPage\(buildPolicyUrl\('privacy'\)\)/);
    assert.match(settingsPage, /navigateToPage\(buildPolicyUrl\('agreement'\)\)/);
    assert.match(settingsPage, /navigateToPage\(buildPolicyUrl\('privacy'\)\)/);
    assert.match(policies, /小程序不提供购物车、在线下单和微信支付功能/);
    assert.match(policies, /未登录用户或未绑定客户的账号默认不展示订单列表/);
    assert.match(policies, /个人信息处理者为肆计包装/);
    assert.match(policies, /手机号授权凭证及微信返回的手机号信息/);
    assert.match(policies, /查询、复制、更正、补充、删除你的个人信息/);
    assert.doesNotMatch(myPage, /内容待完善/);
    assert.doesNotMatch(settingsPage, /内容待完善/);
    assert.doesNotMatch(myPage, /showModal\(\{[\s\S]*用户协议/);
  });
});
