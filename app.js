
/* Minimal Finance Tracker logic for the provided HTML.
   Storage keys:
     - ft_accounts: [{id,name,type,balance}]
     - ft_categories: [{id,name,subs: [string]}]
     - ft_budgets: [{id,category,amount,rollover}]
     - ft_transactions: [{id,type,date,amount,account,category,subcategory,brand,items,notes,taxDeductible,cash,isRecurring,installments,receipt}]
     - ft_debts: [{id,name,amount,rate,notes,repayments:[{id,date,amount,notes}]}]
     - ft_settings: { cashHandling: boolean }
*/

(function(){
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const byId = (id) => document.getElementById(id);

  // ---- Storage helpers ----
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }
  function uid() { return Math.random().toString(36).slice(2,10); }

  const SKEY = {
    ACCOUNTS: 'ft_accounts',
    CATEGORIES: 'ft_categories',
    BUDGETS: 'ft_budgets',
    TXNS: 'ft_transactions',
    DEBTS: 'ft_debts',
    SETTINGS: 'ft_settings'
  };

  // ---- State ----
  let accounts = read(SKEY.ACCOUNTS, []);
  let categories = read(SKEY.CATEGORIES, []);
  let budgets = read(SKEY.BUDGETS, []);
  let txns = read(SKEY.TXNS, []);
  let debts = read(SKEY.DEBTS, []);
  let settings = read(SKEY.SETTINGS, { cashHandling: false });

  // ---- Renderers ----
  function renderAccounts() {
    const list = byId('accountsList');
    if (!list) return;
    list.innerHTML = accounts.map(a =>
      `<li class="row"><span>${escapeHtml(a.name)} (${escapeHtml(a.type||'')})</span><span>$${fmt(a.balance||0)}</span></li>`
    ).join('') || `<li class="muted">No accounts yet</li>`;
    // Update account selects
    fillSelect('txnAccount', accounts, (a)=>a.id, (a)=>a.name);
    fillSelect('transferFrom', accounts, (a)=>a.id, (a)=>a.name);
    fillSelect('transferTo', accounts, (a)=>a.id, (a)=>a.name);
  }

  function renderCategories() {
    const list = byId('categoriesList');
    if (list) {
      list.innerHTML = categories.map(c => `<li><strong>${escapeHtml(c.name)}</strong>${c.subs && c.subs.length ?
        ` – <small>${c.subs.map(escapeHtml).join(', ')}</small>` : ''}</li>`).join('') || `<li class="muted">No categories yet</li>`;
    }
    // Fill category selects
    fillSelect('txnCategory', categories, (c)=>c.id, (c)=>c.name);
    loadSubcategories(); // refresh subs for current selection
    fillSelect('budgetCategory', categories, (c)=>c.id, (c)=>c.name);
  }

  function renderBudgets() {
    const list = byId('budgetsList');
    if (!list) return;
    list.innerHTML = budgets.map(b => {
      const cat = categories.find(c => c.id === b.category);
      const cname = cat ? cat.name : 'Unknown';
      return `<li class="row"><span>${escapeHtml(cname)}</span><span>$${fmt(b.amount)}${b.rollover?' • rollover':''}</span></li>`;
    }).join('') || `<li class="muted">No budgets yet</li>`;
  }

  function renderTxns() {
    const list = byId('transactionsList');
    if (!list) return;
    list.innerHTML = txns.slice().reverse().map(t => {
      const acc = accounts.find(a=>a.id===t.account);
      const cat = categories.find(c=>c.id===t.category);
      return `<li>
        <div class="row">
          <strong>${escapeHtml(t.type||'txn')}</strong>
          <span>${escapeHtml(t.date||'')}</span>
        </div>
        <div class="row">
          <span>${escapeHtml(cat?cat.name:'—')}${t.subcategory? ' / '+escapeHtml(t.subcategory):''}</span>
          <span>$${fmt(t.amount||0)}</span>
        </div>
        <div class="row">
          <small>${escapeHtml(acc?acc.name:'')}</small>
          <small>${escapeHtml(t.brand||'')}</small>
        </div>
      </li>`;
    }).join('') || `<li class="muted">No transactions yet</li>`;
    // Update balance summary
    const balEl = byId('accountBalance');
    if (balEl) {
      const total = txns.reduce((sum, t) => {
        if (t.type==='income') return sum + (+t.amount||0);
        if (t.type==='expense') return sum - (+t.amount||0);
        return sum;
      }, 0);
      balEl.textContent = '$' + fmt(total);
    }
  }

  function renderDebts() {
    const list = byId('debtList');
    if (!list) return;
    list.innerHTML = debts.map(d => {
      const repaid = (d.repayments||[]).reduce((s,r)=>s+(+r.amount||0),0);
      return `<li class="row"><span>${escapeHtml(d.name)}</span><span>$${fmt(repaid)} / $${fmt(d.amount)}</span></li>`;
    }).join('') || `<li class="muted">No debts yet</li>`;
  }

  // ---- Utilities ----
  function fmt(n){ return (Number(n)||0).toFixed(2); }
  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
  function fillSelect(id, arr, getVal, getLabel){
    const sel = byId(id); if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = `<option value="">Select</option>` + arr.map(o => `<option value="${escapeHtml(getVal(o))}">${escapeHtml(getLabel(o))}</option>`).join('');
    if (cur) sel.value = cur;
  }
  function show(id){ const el = byId(id); if (el) el.style.display = 'block'; }
  function hide(id){ const el = byId(id); if (el) el.style.display = 'none'; }

  // ---- Exposed handlers (wired in HTML) ----
  window.openAccountModal = function(){ resetForm('accountModal'); show('accountModal'); };
  window.openCategoryModal = function(){ resetForm('categoryModal'); show('categoryModal'); };
  window.openBudgetModal = function(){ resetForm('budgetModal'); show('budgetModal'); };
  window.openAddTransaction = function(type){
    resetForm('transactionModal');
    const typeSel = byId('txnType');
    if (type && typeSel) typeSel.value = String(type);
    handleTypeChange();
    show('transactionModal');
  };
  window.openTransferModal = function(){ resetForm('transferModal'); show('transferModal'); };
  window.openDebtModal = function(){ resetForm('debtModal'); show('debtModal'); };

  window.closeModal = function(id){ hide(id); };

  window.handleTypeChange = function(){
    const type = byId('txnType') ? byId('txnType').value : 'expense';
    // Show/hide elements that might be type specific (simple example)
    // You can extend this based on your HTML sections.
    // Example: show category fields for expense/income
    const catRow = byId('txnCategory')?.closest('.field') || null;
    if (catRow) catRow.style.display = (type==='transfer') ? 'none' : '';

    const accRow = byId('txnAccount')?.closest('.field') || null;
    if (accRow) accRow.style.display = (type==='transfer') ? 'none' : '';
  };

  window.handleCashHandling = function(){
    const chk = byId('cashHandling');
    settings.cashHandling = !!(chk && chk.checked);
    write(SKEY.SETTINGS, settings);
  };

  window.loadSubcategories = function(){
    const catSel = byId('txnCategory');
    const subSel = byId('txnSubcategory');
    if (!catSel || !subSel) return;
    const cat = categories.find(c => c.id === catSel.value);
    const subs = (cat && cat.subs) ? cat.subs : [];
    const cur = subSel.value;
    subSel.innerHTML = `<option value="">Select</option>` + subs.map(s=> `<option>${escapeHtml(s)}</option>`).join('');
    if (cur) subSel.value = cur;
  };

  window.saveAccount = function(){
    const name = byId('accountName')?.value?.trim();
    const type = byId('accountType')?.value || '';
    if (!name){ alert('Account name required'); return; }
    accounts.push({ id: uid(), name, type, balance: 0 });
    write(SKEY.ACCOUNTS, accounts);
    renderAccounts();
    hide('accountModal');
  };

  window.addCategory = function(){
    const nameEl = byId('categoryName');
    const subsEl = byId('subcategoryList');
    const name = nameEl?.value?.trim();
    if (!name){ alert('Category name required'); return; }
    const subs = (subsEl?.value||'').split(',').map(s=>s.trim()).filter(Boolean);
    categories.push({ id: uid(), name, subs });
    write(SKEY.CATEGORIES, categories);
    renderCategories();
    hide('categoryModal');
  };

  window.saveBudget = function(){
    const cat = byId('budgetCategory')?.value;
    const amount = parseFloat(byId('budgetAmount')?.value||'0');
    const rollover = !!(byId('budgetRollover')?.checked);
    if (!cat || !amount){ alert('Select a category and amount'); return;}
    budgets.push({ id: uid(), category: cat, amount, rollover });
    write(SKEY.BUDGETS, budgets);
    renderBudgets();
    hide('budgetModal');
  };

  window.saveTransaction = function(){
    const type = byId('txnType')?.value || 'expense';
    const date = byId('txnDate')?.value || new Date().toISOString().slice(0,10);
    const amount = parseFloat(byId('txnAmount')?.value||'0');
    const account = byId('txnAccount')?.value || '';
    const category = byId('txnCategory')?.value || '';
    const subcategory = byId('txnSubcategory')?.value || '';
    const notes = byId('txnNotes')?.value || '';
    const brand = byId('txnBrand')?.value || '';
    const items = byId('txnItems')?.value || '';
    const taxDeductible = !!(byId('txnTaxDeductible')?.checked);
    const cash = !!(byId('cashHandling')?.checked);
    const isRecurring = !!(byId('txnRecurring')?.checked);
    const installments = {
      total: parseInt(byId('txnInstallmentTotal')?.value||'0',10)||0,
      current: parseInt(byId('txnInstallmentCurrent')?.value||'0',10)||0,
      remaining: parseInt(byId('txnInstallmentRemaining')?.value||'0',10)||0
    };
    if (!amount){ alert('Enter an amount'); return; }
    if (type!=='transfer' && (!account || !category)){ alert('Select account and category'); return; }

    txns.push({ id: uid(), type, date, amount, account, category, subcategory, notes, brand, items, taxDeductible, cash, isRecurring, installments });
    write(SKEY.TXNS, txns);
    renderTxns();
    hide('transactionModal');
  };

  window.saveTransfer = function(){
    const from = byId('transferFrom')?.value;
    const to = byId('transferTo')?.value;
    const amount = parseFloat(byId('transferAmount')?.value||'0');
    const date = byId('transferDate')?.value || new Date().toISOString().slice(0,10);
    const notes = byId('transferNotes')?.value || '';
    if (!from || !to || !amount){ alert('Select from, to, and amount'); return; }
    // Represent as two txns for clarity
    txns.push({ id: uid(), type:'transfer', date, amount, account: from, category:'', subcategory:'', notes: 'Transfer to '+to+'. '+notes });
    txns.push({ id: uid(), type:'transfer', date, amount: -amount, account: to, category:'', subcategory:'', notes: 'Transfer from '+from+'. '+notes });
    write(SKEY.TXNS, txns);
    renderTxns();
    hide('transferModal');
  };

  window.saveDebt = function(){
    const name = byId('debtName')?.value?.trim();
    const amount = parseFloat(byId('debtAmount')?.value||'0');
    const rate = parseFloat(byId('debtRate')?.value||'0');
    const notes = byId('debtNotes')?.value || '';
    if (!name || !amount){ alert('Debt name and amount required'); return; }
    debts.push({ id: uid(), name, amount, rate, notes, repayments: [] });
    write(SKEY.DEBTS, debts);
    renderDebts();
    hide('debtModal');
  };

  window.saveRepayment = function(){
    const debtId = byId('repaymentDebt')?.value;
    const amount = parseFloat(byId('repaymentAmount')?.value||'0');
    const date = byId('repaymentDate')?.value || new Date().toISOString().slice(0,10);
    const notes = byId('repaymentNotes')?.value || '';
    if (!debtId || !amount){ alert('Select a debt and enter amount'); return; }
    const d = debts.find(x=>x.id===debtId);
    if (!d) { alert('Debt not found'); return; }
    d.repayments = d.repayments || [];
    d.repayments.push({ id: uid(), amount, date, notes });
    write(SKEY.DEBTS, debts);
    renderDebts();
    hide('debtModal');
  };

  window.exportData = function(){
    const payload = {
      accounts, categories, budgets, txns, debts, settings
    };
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finance-tracker-data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  window.importData = function(evt){
    const file = evt && evt.target && evt.target.files && evt.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(){
      try {
        const obj = JSON.parse(reader.result);
        accounts = Array.isArray(obj.accounts)? obj.accounts : accounts;
        categories = Array.isArray(obj.categories)? obj.categories : categories;
        budgets = Array.isArray(obj.budgets)? obj.budgets : budgets;
        txns = Array.isArray(obj.txns)? obj.txns : txns;
        debts = Array.isArray(obj.debts)? obj.debts : debts;
        settings = obj.settings && typeof obj.settings==='object' ? obj.settings : settings;
        write(SKEY.ACCOUNTS, accounts);
        write(SKEY.CATEGORIES, categories);
        write(SKEY.BUDGETS, budgets);
        write(SKEY.TXNS, txns);
        write(SKEY.DEBTS, debts);
        write(SKEY.SETTINGS, settings);
        initialRender();
        alert('Import complete');
      } catch (e) {
        alert('Invalid file');
      }
    };
    reader.readAsText(file);
  };

  window.clearAllData = function(){
    if (!confirm('This will clear all saved data on this device. Continue?')) return;
    try {
      localStorage.removeItem(SKEY.ACCOUNTS);
      localStorage.removeItem(SKEY.CATEGORIES);
      localStorage.removeItem(SKEY.BUDGETS);
      localStorage.removeItem(SKEY.TXNS);
      localStorage.removeItem(SKEY.DEBTS);
      localStorage.removeItem(SKEY.SETTINGS);
    } catch {}
    accounts = []; categories = []; budgets = []; txns = []; debts = []; settings = { cashHandling:false };
    initialRender();
  };

  // ---- Modal reset helper ----
  function resetForm(modalId){
    const modal = byId(modalId);
    if (!modal) return;
    // reset inputs inside modal
    modal.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.type==='checkbox' || el.type==='radio') el.checked = false;
      else el.value = '';
    });
  }

  function initialRender(){
    byId('cashHandling') && (byId('cashHandling').checked = !!settings.cashHandling);
    renderAccounts();
    renderCategories();
    renderBudgets();
    renderTxns();
    renderDebts();
    // Fill repayment debt select
    const debtSel = byId('repaymentDebt');
    if (debtSel) {
      const cur = debtSel.value;
      debtSel.innerHTML = `<option value="">Select</option>` + debts.map(d=> `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
      if (cur) debtSel.value = cur;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initialRender();
  });
})();
