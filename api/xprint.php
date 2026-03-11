<?php
/**
 * Network receipt printer backend.
 * Sends raw ESC/POS data to an Xprinter (or compatible) via TCP socket.
 * 
 * Configure PRINTER_IP and PRINTER_PORT below.
 * Default Xprinter port is 9100.
 */

// ── CORS Headers ──
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Configuration ──
define('PRINTER_IP',   '192.168.1.100');  // Change to your printer's IP address
define('PRINTER_PORT', 9100);             // Default ESC/POS raw print port
define('TIMEOUT_SEC',  3);

// ── Test connection ──
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['test'])) {
    $sock = @fsockopen(PRINTER_IP, PRINTER_PORT, $errno, $errstr, TIMEOUT_SEC);
    if ($sock) {
        fclose($sock);
        echo json_encode(['success' => true, 'message' => 'Printer bereikbaar op ' . PRINTER_IP . ':' . PRINTER_PORT]);
    } else {
        http_response_code(503);
        echo json_encode(['success' => false, 'error' => "Kan printer niet bereiken ($errno): $errstr"]);
    }
    exit;
}

// ── Print receipt ──
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['receipt'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Geen bondata ontvangen']);
        exit;
    }

    $receipt = $input['receipt'];

    $sock = @fsockopen(PRINTER_IP, PRINTER_PORT, $errno, $errstr, TIMEOUT_SEC);
    if (!$sock) {
        http_response_code(503);
        echo json_encode(['success' => false, 'error' => "Printer niet bereikbaar ($errno): $errstr"]);
        exit;
    }

    $written = @fwrite($sock, $receipt);
    fclose($sock);

    if ($written === false || $written === 0) {
        echo json_encode(['success' => false, 'error' => 'Kon niet naar printer schrijven']);
    } else {
        echo json_encode(['success' => true, 'message' => 'Bon verstuurd (' . $written . ' bytes)', 'bytes' => $written]);
    }
    exit;
}

// ── Unknown request ──
http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Methode niet toegestaan']);

