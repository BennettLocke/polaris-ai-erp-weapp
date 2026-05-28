const ORDER_EDITOR_ROLES = new Set([
  'admin',
  'administrator',
  'super_admin',
  'staff',
  'employee',
  'warehouse',
  'designer',
  '管理员',
  '老板',
  '员工',
]);

function truthyFlag(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

function collectRoles(user = {}) {
  const roles = [
    user.role,
    user.role_code,
    user.roleCode,
    user.role_name,
    user.roleName,
    user.user_role,
    user.userRole,
    user.type,
  ];

  if (Array.isArray(user.roles)) roles.push(...user.roles);
  if (Array.isArray(user.permissions?.roles)) roles.push(...user.permissions.roles);

  return roles.map(normalizeRole).filter(Boolean);
}

function linkedCustomerId(user = {}) {
  const value = Number(user.linked_party_id || user.linkedPartyId || user.customer_id || user.customerId || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function isExactOrderKeyword(keyword = '') {
  const text = String(keyword || '').trim().toUpperCase();
  if (!text) return false;
  if (/^\d{4,}$/.test(text)) return true;
  return /^(WF|WFO|XSD|XS|SO|DD|ORDER|SALES)[A-Z0-9_-]{4,}$/.test(text);
}

export function canEditOrders(authState = {}) {
  if (!authState || !authState.token) return false;
  const user = authState.user || {};

  if (truthyFlag(user.is_admin) || truthyFlag(user.isAdmin)) return true;

  return collectRoles(user).some((role) => ORDER_EDITOR_ROLES.has(role));
}

export function hasLinkedCustomer(authState = {}) {
  if (!authState || !authState.token) return false;
  return linkedCustomerId(authState.user || {}) > 0;
}

export function getOrderPermissions(authState = {}) {
  return {
    canQuery: true,
    canEdit: canEditOrders(authState),
  };
}

export function canLoadOrdersByDefault(authState = {}) {
  return canEditOrders(authState) || hasLinkedCustomer(authState);
}

export function canRequestOrderList({ authState = {}, keyword = '' } = {}) {
  if (canEditOrders(authState) || hasLinkedCustomer(authState)) return true;
  return isExactOrderKeyword(keyword);
}
