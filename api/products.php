<?php
require_once __DIR__ . '/config.php';

$sql = '
    SELECT p.product_id, p.category_id, p.name, p.description, p.price, p.kcal, p.available,
           i.filename AS image_filename
    FROM products p
    LEFT JOIN images i ON p.image_id = i.image_id
    WHERE p.available = 1
';

$params = [];

if (isset($_GET['category_id'])) {
    $sql .= ' AND p.category_id = :category_id';
    $params['category_id'] = (int) $_GET['category_id'];
}

$sql .= ' ORDER BY p.product_id';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

echo json_encode($products);
