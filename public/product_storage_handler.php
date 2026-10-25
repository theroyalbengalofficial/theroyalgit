<?php
/**
 * ==============================================================================
 * THE ROYAL BENGAL - REST API STORAGE & PRODUCT / ORDER PERSISTENCE HANDLER
 * ==============================================================================
 * 
 * Supports:
 * - GET    /api/products           -> List all products (auto-seeds if empty)
 * - GET    /api/products/{id}      -> Get single product
 * - POST   /api/products           -> Create new product
 * - PUT    /api/products/{id}      -> Update existing product & physical folder
 * - DELETE /api/products/{id}      -> Delete product & physical folder
 * - POST   /api/products/sync      -> Full sync / overwrite of product catalog
 * - POST   /api/products/reset     -> Reset catalog to official Royal Bengal default
 * - GET    /api/orders             -> List all customer orders
 * - GET    /api/orders/{id}        -> Get single customer order
 * - POST   /api/orders             -> Place customer order & generate receipt
 * - PUT    /api/orders/{id}        -> Update order status (Pending, Shipped, etc.)
 * - DELETE /api/orders/{id}        -> Delete order & order folder
 * - GET    /api/customers          -> List registered customer accounts
 * - GET    /api/storage/info       -> Storage disk space and statistics
 * - GET    /api/storage/folders    -> Detailed folder inspection
 * - GET/POST /api/storage/config   -> Read/write server storage configuration
 * - POST   /api/storage/test-connection -> Diagnostic ping
 * ==============================================================================
 */

// Allow cross-origin requests from storefront, admin panel, and mobile browsers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, X-HTTP-Method-Override");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if (strtoupper($_SERVER["REQUEST_METHOD"] ?? "") === "OPTIONS") {
    http_response_code(200);
    exit(0);
}

// Storage directory layout
$STORAGE_DIR = __DIR__ . "/storage";
$STORAGE_BASE_DIR = $STORAGE_DIR . "/products";
$ORDERS_BASE_DIR = $STORAGE_DIR . "/orders";
$ORDERS_FILE = $STORAGE_DIR . "/orders.json";
$CUSTOMERS_FILE = $STORAGE_DIR . "/customers.json";
$CONFIG_FILE = $STORAGE_DIR . "/config.json";
$PRODUCTS_FILE = $STORAGE_DIR . "/products.json";

// Ensure storage base directories exist
foreach ([$STORAGE_DIR, $STORAGE_BASE_DIR, $ORDERS_BASE_DIR] as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

// Parse request payload & URL parameters
$rawInput = file_get_contents("php://input");
$inputData = json_decode($rawInput, true);
if (!is_array($inputData)) {
    $inputData = $_POST ?: [];
}

// Method detection with HTTP override support
$method = strtoupper($_SERVER["REQUEST_METHOD"] ?? "GET");
if ($method === "POST") {
    if (!empty($_SERVER["HTTP_X_HTTP_METHOD_OVERRIDE"])) {
        $method = strtoupper($_SERVER["HTTP_X_HTTP_METHOD_OVERRIDE"]);
    } else if (!empty($inputData["_method"])) {
        $method = strtoupper($inputData["_method"]);
    }
}

// Parse endpoint & resource parameters
$endpoint = trim($_GET["endpoint"] ?? "", "/");
if (empty($endpoint)) {
    $requestPath = parse_url($_SERVER["REQUEST_URI"] ?? "", PHP_URL_PATH);
    if (preg_match("#(?:^|/)api/(.+)$#", $requestPath, $m)) {
        $endpoint = trim($m[1], "/");
    }
}

$endpointParts = !empty($endpoint) ? explode("/", $endpoint) : [];
$resource = strtolower($endpointParts[0] ?? ($_GET["action"] ?? ""));
$subResource = $endpointParts[1] ?? "";
$paramId = $subResource ?: ($_GET["id"] ?? ($inputData["id"] ?? ($inputData["orderId"] ?? "")));

// Check for action aliases
if (empty($resource)) {
    if (isset($inputData["order"]) || isset($inputData["orderNumber"])) {
        $resource = "orders";
    } else if (isset($inputData["product"]) || isset($inputData["styleCode"])) {
        $resource = "products";
    }
}

// ------------------------------------------------------------------------------
// EMBEDDED SEED CATALOG (Fallback if storage/products.json is missing or empty)
// ------------------------------------------------------------------------------
function getInitialCatalog() {
    static $cached = null;
    if ($cached !== null) return $cached;
    $seedJson = '[{"name":"Boardroom Hunt Bottle Green","subtitle":"Executive Tailored Series","styleCode":"TRB-001","category":"boardroom","price":2800,"currency":"Tk.","stock":18,"sizeStock":{"M":5,"L":7,"XL":6},"description":"Crafted for distinguished command and tailored precision.","fabric":"100% cotton","color":"Bottle Green","colorOptions":[{"name":"Bottle Green","hex":"#F25C05"}],"image":"/assets/Boardroom Hunt Bottle Green - 2800.webp","sizes":["M","L","XL"],"gallery":["/assets/Boardroom Hunt Bottle Green - 2800.webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-muozqipz-nrmq"},{"name":"Boardroom Hunt Charcol Violet","subtitle":"Executive Tailored Series","styleCode":"TRB-002","category":"boardroom","price":2800,"currency":"Tk.","stock":12,"sizeStock":{"M":5,"L":4,"XL":3},"description":"Crafted for distinguished command and tailored precision.","fabric":"100% Cotton","color":"Charcoal Violet","colorOptions":[{"name":"Charcoal Violet","hex":"#F25C05"}],"image":"/assets/Boardroom Hunt Charcol Violet - 2800.webp","sizes":["M","L","XL"],"gallery":["/assets/Boardroom Hunt Charcol Violet - 2800.webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-muozuhl7-jksm"},{"name":"Boardroom Hunt Cotton Cloud","subtitle":"Executive Tailored Series","styleCode":"TRB-003","category":"boardroom","price":2800,"currency":"Tk.","stock":25,"sizeStock":{"M":10,"L":10,"XL":5},"description":"Crafted for distinguished command and tailored precision.","fabric":"100% Cotton","color":"Cotton Cloud","colorOptions":[{"name":"Cotton Cloud","hex":"#F25C05"}],"image":"/assets/Boardroom Hunt Cotton Cloud - 2800.webp","sizes":["M","L","XL"],"gallery":["/assets/Boardroom Hunt Cotton Cloud - 2800.webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-muozx1fa-sozm"},{"name":"Boardroom Hunt Lucite Green","subtitle":"Executive Tailored Series","styleCode":"TRB-004","category":"boardroom","price":2800,"currency":"Tk.","stock":8,"sizeStock":{"M":3,"L":4,"XL":1},"description":"Crafted for distinguished command and tailored precision.","fabric":"100% Cotton","color":"Lucite Green","colorOptions":[{"name":"Lucite Green","hex":"#F25C05"}],"image":"/assets/Boardroom Hunt Lucite Green - 2800.webp","sizes":["M","L","XL"],"gallery":["/assets/Boardroom Hunt Lucite Green - 2800.webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-mup014m1-56y1"},{"name":"Boardroom Hunt Maroon","subtitle":"Executive Tailored Series","styleCode":"TRB-005","category":"boardroom","price":2800,"currency":"Tk.","stock":7,"sizeStock":{"M":4,"L":2,"XL":1},"description":"Crafted for distinguished command and tailored precision.","fabric":"100% Cotton","color":"Maroon","colorOptions":[{"name":"Maroon","hex":"#F25C05"}],"image":"/assets/Boardroom Hunt Maroon - 2800.webp","sizes":["M","L","XL"],"gallery":["/assets/Boardroom Hunt Maroon - 2800.webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-mup033aw-qb3w"},{"name":"Daily Hunt Office Ready Clouds","subtitle":"Executive Tailored Series","styleCode":"TRB-006","category":"daily","price":2000,"currency":"Tk.","stock":3,"sizeStock":{"M":0,"L":2,"XL":1},"description":"Crafted for distinguished command and tailored precision.","fabric":"100% Cotton","color":"Clouds","colorOptions":[{"name":"Clouds","hex":"#F25C05"}],"image":"/assets/Daily Hunt Office Ready Clouds - 2000.webp","sizes":["L","XL"],"gallery":["/assets/Daily Hunt Office Ready Clouds - 2000.webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-mup0ao6y-nb9p"},{"name":"Daily Hunt Office Ready Olive","subtitle":"Executive Tailored Series","styleCode":"TRB-007","category":"daily","price":2000,"currency":"Tk.","stock":17,"sizeStock":{"M":6,"L":7,"XL":4},"description":"Crafted for distinguished command and tailored precision.","fabric":"100% Cotton","color":"Olive","colorOptions":[{"name":"Olive","hex":"#F25C05"}],"image":"/assets/Daily Hunt Office Ready Olive - 2000.webp","sizes":["M","L","XL"],"gallery":["/assets/Daily Hunt Office Ready Olive - 2000.webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-mup0i117-fg59"},{"name":"Holiday Hunt Pre WInter Cilantro","subtitle":"Executive Tailored Series","styleCode":"TRB-008","category":"holiday","price":2300,"currency":"Tk.","stock":43,"sizeStock":{"M":14,"L":14,"XL":15},"description":"Crafted for distinguished command and tailored precision.","fabric":"75% polyester 20% cotton 5% elastane","color":"Cilantro","colorOptions":[{"name":"Cilantro","hex":"#F25C05"}],"image":"/assets/Holiday Hunt Pre WInter Cilantro.webp","sizes":["M","L","XL"],"gallery":["/assets/Holiday Hunt Pre WInter Cilantro.webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-mup0rlpo-4t49"},{"name":"Holiday Hunt Pre WInter Coffee","subtitle":"Executive Tailored Series","styleCode":"TRB-009","category":"holiday","price":2300,"currency":"Tk.","stock":6,"sizeStock":{"M":3,"L":2,"XL":1},"description":"Crafted for distinguished command and tailored precision.","fabric":"100% Cotton","color":"Coffee","colorOptions":[{"name":"Coffee","hex":"#F25C05"}],"image":"/assets/Holiday Hunt Pre WInter Coffee.webp","sizes":["M","L","XL"],"gallery":["/assets/Holiday Hunt Pre WInter Coffee.webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-mup0tj34-l42i"},{"name":"24x7 Band Collar Greyscale","subtitle":"Executive Tailored Series","styleCode":"TRB-010","category":"24x7","price":2400,"currency":"Tk.","stock":25,"sizeStock":{"M":10,"L":10,"XL":5},"description":"Crafted for distinguished command and tailored precision.","fabric":"100% Cotton","color":"Grayscale","colorOptions":[{"name":"Grayscale","hex":"#F25C05"}],"image":"/assets/24x7 Band Collar Greyscale - 2400.webp","sizes":["M","L","XL"],"gallery":["/assets/24x7 Band Collar Greyscale - 2400.webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-mup137vo-y6kc"},{"name":"24x7 Band Collar Midnight Blue","subtitle":"Executive Tailored Series","styleCode":"TRB-011","category":"24x7","price":2400,"currency":"Tk.","stock":25,"sizeStock":{"M":10,"L":10,"XL":5},"description":"Crafted for distinguished command and tailored precision.","fabric":"100% Cotton","color":"Midnight Blue","colorOptions":[{"name":"Midnight Blue","hex":"#F25C05"}],"image":"/assets/24x7 Band Collar Midnight Blue - 2400.webp","sizes":["M","L","XL"],"gallery":["/assets/24x7 Band Collar Midnight Blue - 2400.webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-mup14lqt-hh1l"},{"name":"24x7 Band Collar Charcol Grey","subtitle":"Executive Tailored Series","styleCode":"TRB-012","category":"24x7","price":2500,"currency":"Tk.","stock":25,"sizeStock":{"M":10,"L":10,"XL":5},"description":"Crafted for distinguished command and tailored precision.","fabric":"100% Cotton","color":"Charcoal Grey","colorOptions":[{"name":"Charcoal Grey","hex":"#F25C05"}],"image":"/assets/24x7 Band Collar Charcol Grey-2500.webp","sizes":["M","L","XL"],"gallery":["/assets/24x7 Band Collar Charcol Grey-2500.webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-mup1bkm5-frb0"},{"name":"Signature Hunt Blue Sky","subtitle":"Executive Tailored Series","styleCode":"TRB-013","category":"signature","price":2800,"currency":"Tk.","stock":25,"sizeStock":{"M":10,"L":10,"XL":5},"description":"Crafted for distinguished command and tailored precision.","fabric":"100% Cotton","color":"Blue Sky","colorOptions":[{"name":"Blue Sky","hex":"#F25C05"}],"image":"/assets/Signature Hunt Blue Sky- 2800 (2).webp","sizes":["M","L","XL"],"gallery":["/assets/sSignature Hunt Blue Sky- 2800 (2).webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-mup1dezg-tzmm"},{"name":"Signature Hunt Butterscotch Caramel","subtitle":"Executive Tailored Series","styleCode":"TRB-014","category":"signature","price":2800,"currency":"Tk.","stock":25,"sizeStock":{"M":10,"L":10,"XL":5},"description":"Crafted for distinguished command and tailored precision.","fabric":"100% Cotton","color":"Butterscotch Caramel","colorOptions":[{"name":"Butterscotch Caramel","hex":"#F25C05"}],"image":"/assets/Signature Hunt Butterscotch Caramel- 2800 (3).webp","sizes":["M","L","XL"],"gallery":["/assets/Signature Hunt Butterscotch Caramel- 2800 (3).webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-mup1g4by-cimi"},{"name":"Signature Hunt Cotton Cream","subtitle":"Executive Tailored Series","styleCode":"TRB-015","category":"signature","price":2800,"currency":"Tk.","stock":25,"sizeStock":{"M":10,"L":10,"XL":5},"description":"Crafted for distinguished command and tailored precision.","fabric":"100% Cotton","color":"Cotton Cream","colorOptions":[{"name":"Cotton Cream","hex":"#F25C05"}],"image":"/assets/Signature Hunt Cotton Cream- 2800.webp","sizes":["M","L","XL"],"gallery":["/assets/Signature Hunt Cotton Cream- 2800.webp"],"measurements":[{"size":"S","length":27.5,"chest":38,"sleeveLength":8},{"size":"M","length":28,"chest":41,"sleeveLength":8.5},{"size":"L","length":29.5,"chest":42,"sleeveLength":9},{"size":"XL","length":30,"chest":44,"sleeveLength":9.5},{"size":"2XL","length":31,"chest":46,"sleeveLength":10},{"size":"3XL","length":32,"chest":48,"sleeveLength":10.5}],"id":"trb-mup1htbn-yeu1"}]';
    $decoded = json_decode($seedJson, true);
    $cached = is_array($decoded) ? $decoded : [];
    return $cached;
}

// ------------------------------------------------------------------------------
// HELPER FUNCTIONS FOR PRODUCTS
// ------------------------------------------------------------------------------
function getAllSavedProducts($baseDir, $productsFile) {
    $products = [];
    $needsSave = false;

    if (file_exists($productsFile)) {
        $content = @file_get_contents($productsFile);
        $decoded = json_decode($content, true);
        if (is_array($decoded) && count($decoded) > 0) {
            $products = $decoded;
        }
    }

    // Auto-seed if empty
    if (empty($products)) {
        $products = getInitialCatalog();
        $needsSave = true;
    }

    // Merge any individual product folders created on disk
    if (is_dir($baseDir)) {
        $folders = scandir($baseDir);
        $existingCodes = [];
        $existingIds = [];
        foreach ($products as $p) {
            if (!empty($p["id"])) $existingIds[] = (string)$p["id"];
            if (!empty($p["styleCode"])) $existingCodes[] = (string)$p["styleCode"];
        }

        foreach ($folders as $folder) {
            if ($folder === "." || $folder === ".." || strpos($folder, "_") === 0) continue;
            $jsonFile = $baseDir . "/" . $folder . "/product.json";
            if (file_exists($jsonFile)) {
                $content = @file_get_contents($jsonFile);
                $data = json_decode($content, true);
                if ($data && is_array($data)) {
                    $pid = (string)($data["id"] ?? "");
                    $code = (string)($data["styleCode"] ?? "");
                    if (!in_array($pid, $existingIds) && (!empty($code) ? !in_array($code, $existingCodes) : true)) {
                        $products[] = $data;
                        $needsSave = true;
                    }
                }
            }
        }
    }

    if ($needsSave && !empty($products)) {
        @file_put_contents($productsFile, json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    return $products;
}

function saveSingleProductFolder($baseDir, &$product) {
    $folderName = !empty($product["styleCode"]) ? $product["styleCode"] : (!empty($product["id"]) ? $product["id"] : ("product_" . time()));
    $safeFolder = preg_replace("/[^a-zA-Z0-9_\-\.]/", "_", $folderName);
    $productDir = $baseDir . "/" . $safeFolder;

    if (!is_dir($productDir)) {
        @mkdir($productDir, 0755, true);
    }

    $createdFiles = [];
    $savedImageUrl = null;

    // Decode and save base64 Image if provided
    if (!empty($product["image"])) {
        $imgData = $product["image"];
        if (preg_match("/^data:image\/(\w+);base64,/", $imgData, $typeMatch)) {
            $data = substr($imgData, strpos($imgData, ",") + 1);
            $type = strtolower($typeMatch[1]);
            if ($type === "jpeg") $type = "jpg";
            $decoded = base64_decode($data);
            if ($decoded !== false) {
                $imageFilename = "image." . $type;
                file_put_contents($productDir . "/" . $imageFilename, $decoded);
                $createdFiles[] = $imageFilename;

                $scheme = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
                $host = $_SERVER["HTTP_HOST"] ?? "localhost";
                $scriptDir = dirname($_SERVER["SCRIPT_NAME"]);
                $savedImageUrl = rtrim($scheme . "://" . $host . $scriptDir, "/") . "/storage/products/" . $safeFolder . "/" . $imageFilename;
                $product["image"] = $savedImageUrl;
            }
        } else if (strpos($imgData, "http") === 0 || strpos($imgData, "/") === 0) {
            file_put_contents($productDir . "/image_source.txt", $imgData);
            $createdFiles[] = "image_source.txt";
        }
    }

    // Save product.json metadata
    file_put_contents($productDir . "/product.json", json_encode($product, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    $createdFiles[] = "product.json";

    // Save readable specification archive
    $infoContent = "========================================================\n"
                 . "THE ROYAL BENGAL - PRODUCT SPECIFICATION ARCHIVE\n"
                 . "========================================================\n"
                 . "Product Name:     " . ($product["name"] ?? "N/A") . "\n"
                 . "Style Code / SKU: " . ($product["styleCode"] ?? $safeFolder) . "\n"
                 . "Category:         " . ($product["category"] ?? "N/A") . "\n"
                 . "Price:            " . ($product["price"] ?? 0) . " " . ($product["currency"] ?? "Tk.") . "\n"
                 . "Stock:            " . ($product["stock"] ?? 0) . " units\n"
                 . "Available Sizes:  " . (is_array($product["sizes"] ?? null) ? implode(", ", $product["sizes"]) : "S, M, L, XL") . "\n"
                 . "Primary Color:    " . ($product["color"] ?? "N/A") . "\n"
                 . "Fabric:           " . ($product["fabric"] ?? "N/A") . "\n"
                 . "Updated At:       " . date("c") . "\n"
                 . "Description:\n" . ($product["description"] ?? "No description provided.") . "\n"
                 . "========================================================\n";
    file_put_contents($productDir . "/info.txt", $infoContent);
    $createdFiles[] = "info.txt";

    return [
        "folder" => $safeFolder,
        "folderPath" => $productDir,
        "files" => $createdFiles,
        "imageUrl" => $savedImageUrl
    ];
}

// ------------------------------------------------------------------------------
// HELPER FUNCTIONS FOR ORDERS & CUSTOMERS
// ------------------------------------------------------------------------------
function getAllSavedOrders($ordersDir, $ordersFile) {
    $orders = [];
    if (file_exists($ordersFile)) {
        $content = @file_get_contents($ordersFile);
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            $orders = $decoded;
        }
    }

    if (is_dir($ordersDir)) {
        $existingOrderIds = [];
        foreach ($orders as $o) {
            $existingOrderIds[] = (string)($o["orderId"] ?? $o["orderNumber"] ?? "");
        }

        $folders = scandir($ordersDir);
        foreach ($folders as $folder) {
            if ($folder === "." || $folder === ".." || strpos($folder, "_") === 0) continue;
            $orderJsonFile = $ordersDir . "/" . $folder . "/order.json";
            if (file_exists($orderJsonFile)) {
                $content = @file_get_contents($orderJsonFile);
                $data = json_decode($content, true);
                if ($data && is_array($data)) {
                    $oid = (string)($data["orderId"] ?? $data["orderNumber"] ?? $folder);
                    if (!in_array($oid, $existingOrderIds)) {
                        $orders[] = $data;
                    }
                }
            }
        }
    }

    usort($orders, function($a, $b) {
        $timeA = isset($a["createdAt"]) ? strtotime($a["createdAt"]) : 0;
        $timeB = isset($b["createdAt"]) ? strtotime($b["createdAt"]) : 0;
        return $timeB - $timeA;
    });

    return $orders;
}

function saveCustomerRecord($customersFile, $order) {
    $customers = [];
    if (file_exists($customersFile)) {
        $content = @file_get_contents($customersFile);
        $decoded = json_decode($content, true);
        if (is_array($decoded)) $customers = $decoded;
    }

    $cEmail = strtolower(trim($order["email"] ?? ""));
    $cPhone = trim($order["phone"] ?? "");
    $cName = trim($order["customerName"] ?? "Customer");
    $orderTotal = floatval($order["total"] ?? 0);

    if (empty($cEmail) && empty($cPhone)) return;

    $custIndex = -1;
    foreach ($customers as $idx => $c) {
        if (!empty($cEmail) && strtolower(trim($c["email"] ?? "")) === $cEmail) {
            $custIndex = $idx;
            break;
        }
        if (!empty($cPhone) && trim($c["phone"] ?? "") === $cPhone) {
            $custIndex = $idx;
            break;
        }
    }

    if ($custIndex >= 0) {
        $customers[$custIndex]["totalOrders"] = ($customers[$custIndex]["totalOrders"] ?? 0) + 1;
        $customers[$custIndex]["totalSpent"] = ($customers[$custIndex]["totalSpent"] ?? 0) + $orderTotal;
        $customers[$custIndex]["lastOrderDate"] = date("c");
        if (!empty($order["address"])) $customers[$custIndex]["address"] = $order["address"];
    } else {
        $customers[] = [
            "id" => "cust_" . time() . "_" . rand(100, 999),
            "name" => $cName,
            "email" => $cEmail,
            "phone" => $cPhone,
            "address" => $order["address"] ?? "",
            "totalOrders" => 1,
            "totalSpent" => $orderTotal,
            "createdAt" => date("c"),
            "lastOrderDate" => date("c"),
        ];
    }

    @file_put_contents($customersFile, json_encode($customers, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

// ==============================================================================
// 1. PRODUCTS ROUTING (/api/products, /api/products/:id, /api/products/sync, etc.)
// ==============================================================================
if ($resource === "products") {
    // --------------------------------------------------------------------------
    // A. SYNC ALL PRODUCTS (POST /api/products/sync)
    // --------------------------------------------------------------------------
    if ($subResource === "sync" && $method === "POST") {
        $toSync = $inputData["products"] ?? $inputData;
        if (!is_array($toSync)) {
            echo json_encode(["success" => false, "message" => "Expected array of products in payload"]);
            exit;
        }

        foreach ($toSync as &$prod) {
            if (is_array($prod)) {
                saveSingleProductFolder($STORAGE_BASE_DIR, $prod);
            }
        }
        unset($prod);

        file_put_contents($PRODUCTS_FILE, json_encode($toSync, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        echo json_encode([
            "success" => true,
            "message" => "All products synced and persistent on disk.",
            "count" => count($toSync),
            "products" => $toSync
        ]);
        exit;
    }

    // --------------------------------------------------------------------------
    // B. RESET CATALOG TO DEFAULT (POST /api/products/reset)
    // --------------------------------------------------------------------------
    if ($subResource === "reset" && $method === "POST") {
        $initial = getInitialCatalog();
        foreach ($initial as &$prod) {
            saveSingleProductFolder($STORAGE_BASE_DIR, $prod);
        }
        unset($prod);

        file_put_contents($PRODUCTS_FILE, json_encode($initial, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        echo json_encode([
            "success" => true,
            "message" => "Catalog restored to default Royal Bengal collection.",
            "count" => count($initial),
            "products" => $initial
        ]);
        exit;
    }

    // --------------------------------------------------------------------------
    // C. SINGLE PRODUCT OPERATIONS (/api/products/:id with PUT, DELETE, GET)
    // --------------------------------------------------------------------------
    if (!empty($subResource) && $subResource !== "sync" && $subResource !== "reset") {
        $targetId = $subResource;

        // PUT: Update Product
        if ($method === "PUT" || ($method === "POST" && !empty($inputData))) {
            $allProducts = getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE);
            $foundIndex = -1;

            foreach ($allProducts as $idx => $p) {
                if (($p["id"] ?? "") === $targetId || ($p["styleCode"] ?? "") === $targetId) {
                    $foundIndex = $idx;
                    break;
                }
            }

            $productData = $inputData["product"] ?? $inputData;
            if (is_string($productData)) $productData = json_decode($productData, true) ?: [];

            if ($foundIndex >= 0) {
                $merged = array_merge($allProducts[$foundIndex], $productData);
                $storageResult = saveSingleProductFolder($STORAGE_BASE_DIR, $merged);
                $allProducts[$foundIndex] = $merged;
            } else {
                if (empty($productData["id"])) $productData["id"] = $targetId;
                $storageResult = saveSingleProductFolder($STORAGE_BASE_DIR, $productData);
                $allProducts[] = $productData;
                $merged = $productData;
            }

            file_put_contents($PRODUCTS_FILE, json_encode($allProducts, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            echo json_encode([
                "success" => true,
                "message" => "Product updated successfully on server.",
                "product" => $merged,
                "storage" => $storageResult
            ]);
            exit;
        }

        // DELETE: Remove Product
        if ($method === "DELETE") {
            $safeFolder = preg_replace("/[^a-zA-Z0-9_\-\.]/", "_", $targetId);
            $targetDir = $STORAGE_BASE_DIR . "/" . $safeFolder;

            if (is_dir($targetDir)) {
                $files = array_diff(scandir($targetDir), [".", ".."]);
                foreach ($files as $file) {
                    @unlink($targetDir . "/" . $file);
                }
                @rmdir($targetDir);
            }

            $allProducts = getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE);
            $filtered = array_values(array_filter($allProducts, function($p) use ($targetId, $safeFolder) {
                return ($p["id"] ?? "") !== $targetId && ($p["styleCode"] ?? "") !== $targetId && ($p["styleCode"] ?? "") !== $safeFolder;
            }));

            file_put_contents($PRODUCTS_FILE, json_encode($filtered, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            echo json_encode([
                "success" => true,
                "message" => "Product " . $targetId . " removed from server inventory.",
                "count" => count($filtered)
            ]);
            exit;
        }

        // GET: Single Product
        if ($method === "GET") {
            $allProducts = getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE);
            foreach ($allProducts as $p) {
                if (($p["id"] ?? "") === $targetId || ($p["styleCode"] ?? "") === $targetId) {
                    echo json_encode(["success" => true, "product" => $p]);
                    exit;
                }
            }
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Product not found"]);
            exit;
        }
    }

    // --------------------------------------------------------------------------
    // D. CATALOG COLLECTION OPERATIONS (/api/products with GET, POST)
    // --------------------------------------------------------------------------
    if ($method === "GET") {
        $productList = getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE);
        echo json_encode([
            "success" => true,
            "count" => count($productList),
            "products" => $productList,
            "folders" => array_map(function($p) {
                return $p["styleCode"] ?? $p["id"] ?? "product";
            }, $productList)
        ]);
        exit;
    }

    if ($method === "POST") {
        $product = $inputData["product"] ?? $inputData;
        if (is_string($product)) {
            $product = json_decode($product, true) ?: [];
        }

        if (empty($product["id"])) {
            $product["id"] = "trb-" . base_convert((string)time(), 10, 36) . "-" . substr(md5((string)rand()), 0, 4);
        }
        if (empty($product["styleCode"])) {
            $product["styleCode"] = "TRB-" . rand(100, 999);
        }

        $storageResult = saveSingleProductFolder($STORAGE_BASE_DIR, $product);

        $allProducts = getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE);
        $prodIdx = -1;
        foreach ($allProducts as $i => $p) {
            if (($p["id"] ?? "") === ($product["id"] ?? "") || ($p["styleCode"] ?? "") === ($product["styleCode"] ?? "")) {
                $prodIdx = $i;
                break;
            }
        }

        if ($prodIdx >= 0) {
            $allProducts[$prodIdx] = $product;
        } else {
            array_unshift($allProducts, $product);
        }

        file_put_contents($PRODUCTS_FILE, json_encode($allProducts, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        echo json_encode([
            "success" => true,
            "message" => "Product added and saved to server storage.",
            "product" => $product,
            "storage" => $storageResult
        ]);
        exit;
    }
}

// ==============================================================================
// 2. ORDERS ROUTING (/api/orders, /api/orders/:id)
// ==============================================================================
if ($resource === "orders") {
    // --------------------------------------------------------------------------
    // A. UPDATE ORDER STATUS OR DETAILS (PUT /api/orders/:id)
    // --------------------------------------------------------------------------
    if (!empty($subResource) && ($method === "PUT" || $method === "POST")) {
        $orderId = $subResource;
        $status = $inputData["status"] ?? "";
        $currentOrders = getAllSavedOrders($ORDERS_BASE_DIR, $ORDERS_FILE);
        $found = null;

        foreach ($currentOrders as &$o) {
            if (($o["orderId"] ?? $o["orderNumber"] ?? "") === $orderId) {
                if (!empty($status)) {
                    $o["status"] = ucfirst($status);
                }
                foreach ($inputData as $k => $v) {
                    if ($k !== "orderId" && $k !== "orderNumber") {
                        $o[$k] = $v;
                    }
                }
                $found = $o;
                break;
            }
        }
        unset($o);

        if ($found) {
            file_put_contents($ORDERS_FILE, json_encode($currentOrders, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            $safeOrderFolder = preg_replace("/[^a-zA-Z0-9_\-\.]/", "_", $orderId);
            $orderDir = $ORDERS_BASE_DIR . "/" . $safeOrderFolder;
            if (is_dir($orderDir)) {
                file_put_contents($orderDir . "/order.json", json_encode($found, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            }

            echo json_encode([
                "success" => true,
                "message" => "Order " . $orderId . " updated.",
                "order" => $found
            ]);
            exit;
        }

        echo json_encode(["success" => false, "message" => "Order not found"]);
        exit;
    }

    // --------------------------------------------------------------------------
    // B. DELETE ORDER (DELETE /api/orders/:id)
    // --------------------------------------------------------------------------
    if (!empty($subResource) && $method === "DELETE") {
        $orderId = $subResource;
        $safeOrderFolder = preg_replace("/[^a-zA-Z0-9_\-\.]/", "_", $orderId);
        $orderDir = $ORDERS_BASE_DIR . "/" . $safeOrderFolder;

        if (is_dir($orderDir)) {
            $files = array_diff(scandir($orderDir), [".", ".."]);
            foreach ($files as $file) {
                @unlink($orderDir . "/" . $file);
            }
            @rmdir($orderDir);
        }

        $currentOrders = getAllSavedOrders($ORDERS_BASE_DIR, $ORDERS_FILE);
        $filtered = array_values(array_filter($currentOrders, function($o) use ($orderId) {
            return ($o["orderId"] ?? $o["orderNumber"] ?? "") !== $orderId;
        }));

        file_put_contents($ORDERS_FILE, json_encode($filtered, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        echo json_encode([
            "success" => true,
            "message" => "Order " . $orderId . " purged from server.",
            "count" => count($filtered)
        ]);
        exit;
    }

    // --------------------------------------------------------------------------
    // C. CREATE / PLACE ORDER (POST /api/orders)
    // --------------------------------------------------------------------------
    if ($method === "POST") {
        $order = $inputData["order"] ?? $inputData;
        if (is_string($order)) {
            $order = json_decode($order, true) ?: [];
        }

        $orderNumber = $order["orderId"] ?? $order["orderNumber"] ?? ("TRB-" . rand(100000, 999999));
        $order["orderId"] = $orderNumber;
        $order["orderNumber"] = $orderNumber;
        $order["status"] = !empty($order["status"]) ? ucfirst($order["status"]) : "Pending";
        $order["createdAt"] = $order["createdAt"] ?? date("c");

        $safeOrderFolder = preg_replace("/[^a-zA-Z0-9_\-\.]/", "_", $orderNumber);
        $orderDir = $ORDERS_BASE_DIR . "/" . $safeOrderFolder;

        if (!is_dir($orderDir)) {
            @mkdir($orderDir, 0755, true);
        }

        // 1. Save complete order.json in dedicated order folder
        file_put_contents($orderDir . "/order.json", json_encode($order, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        // 2. Generate and save invoice receipt summary
        $itemsText = "";
        $items = $order["items"] ?? [];
        if (is_array($items)) {
            foreach ($items as $idx => $it) {
                $pName = $it["product"]["name"] ?? $it["name"] ?? "Product";
                $pCode = $it["product"]["styleCode"] ?? $it["styleCode"] ?? "N/A";
                $pSize = $it["selectedSize"] ?? $it["size"] ?? "Standard";
                $pColor = $it["selectedColor"] ?? $it["color"] ?? "Standard";
                $pQty = $it["quantity"] ?? $it["qty"] ?? 1;
                $pPrice = $it["price"] ?? ($it["product"]["price"] ?? 0);
                $pSubtotal = $pQty * $pPrice;
                $itemsText .= sprintf("  %d. %s (Style Code: %s)\n     Size: %s | Color: %s | Qty: %d x Tk. %s = Tk. %s\n", 
                    $idx + 1, $pName, $pCode, $pSize, $pColor, $pQty, number_format((float)$pPrice), number_format((float)$pSubtotal)
                );
            }
        }

        $receiptContent = "========================================================\n"
                        . "THE ROYAL BENGAL - OFFICIAL CUSTOMER ORDER INVOICE\n"
                        . "========================================================\n"
                        . "Order Number:     " . $orderNumber . "\n"
                        . "Date & Time:      " . $order["createdAt"] . "\n"
                        . "Order Status:     " . $order["status"] . "\n"
                        . "Payment Method:   " . strtoupper($order["paymentMethod"] ?? "COD") . " (Cash on Delivery)\n"
                        . "--------------------------------------------------------\n"
                        . "CUSTOMER DETAILS:\n"
                        . "Customer Name:    " . ($order["customerName"] ?? "N/A") . "\n"
                        . "Phone Number:     " . ($order["phone"] ?? "N/A") . "\n"
                        . "Email Address:    " . ($order["email"] ?? "N/A") . "\n"
                        . "Delivery Method:  " . ($order["deliveryMethod"] ?? "inside-dhaka") . "\n"
                        . "District / Zone:  " . ($order["district"] ?? "Dhaka") . "\n"
                        . "Delivery Address: " . ($order["address"] ?? "N/A") . "\n"
                        . "--------------------------------------------------------\n"
                        . "ORDERED ITEMS:\n" . ($itemsText ?: "  No items detailed\n")
                        . "--------------------------------------------------------\n"
                        . "Subtotal:         Tk. " . number_format((float)($order["subtotal"] ?? 0)) . "\n"
                        . "Discount:         Tk. " . number_format((float)($order["discount"] ?? 0)) . "\n"
                        . "Delivery Fee:     Tk. " . number_format((float)($order["shipping"] ?? 0)) . "\n"
                        . "TOTAL PAYABLE:    Tk. " . number_format((float)($order["total"] ?? 0)) . "\n"
                        . "========================================================\n";

        file_put_contents($orderDir . "/receipt.txt", $receiptContent);

        // 3. Update master orders.json
        $currentOrders = getAllSavedOrders($ORDERS_BASE_DIR, $ORDERS_FILE);
        $orderIndex = -1;
        foreach ($currentOrders as $idx => $ex) {
            $exId = $ex["orderId"] ?? $ex["orderNumber"] ?? "";
            if ($exId === $orderNumber) {
                $orderIndex = $idx;
                break;
            }
        }

        if ($orderIndex >= 0) {
            $currentOrders[$orderIndex] = $order;
        } else {
            array_unshift($currentOrders, $order);
        }
        file_put_contents($ORDERS_FILE, json_encode($currentOrders, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        // 4. Update customer database
        saveCustomerRecord($CUSTOMERS_FILE, $order);

        echo json_encode([
            "success" => true,
            "message" => "Customer order confirmed and stored on server.",
            "order" => $order,
            "orderId" => $orderNumber,
            "folder" => $safeOrderFolder,
            "count" => count($currentOrders)
        ]);
        exit;
    }

    // --------------------------------------------------------------------------
    // D. FETCH ALL ORDERS (GET /api/orders)
    // --------------------------------------------------------------------------
    if ($method === "GET") {
        $ordersList = getAllSavedOrders($ORDERS_BASE_DIR, $ORDERS_FILE);
        echo json_encode([
            "success" => true,
            "count" => count($ordersList),
            "orders" => $ordersList
        ]);
        exit;
    }
}

// ==============================================================================
// 3. CUSTOMERS ROUTING (/api/customers)
// ==============================================================================
if ($resource === "customers") {
    $customers = [];
    if (file_exists($CUSTOMERS_FILE)) {
        $c = @file_get_contents($CUSTOMERS_FILE);
        $decoded = json_decode($c, true);
        if (is_array($decoded)) $customers = $decoded;
    }
    echo json_encode([
        "success" => true,
        "count" => count($customers),
        "customers" => $customers
    ]);
    exit;
}

// ==============================================================================
// 4. STORAGE CONFIG & DIAGNOSTICS (/api/storage/*)
// ==============================================================================
if ($resource === "storage") {
    // Config read/write
    if ($subResource === "config") {
        if ($method === "POST") {
            $cfg = $inputData["config"] ?? $inputData;
            file_put_contents($CONFIG_FILE, json_encode($cfg, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            echo json_encode(["success" => true, "message" => "Storage config saved", "config" => $cfg]);
            exit;
        }
        $cfg = file_exists($CONFIG_FILE) ? json_decode(file_get_contents($CONFIG_FILE), true) : null;
        echo json_encode(["success" => true, "config" => $cfg]);
        exit;
    }

    // Test ping
    if ($subResource === "test-connection") {
        echo json_encode([
            "success" => true,
            "message" => "Connected to The Royal Bengal live storage server successfully.",
            "timestamp" => date("c"),
            "storage_dir" => $STORAGE_DIR,
            "products_count" => count(getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE)),
            "orders_count" => count(getAllSavedOrders($ORDERS_BASE_DIR, $ORDERS_FILE))
        ]);
        exit;
    }

    // Folders inspection
    if ($subResource === "folders") {
        $detailedFolders = [];
        $productList = getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE);

        if (is_dir($STORAGE_BASE_DIR)) {
            $folders = scandir($STORAGE_BASE_DIR);
            foreach ($folders as $folder) {
                if ($folder === "." || $folder === ".." || strpos($folder, "_") === 0) continue;
                $fDir = $STORAGE_BASE_DIR . "/" . $folder;
                if (is_dir($fDir)) {
                    $subEntries = array_diff(scandir($fDir), [".", ".."]);
                    $filesData = [];
                    $hasJson = false;
                    $preview = null;

                    foreach ($subEntries as $sub) {
                        $subPath = $fDir . "/" . $sub;
                        $size = @filesize($subPath) ?: 0;
                        $mtime = @filemtime($subPath) ? date("c", @filemtime($subPath)) : date("c");

                        if ($sub === "product.json") {
                            $hasJson = true;
                            $content = @file_get_contents($subPath);
                            $preview = json_decode($content, true);
                        }

                        $filesData[] = [
                            "name" => $sub,
                            "size" => $size,
                            "modified" => $mtime,
                            "url" => "storage/products/" . $folder . "/" . $sub
                        ];
                    }

                    $detailedFolders[] = [
                        "name" => $folder,
                        "path" => "storage/products/" . $folder,
                        "files" => $filesData,
                        "hasProductJson" => $hasJson,
                        "productPreview" => $preview,
                        "modified" => date("c", @filemtime($fDir) ?: time())
                    ];
                }
            }
        }

        echo json_encode([
            "success" => true,
            "count" => count($detailedFolders),
            "folders" => $detailedFolders
        ]);
        exit;
    }

    // Storage info
    if ($subResource === "info") {
        $totalBytes = 0;
        $totalFiles = 0;
        if (is_dir($STORAGE_DIR)) {
            $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($STORAGE_DIR, FilesystemIterator::SKIP_DOTS));
            foreach ($it as $f) {
                $totalBytes += $f->getSize();
                $totalFiles++;
            }
        }
        echo json_encode([
            "success" => true,
            "total_bytes" => $totalBytes,
            "total_files" => $totalFiles,
            "readable_size" => round($totalBytes / 1024 / 1024, 2) . " MB",
            "products_count" => count(getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE)),
            "orders_count" => count(getAllSavedOrders($ORDERS_BASE_DIR, $ORDERS_FILE))
        ]);
        exit;
    }

    // Sync all
    if ($subResource === "sync-all") {
        $all = getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE);
        foreach ($all as &$p) {
            saveSingleProductFolder($STORAGE_BASE_DIR, $p);
        }
        unset($p);
        echo json_encode(["success" => true, "message" => "All folders synced", "count" => count($all)]);
        exit;
    }
}

// ==============================================================================
// 5. DEFAULT FALLBACK RESPONSE
// ==============================================================================
$allProds = getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE);
echo json_encode([
    "success" => true,
    "message" => "The Royal Bengal Storage & Order Persistence Handler is active.",
    "endpoint" => $endpoint,
    "resource" => $resource,
    "method" => $method,
    "count" => count($allProds),
    "products" => $allProds,
    "orders_count" => count(getAllSavedOrders($ORDERS_BASE_DIR, $ORDERS_FILE))
]);
