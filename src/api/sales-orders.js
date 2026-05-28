import { request } from './request';

export function getMySalesOrders(params = {}) {
  return request('/api/mini/sales-orders', {
    data: {
      page: params.page || 1,
      page_size: params.page_size || 20,
      keyword: params.keyword || '',
    },
  });
}
