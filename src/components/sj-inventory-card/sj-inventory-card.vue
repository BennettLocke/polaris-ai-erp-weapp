<template>
  <view class="sj-inventory-card">
    <view class="sj-inventory-card__head">
      <view class="sj-inventory-card__title-wrap">
        <text class="sj-inventory-card__title">{{ inventoryTitle || '未命名商品' }}</text>
        <text class="sj-inventory-card__subtitle">
          {{ colorRows.length }} 个颜色/SKU{{ pieceText ? ` · ${pieceText}` : '' }}
        </text>
      </view>
      <text :class="['sj-inventory-card__total', qtyClass(totalQty)]">合计 {{ totalQty }}</text>
    </view>

    <view class="sj-inventory-card__matrix">
      <view class="sj-inventory-card__matrix-head">
        <text class="sj-inventory-card__matrix-title">颜色/SKU</text>
        <text
          v-for="warehouse in warehouseColumns"
          :key="warehouse.name"
          class="sj-inventory-card__matrix-title sj-inventory-card__matrix-number"
        >
          {{ warehouse.shortName || warehouse.name }}
        </text>
        <text class="sj-inventory-card__matrix-title sj-inventory-card__matrix-number">合计</text>
      </view>

      <view v-for="row in colorRows" :key="row.id || row.code || row.color" class="sj-inventory-card__row">
        <view class="sj-inventory-card__sku">
          <text class="sj-inventory-card__sku-color">{{ row.color || row.spec || '默认颜色' }}</text>
          <text class="sj-inventory-card__sku-code">{{ row.code || '未编号' }}</text>
        </view>
        <text
          v-for="warehouse in warehouseColumns"
          :key="`${row.id || row.code}-${warehouse.name}`"
          :class="['sj-inventory-card__stock-cell', qtyClass(rowWarehouseQty(row, warehouse.name))]"
        >
          {{ rowWarehouseQty(row, warehouse.name) }}
        </text>
        <text :class="['sj-inventory-card__stock-cell', qtyClass(row.totalQty)]">{{ row.totalQty || '0' }}</text>
      </view>
    </view>
  </view>
</template>

<script>
function cleanText(value) {
  return String(value || "").trim();
}

function numberValue(value) {
  const number = Number(cleanText(value));
  return Number.isFinite(number) ? number : 0;
}

export default {
  name: "SjInventoryCard",
  props: {
    group: { type: Object, default: () => ({}) },
    warehouses: {
      type: Array,
      default: () => [
        { id: 1, name: "自己店里" },
        { id: 2, name: "百鑫仓库" },
      ],
    },
  },
  computed: {
    inventoryTitle() {
      return cleanText(this.group.title || this.group.name || this.group.product_name);
    },
    pieceText() {
      return cleanText(this.group.pieceText || this.group.piece_text || this.group.box_spec || this.group.simple_desc);
    },
    totalQty() {
      return cleanText(this.group.totalQty ?? this.group.total_qty ?? this.group.total_stock ?? 0) || "0";
    },
    colorRows() {
      const rows = Array.isArray(this.group.rows) ? this.group.rows : [];
      return rows.map((row) => ({
        ...row,
        color: cleanText(row.color || row.spec),
        spec: cleanText(row.spec || row.color),
        code: cleanText(row.code || row.sku_no || row.product_code),
        totalQty: cleanText(row.totalQty ?? row.total_qty ?? row.total_stock ?? 0) || "0",
      }));
    },
    warehouseColumns() {
      const source = Array.isArray(this.warehouses) && this.warehouses.length
        ? this.warehouses
        : [{ id: 1, name: "自己店里" }, { id: 2, name: "百鑫仓库" }];
      return source.map((warehouse) => ({
        ...warehouse,
        name: cleanText(warehouse.name || warehouse.warehouse_name || warehouse.label),
        shortName: cleanText(warehouse.shortName || warehouse.short_name || warehouse.name || warehouse.warehouse_name)
          .replace("仓库", "")
          .replace("店里", ""),
      })).filter((warehouse) => warehouse.name);
    },
  },
  methods: {
    rowWarehouseQty(row, warehouseName) {
      const warehouses = row && row.warehouses ? row.warehouses : {};
      return cleanText(warehouses[warehouseName] ?? 0) || "0";
    },
    qtyClass(value) {
      const qty = numberValue(value);
      if (qty < 0) return "is-negative";
      if (qty === 0) return "is-zero";
      return "";
    },
  },
};
</script>

<style scoped>
.sj-inventory-card {
  box-sizing: border-box;
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(24, 24, 27, 0.08);
  color: #18181b;
  font-family: "PingFang SC", "PingFang TC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.sj-inventory-card__head {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.sj-inventory-card__title-wrap {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.sj-inventory-card__title {
  min-width: 0;
  color: #18181b;
  font-size: 17px;
  line-height: 24px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-inventory-card__subtitle {
  color: #71717a;
  font-size: 12px;
  line-height: 17px;
  font-weight: 600;
}

.sj-inventory-card__total {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f4f4f5;
  color: #18181b;
  font-size: 13px;
  line-height: 26px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.sj-inventory-card__matrix {
  display: grid;
  overflow: hidden;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
}

.sj-inventory-card__matrix-head,
.sj-inventory-card__row {
  display: grid;
  grid-template-columns: minmax(116px, 1fr) repeat(3, minmax(54px, 64px));
  align-items: stretch;
}

.sj-inventory-card__matrix-title,
.sj-inventory-card__sku,
.sj-inventory-card__stock-cell {
  min-width: 0;
  min-height: 42px;
  box-sizing: border-box;
  display: grid;
  align-content: center;
  border-bottom: 1px solid #e4e4e7;
  padding: 7px 8px;
}

.sj-inventory-card__row:last-child .sj-inventory-card__sku,
.sj-inventory-card__row:last-child .sj-inventory-card__stock-cell {
  border-bottom: 0;
}

.sj-inventory-card__matrix-title {
  background: #f4f4f5;
  color: #71717a;
  font-size: 12px;
  line-height: 17px;
  font-weight: 800;
}

.sj-inventory-card__matrix-number,
.sj-inventory-card__stock-cell {
  justify-content: end;
  text-align: right;
}

.sj-inventory-card__sku {
  gap: 2px;
}

.sj-inventory-card__sku-color {
  color: #18181b;
  font-size: 14px;
  line-height: 20px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-inventory-card__sku-code {
  color: #71717a;
  font-size: 11px;
  line-height: 15px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sj-inventory-card__stock-cell {
  color: #18181b;
  font-size: 15px;
  line-height: 20px;
  font-weight: 850;
  font-variant-numeric: tabular-nums;
}

.sj-inventory-card__stock-cell.is-zero,
.sj-inventory-card__total.is-zero {
  color: #a1a1aa;
}

.sj-inventory-card__stock-cell.is-negative,
.sj-inventory-card__total.is-negative {
  color: #dc2626;
}
</style>
