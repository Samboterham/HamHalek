<?php
require_once __DIR__ . '/config.php';

$stmt = $pdo->query('SELECT category_id, name, description FROM categories ORDER BY category_id');
$categories = $stmt->fetchAll();

echo json_encode($categories);
