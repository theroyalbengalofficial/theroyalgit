import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3e3;
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  const DATA_DIR = path.resolve(__dirname, "data");
  const STORAGE_DIR = path.resolve(__dirname, "storage");
  const PRODUCTS_STORAGE_DIR = path.join(STORAGE_DIR, "products");
  const ORDERS_STORAGE_DIR = path.join(STORAGE_DIR, "orders");
  const PRODUCTS_FILE = fs.existsSync(path.join(STORAGE_DIR, "products.json")) ? path.join(STORAGE_DIR, "products.json") : path.join(DATA_DIR, "products.json");
  const ORDERS_FILE = fs.existsSync(path.join(STORAGE_DIR, "orders.json")) ? path.join(STORAGE_DIR, "orders.json") : path.join(DATA_DIR, "orders.json");
  const CUSTOMERS_FILE = fs.existsSync(path.join(STORAGE_DIR, "customers.json")) ? path.join(STORAGE_DIR, "customers.json") : path.join(DATA_DIR, "customers.json");
  const SOCIAL_FILE = path.join(DATA_DIR, "social.json");
  const STORAGE_CONFIG_FILE = path.join(DATA_DIR, "server_storage_config.json");
  const AUTH_CONFIG_FILE = path.join(DATA_DIR, "auth_config.json");
  [DATA_DIR, STORAGE_DIR, PRODUCTS_STORAGE_DIR, ORDERS_STORAGE_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  app.use("/storage", express.static(STORAGE_DIR, {
    maxAge: "7d",
    setHeaders: (res, filePath) => {
      if (filePath.match(/\.(webp|jpg|jpeg|png|gif|mp4|webm)$/i)) {
        res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      }
    }
  }));
  const PUBLIC_DIR = path.resolve(__dirname, "public");
  if (fs.existsSync(PUBLIC_DIR)) {
    app.use(express.static(PUBLIC_DIR, {
      maxAge: "7d",
      setHeaders: (res, filePath) => {
        if (filePath.match(/\.(mp4|webm)$/i)) {
          res.setHeader("Cache-Control", "public, max-age=604800");
          res.setHeader("Accept-Ranges", "bytes");
        } else if (filePath.match(/\.(webp|jpg|jpeg|png|svg|ico)$/i)) {
          res.setHeader("Cache-Control", "public, max-age=604800, immutable");
        }
      }
    }));
  }
  const readJson = (filePath, fallback) => {
    try {
      if (fs.existsSync(filePath)) {
        const text = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(text);
      }
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err);
    }
    return fallback;
  };
  const writeJson = (filePath, data) => {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      if (filePath.includes("products.json")) {
        const mirrorPath = filePath.includes("storage") ? path.join(DATA_DIR, "products.json") : path.join(STORAGE_DIR, "products.json");
        fs.writeFileSync(mirrorPath, JSON.stringify(data, null, 2), "utf-8");
      } else if (filePath.includes("orders.json")) {
        const mirrorPath = filePath.includes("storage") ? path.join(DATA_DIR, "orders.json") : path.join(STORAGE_DIR, "orders.json");
        fs.writeFileSync(mirrorPath, JSON.stringify(data, null, 2), "utf-8");
      } else if (filePath.includes("customers.json")) {
        const mirrorPath = filePath.includes("storage") ? path.join(DATA_DIR, "customers.json") : path.join(STORAGE_DIR, "customers.json");
        fs.writeFileSync(mirrorPath, JSON.stringify(data, null, 2), "utf-8");
      }
    } catch (err) {
      console.error(`Error writing ${filePath}:`, err);
    }
  };
  const getStorageConfig = () => {
    return readJson(STORAGE_CONFIG_FILE, {
      enabled: false,
      serverType: "php_webhook",
      // 'php_webhook' | 'rest_api' | 'ftp' | 'vps_node'
      serverUrl: "",
      authToken: "",
      remoteBasePath: "products",
      autoSyncOnCreate: true,
      lastTestStatus: null,
      lastTestTimestamp: null
    });
  };
  const saveProductToFolder = async (product) => {
    try {
      const safeFolder = (product.styleCode || product.id || `TRB-${Date.now()}`).toString().replace(/[^a-zA-Z0-9_\-\.]/g, "_");
      const productDir = path.join(PRODUCTS_STORAGE_DIR, safeFolder);
      if (!fs.existsSync(productDir)) {
        fs.mkdirSync(productDir, { recursive: true });
      }
      const createdFiles = [];
      if (product.image && typeof product.image === "string") {
        const base64Match = product.image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (base64Match) {
          let ext = base64Match[1].toLowerCase();
          if (ext === "jpeg") ext = "jpg";
          const imageFileName = `image.${ext}`;
          const imageFilePath = path.join(productDir, imageFileName);
          fs.writeFileSync(imageFilePath, Buffer.from(base64Match[2], "base64"));
          createdFiles.push(imageFileName);
          product.image = `/storage/products/${safeFolder}/${imageFileName}`;
        } else {
          fs.writeFileSync(path.join(productDir, "image_source.txt"), product.image, "utf-8");
          createdFiles.push("image_source.txt");
        }
      }
      const jsonPath = path.join(productDir, "product.json");
      fs.writeFileSync(jsonPath, JSON.stringify(product, null, 2), "utf-8");
      createdFiles.push("product.json");
      const infoText = [
        "========================================================",
        "THE ROYAL BENGAL - PRODUCT SPECIFICATION ARCHIVE",
        "========================================================",
        `Product Name:    ${product.name || "N/A"}`,
        `Style Code / SKU: ${product.styleCode || safeFolder}`,
        `Category:        ${product.category || "N/A"}`,
        `Price:           ${product.price || 0} ${product.currency || "Tk."}`,
        `Stock:           ${product.stock || 0} units`,
        `Available Sizes: ${Array.isArray(product.sizes) ? product.sizes.join(", ") : "N/A"}`,
        `Primary Color:   ${product.color || "N/A"}`,
        `Fabric:          ${product.fabric || "N/A"}`,
        `Created / Updated: ${(/* @__PURE__ */ new Date()).toISOString()}`,
        "--------------------------------------------------------",
        "Description:",
        product.description || "No description provided.",
        "========================================================"
      ].join("\n");
      fs.writeFileSync(path.join(productDir, "info.txt"), infoText, "utf-8");
      createdFiles.push("info.txt");
      let remoteSyncResult = { configured: false };
      const config = getStorageConfig();
      if (config.enabled && config.serverUrl && config.autoSyncOnCreate !== false) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8e3);
          const remoteUrl = config.serverUrl.includes("?") ? `${config.serverUrl}&action=create_product_folder` : `${config.serverUrl}?action=create_product_folder`;
          const headers = {
            "Content-Type": "application/json"
          };
          if (config.authToken) {
            headers["Authorization"] = `Bearer ${config.authToken}`;
            headers["X-API-Key"] = config.authToken;
          }
          const response = await fetch(remoteUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({
              action: "create_product_folder",
              folder: safeFolder,
              remoteBasePath: config.remoteBasePath || "products",
              product,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            }),
            signal: controller.signal
          });
          clearTimeout(timeout);
          const remoteData = await response.json().catch(() => ({}));
          remoteSyncResult = {
            configured: true,
            status: response.ok ? "success" : "error",
            statusCode: response.status,
            remoteUrl: config.serverUrl,
            response: remoteData
          };
        } catch (remoteErr) {
          console.warn("[Storage] Remote purchased server sync error:", remoteErr.message);
          remoteSyncResult = {
            configured: true,
            status: "failed",
            error: remoteErr.message
          };
        }
      }
      return {
        success: true,
        folder: safeFolder,
        folderPath: `storage/products/${safeFolder}`,
        files: createdFiles,
        remoteSync: remoteSyncResult
      };
    } catch (err) {
      console.error("[Storage] Error creating product folder:", err);
      return { success: false, error: err.message };
    }
  };
  const saveOrderToFolder = async (order) => {
    try {
      const orderNum = order.orderId || order.orderNumber || `TRB-${Date.now()}`;
      const safeFolder = orderNum.toString().replace(/[^a-zA-Z0-9_\-\.]/g, "_");
      const orderDir = path.join(ORDERS_STORAGE_DIR, safeFolder);
      if (!fs.existsSync(orderDir)) {
        fs.mkdirSync(orderDir, { recursive: true });
      }
      const createdFiles = [];
      const jsonPath = path.join(orderDir, "order.json");
      fs.writeFileSync(jsonPath, JSON.stringify(order, null, 2), "utf-8");
      createdFiles.push("order.json");
      const items = Array.isArray(order.items) ? order.items : [];
      const itemsText = items.map((it, idx) => {
        const pName = it.product?.name || it.name || "Product";
        const pCode = it.product?.styleCode || it.styleCode || "N/A";
        const pSize = it.selectedSize || it.size || "Standard";
        const pColor = it.selectedColor || it.color || "Standard";
        const pQty = it.quantity || it.qty || 1;
        const pPrice = it.price || it.product?.price || 0;
        const sub = pQty * pPrice;
        return `  ${idx + 1}. ${pName} (Style Code: ${pCode})
     Size: ${pSize} | Color: ${pColor} | Qty: ${pQty} x Tk. ${Number(pPrice).toLocaleString()} = Tk. ${Number(sub).toLocaleString()}`;
      }).join("\n");
      const invoiceText = [
        "========================================================",
        "THE ROYAL BENGAL - OFFICIAL CUSTOMER ORDER INVOICE",
        "========================================================",
        `Order Number:     ${orderNum}`,
        `Date & Time:      ${order.createdAt || (/* @__PURE__ */ new Date()).toISOString()}`,
        `Order Status:     ${order.status || "Pending"}`,
        `Payment Method:   ${(order.paymentMethod || "cod").toUpperCase()} (Cash on Delivery)`,
        "--------------------------------------------------------",
        "CUSTOMER DETAILS:",
        `Customer Name:    ${order.customerName || "N/A"}`,
        `Phone Number:     ${order.phone || "N/A"}`,
        `Email Address:    ${order.email || "N/A"}`,
        `Delivery Method:  ${order.deliveryMethod || "inside-dhaka"}`,
        `District / Zone:  ${order.district || "Dhaka"}`,
        `Delivery Address: ${order.address || "N/A"}`,
        "--------------------------------------------------------",
        "ORDERED ITEMS:",
        itemsText || "  No items detailed",
        "--------------------------------------------------------",
        `Subtotal:         Tk. ${Number(order.subtotal || 0).toLocaleString()}`,
        `Discount:         Tk. ${Number(order.discount || 0).toLocaleString()}`,
        `Delivery Fee:     Tk. ${Number(order.shipping || 0).toLocaleString()}`,
        `TOTAL PAYABLE:    Tk. ${Number(order.total || 0).toLocaleString()}`,
        "========================================================"
      ].join("\n");
      fs.writeFileSync(path.join(orderDir, "receipt.txt"), invoiceText, "utf-8");
      createdFiles.push("receipt.txt");
      let remoteSyncResult = { configured: false };
      const config = getStorageConfig();
      if (config.enabled && config.serverUrl) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8e3);
          const remoteUrl = config.serverUrl.includes("?") ? `${config.serverUrl}&action=save_order` : `${config.serverUrl}?action=save_order`;
          const headers = {
            "Content-Type": "application/json"
          };
          if (config.authToken) {
            headers["Authorization"] = `Bearer ${config.authToken}`;
            headers["X-API-Key"] = config.authToken;
          }
          const response = await fetch(remoteUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({
              action: "save_order",
              order,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            }),
            signal: controller.signal
          });
          clearTimeout(timeout);
          const remoteData = await response.json().catch(() => ({}));
          console.log("[Order] Remote server sync response:", response.status, remoteData);
          remoteSyncResult = {
            configured: true,
            status: response.ok ? "success" : "error",
            statusCode: response.status,
            remoteUrl: config.serverUrl,
            response: remoteData
          };
        } catch (remoteErr) {
          console.warn("[Order] Remote purchased server sync error:", remoteErr.message);
          remoteSyncResult = {
            configured: true,
            status: "failed",
            error: remoteErr.message
          };
        }
      }
      return {
        success: true,
        folder: safeFolder,
        folderPath: `storage/orders/${safeFolder}`,
        files: createdFiles,
        remoteSync: remoteSyncResult
      };
    } catch (err) {
      console.error("[Storage] Error creating order folder:", err);
      return { success: false, error: err.message };
    }
  };
  const DEFAULT_MEASUREMENTS = [
    { size: "S", length: 27.5, chest: 38, sleeveLength: 8 },
    { size: "M", length: 28, chest: 41, sleeveLength: 8.5 },
    { size: "L", length: 29.5, chest: 42, sleeveLength: 9 },
    { size: "XL", length: 30, chest: 44, sleeveLength: 9.5 },
    { size: "2XL", length: 31, chest: 46, sleeveLength: 10 },
    { size: "3XL", length: 32, chest: 48, sleeveLength: 10.5 }
  ];
  app.get("/api/products", (req, res) => {
    const raw = readJson(PRODUCTS_FILE, []);
    const products = Array.isArray(raw) ? raw.map((p) => ({
      ...p,
      colorOptions: Array.isArray(p.colorOptions) && p.colorOptions.length > 0 ? p.colorOptions : [{ name: p.color || "Signature Orange", hex: "#F25C05" }],
      sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ["S", "M", "L", "XL", "2XL"],
      gallery: Array.isArray(p.gallery) && p.gallery.length > 0 ? p.gallery : [p.image || ""],
      measurements: Array.isArray(p.measurements) && p.measurements.length > 0 ? p.measurements : DEFAULT_MEASUREMENTS
    })) : [];
    res.json({ success: true, products });
  });
  app.post("/api/products", async (req, res) => {
    const newProduct = req.body;
    if (!newProduct || !newProduct.name) {
      return res.status(400).json({ success: false, message: "Invalid product data" });
    }
    const storageResult = await saveProductToFolder(newProduct);
    const products = readJson(PRODUCTS_FILE, []);
    const existingIndex = products.findIndex((p) => p.id === newProduct.id);
    if (existingIndex >= 0) {
      products[existingIndex] = newProduct;
    } else {
      products.unshift(newProduct);
    }
    writeJson(PRODUCTS_FILE, products);
    res.json({
      success: true,
      product: newProduct,
      count: products.length,
      storage: storageResult
    });
  });
  app.put("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const products = readJson(PRODUCTS_FILE, []);
    const index = products.findIndex((p) => p.id === id);
    if (index >= 0) {
      const mergedProduct = { ...products[index], ...updates };
      const storageResult = await saveProductToFolder(mergedProduct);
      products[index] = mergedProduct;
      writeJson(PRODUCTS_FILE, products);
      res.json({
        success: true,
        product: products[index],
        storage: storageResult
      });
    } else {
      res.status(404).json({ success: false, message: "Product not found" });
    }
  });
  app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    let products = readJson(PRODUCTS_FILE, []);
    const targetProduct = products.find((p) => p.id === id);
    const initialCount = products.length;
    products = products.filter((p) => p.id !== id);
    writeJson(PRODUCTS_FILE, products);
    if (targetProduct) {
      const safeFolder = (targetProduct.styleCode || targetProduct.id).toString().replace(/[^a-zA-Z0-9_\-\.]/g, "_");
      const productDir = path.join(PRODUCTS_STORAGE_DIR, safeFolder);
      if (fs.existsSync(productDir)) {
        try {
          fs.rmSync(productDir, { recursive: true, force: true });
        } catch (rmErr) {
          console.warn("[Storage] Could not remove folder:", rmErr);
        }
      }
      const config = getStorageConfig();
      if (config.enabled && config.serverUrl) {
        try {
          fetch(`${config.serverUrl}?action=delete_product_folder`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...config.authToken ? { Authorization: `Bearer ${config.authToken}` } : {}
            },
            body: JSON.stringify({ action: "delete_product_folder", folder: safeFolder })
          }).catch(() => {
          });
        } catch (e) {
        }
      }
    }
    res.json({ success: true, count: products.length, deleted: initialCount !== products.length });
  });
  app.post("/api/products/sync", async (req, res) => {
    const { products: incoming, overwrite } = req.body;
    if (Array.isArray(incoming)) {
      let finalProducts = incoming;
      if (!overwrite) {
        const current = readJson(PRODUCTS_FILE, []);
        const map = /* @__PURE__ */ new Map();
        current.forEach((p) => {
          if (p && p.id) map.set(p.id, p);
        });
        incoming.forEach((p) => {
          if (p && p.id) map.set(p.id, p);
        });
        finalProducts = Array.from(map.values());
      }
      writeJson(PRODUCTS_FILE, finalProducts);
      for (const p of finalProducts) {
        if (p && p.name) {
          await saveProductToFolder(p);
        }
      }
      return res.json({ success: true, products: finalProducts, count: finalProducts.length });
    }
    res.json({ success: true, products: readJson(PRODUCTS_FILE, []), count: 0 });
  });
  app.get("/api/storage/info", (req, res) => {
    try {
      const config = getStorageConfig();
      let folderList = [];
      if (fs.existsSync(PRODUCTS_STORAGE_DIR)) {
        folderList = fs.readdirSync(PRODUCTS_STORAGE_DIR).filter((f) => {
          return fs.statSync(path.join(PRODUCTS_STORAGE_DIR, f)).isDirectory();
        });
      }
      res.json({
        success: true,
        local: {
          active: true,
          basePath: "storage/products",
          absolutePath: PRODUCTS_STORAGE_DIR,
          foldersCount: folderList.length,
          folders: folderList
        },
        external: {
          enabled: !!config.enabled,
          serverType: config.serverType || "php_webhook",
          serverUrl: config.serverUrl || "",
          hasAuthToken: !!config.authToken,
          remoteBasePath: config.remoteBasePath || "products",
          autoSyncOnCreate: config.autoSyncOnCreate !== false,
          lastTestStatus: config.lastTestStatus,
          lastTestTimestamp: config.lastTestTimestamp
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/storage/folders", async (req, res) => {
    try {
      const folderMap = /* @__PURE__ */ new Map();
      if (fs.existsSync(PRODUCTS_STORAGE_DIR)) {
        const entries = fs.readdirSync(PRODUCTS_STORAGE_DIR);
        for (const entry of entries) {
          const entryPath = path.join(PRODUCTS_STORAGE_DIR, entry);
          const stat = fs.statSync(entryPath);
          if (stat.isDirectory()) {
            const files = fs.readdirSync(entryPath);
            const hasJson = files.includes("product.json");
            let productPreview = null;
            if (hasJson) {
              try {
                productPreview = JSON.parse(
                  fs.readFileSync(path.join(entryPath, "product.json"), "utf-8")
                );
              } catch (e) {
              }
            }
            folderMap.set(entry, {
              name: entry,
              path: `/storage/products/${entry}`,
              files: files.map((file) => {
                const fStat = fs.statSync(path.join(entryPath, file));
                return {
                  name: file,
                  size: fStat.size,
                  modified: fStat.mtime,
                  url: `/storage/products/${entry}/${file}`
                };
              }),
              hasProductJson: hasJson,
              productPreview: productPreview ? {
                id: productPreview.id,
                name: productPreview.name,
                price: productPreview.price,
                styleCode: productPreview.styleCode,
                stock: productPreview.stock,
                category: productPreview.category
              } : null,
              modified: stat.mtime
            });
          }
        }
      }
      const config = getStorageConfig();
      if (config.enabled && config.serverUrl) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);
          const remoteUrl = config.serverUrl.includes("?") ? `${config.serverUrl}&action=folders` : `${config.serverUrl}?action=folders`;
          const headers = { "Content-Type": "application/json" };
          if (config.authToken) {
            headers["Authorization"] = `Bearer ${config.authToken}`;
            headers["X-API-Key"] = config.authToken;
          }
          const resp = await fetch(remoteUrl, { headers, signal: controller.signal });
          clearTimeout(timeout);
          if (resp.ok) {
            const rData = await resp.json().catch(() => ({}));
            if (Array.isArray(rData.folders)) {
              for (const rf of rData.folders) {
                const name = typeof rf === "string" ? rf : rf.name || rf.styleCode || rf.folder || "product";
                if (!folderMap.has(name)) {
                  folderMap.set(name, {
                    name,
                    path: typeof rf === "object" && rf.path ? rf.path : `/storage/products/${name}`,
                    files: typeof rf === "object" && Array.isArray(rf.files) ? rf.files : [{ name: "product.json", size: 1024, modified: (/* @__PURE__ */ new Date()).toISOString(), url: `/storage/products/${name}/product.json` }],
                    hasProductJson: typeof rf === "object" && typeof rf.hasProductJson === "boolean" ? rf.hasProductJson : true,
                    productPreview: typeof rf === "object" ? rf.productPreview : null,
                    modified: typeof rf === "object" && rf.modified ? rf.modified : (/* @__PURE__ */ new Date()).toISOString()
                  });
                }
              }
            }
          }
        } catch (e) {
        }
      }
      const allFolders = Array.from(folderMap.values());
      res.json({ success: true, count: allFolders.length, folders: allFolders });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/storage/config", (req, res) => {
    res.json({ success: true, config: getStorageConfig() });
  });
  app.post("/api/storage/config", (req, res) => {
    const current = getStorageConfig();
    const updated = {
      ...current,
      ...req.body
    };
    writeJson(STORAGE_CONFIG_FILE, updated);
    res.json({ success: true, message: "Server storage configuration saved successfully", config: updated });
  });
  app.post("/api/storage/test-connection", async (req, res) => {
    const { serverUrl, authToken, serverType } = req.body;
    const targetUrl = serverUrl || getStorageConfig().serverUrl;
    const token = authToken !== void 0 ? authToken : getStorageConfig().authToken;
    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        message: "No server URL provided. Please enter your purchased server or webhook URL."
      });
    }
    try {
      const pingUrl = targetUrl.includes("?") ? `${targetUrl}&action=ping` : `${targetUrl}?action=ping`;
      const startTime = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9e3);
      const headers = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["X-API-Key"] = token;
      }
      const response = await fetch(pingUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "ping",
          test: true,
          client: "The Royal Bengal Store Admin",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const latency = Date.now() - startTime;
      const textResponse = await response.text();
      let parsedData = null;
      try {
        parsedData = JSON.parse(textResponse);
      } catch (e) {
        parsedData = { raw: textResponse.slice(0, 300) };
      }
      const isSuccess = response.ok && (!parsedData || parsedData.success !== false);
      const currentConfig = getStorageConfig();
      currentConfig.lastTestStatus = isSuccess ? "connected" : "error";
      currentConfig.lastTestTimestamp = (/* @__PURE__ */ new Date()).toISOString();
      writeJson(STORAGE_CONFIG_FILE, currentConfig);
      res.json({
        success: isSuccess,
        statusCode: response.status,
        latencyMs: latency,
        message: isSuccess ? `Connection verified! Your purchased server responded in ${latency}ms and is ready to store product folders.` : `Server returned HTTP ${response.status}: ${textResponse.slice(0, 150)}`,
        data: parsedData
      });
    } catch (err) {
      const currentConfig = getStorageConfig();
      currentConfig.lastTestStatus = "failed";
      currentConfig.lastTestTimestamp = (/* @__PURE__ */ new Date()).toISOString();
      writeJson(STORAGE_CONFIG_FILE, currentConfig);
      res.status(502).json({
        success: false,
        message: `Failed to connect to ${targetUrl}: ${err.message}. Please check if the URL is reachable and CORS is enabled.`
      });
    }
  });
  app.post("/api/storage/sync-all", async (req, res) => {
    try {
      const products = readJson(PRODUCTS_FILE, []);
      const results = [];
      for (const p of products) {
        if (p && p.name) {
          const resFolder = await saveProductToFolder(p);
          results.push({ id: p.id, styleCode: p.styleCode, ...resFolder });
        }
      }
      res.json({
        success: true,
        message: `Processed ${results.length} products. Folders created on server storage.`,
        created: results
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  const INQUIRIES_FILE = path.join(__dirname, "data", "inquiries.json");
  app.post("/api/contact", (req, res) => {
    try {
      const { name, email, message } = req.body;
      const inquiries = readJson(INQUIRIES_FILE, []);
      const newInquiry = {
        id: `inq_${Date.now()}`,
        name: name || "",
        email: email || "",
        message: message || "",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      inquiries.unshift(newInquiry);
      writeJson(INQUIRIES_FILE, inquiries);
      res.json({ success: true, message: "Message sent successfully" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/orders", async (req, res) => {
    let orders = readJson(ORDERS_FILE, []);
    const config = getStorageConfig();
    if (config.enabled && config.serverUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const remoteUrl = config.serverUrl.includes("?") ? `${config.serverUrl}&action=orders` : `${config.serverUrl}?action=orders`;
        const headers = { "Content-Type": "application/json" };
        if (config.authToken) {
          headers["Authorization"] = `Bearer ${config.authToken}`;
          headers["X-API-Key"] = config.authToken;
        }
        const resp = await fetch(remoteUrl, { headers, signal: controller.signal });
        clearTimeout(timeout);
        if (resp.ok) {
          const rData = await resp.json().catch(() => ({}));
          if (rData.success && Array.isArray(rData.orders) && rData.orders.length > 0) {
            const map = /* @__PURE__ */ new Map();
            orders.forEach((o) => {
              const k = o.orderId || o.orderNumber;
              if (k) map.set(k, o);
            });
            rData.orders.forEach((ro) => {
              const k = ro.orderId || ro.orderNumber;
              if (k) {
                map.set(k, { ...map.get(k) || {}, ...ro });
              }
            });
            orders = Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
            writeJson(ORDERS_FILE, orders);
          }
        }
      } catch (err) {
      }
    }
    res.json({ success: true, orders, count: orders.length });
  });
  app.post("/api/orders", async (req, res) => {
    const newOrder = req.body;
    if (!newOrder || typeof newOrder !== "object") {
      return res.status(400).json({ success: false, message: "Invalid order data provided" });
    }
    const orderNumber = newOrder.orderId || newOrder.orderNumber || `TRB-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const finalOrder = {
      ...newOrder,
      orderId: orderNumber,
      orderNumber,
      status: newOrder.status || "Pending",
      createdAt: newOrder.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    };
    const storageResult = await saveOrderToFolder(finalOrder);
    const orders = readJson(ORDERS_FILE, []);
    const existingIndex = orders.findIndex(
      (o) => o.orderId === finalOrder.orderId || o.id === finalOrder.orderId
    );
    if (existingIndex >= 0) {
      orders[existingIndex] = finalOrder;
    } else {
      orders.unshift(finalOrder);
    }
    writeJson(ORDERS_FILE, orders);
    console.log(`[Order] Placed & Saved to server disk: ${finalOrder.orderId} | Name: ${finalOrder.customerName} | Phone: ${finalOrder.phone} | Total: Tk. ${finalOrder.total}`);
    try {
      const customers = readJson(CUSTOMERS_FILE, []);
      const custId = finalOrder.customerId || `cust-${finalOrder.phone.replace(/[^0-9]/g, "")}`;
      const cIdx = customers.findIndex((c) => c.phone === finalOrder.phone || c.id === custId);
      const customerRecord = {
        id: custId,
        name: finalOrder.customerName,
        phone: finalOrder.phone,
        email: finalOrder.email || "",
        address: finalOrder.address,
        district: finalOrder.district || (finalOrder.deliveryMethod === "inside-dhaka" ? "Dhaka" : "Outside Dhaka"),
        deliveryZone: finalOrder.deliveryMethod || "inside-dhaka",
        provider: finalOrder.authProvider || "guest",
        totalOrders: 1,
        totalSpent: finalOrder.total || 0,
        lastActive: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (cIdx >= 0) {
        customers[cIdx] = {
          ...customers[cIdx],
          name: finalOrder.customerName || customers[cIdx].name,
          phone: finalOrder.phone || customers[cIdx].phone,
          address: finalOrder.address || customers[cIdx].address,
          totalOrders: (customers[cIdx].totalOrders || 1) + 1,
          totalSpent: (customers[cIdx].totalSpent || 0) + (finalOrder.total || 0),
          lastActive: (/* @__PURE__ */ new Date()).toISOString()
        };
      } else {
        customers.unshift(customerRecord);
      }
      writeJson(CUSTOMERS_FILE, customers);
    } catch (custErr) {
      console.warn("[Order] Could not auto-sync customer:", custErr);
    }
    res.json({
      success: true,
      order: finalOrder,
      count: orders.length,
      storage: storageResult
    });
  });
  app.put("/api/orders/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const orders = readJson(ORDERS_FILE, []);
    const idx = orders.findIndex((o) => o.orderId === id || o.id === id);
    if (idx >= 0) {
      orders[idx].status = status;
      writeJson(ORDERS_FILE, orders);
      const safeFolder = id.toString().replace(/[^a-zA-Z0-9_\-\.]/g, "_");
      const orderDir = path.join(ORDERS_STORAGE_DIR, safeFolder);
      if (fs.existsSync(orderDir)) {
        try {
          fs.writeFileSync(path.join(orderDir, "order.json"), JSON.stringify(orders[idx], null, 2), "utf-8");
        } catch (e) {
        }
      }
      const config = getStorageConfig();
      if (config.enabled && config.serverUrl) {
        try {
          fetch(`${config.serverUrl}?action=update_order_status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...config.authToken ? { Authorization: `Bearer ${config.authToken}`, "X-API-Key": config.authToken } : {}
            },
            body: JSON.stringify({ action: "update_order_status", orderId: id, status })
          }).catch(() => {
          });
        } catch (e) {
        }
      }
      res.json({ success: true, order: orders[idx] });
    } else {
      res.status(404).json({ success: false, message: "Order not found" });
    }
  });
  app.delete("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    let orders = readJson(ORDERS_FILE, []);
    const initialCount = orders.length;
    orders = orders.filter((o) => o.orderId !== id && o.id !== id);
    writeJson(ORDERS_FILE, orders);
    const safeFolder = id.toString().replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    const orderDir = path.join(ORDERS_STORAGE_DIR, safeFolder);
    if (fs.existsSync(orderDir)) {
      try {
        fs.rmSync(orderDir, { recursive: true, force: true });
      } catch (e) {
      }
    }
    const config = getStorageConfig();
    if (config.enabled && config.serverUrl) {
      try {
        fetch(`${config.serverUrl}?action=delete_order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...config.authToken ? { Authorization: `Bearer ${config.authToken}`, "X-API-Key": config.authToken } : {}
          },
          body: JSON.stringify({ action: "delete_order", orderId: id })
        }).catch(() => {
        });
      } catch (e) {
      }
    }
    res.json({ success: true, deleted: orders.length !== initialCount, count: orders.length });
  });
  app.get("/api/customers", (req, res) => {
    const customers = readJson(CUSTOMERS_FILE, []);
    res.json({ success: true, customers });
  });
  app.post("/api/customers", (req, res) => {
    const customer = req.body;
    if (!customer || !customer.id) {
      return res.status(400).json({ success: false, message: "Invalid customer data" });
    }
    const customers = readJson(CUSTOMERS_FILE, []);
    const idx = customers.findIndex(
      (c) => c.id === customer.id || customer.email && c.email?.toLowerCase() === customer.email?.toLowerCase()
    );
    if (idx >= 0) {
      customers[idx] = { ...customers[idx], ...customer };
    } else {
      customers.unshift(customer);
    }
    writeJson(CUSTOMERS_FILE, customers);
    res.json({ success: true, customer });
  });
  const DEFAULT_GOOGLE_CLIENT_ID = "670897616734-vh4meatk3ndiqff4anupfoi17qfd10ou.apps.googleusercontent.com";
  const DEFAULT_FACEBOOK_APP_ID = "1076141502060574";
  app.get("/api/auth/config", (req, res) => {
    const saved = readJson(AUTH_CONFIG_FILE, {});
    const envGoogle = process.env.VITE_GOOGLE_CLIENT_ID;
    const envFb = process.env.VITE_FACEBOOK_APP_ID;
    const isPlaceholderGoogle = !envGoogle || envGoogle.includes("your-google-client-id");
    const isPlaceholderFb = !envFb || envFb === "1234567890123456";
    const googleClientId = saved.googleClientId || (!isPlaceholderGoogle ? envGoogle : "") || DEFAULT_GOOGLE_CLIENT_ID;
    const facebookAppId = saved.facebookAppId || (!isPlaceholderFb ? envFb : "") || DEFAULT_FACEBOOK_APP_ID;
    res.json({
      success: true,
      googleClientId,
      facebookAppId,
      hasGoogleConfigured: !!googleClientId,
      hasFacebookConfigured: !!facebookAppId
    });
  });
  app.post("/api/auth/config", (req, res) => {
    const { googleClientId, facebookAppId } = req.body || {};
    const existing = readJson(AUTH_CONFIG_FILE, {});
    const updated = {
      ...existing,
      googleClientId: (googleClientId !== void 0 ? googleClientId : existing.googleClientId || "").trim(),
      facebookAppId: (facebookAppId !== void 0 ? facebookAppId : existing.facebookAppId || "").trim(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    writeJson(AUTH_CONFIG_FILE, updated);
    res.json({ success: true, config: updated });
  });
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || "";
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  };
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body || {};
      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "Message is required." });
      }
      const products = readJson(PRODUCTS_FILE, []);
      const productCatalogSummary = Array.isArray(products) ? products.slice(0, 16).map(
        (p) => `\u2022 ${p.name} (Style: ${p.styleCode}, Category: ${p.category}, Price: ${p.price} ${p.currency || "Tk."}, Color: ${p.color}, Fabric: ${p.fabric || "100% Egyptian Cotton"}, Stock: ${p.stock || "Available"}, Sizes: ${Array.isArray(p.sizes) ? p.sizes.join(", ") : "S, M, L, XL"})`
      ).join("\n") : "The Royal Bengal luxury shirts available.";
      const systemInstruction = `You are "Bengal Concierge", the exclusive luxury AI styling and shopping assistant for "The Royal Bengal" (theroyalbengal.shop).
Your tone is sophisticated, distinguished, polite, and helpful\u2014embodying executive elegance and the spirit of "Made For The Hunt".

Key Brand Knowledge:
1. Product Lines:
   - "Boardroom Hunt" (e.g., Bottle Green, Charcol Violet, Cotton Cloud, Lucite Green, Maroon): Executive command tailored luxury formal shirts. Price: 2,800 - 3,500 Tk.
   - "Daily Hunt" (Office Ready Clouds, Olive, Silver Olive): Premium everyday executive cotton shirts. Price: ~2,000 Tk.
   - "24x7 Band Collar" (Greyscale, Midnight Blue, Charcol Grey, Winter White): Mandarin / band collar tailored shirts. Price: 2,400 - 2,500 Tk.
   - "Signature Hunt" (Butterscotch Caramel, Cotton Cream, Blue Sky): Pure Egyptian cotton statement pieces. Price: 2,800 Tk.
2. Fabric & Craft:
   - 100% Giza Egyptian Long-Staple Cotton, high-density weave, mother-of-pearl buttons, single-needle tailoring, export QC passed.
3. Delivery & Guarantees:
   - 2-Hour Express Delivery inside Dhaka city.
   - 1-Month Hassle-Free Exchange guarantee.
   - Cash on Delivery (COD), bKash, and Nagad payment options.
4. Current Products in Catalog:
${productCatalogSummary}

Guidelines:
- Recommend specific shirts based on customer preferences, occasions (business meeting, evening gala, casual elegance, weddings), or color tastes.
- Provide size recommendations if asked (sizes S, M, L, XL, 2XL, 3XL with tailored ergonomic fits).
- Mention that customers can click any shirt in the catalog to view high-definition fabric weaves with the 2.5x Loupe zoom tool.
- Keep responses concise, elegant, clear, and styled with bullet points where appropriate. Do not invent products outside the collection.`;
      console.log("[Chat API] Received message:", message.trim());
      const ai = getGeminiClient();
      const contents = [];
      if (Array.isArray(history)) {
        for (const item of history) {
          if (item && item.text && (item.role === "user" || item.role === "model")) {
            contents.push({
              role: item.role,
              parts: [{ text: item.text }]
            });
          }
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: message.trim() }]
      });
      const candidateModels = ["gemini-flash-latest", "gemini-3.8-flash", "gemini-3.1-flash-lite"];
      let response = null;
      let lastError = null;
      for (const modelName of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7
            }
          });
          if (response && response.text) {
            break;
          }
        } catch (err) {
          lastError = err;
          console.warn(`[Chat API] Model ${modelName} error:`, err.message?.slice(0, 100));
        }
      }
      if (!response || !response.text) {
        throw lastError || new Error("No response generated from candidate models.");
      }
      const replyText = response.text || "Welcome to The Royal Bengal. How may I assist your style selection today?";
      return res.json({
        success: true,
        reply: replyText
      });
    } catch (err) {
      console.error("[Chat API Error]:", err);
      return res.status(500).json({
        error: "Failed to generate response from Gemini AI.",
        details: err.message
      });
    }
  });
  app.get("/api/social-links", (req, res) => {
    const links = readJson(SOCIAL_FILE, null);
    res.json({ success: true, links });
  });
  app.post("/api/social-links", (req, res) => {
    const links = req.body;
    writeJson(SOCIAL_FILE, links);
    res.json({ success: true, links });
  });
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "The Royal Bengal Full-Stack Server",
      storageEngine: "Physical Product Folders + Remote Server Sync",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`> Full-stack server running on http://0.0.0.0:${PORT}`);
    console.log(`> Product folders storage mounted at: ${PRODUCTS_STORAGE_DIR}`);
  });
}
startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
