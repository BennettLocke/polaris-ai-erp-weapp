export function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizePageData(payload = {}, itemNormalizer = (item) => item) {
  const sourceItems = payload.data || payload.list || payload.items || payload.records || [];
  const data = asArray(sourceItems).map(itemNormalizer);
  const page = toNumber(payload.current_page || payload.page, 1);
  const pageSize = toNumber(payload.per_page || payload.page_size, data.length || 20);
  const total = toNumber(payload.total, data.length);
  const pageTotal = toNumber(
    payload.page_total || payload.last_page || payload.total_page,
    total && pageSize ? Math.ceil(total / pageSize) : 1,
  );

  return {
    ...payload,
    data,
    list: data,
    page,
    current_page: page,
    page_size: pageSize,
    per_page: pageSize,
    total,
    page_total: pageTotal,
    last_page: pageTotal,
    has_more: page < pageTotal,
  };
}

export function emptyPage(extra = {}) {
  return normalizePageData({ data: [], total: 0, page_total: 1, ...extra });
}
