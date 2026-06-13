import { request } from './request';

function cleanText(value) {
  return String(value || '').trim();
}

function formatQty(value) {
  const text = cleanText(value);
  if (!text) return '0';
  const number = Number(text);
  if (!Number.isFinite(number)) return text;
  return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(3)));
}

function normalizeWarehouses(warehouses = []) {
  const source = Array.isArray(warehouses) && warehouses.length
    ? warehouses
    : [{ id: 1, name: '自己店里' }, { id: 2, name: '百鑫仓库' }];
  return source.map((warehouse) => ({
    id: warehouse.id,
    name: cleanText(warehouse.name || warehouse.warehouse_name || warehouse.label),
  })).filter((warehouse) => warehouse.name);
}

function normalizeInventoryItem(item = {}) {
  return {
    ...item,
    id: item.id || item.product_id || item.sku_id || item.code || item.sku_no,
    code: cleanText(item.code || item.sku_no || item.product_code),
    title: cleanText(item.name || item.title || item.product_name),
    spec: cleanText(item.color || item.spec),
    pieceText: cleanText(item.box_spec || item.pieceText || item.simple_desc),
    qtyShop: formatQty(item.qty_shop ?? item.qtyShop ?? 0),
    qtyBaixin: formatQty(item.qty_baixin ?? item.qtyBaixin ?? 0),
    totalQty: formatQty(item.total_qty ?? item.totalQty ?? 0),
  };
}

function normalizeInventoryRow(row = {}, warehouses = []) {
  const sourceWarehouses = row.warehouses || {};
  const warehouseQty = {};
  warehouses.forEach((warehouse) => {
    warehouseQty[warehouse.name] = formatQty(sourceWarehouses[warehouse.name] ?? 0);
  });
  return {
    ...row,
    id: row.id || row.product_id || row.sku_id || row.code || row.sku_no,
    code: cleanText(row.code || row.sku_no || row.product_code),
    color: cleanText(row.color || row.spec),
    spec: cleanText(row.spec || row.color),
    unitName: cleanText(row.unit_name || row.unit) || '套',
    pieceText: cleanText(row.piece_text || row.pieceText || row.box_spec || row.simple_desc),
    warehouses: warehouseQty,
    totalQty: formatQty(row.total_qty ?? row.totalQty ?? row.total_stock ?? 0),
  };
}

function normalizeInventoryGroup(group = {}, warehouses = []) {
  const rows = Array.isArray(group.rows) ? group.rows : group.skus || group.items || [];
  return {
    ...group,
    id: group.id || group.spu_id || group.product_id || group.title,
    title: cleanText(group.title || group.name || group.product_name),
    pieceText: cleanText(group.piece_text || group.pieceText || group.box_spec || group.simple_desc),
    totalQty: formatQty(group.total_qty ?? group.totalQty ?? group.total_stock ?? 0),
    rows: rows.map((row) => normalizeInventoryRow(row, warehouses)),
  };
}

function buildInventoryGroupsFromItems(items = [], warehouses = []) {
  const groups = new Map();
  items.forEach((item) => {
    const normalized = normalizeInventoryItem(item);
    const key = normalized.spu_id || normalized.title || normalized.code || normalized.id;
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        title: normalized.title,
        pieceText: normalized.pieceText,
        totalQtyValue: 0,
        rows: [],
      });
    }
    const group = groups.get(key);
    const warehouseQty = {};
    warehouses.forEach((warehouse) => {
      if (warehouse.name === '自己店里') warehouseQty[warehouse.name] = normalized.qtyShop;
      else if (warehouse.name === '百鑫仓库') warehouseQty[warehouse.name] = normalized.qtyBaixin;
      else warehouseQty[warehouse.name] = '0';
    });
    group.totalQtyValue += Number(normalized.totalQty || 0) || 0;
    group.rows.push({
      ...normalized,
      color: normalized.spec,
      unitName: cleanText(normalized.unit_name || normalized.unit) || '套',
      warehouses: warehouseQty,
      totalQty: normalized.totalQty,
    });
  });
  return Array.from(groups.values()).map((group) => ({
    ...group,
    totalQty: formatQty(group.totalQtyValue),
    rows: group.rows.sort((a, b) => (Number(b.totalQty || 0) || 0) - (Number(a.totalQty || 0) || 0)),
  }));
}

export function getMiniInventoryList(params = {}) {
  const query = {
    page: params.page || 1,
    page_size: params.page_size || 30,
    keyword: params.keyword || '',
  };

  return request('/api/mini/inventory/list', { data: query }).then((data = {}) => {
    const sourceItems = Array.isArray(data.items) ? data.items : data.list || [];
    const warehouses = normalizeWarehouses(data.warehouses);
    const sourceGroups = Array.isArray(data.groups) ? data.groups : [];
    const items = sourceItems.map(normalizeInventoryItem);
    return {
      ...data,
      items,
      groups: sourceGroups.length
        ? sourceGroups.map((group) => normalizeInventoryGroup(group, warehouses))
        : buildInventoryGroupsFromItems(items, warehouses),
      warehouses,
      total_items: Number(data.total_items || data.total || items.length || 0),
      total_qty: formatQty(data.total_qty),
      page: Number(data.page || query.page),
      page_size: Number(data.page_size || query.page_size),
    };
  });
}
