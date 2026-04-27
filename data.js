/* ============================================================
   COMMON CENTS — Data Layer (js/data.js)
   All data stored in localStorage. No network calls.
   ============================================================ */

const DB_KEY = 'cc_data_v2';
const PIN_KEY = 'cc_pins_v2';
const SESSION_KEY = 'cc_session';

// ---- DEFAULT DATA STRUCTURE ----
const DEFAULT_DATA = {
  income: {
    sumer: 3800,
    siona: 4200
  },
  budgetCategories: [
    { id: 'groceries',     name: 'Groceries',     limit: 800,  icon: 'shopping-cart' },
    { id: 'dining',        name: 'Dining Out',     limit: 400,  icon: 'utensils' },
    { id: 'utilities',     name: 'Utilities',      limit: 350,  icon: 'zap' },
    { id: 'transport',     name: 'Transport',      limit: 300,  icon: 'car' },
    { id: 'entertainment', name: 'Entertainment',  limit: 200,  icon: 'film' },
    { id: 'health',        name: 'Health',         limit: 200,  icon: 'heart-pulse' },
    { id: 'other',         name: 'Other',          limit: 300,  icon: 'more-horizontal' }
  ],
  transactions: [],
  bills: [
    { id: 'b1', name: 'Mortgage — ANZ',   amount: 1850, dueDay: 1,  recur: 'monthly',    remind: 3,  owner: 'shared',  category: 'utilities' },
    { id: 'b2', name: 'Vector Power',      amount: 142,  dueDay: 29, recur: 'monthly',    remind: 3,  owner: 'shared',  category: 'utilities' },
    { id: 'b3', name: 'Chorus Internet',   amount: 89,   dueDay: 1,  recur: 'monthly',    remind: 3,  owner: 'sumer',   category: 'utilities' },
    { id: 'b4', name: 'Car Insurance — AA',amount: 220,  dueDay: 15, recur: 'monthly',    remind: 7,  owner: 'sumer',   category: 'transport' },
    { id: 'b5', name: 'Netflix + Spotify', amount: 38,   dueDay: 20, recur: 'monthly',    remind: 3,  owner: 'shared',  category: 'entertainment' },
  ],
  reminders: [
    { id: 'r1', title: 'Put out the bins',        date: null, time: '21:00', recur: 'weekly',  notify: 'both',  dayOfWeek: 2 },
    { id: 'r2', title: 'Monthly budget review',   date: null, time: '09:00', recur: 'monthly', notify: 'both',  dayOfMonth: 'last' },
    { id: 'r3', title: 'Car WOF renewal — Sumer', date: '2025-06-15', time: '09:00', recur: 'never', notify: 'sumer' },
  ],
  settings: {
    notifBills: true,
    notifBudget: true,
    notifBins: true,
    notifReview: true,
    notifSettle: false
  }
};

const DEFAULT_PINS = { sumer: '1234', siona: '1234' };

// Seed sample historical transactions (last 6 months)
function generateSampleTransactions() {
  const txs = [];
  const now = new Date();
  const categories = ['groceries','dining','utilities','transport','entertainment','health'];
  const catAmounts = { groceries:[60,200], dining:[20,150], utilities:[50,250], transport:[40,120], entertainment:[15,100], health:[30,200] };

  for (let m = 5; m >= 0; m--) {
    const month = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() - m + 1, 0).getDate();
    const numTx = 8 + Math.floor(Math.random() * 6);
    for (let i = 0; i < numTx; i++) {
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const [lo, hi] = catAmounts[cat];
      const amount = +(lo + Math.random() * (hi - lo)).toFixed(2);
      const day = 1 + Math.floor(Math.random() * daysInMonth);
      const dateStr = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const payer = Math.random() > 0.5 ? 'sumer' : 'siona';
      const owner = Math.random() > 0.4 ? 'shared' : payer;
      txs.push({
        id: `sample_${m}_${i}`,
        type: 'expense',
        desc: sampleDesc(cat),
        amount,
        date: dateStr,
        payer,
        owner,
        category: cat,
        createdAt: Date.now()
      });
    }
    // Add income
    txs.push({ id: `inc_j_${m}`, type: 'income', desc: "Sumer's Salary", amount: 3800, date: `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}-15`, owner: 'sumer', payer: 'sumer', category: 'income', createdAt: Date.now() });
    txs.push({ id: `inc_s_${m}`, type: 'income', desc: "Siona's Salary",  amount: 4200, date: `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}-15`, owner: 'siona', payer: 'siona', category: 'income', createdAt: Date.now() });
  }
  return txs;
}

function sampleDesc(cat) {
  const map = {
    groceries:     ['Countdown','Pak'nSave','New World','Fresh Choice'],
    dining:        ['The Terrace Café','Cassia','Mekong Baby','Ebisu','Burger Fuel'],
    utilities:     ['Vector Power','Watercare','Chorus','Council Rates'],
    transport:     ['Z Energy','BP Fuel','AT HOP top-up','AA Parking'],
    entertainment: ['Event Cinema','Sky TV','Spotify','Steam','Netflix'],
    health:        ['Chemist Warehouse','Lumino Dental','Physio','Gym membership']
  };
  const arr = map[cat] || ['Purchase'];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---- LOAD / SAVE ----
function loadData() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveData(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

function initData() {
  let data = loadData();
  if (!data) {
    data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    data.transactions = generateSampleTransactions();
    saveData(data);
  }
  return data;
}

// ---- PINS ----
function loadPins() {
  try {
    const raw = localStorage.getItem(PIN_KEY);
    return raw ? JSON.parse(raw) : { ...DEFAULT_PINS };
  } catch { return { ...DEFAULT_PINS }; }
}

function savePins(pins) {
  localStorage.setItem(PIN_KEY, JSON.stringify(pins));
}

function checkPin(user, pin) {
  const pins = loadPins();
  return pins[user] === pin;
}

function setPin(user, pin) {
  const pins = loadPins();
  pins[user] = pin;
  savePins(pins);
}

// ---- SESSION ----
function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
}

function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, ts: Date.now() }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ---- TRANSACTION CRUD ----
function addTransaction(tx) {
  const data = initData();
  tx.id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
  tx.createdAt = Date.now();
  data.transactions.unshift(tx);
  saveData(data);
  return tx;
}

function deleteTransaction(id) {
  const data = initData();
  data.transactions = data.transactions.filter(t => t.id !== id);
  saveData(data);
}

function getTransactions(filters = {}) {
  const data = initData();
  let txs = [...data.transactions];

  if (filters.month !== undefined && filters.year !== undefined) {
    txs = txs.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === filters.year && d.getMonth() === filters.month;
    });
  }
  if (filters.type) txs = txs.filter(t => t.type === filters.type);
  if (filters.owner && filters.owner !== 'all') {
    txs = txs.filter(t => t.owner === filters.owner || t.payer === filters.owner);
  }
  if (filters.category) txs = txs.filter(t => t.category === filters.category);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    txs = txs.filter(t => t.desc.toLowerCase().includes(q));
  }

  return txs.sort((a,b) => new Date(b.date) - new Date(a.date));
}

// ---- BILL CRUD ----
function addBill(bill) {
  const data = initData();
  bill.id = 'b_' + Date.now();
  data.bills.push(bill);
  saveData(data);
  return bill;
}

function deleteBill(id) {
  const data = initData();
  data.bills = data.bills.filter(b => b.id !== id);
  saveData(data);
}

function getBills() {
  return initData().bills;
}

// ---- REMINDER CRUD ----
function addReminder(rem) {
  const data = initData();
  rem.id = 'r_' + Date.now();
  data.reminders.push(rem);
  saveData(data);
  return rem;
}

function deleteReminder(id) {
  const data = initData();
  data.reminders = data.reminders.filter(r => r.id !== id);
  saveData(data);
}

function getReminders() {
  return initData().reminders;
}

// ---- BUDGET CATEGORIES ----
function getBudgetCategories() {
  return initData().budgetCategories;
}

function addBudgetCategory(cat) {
  const data = initData();
  cat.id = cat.name.toLowerCase().replace(/\s+/g,'_') + '_' + Date.now();
  data.budgetCategories.push(cat);
  saveData(data);
}

// ---- INCOME ----
function getIncome() {
  return initData().income;
}

function setIncome(user, amount) {
  const data = initData();
  data.income[user] = amount;
  saveData(data);
}

// ---- ANALYTICS ----
function getMonthlyTotals(monthsBack = 6) {
  const data = initData();
  const now = new Date();
  const result = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleDateString('en-NZ', { month: 'short', year: '2-digit' });

    const txs = data.transactions.filter(t => {
      const td = new Date(t.date);
      return td.getFullYear() === year && td.getMonth() === month;
    });

    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const income   = txs.filter(t => t.type === 'income').reduce((s,  t) => s + t.amount, 0);
    const savings  = income - expenses;

    result.push({ label, year, month, expenses, income, savings });
  }

  return result;
}

function getCategorySpend(year, month) {
  const data = initData();
  const cats = {};
  data.transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getFullYear() === year && d.getMonth() === month;
    })
    .forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
  return cats;
}

function getSettlement(year, month) {
  const txs = getTransactions({ year, month, type: 'expense' });
  let sumerPaid = 0, sionaPaid = 0;
  let sumerShare = 0, sionaShare = 0;

  txs.forEach(t => {
    const amt = t.amount;
    if (t.payer === 'sumer') sumerPaid += amt;
    if (t.payer === 'siona') sionaPaid += amt;

    if (t.owner === 'shared') {
      sumerShare += amt / 2;
      sionaShare += amt / 2;
    } else if (t.owner === 'sumer') {
      sumerShare += amt;
    } else if (t.owner === 'siona') {
      sionaShare += amt;
    }
  });

  const sumerOwes = sumerShare - sumerPaid;
  return { sumerPaid, sionaPaid, sumerShare, sionaShare, sumerOwes };
}

function getForecast(monthsBack = 6, monthsForward = 6) {
  const monthly = getMonthlyTotals(monthsBack);
  const data = initData();
  const totalIncome = data.income.sumer + data.income.siona;

  const avgExpenses = monthly.reduce((s, m) => s + m.expenses, 0) / monthly.length;
  const avgSavings  = monthly.reduce((s, m) => s + m.savings,  0) / monthly.length;
  const trend = monthly.length >= 2
    ? (monthly[monthly.length-1].expenses - monthly[0].expenses) / monthly.length
    : 0;

  const now = new Date();
  const history = monthly.map(m => ({ label: m.label, value: m.savings, type: 'actual' }));
  const future  = [];
  let cumulative = 0;

  for (let i = 1; i <= monthsForward; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = d.toLocaleDateString('en-NZ', { month: 'short', year: '2-digit' });
    const projExpenses = Math.max(0, avgExpenses + trend * i);
    const projSavings  = totalIncome - projExpenses;
    cumulative += projSavings;
    future.push({ label, value: projSavings, cumulative, type: 'forecast' });
  }

  return {
    history,
    future,
    avgExpenses,
    avgSavings,
    totalIncome,
    projectedAnnualSavings: avgSavings * 12,
    savingsRate: totalIncome > 0 ? (avgSavings / totalIncome) * 100 : 0,
    trend
  };
}

// ---- BILLS DUE ----
function getBillsDueSoon(days = 7) {
  const bills = getBills();
  const now = new Date();
  const upcoming = [];

  bills.forEach(bill => {
    const dueDate = new Date(now.getFullYear(), now.getMonth(), bill.dueDay);
    if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
    const diff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    if (diff <= days) upcoming.push({ ...bill, dueDate, daysUntil: diff });
  });

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
}

// ---- EXPORT / IMPORT ----
function exportData() {
  const data = initData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `common-cents-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importDataFromJSON(json) {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.transactions || !parsed.bills) throw new Error('Invalid format');
    saveData(parsed);
    return true;
  } catch (e) {
    return false;
  }
}
