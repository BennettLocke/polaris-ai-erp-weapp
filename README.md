# 肆计包装官方小程序

肆计包装自有微信小程序，基于 uni-app + Vue 3 开发。项目定位是给客户和内部业务人员查看产品、浏览分类、查看商品详情、查询订单与联系咨询，不包含购物车、在线下单和微信支付。

## 功能范围

- 首页：搜索、分类入口、主推系列、新品、热销与推荐商品模块。
- 分类：左侧分类导航、商品卡片、综合/最新/价格排序、全局搜索入口。
- 搜索：热门词、最近搜索、分类关键词直达、结果排序、分享海报实时生成。
- 商品详情：主图/颜色图浏览、图片预览、商品参数、客服咨询、商品分享海报实时生成。
- 订单：未登录可按关键词查询；客户账号可查看自己的订单；员工/管理员可查看与编辑工作流订单。
- 我的：登录、注册、账号信息、客户绑定信息、销售订单入口、设置与协议页面。

## 数据来源

小程序不直连数据库，所有业务数据通过 sjagent 服务层读取：

- 统一配置文件：`src/config.js`
- API 域名通过 `.env` 或构建环境变量注入，不在仓库中写死真实部署域名。
- 产品/分类/首页接口：`src/api/products.js`、`src/api/categories.js`、`src/api/home.js`
- 登录/客户/订单接口：`src/api/auth.js`、`src/api/customer.js`、`src/api/orders.js`、`src/api/sales-orders.js`

本仓库不保存数据库账号密码，也不保存服务器私钥。数据库连接、身份绑定、上下架过滤和销量统计由 sjagent 后端负责。

## 关联项目

- 组件库来源：[BennettLocke/bennett-locke-ui](https://github.com/BennettLocke/bennett-locke-ui)
- 主程序/服务层来源：[BennettLocke/polaris-erp-agent](https://github.com/BennettLocke/polaris-erp-agent)

## 页面结构

```text
src/
  pages/home/index.vue          首页
  pages/category/index.vue      商品分类
  pages/product/list.vue        商品搜索/列表
  pages/product/detail.vue      商品详情
  pages/orderflow/index.vue     工作流订单
  pages/sales-orders/index.vue  销售订单
  pages/my/index.vue            我的
  pages/settings/index.vue      设置
  pages/profile/index.vue       账号资料
  pages/policy/index.vue        用户协议/隐私政策
  pages/contact/index.vue       联系咨询
```

## 本地运行

```bash
npm install
npm run dev:mp-weixin
```

也可以用 HBuilderX 导入项目根目录，运行到微信开发者工具。

## 构建与检查

```bash
npm run test:unit
npm run build:mp-weixin
```

构建产物在 `dist/build/mp-weixin`，该目录为生成文件，不提交到仓库。

## 发布前注意

- 微信小程序 AppID 在 `src/manifest.json`。
- 小程序合法域名需要在微信公众平台和构建环境中单独配置，不提交到本仓库。
- 构建前按 `.env.example` 配置 `VITE_SJ_API_BASE_URL` 或对应环境的 API URL。
- 分享图优先由页面 canvas 生成临时图；静态分享图只作为兜底资源保留在 `src/static/share/`。
- `docs/`、`dist/`、`node_modules/`、`.tmp/`、本地环境文件和开发工具私有配置不提交。
