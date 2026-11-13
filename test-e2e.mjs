/**
 * E2E Automated Verification Test for SalesPulse Dashboard
 * Connects to Headless Chrome via native WebSocket CDP.
 */

import { spawn } from 'child_process';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve('index.html').replace(/\\/g, '/');
const fileUrl = `file:///${htmlPath}`;
const port = 9333;

console.log('Starting headless Chrome on port', port, 'pointing to', fileUrl);

const chromeProc = spawn(chromePath, [
  `--remote-debugging-port=${port}`,
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--user-data-dir=' + path.resolve('.chrome-test-profile'),
  fileUrl
]);

chromeProc.stderr.on('data', (d) => {
  // Silent Chrome internal logs
});

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  await sleep(1500);

  // Fetch targets
  let targetWs = null;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find(t => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        targetWs = page.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {
      await sleep(500);
    }
  }

  if (!targetWs) {
    console.error('Failed to connect to Chrome CDP targets');
    chromeProc.kill();
    process.exit(1);
  }

  console.log('Connecting to WebSocket CDP at:', targetWs);
  const ws = new WebSocket(targetWs);

  let idCounter = 1;
  const pending = new Map();
  const consoleMessages = [];
  const pageErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push(msg.params);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(msg.params);
    }
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  await new Promise(r => ws.onopen = r);

  function send(method, params = {}) {
    const id = idCounter++;
    return new Promise(resolve => {
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.result && res.result.exceptionDetails) {
      throw new Error(JSON.stringify(res.result.exceptionDetails));
    }
    return res.result?.result?.value;
  }

  // Enable Runtime and Page domains
  await send('Runtime.enable');
  await send('Page.enable');

  await sleep(1000);

  console.log('\n--- TEST SUITE 1: Initialization & Baseline Data ---');
  const title = await evaluate('document.title');
  console.log('Page Title:', title);

  const totalRecords = await evaluate('window.dataStore.getAll().length');
  console.log('Default Seed Records in localStorage:', totalRecords);
  if (totalRecords < 20) throw new Error('Insufficient default records');

  console.log('\n--- TEST SUITE 2: KPI Calculation Accuracy ---');
  const kpiRev = await evaluate('document.getElementById("kpiRevenueValue").textContent');
  const kpiOrders = await evaluate('document.getElementById("kpiOrdersValue").textContent');
  const kpiAov = await evaluate('document.getElementById("kpiAovValue").textContent');
  const kpiCust = await evaluate('document.getElementById("kpiCustomersValue").textContent');
  console.log(`KPIs -> Revenue: ${kpiRev}, Orders: ${kpiOrders}, AOV: ${kpiAov}, Customers: ${kpiCust}`);
  if (kpiRev === '$0' || kpiOrders === '0') throw new Error('KPIs not calculated');

  console.log('\n--- TEST SUITE 3: Dynamic Insights Generation ---');
  const bestProd = await evaluate('document.getElementById("insightTopProduct").querySelector(".insight-main-val")?.textContent');
  const bestChan = await evaluate('document.getElementById("insightTopChannel").querySelector(".insight-main-val")?.textContent');
  const peakDay = await evaluate('document.getElementById("insightPeakDay").querySelector(".insight-main-val")?.textContent');
  console.log(`Insights -> Top Product: "${bestProd}", Top Channel: "${bestChan}", Peak Day: "${peakDay}"`);
  if (!bestProd || !bestChan) throw new Error('Dynamic insights missing');

  console.log('\n--- TEST SUITE 4: Table Filtering & Search ---');
  // Test search
  await evaluate(`
    window.uiController.tableState.searchQuery = 'EdgeRouter';
    window.uiController.renderOrdersTable();
  `);
  let visibleRows = await evaluate('document.querySelectorAll("#ordersTableBody tr").length');
  console.log('Visible rows with searchQuery="EdgeRouter":', visibleRows);
  if (visibleRows === 0) throw new Error('Search failed');

  // Clear search
  await evaluate(`
    window.uiController.tableState.searchQuery = '';
    window.uiController.tableState.statusFilter = 'completed';
    window.uiController.renderOrdersTable();
  `);
  let completedCount = await evaluate('document.querySelectorAll("#ordersTableBody tr").length');
  console.log('Visible rows with statusFilter="completed":', completedCount);

  // Reset filters
  await evaluate(`
    window.uiController.tableState.statusFilter = 'all';
    window.uiController.renderOrdersTable();
  `);

  console.log('\n--- TEST SUITE 5: Sorting & Pagination ---');
  // Sort by amount ascending
  await evaluate(`
    window.uiController.tableState.sortField = 'amount';
    window.uiController.tableState.sortOrder = 'asc';
    window.uiController.renderOrdersTable();
  `);
  const firstAmt = await evaluate('document.querySelector("#ordersTableBody tr .amount-val").textContent');
  console.log('Lowest amount row after asc sort:', firstAmt);

  // Sort by amount descending
  await evaluate(`
    window.uiController.tableState.sortOrder = 'desc';
    window.uiController.renderOrdersTable();
  `);
  const highestAmt = await evaluate('document.querySelector("#ordersTableBody tr .amount-val").textContent');
  console.log('Highest amount row after desc sort:', highestAmt);

  console.log('\n--- TEST SUITE 6: Adding, Updating & Deleting Records (CRUD) ---');
  // Add record
  const newRecord = await evaluate(`
    window.dataStore.add({
      customerName: 'Test Enterprise User',
      customerEmail: 'test.user@e2e.io',
      product: 'Apex Cloud Enterprise',
      category: 'Cloud',
      channel: 'Direct Sales',
      amount: 5500.00,
      paymentStatus: 'Paid',
      orderStatus: 'Completed',
      paymentMethod: 'Wire Transfer'
    })
  `);
  console.log('Added new record:', newRecord.id);

  let updatedCount = await evaluate('window.dataStore.getAll().length');
  if (updatedCount !== totalRecords + 1) throw new Error('Record count mismatch after add');

  // Verify in table
  await evaluate('window.uiController.refreshAll()');
  const foundNew = await evaluate(`document.body.innerText.includes('test.user@e2e.io')`);
  console.log('New record rendered in UI:', foundNew);
  if (!foundNew) throw new Error('New record not rendered in DOM');

  // Delete the record
  await evaluate(`window.dataStore.delete('${newRecord.id}')`);
  let afterDeleteCount = await evaluate('window.dataStore.getAll().length');
  console.log('Record count after delete:', afterDeleteCount);
  if (afterDeleteCount !== totalRecords) throw new Error('Delete failed');

  console.log('\n--- TEST SUITE 7: Navigation & View Switching ---');
  await evaluate(`window.uiController.switchView('products')`);
  let isProductsVisible = await evaluate(`document.getElementById('view-products').style.display === 'block'`);
  console.log('Products view visible:', isProductsVisible);

  await evaluate(`window.uiController.switchView('customers')`);
  let isCustomersVisible = await evaluate(`document.getElementById('view-customers').style.display === 'block'`);
  console.log('Customers view visible:', isCustomersVisible);

  await evaluate(`window.uiController.switchView('reports')`);
  let isReportsVisible = await evaluate(`document.getElementById('view-reports').style.display === 'block'`);
  console.log('Reports view visible:', isReportsVisible);

  await evaluate(`window.uiController.switchView('settings')`);
  let isSettingsVisible = await evaluate(`document.getElementById('view-settings').style.display === 'block'`);
  console.log('Settings view visible:', isSettingsVisible);

  await evaluate(`window.uiController.switchView('overview')`);
  let isOverviewVisible = await evaluate(`document.getElementById('view-overview').style.display === 'block'`);
  console.log('Returned to Overview view:', isOverviewVisible);

  console.log('\n--- TEST SUITE 8: Console Errors Verification ---');
  console.log('Total console API messages captured:', consoleMessages.length);
  console.log('Total unhandled JS exceptions:', pageErrors.length);
  if (pageErrors.length > 0) {
    console.error('Unhandled exceptions detected:', pageErrors);
    throw new Error('JavaScript exceptions were thrown on page!');
  }

  console.log('\n========================================');
  console.log(' ALL E2E AUTOMATED TESTS PASSED CLEANLY!');
  console.log('========================================\n');

  ws.close();
  chromeProc.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('E2E TEST FAILURE:', err);
  chromeProc.kill();
  process.exit(1);
});

