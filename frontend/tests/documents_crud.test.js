import { describe, it, expect, beforeAll } from "bun:test";
import config from "./config.json";

const BASE = config.baseURL;
let salesAccount, warehouseAccount, admin;
let productId,
  productForStockId,
  productStockId,
  orderId,
  salesOrderId,
  orderItemId,
  oiProductId,
  oiOrderId;

async function api(endpoint, payload) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return {
    ok: res.ok,
    status: res.status,
    body: await res.json().catch(() => {}),
  };
}

describe("Products management CRUD with permissions", () => {
  beforeAll(async () => {
    admin = await api("/api/login", { username: "admin", password: "admin" });
    salesAccount = await api("/api/login", {
      username: "sales",
      password: "sales",
    });
    warehouseAccount = await api("/api/login", {
      username: "warehouse",
      password: "warehouse",
    });
  });

  // Product CRUD tests

  // Admin: full CRUD
  it("Admin can CREATE product", async () => {
    const payload = {
      collection: "products",
      session_id: admin.body.session_id,
      action: "insert",
      data: {
        name: "Test Product",
        sku: `TP-${Date.now()}`,
        unit_price: 9.99,
      },
    };
    const r = await api("/api/save", payload);
    expect(r.ok).toBe(true);
    productId = r.body.product_id;
  });

  it("Admin can READ product", async () => {
    const r = await api("/api/select", {
      collection: "products",
      session_id: admin.body.session_id,
      filter: `product_id='${productId}'`,
      expand: "",
      order: "",
      pagination: { limit: 5, offset: 0 },
    });
    expect(r.ok).toBe(true);
    expect(Array.isArray(r.body.data)).toBe(true);
    const found = (r.body.data || []).some(
      (p) => p.id === productId || p.product_id === productId
    );
    expect(found).toBe(true);
  });

  it("Admin can UPDATE product", async () => {
    const r = await api("/api/save", {
      collection: "products",
      session_id: admin.body.session_id,
      action: "update",
      data: { product_id: productId, name: "Updated Test Product" },
    });
    expect(r.ok).toBe(true);
  });

  // Sales: only READ and (in our RBAC) no product CREATE/UPDATE/DELETE
  it("Sales cannot CREATE product (403)", async () => {
    const r = await api("/api/save", {
      collection: "products",
      session_id: salesAccount.body.session_id,
      action: "insert",
      data: {
        name: "Sales Product",
        sku: `SP-${Date.now()}`,
        unit_price: 5.0,
      },
    });
    expect(r.status).toBe(403);
  });

  it("Sales can READ products", async () => {
    const r = await api("/api/select", {
      collection: "products",
      session_id: salesAccount.body.session_id,
      filter: "",
      expand: "",
      order: "",
      pagination: { limit: 5, offset: 0 },
    });
    expect(r.ok).toBe(true);
    expect(Array.isArray(r.body.data)).toBe(true);
  });

  it("Sales cannot UPDATE product (403)", async () => {
    const r = await api("/api/save", {
      collection: "products",
      session_id: salesAccount.body.session_id,
      action: "update",
      data: { product_id: productId, name: "Should Not Update" },
    });
    expect(r.status).toBe(403);
  });

  it("Sales cannot DELETE product (403)", async () => {
    const r = await api("/api/save", {
      collection: "products",
      session_id: salesAccount.body.session_id,
      action: "delete",
      data: { product_id: productId },
    });
    expect(r.status).toBe(403);
  });

  // Warehouse: READ allowed, product definition changes are Admin-only
  it("Warehouse cannot CREATE product (403)", async () => {
    const r = await api("/api/save", {
      collection: "products",
      session_id: warehouseAccount.body.session_id,
      action: "insert",
      data: {
        name: "WH Product",
        sku: `WH-${Date.now()}`,
        unit_price: 1.0,
      },
    });
    expect(r.status).toBe(403);
  });

  it("Warehouse can READ products", async () => {
    const r = await api("/api/select", {
      collection: "products",
      session_id: warehouseAccount.body.session_id,
      filter: "",
      expand: "",
      order: "",
      pagination: { limit: 5, offset: 0 },
    });
    expect(r.ok).toBe(true);
  });

  it("Warehouse cannot UPDATE product (403)", async () => {
    const r = await api("/api/save", {
      collection: "products",
      session_id: warehouseAccount.body.session_id,
      action: "update",
      data: { product_id: productId, name: "WH Update Attempt" },
    });
    expect(r.status).toBe(403);
  });

  it("Warehouse cannot DELETE product (403)", async () => {
    const r = await api("/api/save", {
      collection: "products",
      session_id: warehouseAccount.body.session_id,
      action: "delete",
      data: { product_id: productId },
    });
    expect(r.status).toBe(403);
  });

  it("Admin can DELETE product", async () => {
    const r = await api("/api/save", {
      collection: "products",
      session_id: admin.body.session_id,
      action: "delete",
      data: { product_id: productId },
    });
    // Admin should be able to delete; if FK blocks, the API may return a non-ok status.
    expect(r.ok).toBe(true);
  });
});

describe("Products stocks management CRUD with permissions", () => {
  beforeAll(async () => {
    admin = await api("/api/login", { username: "admin", password: "admin" });
    salesAccount = await api("/api/login", {
      username: "sales",
      password: "sales",
    });
    warehouseAccount = await api("/api/login", {
      username: "warehouse",
      password: "warehouse",
    });
  });

  // Product_stock CRUD tests
  it("Admin can CREATE product_stock", async () => {
    // create a product to attach stock to
    const p = await api("/api/save", {
      collection: "products",
      session_id: admin.body.session_id,
      action: "insert",
      data: {
        name: "Stocked Product",
        sku: `STK-${Date.now()}`,
        unit_price: 2.5,
      },
    });
    expect(p.ok).toBe(true);
    productForStockId = p.body.product_id || p.body.id || p.body.data?.id;
    const r = await api("/api/save", {
      collection: "product_stock",
      session_id: admin.body.session_id,
      action: "insert",
      data: { product_id: productForStockId, quantity_on_hand: 100 },
    });
    expect(r.ok).toBe(true);
    productStockId = r.body.product_stock_id || r.body.id || r.body.data?.id;
  });

  it("Admin can READ product_stock", async () => {
    const r = await api("/api/select", {
      collection: "product_stock",
      session_id: admin.body.session_id,
      filter: `product_id='${productForStockId}'`,
      expand: "",
      order: "",
      pagination: { limit: 5, offset: 0 },
    });
    expect(r.ok).toBe(true);
    const found = (r.body.data || []).some(
      (s) => s.product_stock_id === productStockId
    );
    expect(found).toBe(true);
  });

  it("Admin can UPDATE product_stock", async () => {
    const r = await api("/api/save", {
      collection: "product_stock",
      session_id: admin.body.session_id,
      action: "update",
      data: { product_stock_id: productStockId, quantity_on_hand: 90 },
    });
    expect(r.ok).toBe(true);
  });

  it("Admin can DELETE product_stock", async () => {
    const r = await api("/api/save", {
      collection: "product_stock",
      session_id: admin.body.session_id,
      action: "delete",
      data: { product_stock_id: productStockId },
    });
    expect(r.ok).toBe(true);
  });

  // Sales: read only for product_stock
  it("Sales cannot CREATE product_stock (403)", async () => {
    const r = await api("/api/save", {
      collection: "product_stock",
      session_id: salesAccount.body.session_id,
      action: "insert",
      data: { product_id: productForStockId, quantity_on_hand: 50 },
    });
    expect(r.status).toBe(403);
  });

  it("Sales can READ product_stock", async () => {
    const r = await api("/api/select", {
      collection: "product_stock",
      session_id: salesAccount.body.session_id,
      filter: `product_id='${productForStockId}'`,
      expand: "",
      order: "",
      pagination: { limit: 5, offset: 0 },
    });
    expect(r.ok).toBe(true);
    expect(Array.isArray(r.body.data)).toBe(true);
  });

  it("Sales cannot UPDATE product_stock (403)", async () => {
    const r = await api("/api/save", {
      collection: "product_stock",
      session_id: salesAccount.body.session_id,
      action: "update",
      data: { stock_id: productStockId, quantity_on_hand: 40 },
    });
    expect(r.status).toBe(403);
  });

  it("Sales cannot DELETE product_stock (403)", async () => {
    const r = await api("/api/save", {
      collection: "product_stock",
      session_id: salesAccount.body.session_id,
      action: "delete",
      data: { stock_id: productStockId },
    });
    expect(r.status).toBe(403);
  });

  // Warehouse: can read and update stock, cannot create/delete (per assumed policy)
  it("Warehouse can CREATE product_stock", async () => {
    const r = await api("/api/save", {
      collection: "product_stock",
      session_id: warehouseAccount.body.session_id,
      action: "insert",
      data: { product_id: productForStockId, quantity_on_hand: 10 },
    });
    expect(r.status).toBe(200);
    productStockId = r.body.product_stock_id;
  });

  it("Warehouse can READ product_stock", async () => {
    const r = await api("/api/select", {
      collection: "product_stock",
      session_id: warehouseAccount.body.session_id,
      filter: `product_id='${productForStockId}'`,
      expand: "",
      order: "",
      pagination: { limit: 5, offset: 0 },
    });
    expect(r.ok).toBe(true);
  });

  it("Warehouse can UPDATE product_stock", async () => {
    const r = await api("/api/save", {
      collection: "product_stock",
      session_id: warehouseAccount.body.session_id,
      action: "update",
      data: { product_stock_id: productStockId, quantity_on_hand: 75 },
    });
    expect(r.ok).toBe(true);
  });

  it("Warehouse can DELETE product_stock", async () => {
    const r = await api("/api/save", {
      collection: "product_stock",
      session_id: warehouseAccount.body.session_id,
      action: "delete",
      data: { product_stock_id: productStockId },
    });
    expect(r.status).toBe(200);
  });

  // cleanup: delete the product used for stock testing
  it("Admin cleanup: DELETE product used for stock", async () => {
    const r = await api("/api/save", {
      collection: "products",
      session_id: admin.body.session_id,
      action: "delete",
      data: { product_id: productForStockId },
    });
    expect(r.ok).toBe(true);
  });
});

describe("Orders management CRUD with permissions", () => {
  beforeAll(async () => {
    admin = await api("/api/login", { username: "admin", password: "admin" });
    salesAccount = await api("/api/login", {
      username: "sales",
      password: "sales",
    });
    warehouseAccount = await api("/api/login", {
      username: "warehouse",
      password: "warehouse",
    });
  });

  // Admin: full CRUD
  it("Admin can CREATE order", async () => {
    const r = await api("/api/save", {
      collection: "orders",
      session_id: admin.body.session_id,
      action: "insert",
      data: {
        customer_id: "$session_usr.id",
        order_date: new Date().toISOString(),
        status: "pending",
      },
    });
    expect(r.ok).toBe(true);
    orderId = r.body.orders_id || r.body.id || r.body.data?.id;
  });

  it("Admin can READ order", async () => {
    const r = await api("/api/select", {
      collection: "orders",
      session_id: admin.body.session_id,
      filter: `orders_id='${orderId}'`,
      expand: "",
      order: "",
      pagination: { limit: 5, offset: 0 },
    });
    expect(r.ok).toBe(true);
    const found = (r.body.data || []).some(
      (o) => o.orders_id === orderId || o.id === orderId
    );
    expect(found).toBe(true);
  });

  it("Admin can UPDATE order", async () => {
    const r = await api("/api/save", {
      collection: "orders",
      session_id: admin.body.session_id,
      action: "update",
      data: { orders_id: orderId, status: "completed" },
    });
    expect(r.ok).toBe(true);
  });

  it("Admin can DELETE order", async () => {
    const r = await api("/api/save", {
      collection: "orders",
      session_id: admin.body.session_id,
      action: "delete",
      data: { orders_id: orderId },
    });
    expect(r.ok).toBe(true);
  });

  it("Sales can CREATE order", async () => {
    const r = await api("/api/save", {
      collection: "orders",
      session_id: salesAccount.body.session_id,
      action: "insert",
      data: {
        customer_id: "$session_usr.id",
        order_date: new Date().toISOString(),
        status: "pending",
      },
    });
    expect(r.ok).toBe(true);
    salesOrderId = r.body.orders_id || r.body.id || r.body.data?.id;
  });

  it("Sales can READ orders", async () => {
    const r = await api("/api/select", {
      collection: "orders",
      session_id: salesAccount.body.session_id,
      filter: `orders_id='${salesOrderId}'`,
      expand: "",
      order: "",
      pagination: { limit: 5, offset: 0 },
    });
    expect(r.ok).toBe(true);
    expect(Array.isArray(r.body.data)).toBe(true);
  });

  it("Sales can UPDATE order", async () => {
    const r = await api("/api/save", {
      collection: "orders",
      session_id: salesAccount.body.session_id,
      action: "update",
      data: { orders_id: salesOrderId, status: "updated" },
    });
    expect(r.status).toBe(200);
  });

  it("Sales can DELETE order", async () => {
    const r = await api("/api/save", {
      collection: "orders",
      session_id: salesAccount.body.session_id,
      action: "delete",
      data: { orders_id: salesOrderId },
    });
    expect(r.status).toBe(200);
  });

  // Warehouse: can READ, cannot CREATE/UPDATE/DELETE
  it("Warehouse cannot CREATE order (403)", async () => {
    const r = await api("/api/save", {
      collection: "orders",
      session_id: warehouseAccount.body.session_id,
      action: "insert",
      data: {
        customer_id: "$session_usr.id",
        order_date: new Date().toISOString(),
        status: "pending",
      },
    });
    expect(r.status).toBe(403);
  });

  it("Warehouse can READ orders", async () => {
    const r = await api("/api/select", {
      collection: "orders",
      session_id: warehouseAccount.body.session_id,
      filter: "",
      expand: "",
      order: "",
      pagination: { limit: 5, offset: 0 },
    });
    expect(r.ok).toBe(true);
    expect(Array.isArray(r.body.data)).toBe(true);
  });

  it("Warehouse cannot UPDATE order (403)", async () => {
    const r = await api("/api/save", {
      collection: "orders",
      session_id: warehouseAccount.body.session_id,
      action: "update",
      data: { orders_id: salesOrderId, status: "should-not-update" },
    });
    expect(r.status).toBe(403);
  });

  it("Warehouse cannot DELETE order (403)", async () => {
    const r = await api("/api/save", {
      collection: "orders",
      session_id: warehouseAccount.body.session_id,
      action: "delete",
      data: { orders_id: salesOrderId },
    });
    expect(r.status).toBe(403);
  });
});

describe("Orders items management CRUD with permissions", () => {
  beforeAll(async () => {
    admin = await api("/api/login", { username: "admin", password: "admin" });
    salesAccount = await api("/api/login", {
      username: "sales",
      password: "sales",
    });
    warehouseAccount = await api("/api/login", {
      username: "warehouse",
      password: "warehouse",
    });
  });

  it("Setup: Admin creates product and order for order_items", async () => {
    const p = await api("/api/save", {
      collection: "products",
      session_id: admin.body.session_id,
      action: "insert",
      data: { name: "OI Product", sku: `OI-${Date.now()}`, unit_price: 3.5 },
    });
    expect(p.ok).toBe(true);
    oiProductId = p.body.product_id || p.body.id || p.body.data?.id;
    const o = await api("/api/save", {
      collection: "orders",
      session_id: admin.body.session_id,
      action: "insert",
      data: {
        customer_id: "$session_usr.id",
        order_date: new Date().toISOString(),
        status: "pending",
      },
    });
    expect(o.ok).toBe(true);
    oiOrderId = o.body.orders_id || o.body.id || o.body.data?.id;
  });

  // Admin: full CRUD
  it("Admin can CREATE order_item", async () => {
    const r = await api("/api/save", {
      collection: "order_items",
      session_id: admin.body.session_id,
      action: "insert",
      data: {
        order_id: oiOrderId,
        product_id: oiProductId,
        quantity_ordered: 2,
        item_price: 3.5,
      },
    });
    expect(r.ok).toBe(true);
    orderItemId = r.body.order_items_id || r.body.id || r.body.data?.id;
  });

  it("Admin can READ order_item", async () => {
    const r = await api("/api/select", {
      collection: "order_items",
      session_id: admin.body.session_id,
      filter: `order_items_id='${orderItemId}'`,
      expand: "",
      order: "",
      pagination: { limit: 5, offset: 0 },
    });
    expect(r.ok).toBe(true);
    const found = (r.body.data || []).some(
      (oi) => oi.order_items_id === orderItemId || oi.id === orderItemId
    );
    expect(found).toBe(true);
  });

  it("Admin can UPDATE order_item", async () => {
    const r = await api("/api/save", {
      collection: "order_items",
      session_id: admin.body.session_id,
      action: "update",
      data: { order_items_id: orderItemId, quantity_ordered: 5 },
    });
    expect(r.ok).toBe(true);
  });

  it("Admin can DELETE order_item", async () => {
    const r = await api("/api/save", {
      collection: "order_items",
      session_id: admin.body.session_id,
      action: "delete",
      data: { order_items_id: orderItemId },
    });
    expect(r.ok).toBe(true);
  });

  // Sales: can CREATE and READ, cannot UPDATE/DELETE
  let salesOrderItemId;
  it("Sales can CREATE order_item", async () => {
    const prodId = oiProductId;
    const o = await api("/api/save", {
      collection: "orders",
      session_id: salesAccount.body.session_id,
      action: "insert",
      data: {
        customer_id: "$session_usr.id",
        order_date: new Date().toISOString(),
        status: "pending",
      },
    });
    expect(o.ok).toBe(true);
    const ordId = o.body.orders_id;
    const r = await api("/api/save", {
      collection: "order_items",
      session_id: salesAccount.body.session_id,
      action: "insert",
      data: {
        order_id: ordId,
        product_id: prodId,
        quantity_ordered: 1,
        item_price: 4.5,
      },
    });
    expect(r.ok).toBe(true);
    salesOrderItemId = r.body.order_items_id;
  });

  it("Sales can READ order_items", async () => {
    const r = await api("/api/select", {
      collection: "order_items",
      session_id: salesAccount.body.session_id,
      filter: `order_items_id='${salesOrderItemId}'`,
      expand: "",
      order: "",
      pagination: { limit: 5, offset: 0 },
    });
    expect(r.ok).toBe(true);
    expect(Array.isArray(r.body.data)).toBe(true);
  });

  it("Sales can UPDATE order_item", async () => {
    const r = await api("/api/save", {
      collection: "order_items",
      session_id: salesAccount.body.session_id,
      action: "update",
      data: { order_items_id: salesOrderItemId, quantity_ordered: 10 },
    });
    expect(r.status).toBe(200);
  });

  it("Sales can DELETE order_item", async () => {
    const r = await api("/api/save", {
      collection: "order_items",
      session_id: salesAccount.body.session_id,
      action: "delete",
      data: { order_items_id: salesOrderItemId },
    });
    expect(r.status).toBe(200);
  });

  // Warehouse: can READ, cannot CREATE/UPDATE/DELETE
  it("Warehouse cannot CREATE order_item (403)", async () => {
    const r = await api("/api/save", {
      collection: "order_items",
      session_id: warehouseAccount.body.session_id,
      action: "insert",
      data: {
        order_id: oiOrderId,
        product_id: oiProductId,
        quantity_ordered: 1,
        item_price: 3.5,
      },
    });
    expect(r.status).toBe(403);
  });

  it("Warehouse can READ order_items", async () => {
    const r = await api("/api/select", {
      collection: "order_items",
      session_id: warehouseAccount.body.session_id,
      filter: `order_id='${oiOrderId}'`,
      expand: "",
      order: "",
      pagination: { limit: 5, offset: 0 },
    });
    expect(r.ok).toBe(true);
    expect(Array.isArray(r.body.data)).toBe(true);
  });

  it("Warehouse cannot UPDATE order_item (403)", async () => {
    const r = await api("/api/save", {
      collection: "order_items",
      session_id: warehouseAccount.body.session_id,
      action: "update",
      data: { order_items_id: orderItemId, quantity_ordered: 99 },
    });
    expect(r.status).toBe(403);
  });

  it("Warehouse cannot DELETE order_item (403)", async () => {
    const r = await api("/api/save", {
      collection: "order_items",
      session_id: warehouseAccount.body.session_id,
      action: "delete",
      data: { order_items_id: orderItemId },
    });
    expect(r.status).toBe(403);
  });
});
