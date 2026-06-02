import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyWorkflowOrderAction,
  buildWorkflowOrderEditForm,
  buildWorkflowOrderSavePayload,
  filterWorkflowOrdersByStatus,
  getWorkflowOrderActionUpdates,
  updateWorkflowOrderFromEditForm,
  updateWorkflowOrderInPlace,
  normalizeOrderFlow,
  normalizeOrderStatus,
  sortWorkflowOrdersByProgress,
  workflowOrderNo,
} from '../src/utils/order.js';

describe('workflow order status normalization', () => {
  it('maps production and delivery text into the miniapp five-step workflow', () => {
    assert.equal(normalizeOrderStatus({ status_text: '已下单' }).key, 'ordered');
    assert.equal(normalizeOrderStatus({ status_text: '未制作' }).key, 'pending_make');
    assert.equal(normalizeOrderStatus({ status_text: '待制作' }).key, 'pending_make');
    assert.equal(normalizeOrderStatus({ status_text: '制作完成' }).key, 'pending_delivery');
    assert.equal(normalizeOrderStatus({ status_text: '待配送' }).key, 'pending_delivery');
    assert.equal(normalizeOrderStatus({ status_text: '配送完成' }).key, 'done');
    assert.equal(normalizeOrderStatus({ status_text: '已完成' }).key, 'done');
    assert.equal(normalizeOrderStatus({ status_text: '完成' }).key, 'done');
    assert.equal(normalizeOrderStatus({ status_text: '待完成' }).key, 'pending_make');
  });

  it('uses explicit production flags before vague status values', () => {
    assert.equal(normalizeOrderStatus({ status: 'processing', is_made: 1 }).key, 'pending_delivery');
    assert.equal(normalizeOrderStatus({ status: 'processing', delivery_done: true }).key, 'done');
    assert.equal(normalizeOrderStatus({ status_text: '完成', is_made: 1, is_delivered: 0 }).key, 'done');
    assert.equal(normalizeOrderStatus({ order_type: 1, is_made: 1, is_delivered: 0 }).key, 'done');
    assert.equal(normalizeOrderStatus({ status: 'completed' }).text, '已完成');
  });

  it('uses one workflow order number for display and keyword lookup', () => {
    assert.equal(workflowOrderNo({ orderNo: 'WF-20260531-8', product_name: '见喜半斤', id: 75 }), 'WF-20260531-8');
    assert.equal(workflowOrderNo({ workflow_order_no: 'WO-513', code: 'CODE-513', id: 75 }), 'WO-513');
    assert.equal(workflowOrderNo({ code: 'CODE-513', id: 75 }), 'CODE-513');
    assert.equal(workflowOrderNo({ id: 75 }), '75');

    const payload = normalizeOrderFlow({
      workflows: [{ orderNo: 'WF-20260531-8', product_name: '见喜半斤', id: 75 }],
    });
    assert.equal(payload.workflows[0].orderNo, 'WF-20260531-8');
  });

  it('keeps completed workflow orders in the all tab and sorts by progress', () => {
    const payload = normalizeOrderFlow({
      workflows: [
        { id: 'done', status_text: '配送完成', created_at: '2026-05-25 09:00' },
        { id: 'legacy-done', status_text: '完成', order_type: 1, is_made: 1, is_delivered: 0, created_at: '2026-05-25 09:30' },
        { id: 'delivery', status_text: '制作完成', created_at: '2026-05-25 08:00' },
        { id: 'make', status_text: '未制作', created_at: '2026-05-25 10:00' },
        { id: 'ordered', status_text: '已下单', created_at: '2026-05-25 11:00' },
      ],
    });

    const visible = sortWorkflowOrdersByProgress(filterWorkflowOrdersByStatus(payload.workflows, 'all'));
    assert.deepEqual(visible.map((item) => item.id), ['ordered', 'make', 'delivery', 'legacy-done', 'done']);
    assert.deepEqual(
      sortWorkflowOrdersByProgress(filterWorkflowOrdersByStatus(payload.workflows, 'pending_make')).map((item) => item.id),
      ['ordered', 'make'],
    );
    assert.deepEqual(filterWorkflowOrdersByStatus(payload.workflows, 'make_done').map((item) => item.id), ['delivery']);
    assert.deepEqual(filterWorkflowOrdersByStatus(payload.workflows, 'done').map((item) => item.id), ['done', 'legacy-done']);
  });

  it('maps miniapp workflow actions to backend status fields', () => {
    assert.deepEqual(getWorkflowOrderActionUpdates('make_done'), [
      { field: 'is_made', value: 1 },
    ]);
    assert.deepEqual(getWorkflowOrderActionUpdates('delivery_done'), [
      { field: 'is_made', value: 1 },
      { field: 'is_delivered', value: 1 },
      { field: 'order_type', value: 1 },
    ]);
    assert.deepEqual(getWorkflowOrderActionUpdates('make_cancel'), [
      { field: 'is_delivered', value: 0 },
      { field: 'order_type', value: 0 },
      { field: 'is_made', value: 0 },
    ]);
    assert.deepEqual(getWorkflowOrderActionUpdates('delivery_cancel'), [
      { field: 'is_delivered', value: 0 },
      { field: 'order_type', value: 0 },
    ]);

    assert.equal(
      applyWorkflowOrderAction({ id: 1, status_text: '待完成' }, 'make_done').status_key,
      'pending_delivery',
    );
    const delivered = applyWorkflowOrderAction({ id: 1, status_text: '待完成' }, 'delivery_done');
    assert.equal(delivered.status_key, 'done');
    assert.equal(delivered.is_made, 1);
    assert.equal(delivered.is_delivered, 1);
    assert.equal(delivered.order_type, 1);

    const canceledDelivery = applyWorkflowOrderAction({ id: 1, is_made: 1, is_delivered: 1, order_type: 1 }, 'delivery_cancel');
    assert.equal(canceledDelivery.status_key, 'pending_delivery');
    assert.equal(canceledDelivery.is_made, 1);
    assert.equal(canceledDelivery.is_delivered, 0);
    assert.equal(canceledDelivery.order_type, 0);

    const canceledMake = applyWorkflowOrderAction({ id: 1, is_made: 1, is_delivered: 1, order_type: 1 }, 'make_cancel');
    assert.equal(canceledMake.status_key, 'pending_make');
    assert.equal(canceledMake.is_made, 0);
    assert.equal(canceledMake.is_delivered, 0);
    assert.equal(canceledMake.order_type, 0);
  });

  it('keeps the order in the same list position after an inline action update', () => {
    const orders = [
      { id: 'first', status_text: '待完成', created_at: '2026-05-25 10:00' },
      { id: 'second', status_text: '待完成', created_at: '2026-05-25 09:00' },
      { id: 'third', status_text: '制作完成', created_at: '2026-05-25 08:00' },
    ].map((item) => normalizeOrderFlow({ workflows: [item] }).workflows[0]);

    const next = updateWorkflowOrderInPlace(orders, orders[0], 'make_done');

    assert.deepEqual(next.map((item) => item.id), ['first', 'second', 'third']);
    assert.equal(next[0].status_key, 'pending_delivery');
    assert.equal(next[1].status_key, 'pending_make');
  });

  it('builds workflow order edit payloads and preserves list position after save', () => {
    const order = normalizeOrderFlow({
      workflows: [{
        id: 12,
        customer_name: '齐唯茶业',
        goods_name: '【锦程】半斤礼盒',
        goods_color: '红色 / 黄色',
        order_quantity: '120 套',
        is_screen_print: 1,
        order_images: ['https://img.example/design.jpg'],
        order_type: 1,
        remark: '加急',
      }],
    }).workflows[0];

    const form = buildWorkflowOrderEditForm(order);
    assert.equal(form.id, 12);
    assert.equal(form.customer_name, '齐唯茶业');
    assert.equal(form.order_quantity, '120');
    assert.equal(form.is_screen_print, true);

    const payload = buildWorkflowOrderSavePayload({ ...form, order_quantity: '80 套' });
    assert.equal(payload.id, 12);
    assert.equal(payload.order_quantity, 80);
    assert.equal(payload.is_screen_print, 1);
    assert.equal(payload.order_type, 1);
    assert.deepEqual(payload.order_images, ['https://img.example/design.jpg']);

    const next = updateWorkflowOrderFromEditForm([order, { id: 13, goods_name: '其他订单' }], order, {
      ...form,
      goods_name: '半斤礼盒',
      order_quantity: '80',
    });
    assert.deepEqual(next.map((item) => item.id), [12, 13]);
    assert.equal(next[0].goods_name, '半斤礼盒');
    assert.equal(next[0].order_quantity, '80 套');
    assert.equal(next[0].status_key, 'done');
  });
});
