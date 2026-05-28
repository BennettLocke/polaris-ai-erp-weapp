import { request } from './request';
import { normalizeCategoryList } from '../utils/category';

export function getCategories() {
  return request('/api/mini/goods/category', { method: 'POST' }).then((data) => normalizeCategoryList(data.category || []));
}
