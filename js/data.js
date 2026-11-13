/**
 * SalesPulse - Data Layer & Persistence
 * Manages localStorage, default sample dataset, and CRUD operations.
 */

const STORAGE_KEY = 'salespulse_sales_data_v1';

// Seed sample products catalogue
const SAMPLE_PRODUCTS = [
  { id: 'PROD-01', name: 'Apex Cloud Enterprise', category: 'Cloud', price: 2400.00, icon: 'cloud' },
  { id: 'PROD-02', name: 'CyberShield Sentinel Pro', category: 'Security', price: 1250.00, icon: 'shield-check' },
  { id: 'PROD-03', name: 'OmniAnalytics BI Suite', category: 'Software', price: 1800.00, icon: 'bar-chart-3' },
  { id: 'PROD-04', name: 'EdgeRouter XG Infrastructure', category: 'Hardware', price: 3499.00, icon: 'server' },
  { id: 'PROD-05', name: 'DevPulse CI/CD Pipeline', category: 'Software', price: 890.00, icon: 'code' },
  { id: 'PROD-06', name: 'QuantumVault Key Manager', category: 'Security', price: 650.00, icon: 'key' },
  { id: 'PROD-07', name: 'Workforce Hub Enterprise', category: 'Services', price: 1450.00, icon: 'users' },
  { id: 'PROD-08', name: 'CloudScale Autonomous Pod', category: 'Cloud', price: 4200.00, icon: 'cpu' },
  { id: 'PROD-09', name: 'ComplianceAudit 360', category: 'Services', price: 950.00, icon: 'file-check' }
];

// Seed realistic sales transactions spanning recent days, weeks, months
const DEFAULT_SALES_RECORDS = [
  {
    id: 'ORD-9842',
    customerName: 'Sarah Jenkins',
    customerEmail: 's.jenkins@strataflow.io',
    product: 'Apex Cloud Enterprise',
    category: 'Cloud',
    channel: 'Direct Sales',
    date: '2026-11-13T08:42:00',
    amount: 2400.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9841',
    customerName: 'Marcus Vance',
    customerEmail: 'mvance@zenithcorp.com',
    product: 'CyberShield Sentinel Pro',
    category: 'Security',
    channel: 'Online Store',
    date: '2026-11-12T16:15:00',
    amount: 1250.00,
    paymentStatus: 'Paid',
    orderStatus: 'Processing',
    paymentMethod: 'PayPal'
  },
  {
    id: 'ORD-9840',
    customerName: 'Elena Rostova',
    customerEmail: 'elena.rostova@auroraglobal.de',
    product: 'EdgeRouter XG Infrastructure',
    category: 'Hardware',
    channel: 'Partner',
    date: '2026-11-12T11:20:00',
    amount: 6998.00,
    paymentStatus: 'Paid',
    orderStatus: 'Shipped',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9839',
    customerName: 'Devon Wright',
    customerEmail: 'dwright@lumencraft.org',
    product: 'OmniAnalytics BI Suite',
    category: 'Software',
    channel: 'Marketplace',
    date: '2026-11-11T14:05:00',
    amount: 1800.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9838',
    customerName: 'Aisha Al-Mansoor',
    customerEmail: 'aisha.m@falconfintech.ae',
    product: 'Apex Cloud Enterprise',
    category: 'Cloud',
    channel: 'Direct Sales',
    date: '2026-11-11T09:30:00',
    amount: 4800.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9837',
    customerName: 'Thomas Lindqvist',
    customerEmail: 't.lindqvist@nordicsys.se',
    product: 'QuantumVault Key Manager',
    category: 'Security',
    channel: 'Online Store',
    date: '2026-11-10T17:45:00',
    amount: 650.00,
    paymentStatus: 'Pending',
    orderStatus: 'Processing',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9836',
    customerName: 'Claire Beauchamp',
    customerEmail: 'claire@novasolutions.fr',
    product: 'Workforce Hub Enterprise',
    category: 'Services',
    channel: 'Direct Sales',
    date: '2026-11-10T13:10:00',
    amount: 1450.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9835',
    customerName: 'Liam O\'Connor',
    customerEmail: 'liam@celtictech.ie',
    product: 'DevPulse CI/CD Pipeline',
    category: 'Software',
    channel: 'Online Store',
    date: '2026-11-09T18:22:00',
    amount: 890.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Apple Pay'
  },
  {
    id: 'ORD-9834',
    customerName: 'Kenji Takahashi',
    customerEmail: 'kenji.t@nipponcloud.co.jp',
    product: 'CloudScale Autonomous Pod',
    category: 'Cloud',
    channel: 'Partner',
    date: '2026-11-09T10:14:00',
    amount: 8400.00,
    paymentStatus: 'Paid',
    orderStatus: 'Shipped',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9833',
    customerName: 'Sofia Rossi',
    customerEmail: 'sofia.rossi@milanoapps.it',
    product: 'CyberShield Sentinel Pro',
    category: 'Security',
    channel: 'Online Store',
    date: '2026-11-08T15:50:00',
    amount: 1250.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9832',
    customerName: 'Jordan Taylor',
    customerEmail: 'jtaylor@prismholdings.com',
    product: 'OmniAnalytics BI Suite',
    category: 'Software',
    channel: 'Direct Sales',
    date: '2026-11-08T12:00:00',
    amount: 3600.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9831',
    customerName: 'Rachel Green',
    customerEmail: 'rachel@manhattanretail.com',
    product: 'ComplianceAudit 360',
    category: 'Services',
    channel: 'Marketplace',
    date: '2026-11-07T16:40:00',
    amount: 950.00,
    paymentStatus: 'Refunded',
    orderStatus: 'Cancelled',
    paymentMethod: 'PayPal'
  },
  {
    id: 'ORD-9830',
    customerName: 'Arjun Mehta',
    customerEmail: 'arjun@bengalurusys.in',
    product: 'Apex Cloud Enterprise',
    category: 'Cloud',
    channel: 'Partner',
    date: '2026-11-07T11:15:00',
    amount: 2400.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9829',
    customerName: 'Chloe Dupont',
    customerEmail: 'cdupont@lyondesign.fr',
    product: 'DevPulse CI/CD Pipeline',
    category: 'Software',
    channel: 'Online Store',
    date: '2026-11-06T14:25:00',
    amount: 890.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9828',
    customerName: 'Mateo Morales',
    customerEmail: 'mateo@iberiacloud.es',
    product: 'EdgeRouter XG Infrastructure',
    category: 'Hardware',
    channel: 'Direct Sales',
    date: '2026-11-05T09:45:00',
    amount: 3499.00,
    paymentStatus: 'Paid',
    orderStatus: 'Shipped',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9827',
    customerName: 'Amara Okafor',
    customerEmail: 'amara.okafor@lagostech.ng',
    product: 'CyberShield Sentinel Pro',
    category: 'Security',
    channel: 'Online Store',
    date: '2026-11-04T16:10:00',
    amount: 2500.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9826',
    customerName: 'Lucas Weber',
    customerEmail: 'l.weber@bavariaengine.de',
    product: 'OmniAnalytics BI Suite',
    category: 'Software',
    channel: 'Partner',
    date: '2026-11-03T10:30:00',
    amount: 1800.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9825',
    customerName: 'Natalie Wong',
    customerEmail: 'nwong@pacificventures.hk',
    product: 'Apex Cloud Enterprise',
    category: 'Cloud',
    channel: 'Direct Sales',
    date: '2026-11-02T13:20:00',
    amount: 7200.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9824',
    customerName: 'Zane Gallagher',
    customerEmail: 'zgallagher@sydneyops.au',
    product: 'Workforce Hub Enterprise',
    category: 'Services',
    channel: 'Marketplace',
    date: '2026-11-01T15:15:00',
    amount: 1450.00,
    paymentStatus: 'Pending',
    orderStatus: 'Processing',
    paymentMethod: 'PayPal'
  },
  {
    id: 'ORD-9823',
    customerName: 'Freja Nielsen',
    customerEmail: 'freja@copenhagensaas.dk',
    product: 'QuantumVault Key Manager',
    category: 'Security',
    channel: 'Online Store',
    date: '2026-10-30T11:05:00',
    amount: 1300.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9822',
    customerName: 'Gabriel Santos',
    customerEmail: 'gabriel.santos@saopauloinfo.br',
    product: 'EdgeRouter XG Infrastructure',
    category: 'Hardware',
    channel: 'Direct Sales',
    date: '2026-10-28T14:40:00',
    amount: 3499.00,
    paymentStatus: 'Paid',
    orderStatus: 'Shipped',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9821',
    customerName: 'Hanna Kowalska',
    customerEmail: 'h.kowalska@warsawdata.pl',
    product: 'Apex Cloud Enterprise',
    category: 'Cloud',
    channel: 'Online Store',
    date: '2026-10-26T09:15:00',
    amount: 2400.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9820',
    customerName: 'Derrick Henderson',
    customerEmail: 'dhenderson@austinfin.com',
    product: 'OmniAnalytics BI Suite',
    category: 'Software',
    channel: 'Direct Sales',
    date: '2026-10-24T16:50:00',
    amount: 5400.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9819',
    customerName: 'Mia Chen',
    customerEmail: 'mia.chen@taipeitechnology.tw',
    product: 'CyberShield Sentinel Pro',
    category: 'Security',
    channel: 'Partner',
    date: '2026-10-22T10:10:00',
    amount: 1250.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9818',
    customerName: 'Oliver Smith',
    customerEmail: 'oliver.smith@londonconsulting.co.uk',
    product: 'ComplianceAudit 360',
    category: 'Services',
    channel: 'Direct Sales',
    date: '2026-10-20T11:45:00',
    amount: 2850.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9817',
    customerName: 'Samantha Ray',
    customerEmail: 'sray@seattlemedia.io',
    product: 'DevPulse CI/CD Pipeline',
    category: 'Software',
    channel: 'Marketplace',
    date: '2026-10-18T13:30:00',
    amount: 890.00,
    paymentStatus: 'Failed',
    orderStatus: 'Cancelled',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9816',
    customerName: 'Victor Hugo Ramos',
    customerEmail: 'vhugo@mexicoconsult.mx',
    product: 'CloudScale Autonomous Pod',
    category: 'Cloud',
    channel: 'Direct Sales',
    date: '2026-10-15T15:20:00',
    amount: 4200.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9815',
    customerName: 'Ananya Sharma',
    customerEmail: 'ananya@delhilabs.in',
    product: 'Apex Cloud Enterprise',
    category: 'Cloud',
    channel: 'Online Store',
    date: '2026-10-12T10:00:00',
    amount: 2400.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'PayPal'
  },
  {
    id: 'ORD-9814',
    customerName: 'Lars Bergstrom',
    customerEmail: 'lars@stockholmlabs.se',
    product: 'CyberShield Sentinel Pro',
    category: 'Security',
    channel: 'Partner',
    date: '2026-10-10T09:40:00',
    amount: 2500.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9813',
    customerName: 'Evelyn Brooks',
    customerEmail: 'ebrooks@chicagoventures.org',
    product: 'Workforce Hub Enterprise',
    category: 'Services',
    channel: 'Direct Sales',
    date: '2026-10-05T14:15:00',
    amount: 1450.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9812',
    customerName: 'Jin-Woo Park',
    customerEmail: 'jinwoo@seoulcloud.kr',
    product: 'EdgeRouter XG Infrastructure',
    category: 'Hardware',
    channel: 'Direct Sales',
    date: '2026-09-28T16:30:00',
    amount: 10497.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9811',
    customerName: 'Camila Rodriguez',
    customerEmail: 'crodriguez@bogotatech.co',
    product: 'OmniAnalytics BI Suite',
    category: 'Software',
    channel: 'Online Store',
    date: '2026-09-20T11:20:00',
    amount: 1800.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9810',
    customerName: 'Tariq Habib',
    customerEmail: 'thabib@dubaiventures.ae',
    product: 'CloudScale Autonomous Pod',
    category: 'Cloud',
    channel: 'Direct Sales',
    date: '2026-09-14T10:05:00',
    amount: 8400.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9809',
    customerName: 'Leonie Becker',
    customerEmail: 'leonie.becker@berlinbi.de',
    product: 'Apex Cloud Enterprise',
    category: 'Cloud',
    channel: 'Partner',
    date: '2026-08-25T13:10:00',
    amount: 4800.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9808',
    customerName: 'Ethan Cole',
    customerEmail: 'ethan.cole@torontosys.ca',
    product: 'CyberShield Sentinel Pro',
    category: 'Security',
    channel: 'Online Store',
    date: '2026-08-10T15:45:00',
    amount: 1250.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Apple Pay'
  },
  {
    id: 'ORD-9807',
    customerName: 'Isabella Gomez',
    customerEmail: 'igomez@madridnetworks.es',
    product: 'EdgeRouter XG Infrastructure',
    category: 'Hardware',
    channel: 'Direct Sales',
    date: '2026-07-22T09:30:00',
    amount: 3499.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9806',
    customerName: 'Hiroshi Tanaka',
    customerEmail: 'htanaka@tokyodata.jp',
    product: 'OmniAnalytics BI Suite',
    category: 'Software',
    channel: 'Marketplace',
    date: '2026-07-08T12:00:00',
    amount: 3600.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9805',
    customerName: 'Zoe Kravitz',
    customerEmail: 'zkravitz@nycentreprise.com',
    product: 'CloudScale Autonomous Pod',
    category: 'Cloud',
    channel: 'Partner',
    date: '2026-06-19T14:15:00',
    amount: 12600.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9804',
    customerName: 'Finnian Murphy',
    customerEmail: 'fmurphy@dublinhq.ie',
    product: 'DevPulse CI/CD Pipeline',
    category: 'Software',
    channel: 'Online Store',
    date: '2026-05-30T11:50:00',
    amount: 1780.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9803',
    customerName: 'Chloe Bennett',
    customerEmail: 'cbennett@sanfranciscotech.io',
    product: 'Apex Cloud Enterprise',
    category: 'Cloud',
    channel: 'Direct Sales',
    date: '2026-05-12T16:20:00',
    amount: 4800.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9802',
    customerName: 'Stefan Meyer',
    customerEmail: 'smeyer@zurichfin.ch',
    product: 'QuantumVault Key Manager',
    category: 'Security',
    channel: 'Direct Sales',
    date: '2026-04-18T10:40:00',
    amount: 2600.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'ORD-9801',
    customerName: 'Aria Montgomery',
    customerEmail: 'aria.m@bostonbiotech.org',
    product: 'Workforce Hub Enterprise',
    category: 'Services',
    channel: 'Online Store',
    date: '2026-03-25T13:45:00',
    amount: 1450.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9800',
    customerName: 'Dmitri Volkov',
    customerEmail: 'dmitri@vostokanalytics.com',
    product: 'OmniAnalytics BI Suite',
    category: 'Software',
    channel: 'Partner',
    date: '2026-02-14T15:30:00',
    amount: 1800.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-9799',
    customerName: 'Laura Bailey',
    customerEmail: 'laura@seattlestack.com',
    product: 'Apex Cloud Enterprise',
    category: 'Cloud',
    channel: 'Direct Sales',
    date: '2026-01-20T11:10:00',
    amount: 2400.00,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    paymentMethod: 'Credit Card'
  }
];

class DataStore {
  constructor() {
    this.init();
  }

  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        this.saveAll(DEFAULT_SALES_RECORDS);
      }
    } catch (e) {
      console.warn('localStorage access failed, fallback to memory', e);
      this._memoryStorage = [...DEFAULT_SALES_RECORDS];
    }
  }

  getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load from localStorage', e);
    }
    return this._memoryStorage || [...DEFAULT_SALES_RECORDS];
  }

  saveAll(records) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
      this._memoryStorage = records;
    }
    this.notifyChange();
  }

  getById(id) {
    const list = this.getAll();
    return list.find(r => r.id === id);
  }

  add(record) {
    const list = this.getAll();
    
    // Auto generate ID if not supplied
    if (!record.id) {
      const nextNum = Math.floor(1000 + Math.random() * 9000);
      record.id = `ORD-${nextNum}`;
    }

    // Default timestamp if missing
    if (!record.date) {
      record.date = new Date().toISOString();
    }

    // Ensure amount is numerical
    record.amount = parseFloat(record.amount) || 0;

    // Add to beginning of array
    list.unshift(record);
    this.saveAll(list);
    return record;
  }

  update(id, updatedFields) {
    const list = this.getAll();
    const index = list.findIndex(r => r.id === id);
    if (index === -1) return null;

    if (updatedFields.amount !== undefined) {
      updatedFields.amount = parseFloat(updatedFields.amount) || 0;
    }

    list[index] = { ...list[index], ...updatedFields };
    this.saveAll(list);
    return list[index];
  }

  delete(id) {
    const list = this.getAll();
    const filtered = list.filter(r => r.id !== id);
    if (filtered.length !== list.length) {
      this.saveAll(filtered);
      return true;
    }
    return false;
  }

  reset() {
    this.saveAll([...DEFAULT_SALES_RECORDS]);
    return this.getAll();
  }

  notifyChange() {
    window.dispatchEvent(new CustomEvent('salespulse:datachange', {
      detail: { timestamp: Date.now() }
    }));
  }

  exportCSV(recordsToExport = null) {
    const data = recordsToExport || this.getAll();
    if (!data || data.length === 0) {
      return false;
    }

    const headers = [
      'Order ID',
      'Customer Name',
      'Customer Email',
      'Product',
      'Category',
      'Sales Channel',
      'Date',
      'Amount ($)',
      'Payment Status',
      'Order Status',
      'Payment Method'
    ];

    const rows = data.map(r => [
      `"${r.id}"`,
      `"${(r.customerName || '').replace(/"/g, '""')}"`,
      `"${(r.customerEmail || '').replace(/"/g, '""')}"`,
      `"${(r.product || '').replace(/"/g, '""')}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${(r.channel || '').replace(/"/g, '""')}"`,
      `"${r.date}"`,
      r.amount.toFixed(2),
      `"${r.paymentStatus}"`,
      `"${r.orderStatus}"`,
      `"${r.paymentMethod || 'Credit Card'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SalesPulse_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }
}

// Global data store instance
window.dataStore = new DataStore();

