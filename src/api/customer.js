import { request } from './request';

export function getCustomerSummary() {
  return request('/api/mini/customer/summary');
}
