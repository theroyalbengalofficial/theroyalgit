<?php
/**
 * ==============================================================================
 * THE ROYAL BENGAL - EXTERNAL SERVER STORAGE & PRODUCT / ORDER PERSISTENCE
 * ==============================================================================
 * 
 * This handler manages:
 * 1. Product creation, folder generation (products/<SKU>/), image decoding & JSON storage
 * 2. Customer order creation, folder generation (orders/<ORDER_ID>/), invoice generation & orders.json
 * 3. Customer profile persistence (customers.json)
 * 4. Configuration persistence (config.json)
 * 5. Connection test ping and health checks
 * ==============================================================================
 */

// Allow cross-origin requests from your storefront and admin panel
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Storage directory layout
$STORAGE_DIR = __DIR__ . '/storage';
$STORAGE_BASE_DIR = $STORAGE_DIR . '/products';
$ORDERS_BASE_DIR = $STORAGE_DIR . '/orders';
$ORDERS_FILE = $STORAGE_DIR . '/orders.json';
$CUSTOMERS_FILE = $STORAGE_DIR . '/customers.json';
$CONFIG_FILE = $STORAGE_DIR . '/config.json';
$PRODUCTS_FILE = $STORAGE_DIR . '/products.json';

// Ensure all base directories exist with appropriate permissions
foreach ([$STORAGE_DIR, $STORAGE_BASE_DIR, $ORDERS_BASE_DIR] as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

// Parse request payload & URL parameters
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true);
if (!$inputData || !is_array($inputData)) {
    $inputData = $_POST ?: [];
}

$action = $_GET['action'] ?? $inputData['action'] ?? $_GET['endpoint'] ?? '';
$endpoint = $_GET['endpoint'] ?? '';
$paramId = $_GET['id'] ?? $inputData['id'] ?? $inputData['orderId'] ?? '';
$uri = $_SERVER['REQUEST_URI'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ------------------------------------------------------------------------------
// HELPER FUNCTIONS
// ------------------------------------------------------------------------------

/**
 * Scan storage and load all saved product.json files along with master products.json
 */
function getAllSavedProducts($baseDir, $productsFile) {
    $products = [];
    if (file_exists($productsFile)) {
        $content = @file_get_contents($productsFile);
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            $products = $decoded;
        }
    }

    if (is_dir($baseDir)) {
        $folders = scandir($baseDir);
        $existingCodes = [];
        $existingIds = [];
        foreach ($products as $p) {
            if (!empty($p['id'])) $existingIds[] = (string)$p['id'];
            if (!empty($p['styleCode'])) $existingCodes[] = (string)$p['styleCode'];
        }

        foreach ($folders as $folder) {
            if ($folder === '.' || $folder === '..' || strpos($folder, '_') === 0) continue;
            $jsonFile = $baseDir . '/' . $folder . '/product.json';
            if (file_exists($jsonFile)) {
                $content = @file_get_contents($jsonFile);
                $data = json_decode($content, true);
                if ($data && is_array($data)) {
                    $pid = (string)($data['id'] ?? '');
                    $code = (string)($data['styleCode'] ?? '');
                    if (!in_array($pid, $existingIds) && (!empty($code) ? !in_array($code, $existingCodes) : true)) {
                        $products[] = $data;
                    }
                }
            }
        }
    }
    return $products;
}

/**
 * Scan storage and load all saved customer orders
 */
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
            $existingOrderIds[] = (string)($o['orderId'] ?? $o['orderNumber'] ?? '');
        }

        $folders = scandir($ordersDir);
        foreach ($folders as $folder) {
            if ($folder === '.' || $folder === '..' || strpos($folder, '_') === 0) continue;
            $orderJsonFile = $ordersDir . '/' . $folder . '/order.json';
            if (file_exists($orderJsonFile)) {
                $content = @file_get_contents($orderJsonFile);
                $data = json_decode($content, true);
                if ($data && is_array($data)) {
                    $oid = (string)($data['orderId'] ?? $data['orderNumber'] ?? $folder);
                    if (!in_array($oid, $existingOrderIds)) {
                        $orders[] = $data;
                    }
                }
            }
        }
    }

    // Sort by createdAt descending
    usort($orders, function($a, $b) {
        $timeA = isset($a['createdAt']) ? strtotime($a['createdAt']) : 0;
        $timeB = isset($b['createdAt']) ? strtotime($b['createdAt']) : 0;
        return $timeB - $timeA;
    });

    return $orders;
}

/**
 * Automatically update or create customer record upon order placement
 */
function saveCustomerRecord($customersFile, $order) {
    $customers = [];
    if (file_exists($customersFile)) {
        $customers = json_decode(@file_get_contents($customersFile), true) ?: [];
    }

    $phone = $order['phone'] ?? '';
    $phoneDigits = preg_replace('/[^0-9]/', '', $phone);
    $custId = $order['customerId'] ?? (!empty($phoneDigits) ? ('cust-' . $phoneDigits) : ('cust-' . time()));

    $foundIndex = -1;
    foreach ($customers as $idx => $c) {
        if ((!empty($phone) && ($c['phone'] ?? '') === $phone) || (($c['id'] ?? '') === $custId)) {
            $foundIndex = $idx;
            break;
        }
    }

    $spent = (float)($order['total'] ?? 0);
    if ($foundIndex >= 0) {
        $customers[$foundIndex]['name'] = $order['customerName'] ?? $customers[$foundIndex]['name'];
        $customers[$foundIndex]['phone'] = $order['phone'] ?? $customers[$foundIndex]['phone'];
        $customers[$foundIndex]['address'] = $order['address'] ?? $customers[$foundIndex]['address'];
        $customers[$foundIndex]['district'] = $order['district'] ?? $customers[$foundIndex]['district'];
        $customers[$foundIndex]['totalOrders'] = ($customers[$foundIndex]['totalOrders'] ?? 1) + 1;
        $customers[$foundIndex]['totalSpent'] = ($customers[$foundIndex]['totalSpent'] ?? 0) + $spent;
        $customers[$foundIndex]['lastActive'] = date('c');
    } else {
        $newCustomer = [
            'id' => $custId,
            'name' => $order['customerName'] ?? 'Valued Customer',
            'phone' => $phone,
            'email' => $order['email'] ?? '',
            'address' => $order['address'] ?? '',
            'district' => $order['district'] ?? ($order['deliveryMethod'] === 'inside-dhaka' ? 'Dhaka' : 'Outside Dhaka'),
            'deliveryZone' => $order['deliveryMethod'] ?? 'inside-dhaka',
            'provider' => $order['authProvider'] ?? 'direct',
            'totalOrders' => 1,
            'totalSpent' => $spent,
            'lastActive' => date('c'),
            'createdAt' => date('c'),
        ];
        array_unshift($customers, $newCustomer);
    }

    @file_put_contents($customersFile, json_encode($customers, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    return $customers;
}

// ------------------------------------------------------------------------------
// 1. CONNECTION TEST & PING (/api/storage/test-connection or ping)
// ------------------------------------------------------------------------------
if ($action === 'ping' || $action === 'test-connection' || $endpoint === 'test-connection' || strpos($uri, 'test-connection') !== false) {
    $isWritable = is_writable($STORAGE_BASE_DIR) || is_writable(__DIR__);
    echo json_encode([
        'success' => true,
        'status' => 'online',
        'message' => 'Purchased Server Storage is connected and ready to store products and orders!',
        'server_time' => date('c'),
        'php_version' => PHP_VERSION,
        'storage_path' => $STORAGE_BASE_DIR,
        'orders_path' => $ORDERS_BASE_DIR,
        'is_writable' => $isWritable
    ]);
    exit;
}

// ------------------------------------------------------------------------------
// 2. CONFIGURATION HANDLER (/api/storage/config)
// ------------------------------------------------------------------------------
if (strpos($uri, 'api/storage/config') !== false || $action === 'config' || $endpoint === 'config') {
    if ($method === 'POST') {
        @file_put_contents($CONFIG_FILE, json_encode($inputData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        echo json_encode([
            'success' => true,
            'message' => 'Configuration saved successfully!',
            'config' => $inputData
        ]);
        exit;
    } else {
        $savedConfig = file_exists($CONFIG_FILE) ? json_decode(@file_get_contents($CONFIG_FILE), true) : [];
        echo json_encode([
            'success' => true,
            'config' => $savedConfig ?: []
        ]);
        exit;
    }
}

// ------------------------------------------------------------------------------
// 3. CUSTOMER ORDERS MANAGEMENT (POST, GET, PUT, DELETE /api/orders)
// ------------------------------------------------------------------------------
$isOrdersRequest = (
    strpos($uri, 'api/orders') !== false ||
    $endpoint === 'orders' ||
    $action === 'orders' ||
    $action === 'save_order' ||
    $action === 'create_order' ||
    $action === 'list_orders' ||
    isset($inputData['order']) ||
    (isset($inputData['orderNumber']) && !isset($inputData['styleCode']))
);

if ($isOrdersRequest) {
    // A. CREATE / SAVE ORDER (POST)
    if ($method === 'POST' && ($action === 'save_order' || $action === 'create_order' || $endpoint === 'orders' || strpos($uri, 'api/orders') !== false || isset($inputData['order']) || isset($inputData['orderNumber']))) {
        $order = $inputData['order'] ?? $inputData;
        if (is_string($order)) {
            $order = json_decode($order, true) ?: [];
        }

        $orderNumber = $order['orderId'] ?? $order['orderNumber'] ?? ('TRB-' . rand(100000, 999999));
        $order['orderId'] = $orderNumber;
        $order['orderNumber'] = $orderNumber;
        $order['status'] = !empty($order['status']) ? ucfirst($order['status']) : 'Pending';
        $order['createdAt'] = $order['createdAt'] ?? date('c');

        $safeOrderFolder = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $orderNumber);
        $orderDir = $ORDERS_BASE_DIR . '/' . $safeOrderFolder;

        if (!is_dir($orderDir)) {
            @mkdir($orderDir, 0755, true);
        }

        // 1. Save complete order.json in dedicated order folder
        file_put_contents($orderDir . '/order.json', json_encode($order, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        // 2. Generate and save human-readable invoice summary (receipt.txt)
        $itemsText = "";
        $items = $order['items'] ?? [];
        if (is_array($items)) {
            foreach ($items as $idx => $it) {
                $pName = $it['product']['name'] ?? $it['name'] ?? 'Product';
                $pCode = $it['product']['styleCode'] ?? $it['styleCode'] ?? 'N/A';
                $pSize = $it['selectedSize'] ?? $it['size'] ?? 'Standard';
                $pColor = $it['selectedColor'] ?? $it['color'] ?? 'Standard';
                $pQty = $it['quantity'] ?? $it['qty'] ?? 1;
                $pPrice = $it['price'] ?? ($it['product']['price'] ?? 0);
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
                        . "Date & Time:      " . $order['createdAt'] . "\n"
                        . "Order Status:     " . $order['status'] . "\n"
                        . "Payment Method:   " . strtoupper($order['paymentMethod'] ?? 'COD') . " (Cash on Delivery)\n"
                        . "--------------------------------------------------------\n"
                        . "CUSTOMER DETAILS:\n"
                        . "Customer Name:    " . ($order['customerName'] ?? 'N/A') . "\n"
                        . "Phone Number:     " . ($order['phone'] ?? 'N/A') . "\n"
                        . "Email Address:    " . ($order['email'] ?? 'N/A') . "\n"
                        . "Delivery Method:  " . ($order['deliveryMethod'] ?? 'inside-dhaka') . "\n"
                        . "District / Zone:  " . ($order['district'] ?? 'Dhaka') . "\n"
                        . "Delivery Address: " . ($order['address'] ?? 'N/A') . "\n"
                        . "--------------------------------------------------------\n"
                        . "ORDERED ITEMS:\n" . ($itemsText ?: "  No items detailed\n")
                        . "--------------------------------------------------------\n"
                        . "Subtotal:         Tk. " . number_format((float)($order['subtotal'] ?? 0)) . "\n"
                        . "Discount:         Tk. " . number_format((float)($order['discount'] ?? 0)) . "\n"
                        . "Delivery Fee:     Tk. " . number_format((float)($order['shipping'] ?? 0)) . "\n"
                        . "TOTAL PAYABLE:    Tk. " . number_format((float)($order['total'] ?? 0)) . "\n"
                        . "========================================================\n";

        file_put_contents($orderDir . '/receipt.txt', $receiptContent);

        // 3. Update master orders.json
        $currentOrders = getAllSavedOrders($ORDERS_BASE_DIR, $ORDERS_FILE);
        $orderIndex = -1;
        foreach ($currentOrders as $idx => $ex) {
            $exId = $ex['orderId'] ?? $ex['orderNumber'] ?? '';
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

        // 4. Update customers.json
        saveCustomerRecord($CUSTOMERS_FILE, $order);

        echo json_encode([
            'success' => true,
            'message' => 'Customer order saved and confirmed successfully!',
            'order' => $order,
            'orderId' => $orderNumber,
            'folder' => $safeOrderFolder,
            'folder_path' => $orderDir,
            'receipt' => 'receipt.txt',
            'count' => count($currentOrders)
        ]);
        exit;
    }

    // B. FETCH ORDERS (GET)
    if ($method === 'GET') {
        $ordersList = getAllSavedOrders($ORDERS_BASE_DIR, $ORDERS_FILE);
        echo json_encode([
            'success' => true,
            'count' => count($ordersList),
            'orders' => $ordersList
        ]);
        exit;
    }

    // C. UPDATE ORDER STATUS (PUT or POST action=update_order_status)
    if ($method === 'PUT' || $action === 'update_order_status') {
        $targetId = $paramId ?: ($inputData['orderId'] ?? '');
        $newStatus = $inputData['status'] ?? 'Processing';
        $currentOrders = getAllSavedOrders($ORDERS_BASE_DIR, $ORDERS_FILE);
        $updatedOrder = null;

        foreach ($currentOrders as $idx => $ord) {
            $oid = $ord['orderId'] ?? $ord['orderNumber'] ?? '';
            if ($oid === $targetId) {
                $currentOrders[$idx]['status'] = $newStatus;
                $updatedOrder = $currentOrders[$idx];

                // Update folder
                $safeOrdFolder = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $oid);
                $ordFile = $ORDERS_BASE_DIR . '/' . $safeOrdFolder . '/order.json';
                if (file_exists($ordFile)) {
                    file_put_contents($ordFile, json_encode($updatedOrder, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
                }
                break;
            }
        }

        if ($updatedOrder) {
            file_put_contents($ORDERS_FILE, json_encode($currentOrders, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            echo json_encode(['success' => true, 'order' => $updatedOrder, 'message' => 'Order status updated']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Order not found']);
        }
        exit;
    }

    // D. DELETE ORDER (DELETE or POST action=delete_order)
    if ($method === 'DELETE' || $action === 'delete_order') {
        $targetId = $paramId ?: ($inputData['orderId'] ?? '');
        $currentOrders = getAllSavedOrders($ORDERS_BASE_DIR, $ORDERS_FILE);
        $filtered = array_values(array_filter($currentOrders, function($o) use ($targetId) {
            return ($o['orderId'] ?? $o['orderNumber'] ?? '') !== $targetId;
        }));

        file_put_contents($ORDERS_FILE, json_encode($filtered, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        $safeOrdFolder = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $targetId);
        $targetDir = $ORDERS_BASE_DIR . '/' . $safeOrdFolder;
        if (is_dir($targetDir)) {
            $files = array_diff(scandir($targetDir), ['.', '..']);
            foreach ($files as $f) {
                @unlink($targetDir . '/' . $f);
            }
            @rmdir($targetDir);
        }

        echo json_encode(['success' => true, 'message' => "Order {$targetId} deleted successfully"]);
        exit;
    }
}

// ------------------------------------------------------------------------------
// 4. CUSTOMERS HANDLER (/api/customers)
// ------------------------------------------------------------------------------
if (strpos($uri, 'api/customers') !== false || $endpoint === 'customers' || $action === 'customers') {
    $customers = file_exists($CUSTOMERS_FILE) ? (json_decode(@file_get_contents($CUSTOMERS_FILE), true) ?: []) : [];
    echo json_encode([
        'success' => true,
        'count' => count($customers),
        'customers' => $customers
    ]);
    exit;
}

// ------------------------------------------------------------------------------
// 5. STORAGE FOLDERS LISTING (GET /api/storage/folders, endpoint=folders, action=folders)
// ------------------------------------------------------------------------------
if ($method === 'GET' && (
    strpos($uri, 'api/storage/folders') !== false ||
    $endpoint === 'folders' ||
    $action === 'folders' ||
    $action === 'list_folders'
)) {
    $detailedFolders = [];
    $productList = getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE);

    if (is_dir($STORAGE_BASE_DIR)) {
        $folders = scandir($STORAGE_BASE_DIR);
        foreach ($folders as $folder) {
            if ($folder === '.' || $folder === '..' || strpos($folder, '_') === 0) continue;
            $fDir = $STORAGE_BASE_DIR . '/' . $folder;
            if (is_dir($fDir)) {
                $subEntries = array_diff(scandir($fDir), ['.', '..']);
                $filesData = [];
                $hasJson = false;
                $preview = null;

                foreach ($subEntries as $sub) {
                    $subPath = $fDir . '/' . $sub;
                    $size = @filesize($subPath) ?: 0;
                    $mtime = @filemtime($subPath) ? date('c', @filemtime($subPath)) : date('c');

                    if ($sub === 'product.json') {
                        $hasJson = true;
                        $content = @file_get_contents($subPath);
                        $preview = json_decode($content, true);
                    }

                    $filesData[] = [
                        'name' => $sub,
                        'size' => $size,
                        'modified' => $mtime,
                        'url' => 'storage/products/' . $folder . '/' . $sub
                    ];
                }

                $detailedFolders[] = [
                    'name' => $folder,
                    'path' => 'storage/products/' . $folder,
                    'files' => $filesData,
                    'hasProductJson' => $hasJson,
                    'productPreview' => $preview ? [
                        'id' => $preview['id'] ?? '',
                        'name' => $preview['name'] ?? '',
                        'price' => $preview['price'] ?? 0,
                        'styleCode' => $preview['styleCode'] ?? $folder,
                        'stock' => $preview['stock'] ?? 0,
                        'category' => $preview['category'] ?? ''
                    ] : null,
                    'modified' => date('c', @filemtime($fDir) ?: time())
                ];
            }
        }
    }

    // Fallback: If physical directories are not yet populated, generate previews from saved products
    if (empty($detailedFolders) && !empty($productList)) {
        foreach ($productList as $p) {
            $code = $p['styleCode'] ?? $p['id'] ?? 'product';
            $detailedFolders[] = [
                'name' => $code,
                'path' => 'storage/products/' . $code,
                'files' => [
                    [
                        'name' => 'product.json',
                        'size' => 1024,
                        'modified' => date('c'),
                        'url' => 'storage/products/' . $code . '/product.json'
                    ]
                ],
                'hasProductJson' => true,
                'productPreview' => [
                    'id' => $p['id'] ?? '',
                    'name' => $p['name'] ?? '',
                    'price' => $p['price'] ?? 0,
                    'styleCode' => $code,
                    'stock' => $p['stock'] ?? 0,
                    'category' => $p['category'] ?? ''
                ],
                'modified' => date('c')
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'count' => count($detailedFolders),
        'folders' => $detailedFolders,
        'folder_names' => array_map(fn($f) => $f['name'], $detailedFolders)
    ]);
    exit;
}

// ------------------------------------------------------------------------------
// 6. FETCH ALL PRODUCTS (GET /api/products, endpoint=products, action=products)
// ------------------------------------------------------------------------------
if ($method === 'GET' && (
    strpos($uri, 'api/products') !== false ||
    $endpoint === 'products' ||
    $action === 'products' ||
    $action === 'list'
)) {
    $productList = getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE);
    echo json_encode([
        'success' => true,
        'count' => count($productList),
        'products' => $productList,
        'folders' => array_map(function($p) {
            return $p['styleCode'] ?? $p['id'] ?? $p['name'] ?? 'product';
        }, $productList)
    ]);
    exit;
}

// ------------------------------------------------------------------------------
// 6. CREATE / SAVE PRODUCT (POST /api/products or POST /api/storage/create-folder)
// ------------------------------------------------------------------------------
$isProductSave = (
    ($method === 'POST' && (strpos($uri, 'api/products') !== false || $endpoint === 'products')) ||
    $action === 'create_product_folder' ||
    $action === 'save_product' ||
    isset($inputData['product']) ||
    isset($inputData['styleCode'])
);

if ($isProductSave) {
    $product = $inputData['product'] ?? $inputData;
    if (is_string($product)) {
        $product = json_decode($product, true) ?: [];
    }

    $productName = $product['name'] ?? $product['title'] ?? $product['product_name'] ?? $product['styleCode'] ?? '';

    if (empty($productName)) {
        echo json_encode(['success' => true, 'products' => getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE)]);
        exit;
    }

    $folderName = !empty($product['styleCode']) ? $product['styleCode'] : (!empty($product['id']) ? $product['id'] : ('product_' . time()));
    $safeFolder = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $folderName);
    $productDir = $STORAGE_BASE_DIR . '/' . $safeFolder;

    if (!is_dir($productDir)) {
        @mkdir($productDir, 0755, true);
    }

    $createdFiles = [];

    // Decode and save base64 Image if provided
    $savedImageUrl = null;
    if (!empty($product['image'])) {
        $imgData = $product['image'];
        if (preg_match('/^data:image\/(\w+);base64,/', $imgData, $typeMatch)) {
            $data = substr($imgData, strpos($imgData, ',') + 1);
            $type = strtolower($typeMatch[1]);
            if ($type === 'jpeg') $type = 'jpg';
            $decoded = base64_decode($data);
            if ($decoded !== false) {
                $imageFilename = 'image.' . $type;
                file_put_contents($productDir . '/' . $imageFilename, $decoded);
                $createdFiles[] = $imageFilename;

                $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
                $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
                $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
                $savedImageUrl = rtrim($scheme . '://' . $host . $scriptDir, '/') . '/storage/products/' . $safeFolder . '/' . $imageFilename;
                $product['image'] = $savedImageUrl;
            }
        } else if (strpos($imgData, 'http') === 0 || strpos($imgData, '/') === 0) {
            file_put_contents($productDir . '/image_source.txt', $imgData);
            $createdFiles[] = 'image_source.txt';
        }
    }

    // Save product.json metadata
    file_put_contents($productDir . '/product.json', json_encode($product, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    $createdFiles[] = 'product.json';

    // Save human-readable summary text file (info.txt)
    $infoContent = "========================================================\n"
                 . "THE ROYAL BENGAL - PRODUCT SPECIFICATION ARCHIVE\n"
                 . "========================================================\n"
                 . "Product Name:    " . ($product['name'] ?? 'N/A') . "\n"
                 . "Style Code / SKU: " . ($product['styleCode'] ?? $safeFolder) . "\n"
                 . "Category:        " . ($product['category'] ?? 'N/A') . "\n"
                 . "Price:           " . ($product['price'] ?? 0) . " " . ($product['currency'] ?? 'Tk.') . "\n"
                 . "Stock:           " . ($product['stock'] ?? 0) . " units\n"
                 . "Available Sizes: " . (is_array($product['sizes'] ?? null) ? implode(', ', $product['sizes']) : 'S, M, L, XL') . "\n"
                 . "Primary Color:   " . ($product['color'] ?? 'N/A') . "\n"
                 . "Fabric:          " . ($product['fabric'] ?? 'N/A') . "\n"
                 . "Updated At:      " . date('c') . "\n"
                 . "Description:\n" . ($product['description'] ?? 'No description provided.') . "\n"
                 . "========================================================\n";
    file_put_contents($productDir . '/info.txt', $infoContent);
    $createdFiles[] = 'info.txt';

    // Update master storage/products.json
    $allProducts = getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE);
    $prodIdx = -1;
    foreach ($allProducts as $i => $p) {
        if (($p['id'] ?? '') === ($product['id'] ?? '') || (!empty($product['styleCode']) && ($p['styleCode'] ?? '') === ($product['styleCode'] ?? ''))) {
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
        'success' => true,
        'message' => 'Product and folder saved successfully on your server storage!',
        'folder' => $safeFolder,
        'folder_path' => $productDir,
        'files_saved' => $createdFiles,
        'saved_image_url' => $savedImageUrl,
        'product' => $product
    ]);
    exit;
}

// ------------------------------------------------------------------------------
// 7. DELETE PRODUCT FOLDER (/api/products/:id or action=delete_product_folder)
// ------------------------------------------------------------------------------
if ($method === 'DELETE' || $action === 'delete_product_folder') {
    $folderName = $paramId ?: ($inputData['folder'] ?? ($inputData['id'] ?? ''));
    $safeFolder = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $folderName);
    $targetDir = $STORAGE_BASE_DIR . '/' . $safeFolder;

    if (is_dir($targetDir)) {
        $files = array_diff(scandir($targetDir), ['.', '..']);
        foreach ($files as $file) {
            @unlink($targetDir . '/' . $file);
        }
        @rmdir($targetDir);
    }

    $allProducts = getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE);
    $filtered = array_values(array_filter($allProducts, function($p) use ($folderName, $safeFolder) {
        return ($p['id'] ?? '') !== $folderName && ($p['styleCode'] ?? '') !== $folderName && ($p['styleCode'] ?? '') !== $safeFolder;
    }));
    file_put_contents($PRODUCTS_FILE, json_encode($filtered, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    echo json_encode(['success' => true, 'message' => "Product folder {$safeFolder} deleted from server."]);
    exit;
}

// ------------------------------------------------------------------------------
// 8. FALLBACK RESPONSE
// ------------------------------------------------------------------------------
echo json_encode([
    'success' => true,
    'message' => 'The Royal Bengal Storage & Order Persistence Handler is active.',
    'products' => getAllSavedProducts($STORAGE_BASE_DIR, $PRODUCTS_FILE),
    'orders_count' => count(getAllSavedOrders($ORDERS_BASE_DIR, $ORDERS_FILE))
]);
