import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  canEditOrders,
  canLoadOrdersByDefault,
  canRequestOrderList,
  getOrderPermissions,
  hasLinkedCustomer,
} from '../src/utils/permission.js';

describe('order permissions', () => {
  it('allows everyone to query orders', () => {
    assert.deepEqual(getOrderPermissions(), { canQuery: true, canEdit: false });
    assert.equal(getOrderPermissions({ token: '', user: { role: 'admin' } }).canQuery, true);
    assert.equal(getOrderPermissions({ token: 'token', user: { role: 'customer' } }).canQuery, true);
  });

  it('does not allow guests or customers to edit orders', () => {
    assert.equal(canEditOrders(), false);
    assert.equal(canEditOrders({ token: '', user: { role: 'admin' } }), false);
    assert.equal(canEditOrders({ token: 'token', user: { role: 'customer' } }), false);
    assert.equal(canEditOrders({ token: 'token', user: { role_name: '客户' } }), false);
  });

  it('allows logged-in employees and admins to edit orders', () => {
    assert.equal(canEditOrders({ token: 'token', user: { role: 'employee' } }), true);
    assert.equal(canEditOrders({ token: 'token', user: { role_code: 'admin' } }), true);
    assert.equal(canEditOrders({ token: 'token', user: { role_name: '员工' } }), true);
    assert.equal(canEditOrders({ token: 'token', user: { roles: ['customer', '管理员'] } }), true);
  });

  it('loads the order list by default for employees, admins, and linked customer accounts', () => {
    assert.equal(canLoadOrdersByDefault(), false);
    assert.equal(canLoadOrdersByDefault({ token: 'token', user: { role: 'customer' } }), false);
    assert.equal(canLoadOrdersByDefault({ token: 'token', user: { role: 'customer', linked_party_id: 55 } }), true);
    assert.equal(canLoadOrdersByDefault({ token: 'token', user: { role: 'staff' } }), true);
    assert.equal(canLoadOrdersByDefault({ token: 'token', user: { is_admin: 1 } }), true);
  });

  it('lets linked customer accounts query their own orders without a keyword', () => {
    assert.equal(hasLinkedCustomer({ token: 'token', user: { linked_party_id: 55 } }), true);
    assert.equal(hasLinkedCustomer({ token: '', user: { linked_party_id: 55 } }), false);
    assert.equal(hasLinkedCustomer({ token: 'token', user: { role: 'customer' } }), false);
    assert.equal(canRequestOrderList({ authState: {}, keyword: '' }), false);
    assert.equal(canRequestOrderList({ authState: {}, keyword: '见喜' }), false);
    assert.equal(canRequestOrderList({ authState: {}, keyword: 'SJ1123' }), false);
    assert.equal(canRequestOrderList({ authState: {}, keyword: '1000025' }), true);
    assert.equal(canRequestOrderList({ authState: { token: 'token', user: { role: 'customer' } }, keyword: '' }), false);
    assert.equal(canRequestOrderList({ authState: { token: 'token', user: { role: 'customer' } }, keyword: '见喜' }), false);
    assert.equal(canRequestOrderList({ authState: { token: 'token', user: { role: 'customer', linked_party_id: 55 } }, keyword: '' }), true);
    assert.equal(canRequestOrderList({ authState: { token: 'token', user: { role: 'customer' } }, keyword: 'XSD202605280001' }), true);
    assert.equal(canRequestOrderList({ authState: { token: 'token', user: { role: 'staff' } }, keyword: '' }), true);
  });
});
