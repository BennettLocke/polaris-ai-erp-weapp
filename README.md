# Polaris AI ERP WeApp

[中文说明](#中文说明) | [English](#english)

## 中文说明

Polaris AI ERP WeApp 是肆计包装官方商城小程序端，基于 **uni-app + Vue 3** 开发。它面向客户和内部业务人员，负责产品展示、分类浏览、商品详情、订单查询、账号绑定、销售单入口、联系客服和分享海报等客户侧体验。

这个仓库是小程序端源码仓库：

- 小程序仓库：[BennettLocke/polaris-ai-erp-weapp](https://github.com/BennettLocke/polaris-ai-erp-weapp)
- 主服务端仓库：[BennettLocke/polaris-erp-agent](https://github.com/BennettLocke/polaris-erp-agent)
- 组件库来源：[BennettLocke/bennett-locke-ui](https://github.com/BennettLocke/bennett-locke-ui)

小程序不直接连接数据库，也不保存数据库账号、服务器私钥或真实部署密钥。商品、客户、订单、库存、上下架、热销统计和登录绑定规则都由 `polaris-erp-agent` 服务端统一处理，小程序只通过 API 展示和交互。

### 本地目录说明

当前准确的小程序业务源码来自：

```text
Z:\肆计包装小程序\商城小程序源码\sj-mall-uniapp
```

本地另一个目录：

```text
Z:\肆计包装小程序\商城小程序源码\polaris-ai-erp-weapp
```

是这个 GitHub 仓库的本地克隆，用来提交和推送代码。之前看起来像两个项目，是因为 `sj-mall-uniapp` 是实际开发源码目录，而 `polaris-ai-erp-weapp` 是仓库名对齐的 Git 克隆。现在已经把准确源码同步到本仓库，后续发布和交接应以 GitHub 仓库为准。

### 功能范围

| 模块 | 说明 |
| --- | --- |
| 首页 | 搜索、分类入口、主推系列、新品、热销与推荐商品模块。 |
| 分类 | 左侧分类导航、商品卡片、综合/最新/价格排序、全局搜索入口。 |
| 搜索 | 热门词、最近搜索、分类关键词直达、结果排序、分享海报生成。 |
| 商品详情 | 主图、颜色规格图、图片预览、商品参数、客服咨询、分享海报。 |
| 订单 | 游客关键词查询、客户账号订单查询、员工/管理员工作流订单入口。 |
| 我的 | 登录、注册、账号资料、客户绑定、销售订单入口、设置与协议。 |
| 设置 | 账号设置、协议、联系方式、基础资料入口。 |

### 数据和接口

统一配置文件：

```text
src/config.js
```

主要 API 模块：

```text
src/api/products.js
src/api/categories.js
src/api/home.js
src/api/auth.js
src/api/customer.js
src/api/orders.js
src/api/sales-orders.js
```

生产、测试、本地 API 地址通过环境变量注入，不在代码里写死真实部署域名：

```env
VITE_SJ_API_ENV=prod
VITE_SJ_API_BASE_URL=
VITE_SJ_API_LOCAL_URL=
VITE_SJ_API_TEST_URL=
VITE_SJ_API_PROD_URL=
VITE_SJ_CUSTOMER_SERVICE_URL=
VITE_SJ_CUSTOMER_SERVICE_CORP_ID=
```

### 本地运行

```bash
npm install
npm run dev:mp-weixin
```

也可以用 HBuilderX 导入项目根目录，运行到微信开发者工具。

### 测试和构建

```bash
npm run test:unit
npm run build:mp-weixin
```

构建产物位于：

```text
dist/build/mp-weixin
```

`dist/`、`node_modules/`、`.tmp/`、`unpackage/`、`.env` 和开发工具私有配置不提交到仓库。

### 目录结构

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
  components/                   页面组件和业务组件
  api/                          sjagent 服务端 API 适配层
  utils/                        列表、商品、订单、图片、路由和分享工具
  static/                       图标、占位图、分享图、tabbar 资源
tests/                          Node 单元测试
```

### 发布前检查

- 微信小程序 AppID 在 `src/manifest.json` 中配置。
- 小程序合法域名需要在微信公众平台单独配置。
- 构建前按 `.env.example` 配置 API 域名和客服参数。
- 发布前运行 `npm run test:unit` 和 `npm run build:mp-weixin`。
- 不提交真实域名密钥、客服 ID 私密配置、`dist/`、`node_modules/`、`.tmp/`、`unpackage/`。

## English

Polaris AI ERP WeApp is the official customer-facing WeChat mini program for SJ Packaging, built with **uni-app + Vue 3**. It provides product browsing, category navigation, product detail pages, order lookup, account binding, sales-order entry points, customer-service contact, and share posters.

This is the mini-program source repository:

- Mini-program repository: [BennettLocke/polaris-ai-erp-weapp](https://github.com/BennettLocke/polaris-ai-erp-weapp)
- Main server repository: [BennettLocke/polaris-erp-agent](https://github.com/BennettLocke/polaris-erp-agent)
- Component library source: [BennettLocke/bennett-locke-ui](https://github.com/BennettLocke/bennett-locke-ui)

The mini program is a thin client. It does not connect directly to the database or store production secrets. Products, customers, orders, inventory, shelf state, hot-product analytics, and login/binding rules are owned by the `polaris-erp-agent` server and consumed through API adapters in `src/api/`.

### Local Workspace Note

The current accurate local business source was:

```text
Z:\肆计包装小程序\商城小程序源码\sj-mall-uniapp
```

The local path below is the Git clone for this repository:

```text
Z:\肆计包装小程序\商城小程序源码\polaris-ai-erp-weapp
```

The two folders existed because one was the active working source and the other was the GitHub-aligned clone. The accurate source has now been synchronized into this repository, so future releases and handoffs should use the GitHub repository as the source of truth.

### Quick Start

```bash
npm install
npm run dev:mp-weixin
```

Build and test:

```bash
npm run test:unit
npm run build:mp-weixin
```

Set deployment values through `.env` or CI/build environment variables based on `.env.example`; do not hard-code production domains or customer-service identifiers in source code.
