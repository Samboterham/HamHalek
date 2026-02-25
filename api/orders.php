<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['items'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No items provided']);
    exit();
}

try {
    $pdo->beginTransaction();

    // Calculate total
    $priceTotal = 0;
    foreach ($input['items'] as $item) {
        $priceTotal += $item['price'] * $item['quantity'];
    }

    // Generate pickup number (1-99), cycling through
    $stmt = $pdo->query('SELECT MAX(pickup_number) AS last_num FROM orders WHERE DATE(datetime) = CURDATE()');
    $row = $stmt->fetch();
    $pickupNumber = ($row['last_num'] ?? 0) % 99 + 1;

    // Insert order
    $stmt = $pdo->prepare('
        INSERT INTO orders (order_status_id, pickup_number, price_total, datetime)
        VALUES (2, :pickup, :total, NOW())
    ');
    $stmt->execute([
        'pickup' => $pickupNumber,
        'total'  => $priceTotal,
    ]);
    $orderId = $pdo->lastInsertId();

    // Insert order items
    $stmt = $pdo->prepare('
        INSERT INTO order_product (order_id, product_id, price)
        VALUES (:order_id, :product_id, :price)
    ');

    foreach ($input['items'] as $item) {
        // Insert one row per quantity
        for ($i = 0; $i < $item['quantity']; $i++) {
            $stmt->execute([
                'order_id'   => $orderId,
                'product_id' => $item['product_id'],
                'price'      => $item['price'],
            ]);
        }
    }

    $pdo->commit();

    echo json_encode([
        'success'       => true,
        'order_id'      => (int) $orderId,
        'pickup_number' => $pickupNumber,
        'price_total'   => number_format($priceTotal, 2, '.', ''),
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Order failed: ' . $e->getMessage()]);
}
