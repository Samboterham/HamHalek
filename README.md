# Ham Halek Kiosk

**Ham Halek (Happy Herbivore)** is a 100% plant-based kiosk application designed for a seamless, sustainable, and delicious ordering experience.

## ✨ Features
- **Attract Screen**: Dynamic rotation of featured products to engage customers.
- **Multilingual Support**: Fully localized interface supporting multiple languages (English, Dutch, Chinese, and more).
- **Smooth Ordering Flow**: Intuitive category navigation and product selection.
- **Upsell & Tip Integration**: Encourages additional sales and supports staff with integrated tipping modules.
- **Automated Receipt Printing**: Automatic printing of ESC/POS receipts upon order confirmation (Supports USB and Network printers).
- **Responsive Management**: Backend integration for real-time menu and order tracking.

## 🛠️ Technology Stack
- **Frontend**: [Vite](https://vitejs.dev/) & Vanilla JavaScript for low-latency, performance-driven UI.
- **Styling**: Modern, premium CSS with glassmorphism and smooth animations.
- **Backend**: PHP 8.x for API endpoints and persistent data storage.
- **Database**: MySQL for robust order and menu management.
- **Printing**: Integrated WebUSB and PHP-socket based ESC/POS systems.

## ⚙️ Configuration
### 🖨️ Printer Settings
The network printer configuration is located in:
`api/xprint.php`: Update the `$PRINTER_IP` (Currently: `192.168.1.100`) to match your printer's IP address.

### 🗄️ Database Settings
Database connection details can be found in:
`api/config.php`

## 🚀 Deployment & Build
To build the latest version of the frontend after making changes:
```bash
npm run build
```
The compiled files will be located in the `dist/` directory.

---
[Trello Board](https://trello.com/b/dVUwk9lt/hamhalek) | [Wireframes](https://slate-oval-22868382.figma.site/)
