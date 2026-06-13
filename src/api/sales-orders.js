import { request } from './request';

function asList(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).filter((item) => item && typeof item === 'object');
}

function orderProductList(order = {}) {
  return asList(order.products || order.items || order.goods || order.details || order.product_list || order.goods_list);
}

export function flattenSalesOrderProducts(orders = []) {
  return asList(orders).flatMap((order) => {
    const orderTime = order.created_at || order.order_time || order.time || order.createdAt || 0;
    return orderProductList(order).map((item) => ({
      ...item,
      created_at: item.created_at || item.order_time || item.time || orderTime,
      order_id: item.order_id || order.id || order.sales_id || '',
      sales_no: item.sales_no || order.sales_no || order.order_no || '',
    }));
  });
}

export function getMySalesOrders(params = {}) {
  return request('/api/mini/sales-orders', {
    data: {
      page: params.page || 1,
      page_size: params.page_size || 20,
      keyword: params.keyword || '',
    },
  });
}
