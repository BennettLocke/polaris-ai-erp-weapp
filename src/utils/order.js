import { asArray, normalizePageData } from './list.js';

export const ORDER_TYPES = {
  WORKFLOW: 'workflow',
  SALES: 'sales',
};

export const ORDER_STATUS_COLORS = {
  ordered: 'warning',
  pending: 'warning',
  pending_make: 'warning',
  make_pending: 'warning',
  waiting: 'warning',
  processing: 'warning',
  making: 'warning',
  make_done: 'primary',
  made: 'primary',
  pending_delivery: 'primary',
  delivery_pending: 'primary',
  delivery: 'primary',
  completed: 'success',
  delivered: 'success',
  done: 'success',
  canceled: 'muted',
  deleted: 'muted',
};

export const WORKFLOW_STATUS_LEVELS = {
  ordered: 1,
  pending: 1,
  placed: 1,
  created: 1,
  pending_make: 1,
  make_pending: 1,
  waiting: 1,
  processing: 1,
  making: 1,
  make_done: 2,
  made: 2,
  pending_delivery: 2,
  delivery_pending: 2,
  delivery: 2,
  delivered: 5,
  done: 5,
  completed: 5,
  canceled: 99,
  deleted: 99,
};

const WORKFLOW_STATUS_LABELS = {
  ordered: '已下单',
  pending: '已下单',
  placed: '已下单',
  created: '已下单',
  pending_make: '待制作',
  make_pending: '待制作',
  waiting: '待制作',
  processing: '待制作',
  making: '待制作',
  make_done: '待配送',
  made: '待配送',
  pending_delivery: '待配送',
  delivery_pending: '待配送',
  delivery: '待配送',
  delivered: '已完成',
  done: '已完成',
  completed: '已完成',
  canceled: '已取消',
  deleted: '已删除',
};

function cleanText(value) {
  return String(value || '').trim();
}

function firstText(...values) {
  return values.map(cleanText).find(Boolean) || '';
}

export function workflowOrderNo(order = {}) {
  return firstText(
    order.order_no,
    order.orderNo,
    order.workflow_no,
    order.workflowOrderNo,
    order.workflow_order_no,
    order.no,
    order.code,
    order.id,
  );
}

function firstNumber(...values) {
  const found = values.find((value) => value !== undefined && value !== null && value !== '');
  const number = Number(found);
  return Number.isFinite(number) ? number : 0;
}

function truthyFlag(value) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'yes';
}

function normalizeStatusKey(value) {
  const key = cleanText(value).toLowerCase();
  if (!key) return '';
  if (key === '待制作' || key === '未制作' || key === '待生产') return 'pending_make';
  if (key === '制作完成' || key === '待配送') return 'pending_delivery';
  if (key === '配送完成' || key === '已配送' || key === '已完成' || key === '完成' || key === '完工') return 'done';
  if (WORKFLOW_STATUS_LEVELS[key]) return key;
  return '';
}

function inferStatusKeyFromText(value) {
  const text = cleanText(value).toLowerCase();
  if (!text) return '';
  if (/待完成|未完成|未制作|待制作|待生产|生产中|制作中|making|processing|waiting/.test(text)) return 'pending_make';
  if (/待配送|制作完成|待发货|待送|delivery/.test(text)) return 'pending_delivery';
  if (/已完成|配送完成|已配送|送达|完工|delivered|completed|done/.test(text) || text === '完成') return 'done';
  if (/已下单|新订单|下单|ordered|placed|created|pending/.test(text)) return 'ordered';
  return '';
}

function canonicalWorkflowStatusKey(raw = {}) {
  const rawKey = normalizeStatusKey(firstText(raw.status_key, raw.status?.key, raw.flow_status, raw.state, raw.order_status, raw.status));
  if (['done', 'completed', 'delivered', 'canceled', 'deleted'].includes(rawKey)) return rawKey;

  const textKey = inferStatusKeyFromText(firstText(
    raw.status_text,
    raw.status_name,
    raw.state_text,
    raw.progress_text,
    raw.date_text,
  ));
  if (textKey === 'done') return textKey;

  if (truthyFlag(raw.order_type) || truthyFlag(raw.is_completed) || truthyFlag(raw.completed)) return 'done';
  if (truthyFlag(raw.is_delivered) || truthyFlag(raw.delivery_done) || truthyFlag(raw.delivered)) return 'done';
  if (truthyFlag(raw.is_made) || truthyFlag(raw.make_done) || truthyFlag(raw.production_done)) return 'pending_delivery';

  if (textKey) return textKey;

  return rawKey || 'ordered';
}

function normalizeTime(raw = {}) {
  return firstText(
    raw.created_at,
    raw.created_time,
    raw.order_time_text,
    raw.date_text,
    raw.sales_time,
    raw.updated_at,
  );
}

function imageFromRaw(raw = {}) {
  const images = [
    raw.image,
    raw.images,
    raw.main_image,
    raw.cover,
    raw.goods_image,
    raw.product_image,
  ];
  const first = images.find((item) => cleanText(item));
  if (first) return cleanText(first);
  const list = raw.order_images || raw.photos || raw.product_images || [];
  const item = asArray(list).find(Boolean);
  if (!item) return '';
  if (typeof item === 'string') return cleanText(item);
  return firstText(item.images, item.url, item.src, item.image);
}

export function normalizeOrderStatus(raw = {}) {
  const key = canonicalWorkflowStatusKey(raw);
  const text = WORKFLOW_STATUS_LABELS[key] || firstText(raw.status_text, raw.status_name, raw.state_text, raw.progress_text, raw.date_text) || '进行中';
  const color = firstText(raw.status_color, ORDER_STATUS_COLORS[key]) || 'muted';
  const actions = asArray(raw.actions || raw.allowed_actions).map((item) => ({
    key: firstText(item.key, item.action, item.value),
    text: firstText(item.text, item.name, item.label),
    raw: item,
  })).filter((item) => item.key && item.text);

  return { key, text, color, actions };
}

export function workflowStatusLevel(order = {}) {
  const key = normalizeStatusKey(firstText(order.status_key, order.flow_status, order.status?.key, order.status));
  return WORKFLOW_STATUS_LEVELS[key || canonicalWorkflowStatusKey(order)] || 50;
}

export function filterWorkflowOrdersByStatus(orders = [], activeStatus = 'all') {
  const target = normalizeStatusKey(activeStatus);
  return asArray(orders).filter((order) => {
    const key = canonicalWorkflowStatusKey(order);
    if (!target || target === 'all') return !['canceled', 'deleted'].includes(key);
    if (target === 'pending_make' || target === 'make_pending') {
      return ['ordered', 'pending', 'placed', 'created', 'pending_make', 'make_pending', 'waiting', 'processing', 'making'].includes(key);
    }
    if (target === 'pending_delivery' || target === 'make_done' || target === 'made') {
      return ['pending_delivery', 'make_done', 'made', 'delivery_pending', 'delivery'].includes(key);
    }
    return key === target;
  });
}

export function getWorkflowOrderActionUpdates(action) {
  const key = cleanText(action).toLowerCase().replace(/-/g, '_');
  if (['make_done', 'production_done', 'is_made'].includes(key)) {
    return [{ field: 'is_made', value: 1 }];
  }
  if (['delivery_done', 'delivered', 'is_delivered'].includes(key)) {
    return [
      { field: 'is_made', value: 1 },
      { field: 'is_delivered', value: 1 },
      { field: 'order_type', value: 1 },
    ];
  }
  if (['make_cancel', 'production_cancel', 'cancel_made'].includes(key)) {
    return [
      { field: 'is_delivered', value: 0 },
      { field: 'order_type', value: 0 },
      { field: 'is_made', value: 0 },
    ];
  }
  if (['delivery_cancel', 'cancel_delivery', 'cancel_delivered'].includes(key)) {
    return [
      { field: 'is_delivered', value: 0 },
      { field: 'order_type', value: 0 },
    ];
  }
  return [];
}

export function applyWorkflowOrderAction(order = {}, action) {
  const nextOrder = { ...order };
  const updates = getWorkflowOrderActionUpdates(action);
  if (!updates.length) return normalizeWorkflowOrder(nextOrder);

  updates.forEach((update) => {
    nextOrder[update.field] = update.value;
  });

  const statusKey = truthyFlag(nextOrder.order_type) || truthyFlag(nextOrder.is_delivered)
    ? 'done'
    : truthyFlag(nextOrder.is_made)
      ? 'pending_delivery'
      : 'pending_make';
  const statusText = WORKFLOW_STATUS_LABELS[statusKey];
  nextOrder.status = statusKey === 'done' ? 'completed' : statusKey;
  nextOrder.status_key = statusKey;
  nextOrder.flow_status = statusKey;
  nextOrder.status_text = statusText;
  nextOrder.statusText = statusText;
  return normalizeWorkflowOrder(nextOrder);
}

function workflowOrderId(order = {}) {
  return firstText(order.id, order.order_id, order.workflow_order_id, order.workflowOrderId);
}

export function updateWorkflowOrderInPlace(orders = [], targetOrder = {}, action) {
  const targetId = workflowOrderId(targetOrder);
  return asArray(orders).map((order) => (
    targetId && workflowOrderId(order) === targetId ? applyWorkflowOrderAction(order, action) : order
  ));
}

export function parseWorkflowOrderQuantity(value) {
  const text = cleanText(value);
  if (!text) return 0;
  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return 0;
  const number = Number(match[0]);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

function workflowOrderImages(order = {}) {
  return asArray(order.order_images || order.orderImages || order.raw?.order_images || order.raw?.orderImageUrls)
    .map((item) => (typeof item === 'string' ? cleanText(item) : firstText(item.url, item.src, item.image)))
    .filter(Boolean);
}

function workflowOrderType(order = {}) {
  const statusKey = canonicalWorkflowStatusKey(order);
  if (truthyFlag(order.order_type) || truthyFlag(order.is_completed) || truthyFlag(order.completed)) return 1;
  if (['done', 'completed', 'delivered'].includes(statusKey)) return 1;
  return 0;
}

export function buildWorkflowOrderEditForm(order = {}) {
  const quantity = parseWorkflowOrderQuantity(firstText(order.order_quantity, order.quantity_text, order.quantityText, order.quantity, order.qty));
  return {
    id: order.id || order.order_id || order.workflow_order_id || '',
    customer_name: firstText(order.customer_name, order.customerName, order.customer, order.party_name),
    customer_phone: firstText(order.customer_phone, order.customerPhone, order.phone),
    goods_name: firstText(order.goods_name, order.product_name, order.productName, order.product_summary, order.title),
    goods_color: firstText(order.goods_color, order.color, order.color_text, order.colorText),
    order_quantity: quantity ? String(quantity) : '',
    is_screen_print: truthyFlag(order.is_screen_print ?? order.screen_print ?? order.screenPrint),
    remark: firstText(order.remark, order.note, order.requirement, order.memo),
    order_images: workflowOrderImages(order),
    order_type: workflowOrderType(order),
  };
}

export function buildWorkflowOrderSavePayload(form = {}) {
  return {
    id: form.id || form.order_id || form.workflow_order_id || '',
    customer_name: cleanText(form.customer_name),
    customer_phone: cleanText(form.customer_phone),
    goods_name: cleanText(form.goods_name),
    goods_color: cleanText(form.goods_color),
    order_quantity: parseWorkflowOrderQuantity(form.order_quantity),
    is_screen_print: truthyFlag(form.is_screen_print) ? 1 : 0,
    order_type: truthyFlag(form.order_type) ? 1 : 0,
    remark: cleanText(form.remark),
    order_images: workflowOrderImages(form),
  };
}

export function updateWorkflowOrderFromEditForm(orders = [], targetOrder = {}, form = {}) {
  const targetId = workflowOrderId(targetOrder);
  const payload = buildWorkflowOrderSavePayload(form);
  return asArray(orders).map((order) => {
    if (!targetId || workflowOrderId(order) !== targetId) return order;
    const quantityText = payload.order_quantity ? `${payload.order_quantity} 套` : '';
    return normalizeWorkflowOrder({
      ...order,
      customer_name: payload.customer_name,
      customerName: payload.customer_name,
      customer_phone: payload.customer_phone,
      goods_name: payload.goods_name,
      product_summary: payload.goods_name,
      title: payload.goods_name,
      goods_color: payload.goods_color,
      color: payload.goods_color,
      order_quantity: quantityText,
      quantity: payload.order_quantity,
      quantityText: quantityText,
      is_screen_print: payload.is_screen_print,
      remark: payload.remark,
      order_images: payload.order_images,
      order_type: payload.order_type,
      status: payload.order_type ? 'completed' : order.status,
      status_key: payload.order_type ? 'done' : order.status_key,
      flow_status: payload.order_type ? 'done' : order.flow_status,
    });
  });
}

function workflowOrderTime(order = {}) {
  const text = firstText(order.createdAt, order.created_at, order.order_time_text, order.date_text, order.updated_at);
  const timestamp = Date.parse(text.replace(/-/g, '/'));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function sortWorkflowOrdersByProgress(orders = []) {
  return asArray(orders).slice().sort((left, right) => {
    const levelDelta = workflowStatusLevel(left) - workflowStatusLevel(right);
    if (levelDelta) return levelDelta;
    return workflowOrderTime(right) - workflowOrderTime(left);
  });
}

export function normalizeWorkflowOrder(raw = {}) {
  const status = normalizeOrderStatus(raw);
  const quantity = firstNumber(raw.order_quantity, raw.quantity, raw.num, raw.count);
  const color = firstText(raw.goods_color, raw.color, raw.color_text);
  const productSummary = firstText(raw.product_summary, raw.goods_name, raw.title, raw.name, raw.goods_title, '工作流订单');

  return {
    ...raw,
    type: ORDER_TYPES.WORKFLOW,
    id: raw.id || raw.order_id || raw.workflow_order_id || '',
    orderNo: workflowOrderNo(raw),
    status_key: status.key,
    flow_status: status.key,
    title: productSummary,
    productSummary,
    product_summary: productSummary,
    goods_name: raw.goods_name || productSummary,
    customerName: firstText(raw.customer_name, raw.customer, raw.party_name, '客户'),
    customer_name: firstText(raw.customer_name, raw.customer, raw.party_name, '客户'),
    quantity,
    quantityText: quantity ? `数量 ${quantity}` : '',
    colorText: color,
    image: imageFromRaw(raw),
    status,
    statusText: status.text,
    status_text: status.text,
    statusColor: status.color,
    createdAt: normalizeTime(raw),
    raw,
  };
}

export function normalizeSalesOrder(raw = {}) {
  const status = normalizeOrderStatus({ ...raw, status_text: raw.status_text || '销售单' });
  const totalPrice = firstText(raw.total_price, raw.total_amount, raw.receivable_amount, raw.goods_amount, '0.00');
  const productSummary = firstText(raw.product_summary, raw.items_preview, raw.goods_name, raw.sales_no, '销售单');

  return {
    ...raw,
    type: ORDER_TYPES.SALES,
    id: raw.id || raw.sales_id || raw.order_id || '',
    orderNo: firstText(raw.sales_no, raw.order_no, raw.no, raw.code),
    title: productSummary,
    productSummary,
    product_summary: productSummary,
    customerName: firstText(raw.customer_name, raw.customer, raw.party_name, '客户'),
    customer_name: firstText(raw.customer_name, raw.customer, raw.party_name, '客户'),
    totalPrice,
    total_price: totalPrice,
    priceText: `¥${totalPrice}`,
    image: imageFromRaw(raw),
    status,
    statusText: status.text,
    status_text: status.text,
    statusColor: status.color,
    createdAt: normalizeTime(raw),
    raw,
  };
}

export function normalizeOrderFlow(payload = {}) {
  const workflows = asArray(payload.workflows || payload.workflow_orders || payload.workflow || payload.list)
    .map(normalizeWorkflowOrder);
  const sales = asArray(payload.sales || payload.sales_orders || payload.sale_orders)
    .map(normalizeSalesOrder);
  const data = [...workflows, ...sales];
  const page = normalizePageData(
    {
      ...payload,
      data,
      total: payload.total || data.length,
      page: payload.page || payload.current_page || 1,
      page_size: payload.page_size || payload.per_page || data.length || 20,
    },
    (item) => item,
  );

  return {
    ...page,
    workflows,
    workflow_orders: workflows,
    sales,
    sales_orders: sales,
    orders: data,
  };
}
