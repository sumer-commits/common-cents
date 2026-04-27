/* ============================================================
   COMMON CENTS — App Logic (js/app.js)
   ============================================================ */

// ---- STATE ----
let currentUser = null;
let currentMonth = new Date().getMonth();
let currentYear  = new Date().getFullYear();
let activeUserFilter = 'all';
let calendarDate = new Date();
let selectedCalDay = null;

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  Chart.defaults.font.family = 'DM Sans, sans-serif';

  // Set today's date on all date inputs
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(el => { if (!el.value) el.value = today; });

  lucide.createIcons();

  const session = getSession();
  if (session && session.user) {
    currentUser = session.user;
    showApp();
  } else {
    showLogin();
  }

  // chip-group single-select behaviour
  document.querySelectorAll('.chip-group').forEach(group => {
    group.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
});

// ---- LOGIN ----
let loginUser = 'sumer';

function selectUser(user) {
  loginUser = user;
  document.querySelectorAll('.user-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-user="${user}"]`).classList.add('active');
}

function pinNext(el, nextId) {
  if (el.value.length >= 1 && nextId) {
    document.getElementById(nextId).focus();
  }
}

function doLogin() {
  const pin = ['p1','p2','p3','p4'].map(id => document.getElementById(id).value).join('');
  if (pin.length < 4) { showToast('Please enter your 4-digit PIN'); return; }

  if (checkPin(loginUser, pin)) {
    currentUser = loginUser;
    setSession(currentUser);
    showApp();
  } else {
    document.getElementById('pin-hint').textContent = 'Incorrect PIN — try again';
    document.getElementById('pin-hint').style.color = 'var(--coral)';
    ['p1','p2','p3','p4'].forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('p1').focus();
  }
}

function doLogout() {
  clearSession();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').style.display = 'flex';
  ['p1','p2','p3','p4'].forEach(id => { document.getElementById(id).value = ''; });
}

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').classList.add('hidden');
  lucide.createIcons();
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');
  updateGreeting();
  updateMonthLabel();
  switchNav('dashboard');
  checkBillAlerts();
  lucide.createIcons();
}

// ---- GREETING ----
function updateGreeting() {
  const h = new Date().getHours();
  const timeGreet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const name = currentUser === 'sumer' ? 'Sumer' : 'Siona';
  const el = document.getElementById('greeting-text');
  if (el) el.textContent = `${timeGreet}, ${name}`;
}

// ---- MONTH NAVIGATION ----
function updateMonthLabel() {
  const d = new Date(currentYear, currentMonth, 1);
  const label = d.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' });
  document.getElementById('month-label').textContent = label;
}

function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
  updateMonthLabel();
  refreshCurrentScreen();
}

function refreshCurrentScreen() {
  const active = document.querySelector('.screen.active');
  if (!active) return;
  const id = active.id.replace('screen-', '');
  renderScreen(id);
}

// ---- NAVIGATION ----
function switchNav(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const screen = document.getElementById('screen-' + name);
  const navEl   = document.getElementById('nav-' + name);
  if (screen) screen.classList.add('active');
  if (navEl)  navEl.classList.add('active');

  renderScreen(name);
  lucide.createIcons();
}

function renderScreen(name) {
  switch (name) {
    case 'dashboard':    renderDashboard();    break;
    case 'transactions': renderTransactions(); break;
    case 'analytics':    renderAnalytics();    break;
    case 'calendar':     renderCalendar();     break;
    case 'bills':        renderBills();        break;
    case 'profile':      renderProfile();      break;
  }
}

// ---- DASHBOARD ----
function renderDashboard() {
  const now = new Date();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dayOfMonth  = currentMonth === now.getMonth() && currentYear === now.getFullYear() ? now.getDate() : daysInMonth;
  const daysLeft    = daysInMonth - dayOfMonth;

  const cats   = getBudgetCategories();
  const budget = cats.reduce((s, c) => s + (c.limit || 0), 0);

  const txs      = getTransactions({ year: currentYear, month: currentMonth, type: 'expense' });
  const spent    = txs.reduce((s, t) => s + t.amount, 0);
  const income   = getIncome();
  const totalInc = income.sumer + income.siona;
  const remaining = budget - spent;
  const savingsRate = totalInc > 0 ? Math.max(0, ((totalInc - spent) / totalInc) * 100) : 0;

  document.getElementById('dash-budget').textContent    = '$' + budget.toLocaleString('en-NZ');
  document.getElementById('dash-spent-sub').textContent = `$${spent.toFixed(0)} spent`;
  document.getElementById('dash-remaining').textContent = '$' + Math.abs(remaining).toFixed(0);
  document.getElementById('dash-remaining').style.color = remaining < 0 ? 'var(--coral)' : 'var(--amber)';
  document.getElementById('dash-days-sub').textContent  = `${daysLeft} days left`;
  document.getElementById('dash-savings-rate').textContent = savingsRate.toFixed(1) + '%';
  document.getElementById('dash-savings-sub').textContent  = `$${Math.max(0, totalInc - spent).toFixed(0)} saved`;

  // Bills due
  const billsDue = getBillsDueSoon(7);
  document.getElementById('dash-bills-due').textContent  = billsDue.length;
  document.getElementById('dash-bills-sub').textContent  = billsDue.length ? `next: ${billsDue[0].name.split(' ')[0]}` : 'none this week';
  updateBillBadge(billsDue.length);

  // Settlement
  const settle = getSettlement(currentYear, currentMonth);
  const settleBody = document.getElementById('settle-body');
  if (Math.abs(settle.sumerOwes) < 1) {
    settleBody.innerHTML = '<span class="muted-text" style="font-size:13px">✓ All settled up this month!</span>';
  } else if (settle.sumerOwes > 0) {
    settleBody.innerHTML = `<div class="settle-row"><span class="settle-text">Sumer owes Siona</span><span class="settle-amount">$${settle.sumerOwes.toFixed(2)}</span></div>`;
  } else {
    settleBody.innerHTML = `<div class="settle-row"><span class="settle-text">Siona owes Sumer</span><span class="settle-amount">$${Math.abs(settle.sumerOwes).toFixed(2)}</span></div>`;
  }

  // Donut
  const catSpend = getCategorySpend(currentYear, currentMonth);
  renderDonutChart('donut-chart', catSpend);

  // Recent 5 transactions
  const recent = getTransactions({ year: currentYear, month: currentMonth }).slice(0, 5);
  renderTxList('dash-tx-list', recent, true);

  lucide.createIcons();
}

// ---- TRANSACTIONS ----
let txFilter = 'all';

function filterTx(el) {
  document.querySelectorAll('#tx-filter-chips .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  txFilter = el.dataset.filter;
  renderTransactions();
}

function renderTransactions() {
  const search = document.getElementById('tx-search')?.value || '';
  const ownerFilter = txFilter === 'all' ? 'all' : txFilter;

  const txs = getTransactions({ year: currentYear, month: currentMonth, owner: ownerFilter, search });
  renderTxList('tx-list-full', txs, false);

  // Split summary
  const settle = getSettlement(currentYear, currentMonth);
  const income = getIncome();
  const splitEl = document.getElementById('split-summary');
  if (splitEl) {
    splitEl.innerHTML = `
      <div class="split-row">
        <div class="split-person">
          <div class="avatar av-sumer sm-av">J</div>
          <div><div class="split-name">Sumer</div><div class="split-paid">Paid $${settle.sumerPaid.toFixed(0)} · Income $${income.sumer.toLocaleString()}</div></div>
        </div>
        <div class="split-balance ${settle.sumerOwes > 0 ? 'split-owe' : 'split-owed'}">
          ${settle.sumerOwes > 0 ? 'Owes' : 'Owed'} $${Math.abs(settle.sumerOwes).toFixed(2)}
        </div>
      </div>
      <div class="split-row">
        <div class="split-person">
          <div class="avatar av-siona sm-av">S</div>
          <div><div class="split-name">Siona</div><div class="split-paid">Paid $${settle.sionaPaid.toFixed(0)} · Income $${income.siona.toLocaleString()}</div></div>
        </div>
        <div class="split-balance ${settle.sumerOwes < 0 ? 'split-owe' : 'split-owed'}">
          ${settle.sumerOwes < 0 ? 'Owes' : 'Owed'} $${Math.abs(settle.sumerOwes).toFixed(2)}
        </div>
      </div>`;
  }

  lucide.createIcons();
}

// ---- TX LIST RENDERER ----
const CAT_ICONS = {
  groceries: 'shopping-cart', dining: 'utensils', utilities: 'zap',
  transport: 'car', entertainment: 'film', health: 'heart-pulse',
  income: 'trending-up', other: 'more-horizontal',
};

const CAT_BG = {
  groceries: 'background:var(--amber-light);color:var(--amber)',
  dining: 'background:var(--coral-light);color:var(--coral)',
  utilities: 'background:var(--blue-light);color:var(--blue)',
  transport: 'background:var(--teal-light);color:var(--teal-dark)',
  entertainment: 'background:var(--purple-light);color:var(--purple)',
  health: 'background:#e8f5e9;color:#2e7d32',
  income: 'background:var(--teal-light);color:var(--teal-dark)',
  other: 'background:var(--bg);color:var(--text-muted)',
};

function renderTxList(containerId, txs, compact) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!txs.length) {
    el.innerHTML = '<div class="empty-state"><i data-lucide="inbox"></i><span>No transactions for this period</span></div>';
    lucide.createIcons();
    return;
  }

  el.innerHTML = txs.map(tx => {
    const icon    = CAT_ICONS[tx.category] || 'circle';
    const bgStyle = CAT_BG[tx.category] || CAT_BG.other;
    const isIncome = tx.type === 'income';
    const sign     = isIncome ? '+' : '-';
    const amtCls   = isIncome ? 'income' : 'expense';

    const ownerTag = tx.owner === 'shared'
      ? `<span class="tag tag-shared">Shared</span>`
      : tx.owner === 'sumer'
        ? `<span class="tag tag-sumer">Sumer</span>`
        : `<span class="tag tag-siona">Siona</span>`;

    const payerTag = tx.payer && tx.payer !== tx.owner && !isIncome
      ? (tx.payer === 'sumer'
          ? `<span class="tag tag-sumer">J paid</span>`
          : `<span class="tag tag-siona">S paid</span>`)
      : '';

    const catTag = `<span class="tag tag-${tx.category}">${tx.category}</span>`;
    const dateStr = new Date(tx.date).toLocaleDateString('en-NZ', { day:'numeric', month:'short' });

    const delBtn = compact ? '' : `<button class="del-btn" onclick="deleteTx('${tx.id}',event)"><i data-lucide="trash-2"></i></button>`;

    return `
      <div class="tx-item">
        <div class="tx-icon" style="${bgStyle}"><i data-lucide="${icon}"></i></div>
        <div class="tx-info">
          <div class="tx-name">${tx.desc}</div>
          <div class="tx-meta">${catTag}${ownerTag}${payerTag}</div>
        </div>
        <div class="tx-right">
          <div class="tx-amount ${amtCls}">${sign}$${tx.amount.toFixed(2)}</div>
          <div class="tx-date">${dateStr}</div>
        </div>
        ${delBtn}
      </div>`;
  }).join('');

  lucide.createIcons();
}

function deleteTx(id, e) {
  e.stopPropagation();
  if (confirm('Delete this transaction?')) {
    deleteTransaction(id);
    refreshCurrentScreen();
    showToast('Transaction deleted');
  }
}

// ---- ANALYTICS ----
function renderAnalytics() {
  const monthlyData = getMonthlyTotals(6);
  renderBarChart('bar-chart', monthlyData);

  const forecast = getForecast(6, 6);
  renderForecastChart('forecast-chart', forecast);

  // Forecast summary cards
  const fSummary = document.getElementById('forecast-summary');
  if (fSummary) {
    fSummary.innerHTML = `
      <div class="forecast-stat">
        <div class="forecast-stat-label">Avg monthly savings</div>
        <div class="forecast-stat-value ${forecast.avgSavings >= 0 ? 'pos' : 'neg'}">$${Math.abs(forecast.avgSavings).toFixed(0)}</div>
      </div>
      <div class="forecast-stat">
        <div class="forecast-stat-label">Projected 6-mo</div>
        <div class="forecast-stat-value neutral">$${forecast.future.slice(-1)[0]?.cumulative.toFixed(0) || 0}</div>
      </div>
      <div class="forecast-stat">
        <div class="forecast-stat-label">Savings rate</div>
        <div class="forecast-stat-value ${forecast.savingsRate >= 20 ? 'pos' : forecast.savingsRate >= 10 ? 'neutral' : 'neg'}">${forecast.savingsRate.toFixed(1)}%</div>
      </div>`;
  }

  // Forecast insight
  const fInsight = document.getElementById('forecast-insight');
  if (fInsight) {
    let msg = '', cls = '';
    if (forecast.savingsRate >= 20) {
      msg = `Great work! You're saving ${forecast.savingsRate.toFixed(1)}% of your combined income. At this rate you'll save approximately $${(forecast.avgSavings * 12).toFixed(0)} this year. Keep it up!`;
      cls = 'insight-good';
    } else if (forecast.savingsRate >= 10) {
      msg = `You're saving ${forecast.savingsRate.toFixed(1)}% of income — decent progress. To hit a 20% savings rate, you'd need to cut spending by roughly $${((forecast.totalIncome * 0.20 - forecast.avgSavings)).toFixed(0)}/month.`;
      cls = 'insight-warn';
    } else if (forecast.savingsRate > 0) {
      msg = `Your savings rate of ${forecast.savingsRate.toFixed(1)}% is below the recommended 20%. Consider reducing dining or entertainment spend — those trend upward most months.`;
      cls = 'insight-warn';
    } else {
      msg = `Spending is currently exceeding income. Review your largest categories and look for cuts. The forecast shows a deficit if this trend continues.`;
      cls = 'insight-bad';
    }
    fInsight.innerHTML = msg;
    fInsight.className = `forecast-insight ${cls}`;
  }

  renderLineChart('line-chart', 6);
  renderBudgetVsActual('budget-vs-actual', currentYear, currentMonth);

  lucide.createIcons();
}

// ---- CALENDAR ----
function renderCalendar() {
  const year  = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const today = new Date();

  document.getElementById('cal-month-title').textContent =
    calendarDate.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Gather events for dots
  const bills = getBills();
  const reminders = getReminders();
  const billDays = new Set(bills.map(b => b.dueDay));
  const remDays  = new Set();
  reminders.forEach(r => {
    if (r.date) {
      const d = new Date(r.date);
      if (d.getFullYear() === year && d.getMonth() === month) remDays.add(d.getDate());
    }
    if (r.recur === 'weekly' && r.dayOfWeek !== undefined) {
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        if (d.getDay() === r.dayOfWeek) remDays.add(day);
      }
    }
  });

  const grid = document.getElementById('cal-grid');
  let html = '';

  // Blanks before first day
  for (let i = 0; i < firstDay; i++) {
    const prevDay = new Date(year, month, 0 - (firstDay - 1 - i)).getDate();
    html += `<div class="cal-day other-month"><span>${prevDay}</span></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSelected = selectedCalDay === d;
    let dots = '';
    if (billDays.has(d))  dots += '<span class="cal-dot dot-bill"></span>';
    if (remDays.has(d))   dots += '<span class="cal-dot dot-reminder"></span>';

    const cls = [
      'cal-day',
      isToday ? 'today' : '',
      isSelected && !isToday ? 'selected' : '',
    ].filter(Boolean).join(' ');

    html += `<div class="${cls}" onclick="calSelectDay(${d})">
      <span>${d}</span>
      ${dots ? `<div class="cal-dots">${dots}</div>` : ''}
    </div>`;
  }

  // Fill remaining
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  for (let i = 1; i <= totalCells - firstDay - daysInMonth; i++) {
    html += `<div class="cal-day other-month"><span>${i}</span></div>`;
  }

  grid.innerHTML = html;

  renderCalEvents(year, month, selectedCalDay);
  lucide.createIcons();
}

function calPrev() { calendarDate.setMonth(calendarDate.getMonth() - 1); selectedCalDay = null; renderCalendar(); }
function calNext() { calendarDate.setMonth(calendarDate.getMonth() + 1); selectedCalDay = null; renderCalendar(); }

function calSelectDay(day) {
  selectedCalDay = selectedCalDay === day ? null : day;
  renderCalendar();
}

function renderCalEvents(year, month, filterDay) {
  const bills = getBills();
  const reminders = getReminders();
  const eventsEl = document.getElementById('cal-events-list');
  const titleEl  = document.getElementById('cal-events-title');

  const label = filterDay
    ? `Events — ${new Date(year, month, filterDay).toLocaleDateString('en-NZ',{day:'numeric',month:'long'})}`
    : `Events — ${new Date(year, month, 1).toLocaleDateString('en-NZ',{month:'long',year:'numeric'})}`;
  if (titleEl) titleEl.textContent = label;

  const items = [];

  bills.forEach(bill => {
    if (filterDay && bill.dueDay !== filterDay) return;
    const due = new Date(year, month, bill.dueDay);
    items.push({
      type: 'bill',
      title: bill.name,
      sub: `$${bill.amount} · ${bill.owner === 'shared' ? 'Shared' : bill.owner === 'sumer' ? 'Sumer pays' : 'Siona pays'}`,
      date: due,
      day: bill.dueDay,
      icon: 'credit-card',
      color: 'var(--coral)',
    });
  });

  reminders.forEach(rem => {
    let day = null;
    if (rem.date) {
      const d = new Date(rem.date);
      if (d.getFullYear() === year && d.getMonth() === month) day = d.getDate();
    }
    if (rem.recur === 'weekly' && !rem.date) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(year, month, d).getDay() === (rem.dayOfWeek ?? 2)) {
          if (!filterDay || d === filterDay) {
            items.push({ type: 'reminder', title: rem.title, sub: `${rem.time} · Weekly · ${rem.notify === 'both' ? 'Both' : rem.notify}`, date: new Date(year, month, d), day: d, icon: 'bell', color: 'var(--blue-mid)' });
          }
        }
      }
      return;
    }
    if (day) {
      if (!filterDay || day === filterDay) {
        items.push({ type: 'reminder', title: rem.title, sub: `${rem.time} · ${rem.notify === 'both' ? 'Both' : rem.notify}`, date: new Date(year, month, day), day, icon: 'bell', color: 'var(--blue-mid)' });
      }
    }
  });

  items.sort((a, b) => a.day - b.day);

  if (!items.length) {
    eventsEl.innerHTML = '<div class="empty-state"><i data-lucide="calendar-x"></i><span>No events this period</span></div>';
    lucide.createIcons();
    return;
  }

  eventsEl.innerHTML = items.map(ev => `
    <div class="tx-item">
      <div class="tx-icon" style="background:${ev.color}22;color:${ev.color}"><i data-lucide="${ev.icon}"></i></div>
      <div class="tx-info">
        <div class="tx-name">${ev.title}</div>
        <div class="tx-meta">
          <span class="tag tag-${ev.type}">${ev.type}</span>
          <span style="font-size:12px;color:var(--text-muted)">${ev.sub}</span>
        </div>
      </div>
      <div class="tx-date" style="font-size:12px;color:var(--text-muted);text-align:right">${ev.date.toLocaleDateString('en-NZ',{day:'numeric',month:'short'})}</div>
    </div>`).join('');

  lucide.createIcons();
}

// ---- BILLS ----
function renderBills() {
  const bills = getBills();
  const now = new Date();
  const billsList = document.getElementById('bills-list');

  if (!bills.length) {
    billsList.innerHTML = '<div class="empty-state"><i data-lucide="file-text"></i><span>No bills added yet</span></div>';
    lucide.createIcons();
    return;
  }

  billsList.innerHTML = bills.map(bill => {
    const dueDate = new Date(now.getFullYear(), now.getMonth(), bill.dueDay);
    if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
    const diff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    const dotCls = diff <= 0 ? 'due-overdue' : diff <= 5 ? 'due-soon-dot' : 'due-ok';
    const amtCls = diff <= 0 ? 'overdue' : diff <= 5 ? 'due-soon' : 'ok';
    const dateLabel = diff <= 0 ? 'Due today' : diff === 1 ? 'Due tomorrow' : `Due in ${diff} days`;

    const ownerTag = bill.owner === 'shared'
      ? '<span class="tag tag-shared">Shared</span>'
      : bill.owner === 'sumer'
        ? '<span class="tag tag-sumer">Sumer</span>'
        : '<span class="tag tag-siona">Siona</span>';

    return `
      <div class="bill-item">
        <div class="bill-dot-lg ${dotCls}"></div>
        <div class="bill-info">
          <div class="bill-name">${bill.name}</div>
          <div class="bill-meta">
            <span class="bill-date-txt">${dateLabel}</span>
            ${ownerTag}
            <span class="tag" style="background:var(--bg);border:1px solid var(--border);color:var(--text-muted);font-size:10px">${bill.recur}</span>
          </div>
        </div>
        <div class="bill-right">
          <div class="bill-amount ${amtCls}">$${bill.amount}</div>
          <button class="del-btn" onclick="deleteBillItem('${bill.id}')"><i data-lucide="trash-2"></i></button>
        </div>
      </div>`;
  }).join('');

  // Reminders
  const reminders = getReminders();
  const remList = document.getElementById('reminders-list');

  if (!reminders.length) {
    remList.innerHTML = '<div class="empty-state"><i data-lucide="bell"></i><span>No reminders set</span></div>';
  } else {
    remList.innerHTML = reminders.map(rem => `
      <div class="reminder-item">
        <div class="rem-icon" style="background:var(--blue-light);color:var(--blue)"><i data-lucide="bell"></i></div>
        <div class="rem-body">
          <div class="rem-title">${rem.title}</div>
          <div class="rem-sub">${rem.time || ''} · ${rem.recur} · ${rem.notify === 'both' ? 'Both' : rem.notify}</div>
        </div>
        <button class="del-btn" onclick="deleteReminderItem('${rem.id}')"><i data-lucide="trash-2"></i></button>
      </div>`).join('');
  }

  lucide.createIcons();
}

function deleteBillItem(id) {
  if (confirm('Delete this bill?')) { deleteBill(id); renderBills(); showToast('Bill removed'); }
}

function deleteReminderItem(id) {
  if (confirm('Delete this reminder?')) { deleteReminder(id); renderBills(); showToast('Reminder removed'); }
}

// ---- PROFILE ----
function renderProfile() {
  const income = getIncome();
  document.getElementById('income-sumer-display').textContent = '$' + income.sumer.toLocaleString();
  document.getElementById('income-siona-display').textContent = '$' + income.siona.toLocaleString();

  const cats = getBudgetCategories();
  const catList = document.getElementById('budget-cats');
  catList.innerHTML = cats.map(cat => `
    <div class="budget-cat-row">
      <i data-lucide="${cat.icon || 'tag'}"></i>
      <span class="budget-cat-name">${cat.name}</span>
      <span class="budget-cat-limit">$${cat.limit}/mo</span>
    </div>`).join('');

  lucide.createIcons();
}

function editIncome(user) {
  const current = getIncome()[user];
  const val = prompt(`Monthly income for ${user === 'sumer' ? 'Sumer' : 'Siona'} (NZD):`, current);
  if (val !== null && !isNaN(parseFloat(val))) {
    setIncome(user, parseFloat(val));
    renderProfile();
    showToast('Income updated');
  }
}

// ---- BILLS DUE BADGE ----
function updateBillBadge(count) {
  const badge = document.getElementById('nav-badge-bills');
  if (!badge) return;
  if (count > 0) { badge.textContent = count; badge.classList.remove('hidden'); }
  else { badge.classList.add('hidden'); }
}

function checkBillAlerts() {
  const due = getBillsDueSoon(3);
  updateBillBadge(getBillsDueSoon(7).length);
  if (due.length && Notification.permission === 'granted') {
    due.forEach(b => {
      new Notification(`Common ¢ents — Bill Due Soon`, {
        body: `${b.name}: $${b.amount} due in ${b.daysUntil} day${b.daysUntil !== 1 ? 's' : ''}`,
        icon: 'icons/icon-192.png',
        tag: b.id,
      });
    });
  }
}

function requestNotifPermission() {
  if (!('Notification' in window)) { showToast('Notifications not supported on this browser'); return; }
  Notification.requestPermission().then(perm => {
    if (perm === 'granted') {
      showToast('Notifications enabled!');
      checkBillAlerts();
    } else {
      showToast('Permission denied — enable in browser settings');
    }
  });
}

// ---- USER FILTER ----
function toggleUserFilter(user) {
  activeUserFilter = activeUserFilter === user ? 'all' : user;
  document.querySelectorAll('.avatar').forEach(av => av.classList.remove('active'));
  if (activeUserFilter !== 'all') {
    document.getElementById('av-' + activeUserFilter)?.classList.add('active');
  }
  refreshCurrentScreen();
}

// ---- MODALS ----
function openModal(name) {
  document.getElementById('modal-' + name).classList.remove('hidden');
  lucide.createIcons();
}

function closeModal(name) {
  document.getElementById('modal-' + name).classList.add('hidden');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) {
    if (e.target === this) this.classList.add('hidden');
  });
});

// ---- FORM TABS ----
function switchFormTab(el, tabId) {
  const modal = el.closest('.modal');
  modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  modal.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(tabId)?.classList.add('active');
  lucide.createIcons();
}

function switchBillTab(el, tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    if (el.closest('.tab-bar').contains(b)) b.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(tabId)?.classList.add('active');
}

// ---- SAVE FORMS ----
function getChipVal(groupId) {
  return document.querySelector(`#${groupId} .chip.active`)?.dataset.val || null;
}

function saveExpense() {
  const desc   = document.getElementById('exp-desc').value.trim();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const date   = document.getElementById('exp-date').value;
  const payer  = getChipVal('exp-payer');
  const cat    = getChipVal('exp-category');
  const owner  = getChipVal('exp-owner');

  if (!desc)           { showToast('Please enter a description'); return; }
  if (isNaN(amount) || amount <= 0) { showToast('Please enter a valid amount'); return; }
  if (!date)           { showToast('Please select a date'); return; }

  addTransaction({ type: 'expense', desc, amount, date, payer: payer || 'sumer', category: cat || 'other', owner: owner || 'shared' });
  closeModal('add-transaction');
  showToast('Expense saved ✓');
  refreshCurrentScreen();
  document.getElementById('exp-desc').value = '';
  document.getElementById('exp-amount').value = '';
}

function saveIncome() {
  const desc   = document.getElementById('inc-desc').value.trim();
  const amount = parseFloat(document.getElementById('inc-amount').value);
  const date   = document.getElementById('inc-date').value;
  const owner  = getChipVal('inc-owner');

  if (!desc || isNaN(amount) || amount <= 0 || !date) { showToast('Please fill all fields'); return; }

  addTransaction({ type: 'income', desc, amount, date, payer: owner || 'sumer', category: 'income', owner: owner || 'sumer' });
  closeModal('add-transaction');
  showToast('Income saved ✓');
  refreshCurrentScreen();
  document.getElementById('inc-desc').value = '';
  document.getElementById('inc-amount').value = '';
}

function saveBill() {
  const name   = document.getElementById('bill-name').value.trim();
  const amount = parseFloat(document.getElementById('bill-amount').value);
  const due    = document.getElementById('bill-due').value;
  const recur  = document.getElementById('bill-recur').value;
  const remind = parseInt(document.getElementById('bill-remind').value);
  const owner  = getChipVal('bill-owner');

  if (!name || isNaN(amount) || amount <= 0 || !due) { showToast('Please fill all fields'); return; }

  const dueDay = new Date(due).getDate();
  addBill({ name, amount, dueDay, recur, remind, owner: owner || 'shared', category: 'utilities' });
  closeModal('add-transaction');
  showToast('Bill added ✓');
  renderBills();
  renderDashboard();
  document.getElementById('bill-name').value = '';
  document.getElementById('bill-amount').value = '';
}

function saveReminder() {
  const title  = document.getElementById('rem-title').value.trim();
  const date   = document.getElementById('rem-date').value;
  const time   = document.getElementById('rem-time').value;
  const recur  = document.getElementById('rem-recur').value;
  const notify = getChipVal('rem-notify');

  if (!title) { showToast('Please enter a reminder title'); return; }

  addReminder({ title, date: date || null, time, recur, notify: notify || 'both' });
  closeModal('add-transaction');
  showToast('Reminder saved ✓');
  renderBills();
  renderCalendar();
  document.getElementById('rem-title').value = '';
}

function saveBudgetCat() {
  const name  = document.getElementById('bcat-name').value.trim();
  const limit = parseFloat(document.getElementById('bcat-limit').value);

  if (!name || isNaN(limit) || limit <= 0) { showToast('Please fill all fields'); return; }

  addBudgetCategory({ name, limit, icon: 'tag' });
  closeModal('add-budget');
  renderProfile();
  showToast('Category added ✓');
  document.getElementById('bcat-name').value = '';
  document.getElementById('bcat-limit').value = '';
}

// ---- PIN CHANGE ----
function changePin() {
  const newPin = prompt('Enter new 4-digit PIN:');
  if (newPin && /^\d{4}$/.test(newPin)) {
    setPin(currentUser, newPin);
    showToast('PIN updated ✓');
  } else if (newPin !== null) {
    showToast('PIN must be exactly 4 digits');
  }
}

// ---- DATA IMPORT ----
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    if (importDataFromJSON(e.target.result)) {
      showToast('Data imported successfully ✓');
      refreshCurrentScreen();
    } else {
      showToast('Invalid file format');
    }
  };
  reader.readAsText(file);
}

function confirmClearData() {
  if (confirm('Delete ALL data? This cannot be undone.')) {
    if (confirm('Are you absolutely sure?')) {
      localStorage.removeItem(DB_KEY);
      showToast('All data cleared');
      location.reload();
    }
  }
}

// ---- TOAST ----
function showToast(msg, duration = 2500) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), duration);
}

// ---- SERVICE WORKER ----
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
