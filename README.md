# SalesPulse &mdash; Commercial Sales Analytics Dashboard

A modern, high-performance **Sales Analytics Dashboard** built with Vanilla HTML5, Pure CSS3, and JavaScript (ES6+). Engineered with a strong emphasis on visual hierarchy, usability, data clarity, and client-side persistence.

![SalesPulse Dashboard Preview](https://img.shields.io/badge/SalesPulse-v1.0-4f46e5?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/HTML5-CSS3-JavaScript-blue?style=for-the-badge)
![Zero Frameworks](https://img.shields.io/badge/Vanilla-Zero%20Frameworks-emerald?style=for-the-badge)

---

## Key Features

- **Direct Dashboard Launch**: Opens immediately into the core operational dashboard without authentication friction.
- **Dynamic KPI Metrics**: Real-time calculations for Total Revenue, Total Orders, Average Order Value (AOV), and Active Customers with period-over-period percentage indicators and canvas sparklines.
- **Interactive Visualizations**:
  - **Sales Performance Area Chart**: Multi-timeline trajectory with Daily, Weekly, Monthly, and Yearly views compared against baseline benchmarks.
  - **Category Distribution Donut**: Visual revenue contribution with custom interactive legends.
  - **Channel Velocity Bar Chart**: Sales volume breakdown across Direct Sales, Online Stores, Partners, and Marketplaces.
- **Automated Business Insights**: Algorithmic detection of top-performing SKUs, leading channels, peak revenue days, and period momentum.
- **Full Transaction Ledger**:
  - Live multi-field search (Customer name, Email, Product, Order ID, Category).
  - Status and payment filtering.
  - Interactive multi-column sorting (Date, Amount, Customer, Status).
  - Clean pagination controls.
- **Complete CRUD Operations**: Create, view, edit, and safely delete sales records via modal dialogues with live recalculation.
- **Data Persistence & Export**:
  - Automatically persists all state into browser `localStorage`.
  - RFC-compliant CSV export for tabular data analysis.
  - Sample dataset reset capability.
- **Responsive Design**: Fluid layout adapting cleanly across desktop, tablet, and mobile screens with a slide-out drawer on smaller viewports.

---

## Tech Stack & Architecture

- **Markup**: Semantic HTML5.
- **Styling**: Pure CSS3 with direct standard declarations (zero CSS variables or custom properties).
- **Logic**: Vanilla ES6+ JavaScript structured into modular layers:
  - `js/data.js`: Data store, seed generation, CRUD operations, and CSV export.
  - `js/analytics.js`: KPI calculations, comparisons, time series, and dynamic insights.
  - `js/charts.js`: Chart.js rendering and custom canvas sparklines.
  - `js/ui.js`: DOM event orchestration, modals, tables, and notifications.
  - `js/app.js`: Application lifecycle coordinator.
- **Visual Assets**: Lucide Icons via CDN & Chart.js via CDN.

---

## Getting Started

### Option 1: Direct File
Open `index.html` directly in any modern web browser.

### Option 2: Local Server
Run the lightweight built-in Node server:
```bash
node server.js
```
Then visit `http://127.0.0.1:5500/` in your browser.
