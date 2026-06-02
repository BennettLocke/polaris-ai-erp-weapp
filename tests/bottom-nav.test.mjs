import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const pagesConfig = JSON.parse(readFileSync(new URL('../src/pages.json', import.meta.url), 'utf8'));
const tabBarDir = new URL('../src/custom-tab-bar/', import.meta.url);
const tabBarJsUrl = new URL('index.js', tabBarDir);
const tabBarWxmlUrl = new URL('index.wxml', tabBarDir);
const tabBarWxssUrl = new URL('index.wxss', tabBarDir);
const tabBarJsonUrl = new URL('index.json', tabBarDir);

const tabBarJsSource = existsSync(tabBarJsUrl) ? readFileSync(tabBarJsUrl, 'utf8') : '';
const tabBarWxmlSource = existsSync(tabBarWxmlUrl) ? readFileSync(tabBarWxmlUrl, 'utf8') : '';
const tabBarWxssSource = existsSync(tabBarWxssUrl) ? readFileSync(tabBarWxssUrl, 'utf8') : '';
const routeSource = readFileSync(new URL('../src/utils/route.js', import.meta.url), 'utf8');
const tabPageSources = {
  home: readFileSync(new URL('../src/pages/home/index.vue', import.meta.url), 'utf8'),
  category: readFileSync(new URL('../src/pages/category/index.vue', import.meta.url), 'utf8'),
  order: readFileSync(new URL('../src/pages/orderflow/index.vue', import.meta.url), 'utf8'),
  my: readFileSync(new URL('../src/pages/my/index.vue', import.meta.url), 'utf8'),
};

describe('custom bottom navigation', () => {
  it('enables the WeChat custom tabBar on the four first-level pages', () => {
    assert.equal(pagesConfig.tabBar?.custom, true);
    assert.deepEqual(
      pagesConfig.tabBar?.list?.map((item) => item.pagePath),
      ['pages/home/index', 'pages/category/index', 'pages/orderflow/index', 'pages/my/index']
    );
    assert.equal(existsSync(tabBarJsUrl), true);
    assert.equal(existsSync(tabBarWxmlUrl), true);
    assert.equal(existsSync(tabBarWxssUrl), true);
    assert.equal(existsSync(tabBarJsonUrl), true);
  });

  it('uses the real ShopXO app-center-nav icons and switches native tab pages', () => {
    const iconUrls = [
      '1774869699282797.png',
      '1774869699200935.png',
      '1774869699309568.png',
      '1774869698249700.png',
      '1774869699858406.png',
      '1774869699328333.png',
      '1774869699161830.png',
      '1774869699255558.png',
    ];

    iconUrls.forEach((fileName) => {
      assert.match(tabBarJsSource, new RegExp(`https://img\\.513sjbz\\.com/static/upload/images/app_center_nav/2026/03/30/${fileName}`));
    });

    assert.match(tabBarJsSource, /pagePath:\s*'\/pages\/home\/index'/);
    assert.match(tabBarJsSource, /pagePath:\s*'\/pages\/category\/index'/);
    assert.match(tabBarJsSource, /pagePath:\s*'\/pages\/orderflow\/index'/);
    assert.match(tabBarJsSource, /pagePath:\s*'\/pages\/my\/index'/);
    assert.match(tabBarJsSource, /wx\.switchTab/);
    assert.match(tabBarJsSource, /selectedIconPath/);
    assert.match(tabBarJsSource, /ROUTE_VALUE_MAP/);
    assert.match(tabBarJsSource, /valueForPath/);
    assert.match(tabBarJsSource, /item\.page_path/);
    assert.match(tabBarJsSource, /item\.title/);
    assert.match(tabBarJsSource, /selectedPath/);
    assert.match(tabBarJsSource, /setActiveByPath/);
    assert.match(tabBarJsSource, /pageLifetimes/);
    assert.match(tabBarJsSource, /syncActive/);
    assert.doesNotMatch(tabBarJsSource, /dataset\.index/);
  });

  it('renders the rounded navigation shell without an active icon background', () => {
    const navBlock = tabBarWxssSource.match(/\.sj-bottom-nav\s*\{[^}]*\}/)?.[0] || '';
    const shellBlock = tabBarWxssSource.match(/\.sj-bottom-nav__shell\s*\{[^}]*\}/)?.[0] || '';

    assert.match(tabBarWxmlSource, /wx:for="\{\{list\}\}"/);
    assert.match(tabBarWxmlSource, /selectedPath === item\.pagePath/);
    assert.match(tabBarWxmlSource, /data-path="\{\{item\.pagePath\}\}"/);
    assert.match(tabBarWxmlSource, /item\.selectedIconPath/);
    assert.match(tabBarWxmlSource, /item\.iconPath/);
    assert.match(tabBarWxmlSource, /sj-bottom-nav__icon--normal/);
    assert.match(tabBarWxmlSource, /sj-bottom-nav__icon--active/);
    assert.doesNotMatch(tabBarWxmlSource, /src="\{\{selectedPath === item\.pagePath \? item\.selectedIconPath : item\.iconPath\}\}"/);

    assert.match(navBlock, /padding:\s*0 0 calc\(-4px \+ env\(safe-area-inset-bottom\)\)/);
    assert.match(shellBlock, /padding-bottom:\s*8px/);
    assert.doesNotMatch(shellBlock, /safe-area-inset-bottom/);
    assert.match(shellBlock, /min-height:\s*62px/);
    assert.match(shellBlock, /box-shadow:\s*0 -6px 18px rgba\(24,\s*24,\s*27,\s*0\.06\)/);
    assert.match(tabBarWxssSource, /width:\s*calc\(100%\s*-\s*48px\)/);
    assert.match(tabBarWxssSource, /max-width:\s*420px/);
    assert.match(tabBarWxssSource, /border-radius:\s*999px/);
    assert.match(tabBarWxssSource, /\.sj-bottom-nav__icon\.is-hidden\s*\{/);
    assert.match(tabBarWxssSource, /opacity:\s*0/);
    assert.match(tabBarWxssSource, /\.sj-bottom-nav__item\.is-active\s*\{/);
    assert.match(tabBarWxssSource, /\.sj-bottom-nav__icon\s*\{/);
    assert.match(tabBarWxssSource, /width:\s*22px/);
    assert.doesNotMatch(tabBarWxssSource, /is-active[\s\S]*sj-bottom-nav__icon-wrap[\s\S]*background/);
    assert.doesNotMatch(tabBarWxssSource, /sj-bottom-nav__icon-wrap[\s\S]*background:\s*#f4f4f5/);
  });

  it('lets each tab page actively sync the custom tabBar active path on show', () => {
    assert.match(routeSource, /export function syncCustomTabBar/);
    assert.match(routeSource, /getTabBar/);
    assert.match(routeSource, /setActiveByPath/);

    assert.match(tabPageSources.home, /import \{ PAGE_ROUTES,\s*navigateToPage,\s*syncCustomTabBar \}/);
    assert.match(tabPageSources.home, /onShow\(\)\s*\{[\s\S]*syncCustomTabBar\(PAGE_ROUTES\.home\)/);
    assert.match(tabPageSources.category, /syncCustomTabBar/);
    assert.match(tabPageSources.category, /onShow\(\)\s*\{[\s\S]*syncCustomTabBar\(PAGE_ROUTES\.category\)/);
    assert.match(tabPageSources.order, /syncCustomTabBar/);
    assert.match(tabPageSources.order, /onShow\(\)\s*\{[\s\S]*syncCustomTabBar\(PAGE_ROUTES\.order\)/);
    assert.match(tabPageSources.my, /syncCustomTabBar/);
    assert.match(tabPageSources.my, /onShow\(\)\s*\{[\s\S]*syncCustomTabBar\(PAGE_ROUTES\.my\)/);
  });
});
