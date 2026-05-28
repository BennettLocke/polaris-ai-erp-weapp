import { request } from './request';
import { buildWorkflowOrderSavePayload, getWorkflowOrderActionUpdates, normalizeOrderFlow } from '../utils/order.js';

function cleanText(value) {
  return String(value || '').trim();
}

function getWorkflowOrderId(order) {
  if (typeof order !== 'object' || order === null) return cleanText(order);
  return cleanText(order.id || order.order_id || order.workflow_order_id || order.workflowOrderId);
}

export function getOrderFlow(params = {}) {
  const query = {
    page: params.page || 1,
    page_size: params.page_size || 20,
    keyword: params.keyword || '',
    status: params.status || '',
  };

  return request('/api/mini/orderflow/list', { data: query }).then(normalizeOrderFlow).catch(async () => {
    const [workflowResult, salesResult] = await Promise.allSettled([
      request('/api/workflow/orders', { data: { ...query, filter: 'active' } }),
      request('/api/sales/cards', { data: query }),
    ]);
    const workflows = workflowResult.status === 'fulfilled' ? workflowResult.value.list || [] : [];
    const sales = salesResult.status === 'fulfilled' ? salesResult.value.list || [] : [];
    return normalizeOrderFlow({
      page: query.page,
      page_size: query.page_size,
      workflows,
      sales,
      total: workflows.length + sales.length,
    });
  });
}

export function updateWorkflowOrderStatus(orderId, update = {}) {
  const id = getWorkflowOrderId(orderId);
  const field = cleanText(update.field);
  const value = Number(update.value);
  if (!id) return Promise.reject({ msg: '缺少订单ID' });
  if (!field) return Promise.reject({ msg: '缺少更新字段' });

  return request('/api/mini/workflow-order/status-update', {
    method: 'POST',
    data: {
      id,
      field,
      value: Number.isFinite(value) ? value : 0,
    },
  });
}

export function saveWorkflowOrder(form = {}) {
  const payload = buildWorkflowOrderSavePayload(form);
  if (!payload.customer_name) return Promise.reject({ msg: '请输入客户名称' });
  if (!payload.goods_name) return Promise.reject({ msg: '请输入商品名称' });
  if (!payload.order_quantity) return Promise.reject({ msg: '请输入订单数量' });

  return request('/api/mini/workflow-order/save', {
    method: 'POST',
    data: payload,
  });
}

export async function completeWorkflowOrderAction(order, action) {
  const id = getWorkflowOrderId(order);
  const updates = getWorkflowOrderActionUpdates(action);
  if (!id) throw { msg: '缺少订单ID' };
  if (!updates.length) throw { msg: '不支持的订单操作' };

  let result = null;
  for (const update of updates) {
    result = await updateWorkflowOrderStatus(id, update);
  }
  return result;
}
