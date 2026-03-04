<?php
/**
 * xprint.php — Network receipt printing endpoint for ESC/POS printers
 * 
 * Configure your printer IP and port below.
 * 
 * Usage:
 *   GET  ?test=1              — test printer connectivity
 *   POST { action: 'print', receipt: '...' } — send receipt to printer
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Configuration ──────────────────────────────────────────────
// Change these to match your Xprinter network settings
$PRINTER_IP   = '192.168.1.100';  // Your printer's IP address
$PRINTER_PORT = 9100;              // Default ESC/POS port
$TIMEOUT      = 3;                 // Connection timeout in seconds

// ── Test Connection ────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['test'])) {
    $socket = @fsockopen($PRINTER_IP, $PRINTER_PORT, $errno, $errstr, $TIMEOUT);
    
    if ($socket) {
        fclose($socket);
        echo json_encode(['success' => true, 'message' => 'Printer is reachable']);
    } else {
        http_response_code(503);
        echo json_encode(['success' => false, 'error' => "Cannot connect: $errstr ($errno)"]);
    }
    exit;
}

// ── Print Receipt ──────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['action']) || $input['action'] !== 'print') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid request. Expected { action: "print", receipt: "..." }']);
        exit;
    }
    
    if (!isset($input['receipt']) || empty($input['receipt'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Receipt data is empty']);
        exit;
    }
    
    $receipt = $input['receipt'];
    $socket = @fsockopen($PRINTER_IP, $PRINTER_PORT, $errno, $errstr, $TIMEOUT);
    
    if (!$socket) {
        http_response_code(503);
        echo json_encode(['success' => false, 'error' => "Cannot connect to printer: $errstr ($errno)"]);
        exit;
    }
    
    $written = fwrite($socket, $receipt);
    fclose($socket);
    
    if ($written === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to write to printer']);
    } else {
        echo json_encode(['success' => true, 'message' => 'Receipt printed successfully', 'bytes' => $written]);
    }
    exit;
}

// ── Fallback ───────────────────────────────────────────────────
http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
