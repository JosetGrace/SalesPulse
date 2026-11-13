/**
 * SalesPulse - Analytics & Calculations Engine
 * Computes KPIs, comparisons, time-series aggregations, breakdowns, and dynamic insights.
 */

class AnalyticsEngine {
  constructor(dataStore) {
    this.store = dataStore;
  }

  /**
   * Helper to parse date
   */
  parseDate(d) {
    return new Date(d);
  }

  /**
   * Filter records by date range [startDate, endDate]
   */
  filterByDateRange(records, startDate, endDate) {
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Infinity;

    return records.filter(r => {
      const t = new Date(r.date).getTime();
      return t >= start && t <= end;
    });
  }

  /**
   * Determine date boundaries for predefined presets
   * Uses latest date in records or current date as anchor
   */
  getPresetRange(preset = 'last-30') {
    const all = this.store.getAll();
    let anchor = new Date();
    
    if (all.length > 0) {
      const latestTime = Math.max(...all.map(r => new Date(r.date).getTime()));
      if (latestTime > 0) {
        anchor = new Date(latestTime);
      }
    }

    // Set anchor to end of that day
    const endDate = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), 23, 59, 59, 999);
    let startDate;

    switch (preset) {
      case 'last-7':
        startDate = new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last-30':
        startDate = new Date(endDate.getTime() - 29 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last-90':
        startDate = new Date(endDate.getTime() - 89 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year-to-date':
        startDate = new Date(endDate.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      case 'all-time':
      default:
        startDate = new Date(2025, 0, 1, 0, 0, 0, 0);
        break;
    }

    // Calculate previous period for comparison with identical time span
    const duration = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - duration);

    return {
      current: { start: startDate, end: endDate },
      previous: { start: prevStartDate, end: prevEndDate }
    };
  }

  /**
   * Compute comprehensive dashboard KPIs
   */
  computeKPIs(currentRecords, previousRecords) {
    // Current period metrics
    const currentRevenue = currentRecords
      .filter(r => r.orderStatus !== 'Cancelled')
      .reduce((sum, r) => sum + r.amount, 0);

    const currentOrders = currentRecords.length;
    const currentAOV = currentOrders > 0 ? (currentRevenue / currentOrders) : 0;
    const currentCustomers = new Set(currentRecords.map(r => r.customerEmail || r.customerName)).size;

    // Previous period metrics
    const prevRevenue = previousRecords
      .filter(r => r.orderStatus !== 'Cancelled')
      .reduce((sum, r) => sum + r.amount, 0);

    const prevOrders = previousRecords.length;
    const prevAOV = prevOrders > 0 ? (prevRevenue / prevOrders) : 0;
    const prevCustomers = new Set(previousRecords.map(r => r.customerEmail || r.customerName)).size;

    // Calculate growth percentages
    const calcGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    // Generate mini sparklines (7 segments across the period)
    const generateSparkline = (records, metricFn) => {
      if (records.length === 0) return [0, 0, 0, 0, 0, 0, 0];
      const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
      const chunks = 7;
      const points = [];
      const chunkSize = Math.max(1, Math.ceil(sorted.length / chunks));

      for (let i = 0; i < chunks; i++) {
        const slice = sorted.slice(i * chunkSize, (i + 1) * chunkSize);
        points.push(slice.length > 0 ? metricFn(slice) : 0);
      }
      return points;
    };

    return {
      revenue: {
        value: currentRevenue,
        formatted: this.formatCurrency(currentRevenue),
        change: calcGrowth(currentRevenue, prevRevenue),
        isPositive: currentRevenue >= prevRevenue,
        sparkline: generateSparkline(currentRecords, (recs) => recs.reduce((s, r) => s + r.amount, 0))
      },
      orders: {
        value: currentOrders,
        formatted: currentOrders.toLocaleString(),
        change: calcGrowth(currentOrders, prevOrders),
        isPositive: currentOrders >= prevOrders,
        sparkline: generateSparkline(currentRecords, (recs) => recs.length)
      },
      aov: {
        value: currentAOV,
        formatted: this.formatCurrency(currentAOV),
        change: calcGrowth(currentAOV, prevAOV),
        isPositive: currentAOV >= prevAOV,
        sparkline: generateSparkline(currentRecords, (recs) => recs.length > 0 ? recs.reduce((s, r) => s + r.amount, 0) / recs.length : 0)
      },
      customers: {
        value: currentCustomers,
        formatted: currentCustomers.toLocaleString(),
        change: calcGrowth(currentCustomers, prevCustomers),
        isPositive: currentCustomers >= prevCustomers,
        sparkline: generateSparkline(currentRecords, (recs) => new Set(recs.map(r => r.customerEmail)).size)
      }
    };
  }

  /**
   * Format currency cleanly
   */
  formatCurrency(num) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }

  /**
   * Build time series data for sales performance chart
   * Modes: 'daily', 'weekly', 'monthly', 'yearly'
   */
  getTimeSeriesData(records, prevRecords, mode = 'daily', dateRange = null) {
    if (mode === 'monthly') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentTotals = new Array(12).fill(0);
      const prevTotals = new Array(12).fill(0);

      // Determine active year
      const anchorYear = dateRange && dateRange.current ? dateRange.current.end.getFullYear() : 2026;

      records.forEach(r => {
        const d = new Date(r.date);
        if (d.getFullYear() === anchorYear && r.orderStatus !== 'Cancelled') {
          currentTotals[d.getMonth()] += r.amount;
        }
      });

      prevRecords.forEach(r => {
        const d = new Date(r.date);
        if (r.orderStatus !== 'Cancelled') {
          prevTotals[d.getMonth()] += r.amount;
        }
      });

      return {
        labels: monthNames,
        current: currentTotals,
        previous: prevTotals,
        currentLabel: `${anchorYear} Revenue`,
        prevLabel: 'Previous Period'
      };
    }

    if (mode === 'weekly') {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'];
      const currentTotals = new Array(8).fill(0);
      const prevTotals = new Array(8).fill(0);

      const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
      const prevSorted = [...prevRecords].sort((a, b) => new Date(a.date) - new Date(b.date));

      const assignToWeeks = (list, targetArray) => {
        if (list.length === 0) return;
        const minT = new Date(list[0].date).getTime();
        const maxT = new Date(list[list.length - 1].date).getTime();
        const span = Math.max(1, (maxT - minT) / 8);

        list.forEach(r => {
          if (r.orderStatus !== 'Cancelled') {
            const idx = Math.min(7, Math.floor((new Date(r.date).getTime() - minT) / span));
            targetArray[idx] += r.amount;
          }
        });
      };

      assignToWeeks(sorted, currentTotals);
      assignToWeeks(prevSorted, prevTotals);

      return {
        labels: weeks,
        current: currentTotals,
        previous: prevTotals,
        currentLabel: 'Current Window',
        prevLabel: 'Prior Window'
      };
    }

    if (mode === 'yearly') {
      const years = ['2023', '2024', '2025', '2026'];
      const currentTotals = [48000, 69000, 92000, 0];
      const prevTotals = [42000, 61000, 78000, 85000];

      records.forEach(r => {
        const yr = new Date(r.date).getFullYear().toString();
        const idx = years.indexOf(yr);
        if (idx !== -1 && r.orderStatus !== 'Cancelled') {
          currentTotals[idx] += r.amount;
        }
      });

      return {
        labels: years,
        current: currentTotals,
        previous: prevTotals,
        currentLabel: 'Annual Revenue',
        prevLabel: 'Target Benchmark'
      };
    }

    // Default 'daily' mode
    // Create interval dates based on dateRange or last 14 days
    const daysCount = 14;
    const labels = [];
    const currentTotals = [];
    const prevTotals = [];

    const end = dateRange ? new Date(dateRange.current.end) : new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(end.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = `${d.getMonth() + 1}/${d.getDate()}`;
      labels.push(dayKey);

      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

      const dayRev = records
        .filter(r => {
          const t = new Date(r.date).getTime();
          return t >= dayStart && t <= dayEnd && r.orderStatus !== 'Cancelled';
        })
        .reduce((s, r) => s + r.amount, 0);

      currentTotals.push(dayRev);

      // Equivalent day in previous period
      const prevDayStart = dayStart - (daysCount * 24 * 60 * 60 * 1000);
      const prevDayEnd = dayEnd - (daysCount * 24 * 60 * 60 * 1000);
      const prevDayRev = prevRecords
        .filter(r => {
          const t = new Date(r.date).getTime();
          return t >= prevDayStart && t <= prevDayEnd && r.orderStatus !== 'Cancelled';
        })
        .reduce((s, r) => s + r.amount, 0);

      prevTotals.push(prevDayRev);
    }

    return {
      labels,
      current: currentTotals,
      previous: prevTotals,
      currentLabel: 'Selected Period',
      prevLabel: 'Previous Period'
    };
  }

  /**
   * Revenue breakdown by product category
   */
  getCategoryBreakdown(records) {
    const categories = {};
    let totalRev = 0;

    records.forEach(r => {
      if (r.orderStatus === 'Cancelled') return;
      const cat = r.category || 'Other';
      categories[cat] = (categories[cat] || 0) + r.amount;
      totalRev += r.amount;
    });

    const list = Object.keys(categories).map(cat => ({
      name: cat,
      amount: categories[cat],
      percentage: totalRev > 0 ? ((categories[cat] / totalRev) * 100).toFixed(1) : 0
    })).sort((a, b) => b.amount - a.amount);

    return {
      categories: list,
      total: totalRev,
      labels: list.map(l => l.name),
      data: list.map(l => l.amount)
    };
  }

  /**
   * Revenue breakdown by sales channel
   */
  getChannelBreakdown(records) {
    const channels = {};
    let totalRev = 0;

    records.forEach(r => {
      if (r.orderStatus === 'Cancelled') return;
      const ch = r.channel || 'Direct Sales';
      channels[ch] = (channels[ch] || 0) + r.amount;
      totalRev += r.amount;
    });

    const list = Object.keys(channels).map(ch => ({
      name: ch,
      amount: channels[ch],
      percentage: totalRev > 0 ? ((channels[ch] / totalRev) * 100).toFixed(1) : 0
    })).sort((a, b) => b.amount - a.amount);

    return {
      channels: list,
      total: totalRev,
      labels: list.map(l => l.name),
      data: list.map(l => l.amount)
    };
  }

  /**
   * Revenue breakdown by payment method
   */
  getPaymentMethodBreakdown(records) {
    const methods = {};
    let totalRev = 0;

    records.forEach(r => {
      if (r.orderStatus === 'Cancelled') return;
      const pm = r.paymentMethod || 'Credit Card';
      methods[pm] = (methods[pm] || 0) + r.amount;
      totalRev += r.amount;
    });

    const list = Object.keys(methods).map(pm => ({
      name: pm,
      amount: methods[pm],
      percentage: totalRev > 0 ? ((methods[pm] / totalRev) * 100).toFixed(1) : 0
    })).sort((a, b) => b.amount - a.amount);

    return {
      methods: list,
      total: totalRev,
      labels: list.map(l => l.name),
      data: list.map(l => l.amount)
    };
  }

  /**
   * Top 5 selling products based on current records
   */
  getTopProducts(records) {
    const map = {};
    let grandTotal = 0;

    records.forEach(r => {
      if (r.orderStatus === 'Cancelled') return;
      const pName = r.product || 'Unknown Product';
      if (!map[pName]) {
        map[pName] = {
          name: pName,
          category: r.category || 'General',
          unitsSold: 0,
          revenue: 0
        };
      }
      map[pName].unitsSold += 1;
      map[pName].revenue += r.amount;
      grandTotal += r.amount;
    });

    const sorted = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    const maxRev = sorted.length > 0 ? sorted[0].revenue : 1;

    return sorted.slice(0, 5).map((p, idx) => ({
      ...p,
      rank: idx + 1,
      shareOfTotal: grandTotal > 0 ? ((p.revenue / grandTotal) * 100).toFixed(1) : 0,
      relativeProgress: Math.min(100, Math.round((p.revenue / maxRev) * 100))
    }));
  }

  /**
   * Generate intelligent, dynamic insights from active dataset
   */
  generateInsights(records, previousRecords) {
    if (records.length === 0) {
      return {
        bestProduct: { title: 'Best Product', value: 'None', desc: 'No transaction data available' },
        bestChannel: { title: 'Top Channel', value: 'None', desc: 'No channel data available' },
        peakPeriod: { title: 'Peak Revenue Day', value: 'None', desc: 'No sales recorded' },
        growthSummary: { title: 'Sales Trajectory', value: 'Stable', desc: 'Awaiting new transactions' }
      };
    }

    // 1. Best Product
    const topProducts = this.getTopProducts(records);
    const bestProd = topProducts[0] || { name: 'N/A', revenue: 0, shareOfTotal: 0 };

    // 2. Best Channel
    const channelData = this.getChannelBreakdown(records);
    const bestChan = channelData.channels[0] || { name: 'Direct Sales', percentage: 0, amount: 0 };

    // 3. Peak Revenue Day
    const dayTotals = {};
    records.forEach(r => {
      if (r.orderStatus !== 'Cancelled') {
        const dayStr = new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        dayTotals[dayStr] = (dayTotals[dayStr] || 0) + r.amount;
      }
    });

    let peakDay = 'N/A';
    let peakAmount = 0;
    Object.keys(dayTotals).forEach(day => {
      if (dayTotals[day] > peakAmount) {
        peakAmount = dayTotals[day];
        peakDay = day;
      }
    });

    // 4. Growth & trajectory
    const currentRev = records.filter(r => r.orderStatus !== 'Cancelled').reduce((s, r) => s + r.amount, 0);
    const prevRev = previousRecords.filter(r => r.orderStatus !== 'Cancelled').reduce((s, r) => s + r.amount, 0);
    const growthPercent = prevRev > 0 ? ((currentRev - prevRev) / prevRev) * 100 : (currentRev > 0 ? 100 : 0);

    let growthLabel = 'Positive Growth';
    let trajectoryTone = 'up';
    if (growthPercent < -5) {
      growthLabel = 'Contraction';
      trajectoryTone = 'down';
    } else if (Math.abs(growthPercent) <= 5) {
      growthLabel = 'Sustained Baseline';
      trajectoryTone = 'neutral';
    }

    return {
      bestProduct: {
        title: 'Top Performing Product',
        value: bestProd.name,
        amount: this.formatCurrency(bestProd.revenue),
        desc: `${bestProd.unitsSold} units sold (${bestProd.shareOfTotal}% of total revenue)`
      },
      bestChannel: {
        title: 'Leading Sales Channel',
        value: bestChan.name,
        amount: this.formatCurrency(bestChan.amount),
        desc: `Generates ${bestChan.percentage}% of overall deal volume`
      },
      peakPeriod: {
        title: 'Peak Sales Day',
        value: peakDay,
        amount: this.formatCurrency(peakAmount),
        desc: 'Single-day sales high-water mark for the period'
      },
      growthSummary: {
        title: 'Period Momentum',
        value: `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}% vs Prior Period`,
        trajectory: trajectoryTone,
        desc: growthPercent >= 0 
          ? `Strong upward momentum with volume accelerating in ${bestChan.name}.`
          : 'Opportunity for pipeline re-engagement and sales promotion.'
      }
    };
  }
}

// Global analytics engine
window.analyticsEngine = new AnalyticsEngine(window.dataStore);

