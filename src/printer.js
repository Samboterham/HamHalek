/**
 * printer.js — Receipt printing module for the Ham Halek kiosk
 * Supports USB (WebUSB) and network (PHP backend) printing
 */

// ── USB Printer Setup ──────────────────────────────────────────

const PRINTER_VENDORS = [
    0x0483, // STM Microelectronics (Xprinter)
    0x04b8, // Seiko Epson
    0x0456, // Microtek
    0x067b, // Prolific Technology
];

let selectedDevice = null;

/**
 * Try to auto-detect a previously authorized USB printer,
 * or silently give up (no user prompt on page load).
 */
async function autoDetectPrinter() {
    try {
        if (!navigator.usb) return false;

        const devices = await navigator.usb.getDevices();
        const printer = devices.find(d => PRINTER_VENDORS.includes(d.vendorId));

        if (printer) {
            selectedDevice = printer;
            console.log('[Printer] Auto-detected:', printer.productName || printer.manufacturerName);
            return true;
        }
    } catch (err) {
        console.warn('[Printer] Auto-detect failed:', err);
    }
    return false;
}

/**
 * Prompt user to select a USB printer (requires user gesture).
 */
export async function selectUSBPrinter() {
    try {
        if (!navigator.usb) {
            console.warn('[Printer] WebUSB not supported');
            return false;
        }

        const filters = PRINTER_VENDORS.map(vendorId => ({ vendorId }));
        selectedDevice = await navigator.usb.requestDevice({ filters });
        console.log('[Printer] Selected:', selectedDevice.productName || selectedDevice.manufacturerName);
        return true;
    } catch (err) {
        if (err.name !== 'NotFoundError') {
            console.warn('[Printer] Select failed:', err);
        }
        return false;
    }
}

// ── Receipt Builder (ESC/POS) ──────────────────────────────────

const ESC = '\x1B';
const GS = '\x1D';
const LINE_WIDTH = 42; // typical 80mm thermal printer char width

function center(text) {
    const pad = Math.max(0, Math.floor((LINE_WIDTH - text.length) / 2));
    return ' '.repeat(pad) + text;
}

function lineItem(qty, name, price) {
    const left = `${qty}x ${name}`;
    const right = `EUR ${price.toFixed(2).padStart(6)}`;
    const gap = Math.max(1, LINE_WIDTH - left.length - right.length);
    return left + ' '.repeat(gap) + right;
}

function labelValue(label, value) {
    const right = `EUR ${value.toFixed(2).padStart(6)}`;
    const gap = Math.max(1, LINE_WIDTH - label.length - right.length);
    return label + ' '.repeat(gap) + right;
}

/**
 * Build ESC/POS receipt from order data.
 */
export function buildReceipt(cart, orderNumber, orderType, tip, total) {
    const separator = '='.repeat(LINE_WIDTH);
    const thinSep = '-'.repeat(LINE_WIDTH);

    let receipt = '';

    // Init printer
    receipt += ESC + '@';

    // Header — centered
    receipt += ESC + 'a' + '\x01'; // center
    receipt += '\n';
    receipt += 'Ham Halek\n';
    receipt += '100% Plant-Based\n';
    receipt += '\n';

    // Left align for body
    receipt += ESC + 'a' + '\x00';
    receipt += separator + '\n';

    // Order info
    const orderLabel = `Order #${orderNumber}`;
    const typeLabel = orderType === 'eat-in' ? 'Eat In' : 'Takeaway';
    const infoGap = Math.max(1, LINE_WIDTH - orderLabel.length - typeLabel.length);
    receipt += orderLabel + ' '.repeat(infoGap) + typeLabel + '\n';

    receipt += separator + '\n';
    receipt += '\n';

    // Items
    cart.forEach(item => {
        const price = parseFloat(item.product.price) * item.quantity;
        receipt += lineItem(item.quantity, item.product.name, price) + '\n';
    });

    receipt += thinSep + '\n';

    // Tip (if any)
    if (tip > 0) {
        receipt += labelValue('Tip:', tip) + '\n';
    }

    // Total — bold
    receipt += ESC + 'E' + '\x01'; // bold on
    receipt += labelValue('TOTAL:', total) + '\n';
    receipt += ESC + 'E' + '\x00'; // bold off

    receipt += separator + '\n';
    receipt += '\n';

    // Footer — centered
    receipt += ESC + 'a' + '\x01';
    receipt += 'Thank you for your visit!\n';
    receipt += 'Bedankt voor uw bezoek!\n';
    receipt += '\n\n\n';

    // Cut paper
    receipt += GS + 'V' + '\x00';

    return receipt;
}

// ── Print via USB ──────────────────────────────────────────────

async function printUSB(receiptData) {
    if (!selectedDevice) {
        console.warn('[Printer] No USB device selected');
        return false;
    }

    try {
        await selectedDevice.open();

        if (selectedDevice.configuration === null) {
            await selectedDevice.selectConfiguration(1);
        }

        try {
            await selectedDevice.claimInterface(0);
        } catch (e) {
            console.log('[Printer] Interface already claimed, continuing...');
        }

        const encoder = new TextEncoder();
        const intf = selectedDevice.configuration.interfaces[0].alternates[0];
        const endpoint = intf.endpoints.find(e => e.direction === 'out');

        if (!endpoint) {
            throw new Error('Output endpoint not found');
        }

        await selectedDevice.transferOut(endpoint.endpointNumber, encoder.encode(receiptData));
        console.log('[Printer] USB print successful');

        setTimeout(() => {
            selectedDevice.close().catch(() => { });
        }, 1000);

        return true;
    } catch (err) {
        console.warn('[Printer] USB print failed:', err);
        try { selectedDevice.close().catch(() => { }); } catch (_) { }
        return false;
    }
}

// ── Print via Network (PHP) ────────────────────────────────────

async function printNetwork(receiptData) {
    try {
        const response = await fetch('api/xprint.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'print', receipt: receiptData }),
        });

        const data = await response.json();

        if (data.success) {
            console.log('[Printer] Network print successful');
            return true;
        } else {
            console.warn('[Printer] Network print error:', data.error);
            return false;
        }
    } catch (err) {
        console.warn('[Printer] Network print failed:', err);
        return false;
    }
}

// ── Main Print Function ────────────────────────────────────────

/**
 * Build and print a receipt. Tries USB first, falls back to network.
 * Fails silently (console warnings only — no UI errors).
 *
 * @param {Array} cart - Cart items from state
 * @param {number|string} orderNumber - The order/pickup number
 * @param {string} orderType - 'eat-in' or 'takeaway'
 * @param {number} tip - Tip amount
 * @param {number} total - Order total including tip
 * @returns {Promise<boolean>} true if printed successfully
 */
export async function printReceipt(cart, orderNumber, orderType, tip, total) {
    const receiptData = buildReceipt(cart, orderNumber, orderType, tip, total);

    // Try USB first
    if (selectedDevice) {
        const usbOk = await printUSB(receiptData);
        if (usbOk) return true;
    }

    // Fall back to network
    const netOk = await printNetwork(receiptData);
    return netOk;
}

// ── Init ───────────────────────────────────────────────────────

// Auto-detect printer on load (no user prompt)
autoDetectPrinter();
