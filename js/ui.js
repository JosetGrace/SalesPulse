/**
 * SalesPulse - UI Controller & DOM Management
 * Handles table sorting, search, filtering, pagination, modals, dropdowns, views, and toasts.
 */

class UIController {
  constructor() {
    this.currentPreset = 'last-30';
    this.currentView = 'overview';
    this.performanceMode = 'daily';

    // Orders table state
    this.tableState = {
      searchQuery: '',
      statusFilter: 'all',
      paymentFilter: 'all',
      sortField: 'date',
      sortOrder: 'desc',
      currentPage: 1,
      pageSize: 8
    };

    // Modal state
    this.activeModalRecordId = null;

    // Toast queue
    this.toastTimeout = null;
  }

  init() {
    this.bindEvents();
    this.bindGlobalListeners();
    this.renderNotifications();
  }

  bindEvents() {
    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('mobileSidebarToggle');
    const sidebar = document.getElementById('appSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (backdrop) backdrop.classList.toggle('active');
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('open');
        backdrop.classList.remove('active');
      });
    }

    // Sidebar navigation items
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        this.switchView(view);

        // Close mobile drawer on navigation
        if (sidebar && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
          if (backdrop) backdrop.classList.remove('active');
        }
      });
    });

    // Date range selector dropdown
    const dateRangeBtn = document.getElementById('dateRangeBtn');
    const dateRangeMenu = document.getElementById('dateRangeDropdown');
    if (dateRangeBtn && dateRangeMenu) {
      dateRangeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeAllDropdowns(dateRangeMenu);
        dateRangeMenu.classList.toggle('open');
      });

      const options = dateRangeMenu.querySelectorAll('.dropdown-item[data-range]');
      options.forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.preventDefault();
          const range = opt.getAttribute('data-range');
          const label = opt.textContent.trim();
          this.setPresetRange(range, label);
          dateRangeMenu.classList.remove('open');
        });
      });
    }

    // Performance chart mode buttons (Daily, Weekly, Monthly, Yearly)
    const modeButtons = document.querySelectorAll('.chart-toggle-btn[data-mode]');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.performanceMode = btn.getAttribute('data-mode');
        this.refreshPerformanceChart();
      });
    });

    // Notification dropdown toggle
    const notifBtn = document.getElementById('notificationBtn');
    const notifDropdown = document.getElementById('notificationDropdown');
    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeAllDropdowns(notifDropdown);
        notifDropdown.classList.toggle('open');
      });
    }

    // User profile dropdown toggle
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileBtn && profileDropdown) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeAllDropdowns(profileDropdown);
        profileDropdown.classList.toggle('open');
      });
    }

    // Quick Actions
    const addSaleBtn = document.getElementById('quickAddSaleBtn');
    if (addSaleBtn) {
      addSaleBtn.addEventListener('click', () => {
        this.openAddModal();
      });
    }

    const exportBtn = document.getElementById('quickExportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const records = this.getFilteredOrdersList();
        const success = window.dataStore.exportCSV(records);
        if (success) {
          this.showToast('Sales data exported to CSV successfully.', 'success');
        } else {
          this.showToast('No records available to export.', 'warning');
        }
      });
    }

    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all data back to the default sample dataset?')) {
          window.dataStore.reset();
          this.showToast('Sample dataset restored successfully.', 'info');
        }
      });
    }

    // Orders table search input
    const tableSearch = document.getElementById('tableSearchInput');
    if (tableSearch) {
      tableSearch.addEventListener('input', (e) => {
        this.tableState.searchQuery = e.target.value.trim().toLowerCase();
        this.tableState.currentPage = 1;
        this.renderOrdersTable();
      });
    }

    // Orders table status filter
    const statusFilter = document.getElementById('statusFilterSelect');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.tableState.statusFilter = e.target.value;
        this.tableState.currentPage = 1;
        this.renderOrdersTable();
      });
    }

    // Orders table payment filter
    const paymentFilter = document.getElementById('paymentFilterSelect');
    if (paymentFilter) {
      paymentFilter.addEventListener('change', (e) => {
        this.tableState.paymentFilter = e.target.value;
        this.tableState.currentPage = 1;
        this.renderOrdersTable();
      });
    }

    // Sortable table headers
    const sortHeaders = document.querySelectorAll('.sortable-th[data-sort]');
    sortHeaders.forEach(th => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort');
        if (this.tableState.sortField === field) {
          this.tableState.sortOrder = this.tableState.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          this.tableState.sortField = field;
          this.tableState.sortOrder = 'desc';
        }
        this.updateSortHeaders();
        this.renderOrdersTable();
      });
    });

    // Pagination controls
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => {
        if (this.tableState.currentPage > 1) {
          this.tableState.currentPage--;
          this.renderOrdersTable();
        }
      });
    }
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => {
        const total = this.getFilteredOrdersList().length;
        const maxPage = Math.max(1, Math.ceil(total / this.tableState.pageSize));
        if (this.tableState.currentPage < maxPage) {
          this.tableState.currentPage++;
          this.renderOrdersTable();
        }
      });
    }

    // Global Top Search Input
    const globalSearchInput = document.getElementById('globalSearchInput');
    if (globalSearchInput) {
      globalSearchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        this.tableState.searchQuery = val;
        this.tableState.currentPage = 1;
        if (tableSearch) tableSearch.value = val;
        this.renderOrdersTable();
      });
    }

    // Modal Form Submissions
    const saleForm = document.getElementById('saleForm');
    if (saleForm) {
      saleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveSale();
      });
    }

    // Close Modal triggers
    document.querySelectorAll('[data-close-modal]').forEach(el => {
      el.addEventListener('click', () => {
        this.closeAllModals();
      });
    });

    // Confirm Delete button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => {
        if (this.activeModalRecordId) {
          const id = this.activeModalRecordId;
          const deleted = window.dataStore.delete(id);
          this.closeAllModals();
          if (deleted) {
            this.showToast(`Order ${id} deleted successfully.`, 'info');
          }
        }
      });
    }
  }

  bindGlobalListeners() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      this.closeAllDropdowns();
    });

    // Keyboard escape to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
        this.closeAllDropdowns();
      }
    });

    // Listen for dataStore changes
    window.addEventListener('salespulse:datachange', () => {
      this.refreshAll();
    });
  }

  closeAllDropdowns(except = null) {
    const dropdowns = document.querySelectorAll('.dropdown-menu.open');
    dropdowns.forEach(dd => {
      if (dd !== except) {
        dd.classList.remove('open');
      }
    });
  }

  setPresetRange(preset, label) {
    this.currentPreset = preset;
    const labelEl = document.getElementById('selectedDateRangeLabel');
    if (labelEl) {
      labelEl.textContent = label;
    }
    this.refreshAll();
    this.showToast(`Analytics updated for: ${label}`, 'info');
  }

  switchView(viewName) {
    this.currentView = viewName;

    // Update sidebar navigation active item
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update view panels visibility
    const views = document.querySelectorAll('.dashboard-view');
    views.forEach(v => {
      if (v.id === `view-${viewName}`) {
        v.style.display = 'block';
      } else {
        v.style.display = 'none';
      }
    });

    // Update top header title & subtitle dynamically
    const headerTitle = document.getElementById('pageTitle');
    const headerSubtitle = document.getElementById('pageSubtitle');

    const viewTitles = {
      overview: {
        title: 'Sales Analytics Overview',
        subtitle: 'Real-time performance metrics, revenue trajectories, and conversion health.'
      },
      sales: {
        title: 'Sales & Revenue Analysis',
        subtitle: 'Comprehensive financial tracking, deals pipeline, and channel performance.'
      },
      orders: {
        title: 'Order Management',
        subtitle: 'Full transaction ledger, fulfillment status, and customer receipt logs.'
      },
      products: {
        title: 'Product Catalog Performance',
        subtitle: 'Merchandise velocity, margin distribution, and SKU-level statistics.'
      },
      customers: {
        title: 'Customer Directory & Accounts',
        subtitle: 'Client transaction histories, retention rates, and account valuations.'
      },
      reports: {
        title: 'Executive Reports & Audits',
        subtitle: 'Consolidated commercial reporting, automated ledgers, and data compliance.'
      },
      settings: {
        title: 'Application Preferences',
        subtitle: 'Data persistence management, sample seed control, and display configs.'
      }
    };

    const info = viewTitles[viewName] || viewTitles.overview;
    if (headerTitle) headerTitle.textContent = info.title;
    if (headerSubtitle) headerSubtitle.textContent = info.subtitle;

    // Render view-specific content if needed
    if (viewName === 'sales') {
      this.renderSalesView();
    } else if (viewName === 'orders') {
      this.renderOrdersView();
    } else if (viewName === 'products') {
      this.renderProductsView();
    } else if (viewName === 'customers') {
      this.renderCustomersView();
    } else if (viewName === 'reports') {
      this.renderReportsView();
    } else if (viewName === 'settings') {
      this.renderSettingsView();
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Main refresh cycle for dashboard
   */
  refreshAll() {
    const range = window.analyticsEngine.getPresetRange(this.currentPreset);
    const allRecords = window.dataStore.getAll();

    const currentRecords = window.analyticsEngine.filterByDateRange(
      allRecords,
      range.current.start,
      range.current.end
    );

    const prevRecords = window.analyticsEngine.filterByDateRange(
      allRecords,
      range.previous.start,
      range.previous.end
    );

    // 1. Refresh KPIs
    this.renderKPIs(currentRecords, prevRecords);

    // 2. Refresh Performance Chart
    this.refreshPerformanceChart(currentRecords, prevRecords, range);

    // 3. Refresh Category Donut Chart
    this.refreshCategoryBreakdown(currentRecords);

    // 4. Refresh Channels Chart
    this.refreshChannelBreakdown(currentRecords);

    // 5. Refresh Top Products list
    this.renderTopProducts(currentRecords);

    // 6. Refresh Dynamic Insights
    this.renderInsights(currentRecords, prevRecords);

    // 7. Refresh Orders Table
    this.renderOrdersTable();

    // Re-render Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderKPIs(currentRecords, prevRecords) {
    const kpis = window.analyticsEngine.computeKPIs(currentRecords, prevRecords);

    // Card 1: Revenue
    const revVal = document.getElementById('kpiRevenueValue');
    const revBadge = document.getElementById('kpiRevenueBadge');
    if (revVal) revVal.textContent = kpis.revenue.formatted;
    if (revBadge) {
      this.setKpiBadge(revBadge, kpis.revenue.change, kpis.revenue.isPositive);
    }
    window.chartManager.drawSparkline('kpiRevenueSparkline', kpis.revenue.sparkline, kpis.revenue.isPositive);

    // Card 2: Orders
    const ordVal = document.getElementById('kpiOrdersValue');
    const ordBadge = document.getElementById('kpiOrdersBadge');
    if (ordVal) ordVal.textContent = kpis.orders.formatted;
    if (ordBadge) {
      this.setKpiBadge(ordBadge, kpis.orders.change, kpis.orders.isPositive);
    }
    window.chartManager.drawSparkline('kpiOrdersSparkline', kpis.orders.sparkline, kpis.orders.isPositive);

    // Card 3: AOV
    const aovVal = document.getElementById('kpiAovValue');
    const aovBadge = document.getElementById('kpiAovBadge');
    if (aovVal) aovVal.textContent = kpis.aov.formatted;
    if (aovBadge) {
      this.setKpiBadge(aovBadge, kpis.aov.change, kpis.aov.isPositive);
    }
    window.chartManager.drawSparkline('kpiAovSparkline', kpis.aov.sparkline, kpis.aov.isPositive);

    // Card 4: Customers
    const custVal = document.getElementById('kpiCustomersValue');
    const custBadge = document.getElementById('kpiCustomersBadge');
    if (custVal) custVal.textContent = kpis.customers.formatted;
    if (custBadge) {
      this.setKpiBadge(custBadge, kpis.customers.change, kpis.customers.isPositive);
    }
    window.chartManager.drawSparkline('kpiCustomersSparkline', kpis.customers.sparkline, kpis.customers.isPositive);
  }

  setKpiBadge(badgeEl, changePct, isPositive) {
    const formatted = `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`;
    badgeEl.textContent = formatted;
    if (isPositive) {
      badgeEl.className = 'kpi-badge kpi-badge-positive';
      badgeEl.innerHTML = `<i data-lucide="trending-up" class="kpi-badge-icon"></i> ${formatted}`;
    } else {
      badgeEl.className = 'kpi-badge kpi-badge-negative';
      badgeEl.innerHTML = `<i data-lucide="trending-down" class="kpi-badge-icon"></i> ${formatted}`;
    }
  }

  refreshPerformanceChart(currentRecs = null, prevRecs = null, activeRange = null) {
    const range = activeRange || window.analyticsEngine.getPresetRange(this.currentPreset);
    const all = window.dataStore.getAll();
    const curr = currentRecs || window.analyticsEngine.filterByDateRange(all, range.current.start, range.current.end);
    const prev = prevRecs || window.analyticsEngine.filterByDateRange(all, range.previous.start, range.previous.end);

    const tsData = window.analyticsEngine.getTimeSeriesData(curr, prev, this.performanceMode, range);
    window.chartManager.renderPerformanceChart('salesPerformanceCanvas', tsData);
  }

  refreshCategoryBreakdown(records) {
    const catData = window.analyticsEngine.getCategoryBreakdown(records);
    window.chartManager.renderCategoryChart('categoryDonutCanvas', catData);

    // Render interactive legend list
    const legendEl = document.getElementById('categoryCustomLegend');
    if (!legendEl) return;

    if (catData.categories.length === 0) {
      legendEl.innerHTML = '<div class="empty-text">No category data available</div>';
      return;
    }

    const colors = window.chartManager.colors.categories;
    legendEl.innerHTML = catData.categories.map((c, i) => {
      const color = colors[i % colors.length];
      return `
        <div class="category-legend-row">
          <div class="category-legend-left">
            <span class="category-color-dot" style="background-color: ${color};"></span>
            <span class="category-legend-name">${c.name}</span>
          </div>
          <div class="category-legend-right">
            <span class="category-legend-val">$${c.amount.toLocaleString()}</span>
            <span class="category-legend-pct">${c.percentage}%</span>
          </div>
        </div>
      `;
    }).join('');
  }

  refreshChannelBreakdown(records) {
    const chanData = window.analyticsEngine.getChannelBreakdown(records);
    window.chartManager.renderChannelChart('channelsBarCanvas', chanData);

    const channelSummary = document.getElementById('channelSummaryList');
    if (channelSummary) {
      if (chanData.channels.length === 0) {
        channelSummary.innerHTML = '<div class="empty-text">No channel transactions</div>';
        return;
      }

      channelSummary.innerHTML = chanData.channels.map(ch => `
        <div class="channel-metric-card">
          <div class="channel-metric-title">${ch.name}</div>
          <div class="channel-metric-value">$${ch.amount.toLocaleString()}</div>
          <div class="channel-metric-share">${ch.percentage}% of gross</div>
        </div>
      `).join('');
    }
  }

  renderTopProducts(records) {
    const container = document.getElementById('topProductsList');
    if (!container) return;

    const topList = window.analyticsEngine.getTopProducts(records);

    if (topList.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <i data-lucide="package-search" class="empty-state-icon"></i>
          <p class="empty-state-title">No product sales yet</p>
          <p class="empty-state-desc">Transactions within this range will automatically rank top performers here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = topList.map(prod => {
      const iconMap = {
        'Apex Cloud Enterprise': 'cloud',
        'CyberShield Sentinel Pro': 'shield-check',
        'OmniAnalytics BI Suite': 'bar-chart-3',
        'EdgeRouter XG Infrastructure': 'server',
        'DevPulse CI/CD Pipeline': 'code',
        'QuantumVault Key Manager': 'key',
        'Workforce Hub Enterprise': 'users',
        'CloudScale Autonomous Pod': 'cpu',
        'ComplianceAudit 360': 'file-check'
      };
      const iconName = iconMap[prod.name] || 'box';

      return `
        <div class="top-product-item">
          <div class="product-rank-badge">${prod.rank}</div>
          <div class="product-icon-wrap">
            <i data-lucide="${iconName}" class="product-icon"></i>
          </div>
          <div class="product-details">
            <div class="product-name-row">
              <span class="product-title">${prod.name}</span>
              <span class="product-cat-tag">${prod.category}</span>
            </div>
            <div class="product-progress-track">
              <div class="product-progress-fill" style="width: ${prod.relativeProgress}%;"></div>
            </div>
            <div class="product-stats-row">
              <span class="product-units-sold">${prod.unitsSold} orders (${prod.shareOfTotal}% share)</span>
              <span class="product-rev-amount">$${prod.revenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderInsights(records, prevRecords) {
    const insights = window.analyticsEngine.generateInsights(records, prevRecords);

    const elProduct = document.getElementById('insightTopProduct');
    const elChannel = document.getElementById('insightTopChannel');
    const elPeak = document.getElementById('insightPeakDay');
    const elMomentum = document.getElementById('insightMomentum');

    if (elProduct) {
      elProduct.innerHTML = `
        <div class="insight-label-row">
          <span class="insight-label">${insights.bestProduct.title}</span>
          <span class="insight-badge">${insights.bestProduct.amount || '$0'}</span>
        </div>
        <div class="insight-main-val">${insights.bestProduct.value}</div>
        <div class="insight-desc">${insights.bestProduct.desc}</div>
      `;
    }

    if (elChannel) {
      elChannel.innerHTML = `
        <div class="insight-label-row">
          <span class="insight-label">${insights.bestChannel.title}</span>
          <span class="insight-badge">${insights.bestChannel.amount || '$0'}</span>
        </div>
        <div class="insight-main-val">${insights.bestChannel.value}</div>
        <div class="insight-desc">${insights.bestChannel.desc}</div>
      `;
    }

    if (elPeak) {
      elPeak.innerHTML = `
        <div class="insight-label-row">
          <span class="insight-label">${insights.peakPeriod.title}</span>
          <span class="insight-badge">${insights.peakPeriod.amount || '$0'}</span>
        </div>
        <div class="insight-main-val">${insights.peakPeriod.value}</div>
        <div class="insight-desc">${insights.peakPeriod.desc}</div>
      `;
    }

    if (elMomentum) {
      const badgeClass = insights.growthSummary.trajectory === 'up' 
        ? 'insight-badge-success' 
        : (insights.growthSummary.trajectory === 'down' ? 'insight-badge-danger' : 'insight-badge-neutral');

      elMomentum.innerHTML = `
        <div class="insight-label-row">
          <span class="insight-label">${insights.growthSummary.title}</span>
          <span class="insight-badge ${badgeClass}">${insights.growthSummary.value}</span>
        </div>
        <div class="insight-main-val">Sales Velocity</div>
        <div class="insight-desc">${insights.growthSummary.desc}</div>
      `;
    }
  }

  /**
   * Filter and sort orders list according to table state
   */
  getFilteredOrdersList() {
    let records = window.dataStore.getAll();

    // 1. Search Query filter (matches ID, customer name, email, product, category)
    if (this.tableState.searchQuery) {
      const q = (this.tableState.searchQuery || '').trim().toLowerCase();
      if (q) {
        records = records.filter(r =>
          (r.id && r.id.toLowerCase().includes(q)) ||
          (r.customerName && r.customerName.toLowerCase().includes(q)) ||
          (r.customerEmail && r.customerEmail.toLowerCase().includes(q)) ||
          (r.product && r.product.toLowerCase().includes(q)) ||
          (r.category && r.category.toLowerCase().includes(q)) ||
          (r.channel && r.channel.toLowerCase().includes(q))
        );
      }
    }

    // 2. Order status filter
    if (this.tableState.statusFilter !== 'all') {
      records = records.filter(r => r.orderStatus.toLowerCase() === this.tableState.statusFilter.toLowerCase());
    }

    // 3. Payment status filter
    if (this.tableState.paymentFilter !== 'all') {
      records = records.filter(r => r.paymentStatus.toLowerCase() === this.tableState.paymentFilter.toLowerCase());
    }

    // 4. Sorting
    records.sort((a, b) => {
      let valA = a[this.tableState.sortField];
      let valB = b[this.tableState.sortField];

      if (this.tableState.sortField === 'amount') {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else if (this.tableState.sortField === 'date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return this.tableState.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return this.tableState.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return records;
  }

  /**
   * Render Recent Orders Table with full interactivity
   */
  renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    const paginationInfo = document.getElementById('tablePaginationInfo');
    const paginationControls = document.getElementById('tablePaginationButtons');
    const emptyState = document.getElementById('tableEmptyState');
    const tableContainer = document.getElementById('tableResponsiveContainer');

    if (!tbody) return;

    const filtered = this.getFilteredOrdersList();
    const totalRecords = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / this.tableState.pageSize));

    // Ensure valid page number
    if (this.tableState.currentPage > totalPages) {
      this.tableState.currentPage = totalPages;
    }

    if (totalRecords === 0) {
      tbody.innerHTML = '';
      if (tableContainer) tableContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      if (paginationInfo) paginationInfo.textContent = 'Showing 0 orders';
      if (paginationControls) paginationControls.innerHTML = '';
      return;
    }

    if (tableContainer) tableContainer.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    // Calculate slice indices
    const startIndex = (this.tableState.currentPage - 1) * this.tableState.pageSize;
    const endIndex = Math.min(startIndex + this.tableState.pageSize, totalRecords);
    const pageRecords = filtered.slice(startIndex, endIndex);

    // Render table rows
    tbody.innerHTML = pageRecords.map(order => {
      const orderDate = new Date(order.date);
      const dateFormatted = orderDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const timeFormatted = orderDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const initials = order.customerName
        ? order.customerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'CU';

      const paymentBadgeClass = `badge-payment-${(order.paymentStatus || 'paid').toLowerCase()}`;
      const orderBadgeClass = `badge-status-${(order.orderStatus || 'completed').toLowerCase()}`;

      return `
        <tr class="table-data-row" data-id="${order.id}">
          <td class="td-order-id">
            <span class="order-id-code">${order.id}</span>
          </td>
          <td class="td-customer">
            <div class="customer-cell">
              <div class="customer-avatar">${initials}</div>
              <div class="customer-meta">
                <span class="customer-name">${this.escapeHTML(order.customerName)}</span>
                <span class="customer-email">${this.escapeHTML(order.customerEmail)}</span>
              </div>
            </div>
          </td>
          <td class="td-product">
            <div class="product-cell">
              <span class="product-name-txt">${this.escapeHTML(order.product)}</span>
              <span class="product-cat-sub">${this.escapeHTML(order.category || 'General')} &bull; ${this.escapeHTML(order.channel || 'Direct')}</span>
            </div>
          </td>
          <td class="td-date">
            <div class="date-cell">
              <span class="date-main">${dateFormatted}</span>
              <span class="date-time">${timeFormatted}</span>
            </div>
          </td>
          <td class="td-amount">
            <span class="amount-val">$${order.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span class="payment-method-sub">${order.paymentMethod || 'Credit Card'}</span>
          </td>
          <td class="td-payment-status">
            <span class="badge ${paymentBadgeClass}">
              <span class="badge-dot"></span>
              ${order.paymentStatus}
            </span>
          </td>
          <td class="td-order-status">
            <span class="badge ${orderBadgeClass}">
              ${order.orderStatus}
            </span>
          </td>
          <td class="td-actions">
            <div class="row-actions">
              <button class="action-icon-btn edit-order-btn" title="Edit Record" data-action="edit" data-id="${order.id}">
                <i data-lucide="edit-3" class="action-icon"></i>
              </button>
              <button class="action-icon-btn delete-order-btn" title="Delete Record" data-action="delete" data-id="${order.id}">
                <i data-lucide="trash-2" class="action-icon"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Pagination Info
    if (paginationInfo) {
      paginationInfo.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalRecords} orders`;
    }

    // Render Page Numbers
    if (paginationControls) {
      let pageButtonsHTML = '';
      for (let p = 1; p <= totalPages; p++) {
        const isActive = p === this.tableState.currentPage ? 'active' : '';
        pageButtonsHTML += `
          <button class="page-num-btn ${isActive}" data-page="${p}">${p}</button>
        `;
      }
      paginationControls.innerHTML = pageButtonsHTML;

      // Bind page buttons
      paginationControls.querySelectorAll('.page-num-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.tableState.currentPage = parseInt(btn.getAttribute('data-page'), 10);
          this.renderOrdersTable();
        });
      });
    }

    // Bind action buttons via event delegation
    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.openEditModal(id);
      });
    });

    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.openDeleteConfirmModal(id);
      });
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  updateSortHeaders() {
    const headers = document.querySelectorAll('.sortable-th[data-sort]');
    headers.forEach(th => {
      const field = th.getAttribute('data-sort');
      const icon = th.querySelector('.sort-icon');
      if (!icon) return;

      if (field === this.tableState.sortField) {
        th.classList.add('active-sort');
        icon.setAttribute('data-lucide', this.tableState.sortOrder === 'asc' ? 'chevron-up' : 'chevron-down');
      } else {
        th.classList.remove('active-sort');
        icon.setAttribute('data-lucide', 'chevrons-up-down');
      }
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Modal management
   */
  openAddModal() {
    this.activeModalRecordId = null;
    const modal = document.getElementById('saleModal');
    const title = document.getElementById('saleModalTitle');
    const form = document.getElementById('saleForm');

    if (!modal || !form) return;
    form.reset();

    if (title) title.textContent = 'Add New Sales Record';

    // Set sensible defaults
    const idInput = document.getElementById('formOrderId');
    const dateInput = document.getElementById('formDate');
    if (idInput) {
      idInput.value = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    if (dateInput) {
      const now = new Date();
      // Format as YYYY-MM-DDTHH:mm
      const pad = (n) => String(n).padStart(2, '0');
      dateInput.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }

    modal.classList.add('active');
  }

  openEditModal(id) {
    const record = window.dataStore.getById(id);
    if (!record) return;

    this.activeModalRecordId = id;
    const modal = document.getElementById('saleModal');
    const title = document.getElementById('saleModalTitle');

    if (title) title.textContent = `Edit Sales Record (${id})`;

    document.getElementById('formOrderId').value = record.id || '';
    document.getElementById('formCustomerName').value = record.customerName || '';
    document.getElementById('formCustomerEmail').value = record.customerEmail || '';
    document.getElementById('formProduct').value = record.product || '';
    document.getElementById('formCategory').value = record.category || 'Cloud';
    document.getElementById('formChannel').value = record.channel || 'Direct Sales';
    document.getElementById('formAmount').value = record.amount || 0;
    document.getElementById('formPaymentStatus').value = record.paymentStatus || 'Paid';
    document.getElementById('formOrderStatus').value = record.orderStatus || 'Completed';
    document.getElementById('formPaymentMethod').value = record.paymentMethod || 'Credit Card';

    // Date formatting
    if (record.date) {
      const d = new Date(record.date);
      const pad = (n) => String(n).padStart(2, '0');
      document.getElementById('formDate').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    if (modal) modal.classList.add('active');
  }

  openDeleteConfirmModal(id) {
    this.activeModalRecordId = id;
    const modal = document.getElementById('deleteConfirmModal');
    const text = document.getElementById('deleteModalRecordText');
    if (text) text.textContent = `Are you sure you want to permanently delete order ${id}? This action cannot be undone.`;
    if (modal) modal.classList.add('active');
  }

  closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay.active');
    modals.forEach(m => m.classList.remove('active'));
    this.activeModalRecordId = null;
  }

  handleSaveSale() {
    const id = document.getElementById('formOrderId').value.trim();
    const customerName = document.getElementById('formCustomerName').value.trim();
    const customerEmail = document.getElementById('formCustomerEmail').value.trim();
    const product = document.getElementById('formProduct').value.trim();
    const category = document.getElementById('formCategory').value;
    const channel = document.getElementById('formChannel').value;
    const amountVal = parseFloat(document.getElementById('formAmount').value);
    const dateVal = document.getElementById('formDate').value;
    const paymentStatus = document.getElementById('formPaymentStatus').value;
    const orderStatus = document.getElementById('formOrderStatus').value;
    const paymentMethod = document.getElementById('formPaymentMethod').value;

    if (!customerName || !customerEmail || !product || isNaN(amountVal)) {
      this.showToast('Please fill in all required fields with valid values.', 'warning');
      return;
    }

    const payload = {
      id: id || undefined,
      customerName,
      customerEmail,
      product,
      category,
      channel,
      amount: amountVal,
      date: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
      paymentStatus,
      orderStatus,
      paymentMethod
    };

    if (this.activeModalRecordId) {
      // Update existing
      window.dataStore.update(this.activeModalRecordId, payload);
      this.showToast(`Order ${this.activeModalRecordId} updated successfully.`, 'success');
    } else {
      // Add new
      const created = window.dataStore.add(payload);
      this.showToast(`New sale ${created.id} added successfully.`, 'success');
    }

    this.closeAllModals();
  }

  /**
   * Notification items rendering
   */
  renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;

    const notifs = [
      {
        title: 'Monthly Revenue Record',
        desc: 'November gross volume reached $98,420, surpassing team targets by 14.2%.',
        time: '12m ago',
        icon: 'trending-up',
        color: '#10b981'
      },
      {
        title: 'High-Value Deal Closed',
        desc: 'New deal #ORD-9840 for EdgeRouter XG ($6,998) was marked Paid.',
        time: '1h ago',
        icon: 'check-circle-2',
        color: '#4f46e5'
      },
      {
        title: 'Payment Verification',
        desc: 'Order #ORD-9837 awaiting manual settlement confirmation.',
        time: '3h ago',
        icon: 'alert-circle',
        color: '#f59e0b'
      }
    ];

    list.innerHTML = notifs.map(n => `
      <div class="notification-item">
        <div class="notification-icon-box" style="background-color: ${n.color}15; color: ${n.color};">
          <i data-lucide="${n.icon}" class="notif-lucide"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <div class="notification-desc">${n.desc}</div>
          <div class="notification-time">${n.time}</div>
        </div>
      </div>
    `).join('');

    const markReadBtn = document.getElementById('markAllReadBtn');
    if (markReadBtn) {
      markReadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const badge = document.getElementById('notificationBadgeCount');
        if (badge) badge.style.display = 'none';
        this.showToast('All notifications marked as read.', 'info');
      });
    }
  }

  /**
   * Additional Dedicated Views (Sales, Orders, Products, Customers, Reports, Settings)
   */
  renderSalesView() {
    const container = document.getElementById('salesViewContainer');
    if (!container) return;

    const records = window.dataStore.getAll();
    const active = records.filter(r => r.orderStatus !== 'Cancelled');
    const totalRev = active.reduce((s, r) => s + r.amount, 0);
    const avgDeal = active.length > 0 ? (totalRev / active.length) : 0;
    const completedCount = records.filter(r => r.orderStatus === 'Completed').length;
    const conversionRate = records.length > 0 ? ((completedCount / records.length) * 100).toFixed(1) : 0;

    const channelData = window.analyticsEngine.getChannelBreakdown(records);
    const paymentData = window.analyticsEngine.getPaymentMethodBreakdown(records);

    container.innerHTML = `
      <div class="section-card" style="margin-bottom: 24px;">
        <div class="card-header-bar">
          <div>
            <h3 class="card-title">Commercial Deal Stream &amp; Revenue Matrix</h3>
            <p class="card-subtitle">Aggregated sales pipelines, multi-channel volume, and payment settlement breakdown</p>
          </div>
          <div class="btn-group">
            <button class="btn btn-secondary" onclick="window.dataStore.exportCSV()">
              <i data-lucide="download" class="btn-icon"></i> Export Deals CSV
            </button>
            <button class="btn btn-primary" onclick="window.uiController.openAddModal()">
              <i data-lucide="plus" class="btn-icon"></i> New Transaction
            </button>
          </div>
        </div>

        <div class="report-summary-grid" style="margin-bottom: 24px;">
          <div class="report-card">
            <div class="report-card-label">Gross Bookings</div>
            <div class="report-card-val">$${totalRev.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
            <div class="report-card-meta">${active.length} active transactions</div>
          </div>
          <div class="report-card">
            <div class="report-card-label">Average Deal Size</div>
            <div class="report-card-val">$${avgDeal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div class="report-card-meta">Deal size across channels</div>
          </div>
          <div class="report-card">
            <div class="report-card-label">Fulfillment Rate</div>
            <div class="report-card-val">${conversionRate}%</div>
            <div class="report-card-meta">${completedCount} completed of ${records.length} total</div>
          </div>
        </div>

        <div class="card-header-bar" style="margin-top: 12px; margin-bottom: 12px;">
          <h4 class="card-title" style="font-size: 14px;">Sales Channel Breakdown</h4>
        </div>
        <div class="channel-summary-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 24px;">
          ${channelData.channels.map(ch => `
            <div class="channel-metric-card">
              <div class="channel-metric-title">${ch.name}</div>
              <div class="channel-metric-value">$${ch.amount.toLocaleString()}</div>
              <div class="channel-metric-share">${ch.percentage}% of gross</div>
            </div>
          `).join('')}
        </div>

        <div class="card-header-bar" style="margin-top: 12px; margin-bottom: 12px;">
          <h4 class="card-title" style="font-size: 14px;">Payment Settlement Distribution</h4>
        </div>
        <div class="channel-summary-grid" style="grid-template-columns: repeat(4, 1fr);">
          ${paymentData.methods.map(pm => `
            <div class="channel-metric-card">
              <div class="channel-metric-title">${pm.name}</div>
              <div class="channel-metric-value">$${pm.amount.toLocaleString()}</div>
              <div class="channel-metric-share">${pm.percentage}% share</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderOrdersView() {
    const container = document.getElementById('ordersViewContainer');
    if (!container) return;

    const records = window.dataStore.getAll();
    const completed = records.filter(r => r.orderStatus === 'Completed').length;
    const processing = records.filter(r => r.orderStatus === 'Processing').length;
    const shipped = records.filter(r => r.orderStatus === 'Shipped').length;
    const cancelled = records.filter(r => r.orderStatus === 'Cancelled').length;

    container.innerHTML = `
      <div class="section-card" style="margin-bottom: 24px;">
        <div class="card-header-bar">
          <div>
            <h3 class="card-title">Comprehensive Orders Management</h3>
            <p class="card-subtitle">Centralized fulfillment pipeline with transaction auditing and editing</p>
          </div>
          <div class="btn-group">
            <button class="btn btn-secondary" onclick="window.dataStore.exportCSV()">
              <i data-lucide="download" class="btn-icon"></i> Export Orders
            </button>
            <button class="btn btn-primary" onclick="window.uiController.openAddModal()">
              <i data-lucide="plus" class="btn-icon"></i> Create Order
            </button>
          </div>
        </div>

        <div class="report-summary-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 24px;">
          <div class="report-card">
            <div class="report-card-label">Total Transactions</div>
            <div class="report-card-val">${records.length}</div>
            <div class="report-card-meta">All-time order volume</div>
          </div>
          <div class="report-card">
            <div class="report-card-label">Completed &amp; Paid</div>
            <div class="report-card-val" style="color: #059669;">${completed}</div>
            <div class="report-card-meta">Successfully settled</div>
          </div>
          <div class="report-card">
            <div class="report-card-label">In Fulfillment</div>
            <div class="report-card-val" style="color: #2563eb;">${processing + shipped}</div>
            <div class="report-card-meta">${processing} processing &bull; ${shipped} shipped</div>
          </div>
          <div class="report-card">
            <div class="report-card-label">Cancelled / Void</div>
            <div class="report-card-val" style="color: #dc2626;">${cancelled}</div>
            <div class="report-card-meta">Refunded or voided</div>
          </div>
        </div>

        <p style="color: #64748b; font-size: 13px;">
          To manage, search, sort, or modify specific order records, use the interactive transactions ledger on the 
          <a href="#" onclick="window.uiController.switchView('overview'); return false;" style="color: #4f46e5; font-weight: 600; text-decoration: underline;">Overview Dashboard</a>.
        </p>
      </div>
    `;
  }

  renderProductsView() {
    const container = document.getElementById('productsViewContainer');
    if (!container) return;

    const records = window.dataStore.getAll();
    const top = window.analyticsEngine.getTopProducts(records);

    container.innerHTML = `
      <div class="section-card">
        <div class="card-header-bar">
          <div>
            <h3 class="card-title">Product Catalog & Commercial Health</h3>
            <p class="card-subtitle">Real-time SKU sales volume, revenue generation, and inventory category breakdown</p>
          </div>
          <button class="btn btn-secondary" onclick="window.dataStore.exportCSV()">
            <i data-lucide="download" class="btn-icon"></i> Export Catalog Metrics
          </button>
        </div>
        <div class="products-grid-catalog">
          ${SAMPLE_PRODUCTS.map(p => {
            const match = top.find(t => t.name === p.name);
            const units = match ? match.unitsSold : 0;
            const rev = match ? match.revenue : 0;
            return `
              <div class="catalog-card">
                <div class="catalog-icon-box">
                  <i data-lucide="${p.icon}" class="catalog-icon"></i>
                </div>
                <div class="catalog-header-text">
                  <span class="catalog-category-tag">${p.category}</span>
                  <h4 class="catalog-prod-title">${p.name}</h4>
                  <span class="catalog-prod-price">$${p.price.toLocaleString()} list price</span>
                </div>
                <div class="catalog-stats-row">
                  <div class="catalog-stat">
                    <span class="catalog-stat-label">Units Sold</span>
                    <span class="catalog-stat-val">${units}</span>
                  </div>
                  <div class="catalog-stat">
                    <span class="catalog-stat-label">Total Revenue</span>
                    <span class="catalog-stat-val">$${rev.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderCustomersView() {
    const container = document.getElementById('customersViewContainer');
    if (!container) return;

    const records = window.dataStore.getAll();
    const custMap = {};

    records.forEach(r => {
      const email = r.customerEmail || 'no-email@domain.com';
      if (!custMap[email]) {
        custMap[email] = {
          name: r.customerName || 'Anonymous Client',
          email: email,
          totalSpent: 0,
          ordersCount: 0,
          latestDate: r.date,
          status: 'Active'
        };
      }
      custMap[email].totalSpent += r.amount;
      custMap[email].ordersCount += 1;
      if (new Date(r.date) > new Date(custMap[email].latestDate)) {
        custMap[email].latestDate = r.date;
      }
    });

    const customers = Object.values(custMap).sort((a, b) => b.totalSpent - a.totalSpent);

    container.innerHTML = `
      <div class="section-card">
        <div class="card-header-bar">
          <div>
            <h3 class="card-title">Customer Ledger (${customers.length} Accounts)</h3>
            <p class="card-subtitle">Aggregated customer lifetime value, transaction count, and recent activity</p>
          </div>
          <button class="btn btn-secondary" onclick="window.dataStore.exportCSV()">
            <i data-lucide="download" class="btn-icon"></i> Export Customers
          </button>
        </div>
        <div class="table-responsive-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Orders</th>
                <th>Lifetime Value</th>
                <th>Last Active</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${customers.map(c => `
                <tr>
                  <td>
                    <div class="customer-cell">
                      <div class="customer-avatar">${c.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                      <div class="customer-meta">
                        <span class="customer-name">${c.name}</span>
                        <span class="customer-email">${c.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><strong>${c.ordersCount}</strong> orders</td>
                  <td class="amount-val">$${c.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${new Date(c.latestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td><span class="badge badge-status-completed">Active Client</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderReportsView() {
    const container = document.getElementById('reportsViewContainer');
    if (!container) return;

    const all = window.dataStore.getAll();
    const currentRev = all.filter(r => r.orderStatus !== 'Cancelled').reduce((s, r) => s + r.amount, 0);
    const completedOrders = all.filter(r => r.orderStatus === 'Completed').length;
    const catData = window.analyticsEngine.getCategoryBreakdown(all);

    container.innerHTML = `
      <div class="section-card">
        <div class="card-header-bar">
          <div>
            <h3 class="card-title">Executive Revenue Audit & Financial Statements</h3>
            <p class="card-subtitle">Audited metrics snapshot generated dynamically from stored database ledgers</p>
          </div>
          <div class="btn-group">
            <button class="btn btn-primary" onclick="window.dataStore.exportCSV()">
              <i data-lucide="download" class="btn-icon"></i> Export Ledger CSV
            </button>
            <button class="btn btn-secondary" onclick="window.print()">
              <i data-lucide="printer" class="btn-icon"></i> Print Statement
            </button>
          </div>
        </div>
        <div class="report-summary-grid">
          <div class="report-card">
            <div class="report-card-label">Cumulative Gross Bookings</div>
            <div class="report-card-val">$${currentRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div class="report-card-meta">All audited transactions</div>
          </div>
          <div class="report-card">
            <div class="report-card-label">Completed Orders Ratio</div>
            <div class="report-card-val">${all.length > 0 ? ((completedOrders / all.length) * 100).toFixed(1) : 0}%</div>
            <div class="report-card-meta">${completedOrders} settled orders</div>
          </div>
          <div class="report-card">
            <div class="report-card-label">Top Category Dominance</div>
            <div class="report-card-val">${catData.categories[0] ? catData.categories[0].name : 'N/A'}</div>
            <div class="report-card-meta">${catData.categories[0] ? catData.categories[0].percentage + '% of gross volume' : ''}</div>
          </div>
        </div>
      </div>
    `;
  }

  renderSettingsView() {
    const container = document.getElementById('settingsViewContainer');
    if (!container) return;

    const all = window.dataStore.getAll();
    const storageUsage = new Blob([JSON.stringify(all)]).size;

    container.innerHTML = `
      <div class="section-card">
        <div class="card-header-bar">
          <div>
            <h3 class="card-title">Data Storage & Persistence Controls</h3>
            <p class="card-subtitle">Manage browser localStorage persistence, data schema, and sample dataset reset</p>
          </div>
        </div>
        <div class="settings-content-grid">
          <div class="settings-item-row">
            <div>
              <h4 class="settings-item-title">Browser Web Storage (localStorage)</h4>
              <p class="settings-item-desc">Currently persisting ${all.length} sales records (${(storageUsage / 1024).toFixed(2)} KB in browser storage).</p>
            </div>
            <span class="badge badge-status-completed">Active & Synchronized</span>
          </div>

          <div class="settings-item-row">
            <div>
              <h4 class="settings-item-title">Export Complete Database</h4>
              <p class="settings-item-desc">Download all historical orders, customers, and payment records in standard CSV format.</p>
            </div>
            <button class="btn btn-secondary" onclick="window.dataStore.exportCSV()">
              <i data-lucide="download" class="btn-icon"></i> Download CSV
            </button>
          </div>

          <div class="settings-item-row">
            <div>
              <h4 class="settings-item-title">Restore Default Sample Data</h4>
              <p class="settings-item-desc">Reset all records back to the original rich enterprise sample dataset.</p>
            </div>
            <button class="btn btn-danger" onclick="if(confirm('Reset all records back to default sample dataset?')){ window.dataStore.reset(); window.uiController.showToast('Sample dataset restored', 'info'); }">
              <i data-lucide="rotate-ccw" class="btn-icon"></i> Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Floating Toast Notifications
   */
  showToast(message, type = 'info') {
    const toast = document.getElementById('appToast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;

    const iconMap = {
      success: 'check-circle-2',
      warning: 'alert-triangle',
      danger: 'alert-circle',
      info: 'info'
    };

    if (toastIcon) {
      toastIcon.setAttribute('data-lucide', iconMap[type] || 'info');
    }

    toast.className = `app-toast toast-${type} active`;

    if (window.lucide) {
      window.lucide.createIcons();
    }

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, 3800);
  }

  escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Global UI controller
window.uiController = new UIController();
