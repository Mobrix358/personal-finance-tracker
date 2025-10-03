// Data Structure
let data = {
    accounts: [],
    transactions: [],
    categories: {
        income: ['Salary', 'Freelance', 'Investments', 'Tax Return', 'Gifts', 'Other Income'],
        expense: [
            'Sustenance & Dining',
            'Groceries',
            'Transport',
            'Shopping',
            'Bills & Utilities',
            'Housing',
            'Health',
            'Loans & Installments',
            'Pets',
            'Entertainment',
            'Personal Care',
            'Education',
            'Travel',
            'Other'
        ]
    },
    subcategories: {
        'Sustenance & Dining': ['Restaurant', 'Fast Food', 'Café', 'Delivery', 'Takeaway'],
        'Groceries': ['Supermarket', 'Convenience Store', 'Market', 'Online Grocery'],
        'Transport': ['Fuel', 'Public Transport', 'Grab/Taxi', 'Parking', 'Vehicle Registration', 'Insurance'],
        'Shopping': ['Clothing', 'Electronics', 'Home Items', 'Books', 'Gifts'],
        'Bills & Utilities': ['Electricity', 'Gas', 'Water', 'Internet', 'Mobile', 'Streaming'],
        'Housing': ['Rent', 'Mortgage', 'Repairs', 'Furniture', 'Maintenance'],
        'Health': ['Doctor', 'Pharmacy', 'Gym', 'Supplements', 'Insurance'],
        'Loans & Installments': ['Personal Loan', 'Car Loan', 'Credit Card', 'Buy Now Pay Later', 'Appliances'],
        'Pets': ['Pet Food', 'Veterinary', 'Medication', 'Grooming', 'Supplies', 'Insurance', 'Boarding'],
        'Entertainment': ['Movies', 'Games', 'Concerts', 'Sports', 'Hobbies'],
        'Personal Care': ['Haircut', 'Spa', 'Beauty Products', 'Clothing Care'],
        'Education': ['Tuition', 'Books', 'Courses', 'Supplies'],
        'Travel': ['Flights', 'Accommodation', 'Activities', 'Transport'],
        'Other': ['Miscellaneous']
    },
    debts: [],
    budgets: [],
    templates: []
};

let deferredPrompt;

// Initialize
function init() {
    loadData();
    setupEventListeners();
    updateAllDisplays();
    setDefaultDateTime();
    registerServiceWorker();
    setupPWA();
}

function loadData() {
    const saved = localStorage.getItem('financeTrackerData');
    if (saved) {
        data = JSON.parse(saved);
    }
}

function saveData() {
    localStorage.setItem('financeTrackerData', JSON.stringify(data));
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            filterTransactions(chip.dataset.filter);
        });
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchTransactions(e.target.value);
    });

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'accounts') displayAccounts();
    if (tabName === 'transactions') displayTransactions();
    if (tabName === 'debt') displayDebts();
    if (tabName === 'budgets') displayBudgets();
    if (tabName === 'reports') displayReports();
    if (tabName === 'dashboard') updateDashboard();
}

function setDefaultDateTime() {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0,5);
    
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const timeInputs = document.querySelectorAll('input[type="time"]');
    
    dateInputs.forEach(input => input.value = date);
    timeInputs.forEach(input => input.value = time);
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    setDefaultDateTime();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    resetForm(modalId);
}

function resetForm(modalId) {
    const modal = document.getElementById(modalId);
    modal.querySelectorAll('input, textarea, select').forEach(el => {
        if (el.type === 'checkbox') {
            el.checked = false;
        } else if (el.type !== 'date' && el.type !== 'time') {
            el.value = '';
        }
    });
}

// PWA Setup
function setupPWA() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installBanner').classList.add('show');
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        document.getElementById('installBanner').classList.remove('show');
    });
}

function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('App installed');
        }
        deferredPrompt = null;
        document.getElementById('installBanner').classList.remove('show');
    });
}

function dismissInstall() {
    document.getElementById('installBanner').classList.remove('show');
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    }
}

// Accounts
function openAccountModal() {
    openModal('accountModal');
}

function saveAccount() {
    const name = document.getElementById('accountName').value;
    const type = document.getElementById('accountType').value;
    const balance = parseFloat(document.getElementById('accountBalance').value) || 0;

    if (!name) {
        alert('Please enter account name');
        return;
    }

    data.accounts.push({
        id: Date.now().toString(),
        name,
        type,
        balance,
        createdAt: new Date().toISOString()
    });

    saveData();
    closeModal('accountModal');
    displayAccounts();
    updateAllDisplays();
}

function displayAccounts() {
    const container = document.getElementById('accountsList');
    
    if (data.accounts.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💳</div><p>No accounts yet. Add your first account to start tracking.</p></div>';
        return;
    }

    container.innerHTML = data.accounts.map(account => `
        <div class="account-item">
            <div>
                <div class="account-name">${account.name}</div>
                <div class="account-type">${account.type}</div>
            </div>
            <div class="account-balance">₱${formatNumber(account.balance)}</div>
        </div>
    `).join('');
}

function populateAccountDropdowns() {
    const dropdowns = ['txnAccount', 'transferFrom', 'transferTo', 'debtMethod', 'repaymentMethod', 'depositAccount'];
    
    dropdowns.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="">Select Account</option>' + 
                data.accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('');
        }
    });
}

// Transactions
function openAddTransaction(type = 'expense') {
    populateAccountDropdowns();
    loadCategoryOptions();
    openModal('transactionModal');
    document.getElementById('txnType').value = type;
    handleTypeChange();
}

function handleTypeChange() {
    const type = document.getElementById('txnType').value;
    loadCategoryOptions();
}

function loadCategoryOptions() {
    const type = document.getElementById('txnType').value;
    const categorySelect = document.getElementById('txnCategory');
    const categories = data.categories[type] || [];
    
    categorySelect.innerHTML = '<option value="">Select Category</option>' + 
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    
    document.getElementById('subcategoryGroup').style.display = 'none';
    
    // Show installment group for Loans & Installments category
    categorySelect.addEventListener('change', () => {
        const selected = categorySelect.value;
        document.getElementById('installmentGroup').style.display = 
            selected === 'Loans & Installments' ? 'block' : 'none';
    });
}

function loadSubcategories() {
    const category = document.getElementById('txnCategory').value;
    const subcategorySelect = document.getElementById('txnSubcategory');
    const subcategoryGroup = document.getElementById('subcategoryGroup');
    
    if (data.subcategories[category]) {
        subcategoryGroup.style.display = 'block';
        subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>' + 
            data.subcategories[category].map(sub => `<option value="${sub}">${sub}</option>`).join('');
    } else {
        subcategoryGroup.style.display = 'none';
    }
}

function saveTransaction() {
    const type = document.getElementById('txnType').value;
    const date = document.getElementById('txnDate').value;
    const time = document.getElementById('txnTime').value;
    const amount = parseFloat(document.getElementById('txnAmount').value);
    const accountId = document.getElementById('txnAccount').value;
    const category = document.getElementById('txnCategory').value;
    const subcategory = document.getElementById('txnSubcategory').value;

    if (!date || !amount || !accountId || !category) {
        alert('Please fill in required fields: Date, Amount, Account, and Category');
        return;
    }

    const account = data.accounts.find(a => a.id === accountId);
    if (!account) return;

    const transaction = {
        id: Date.now().toString(),
        type,
        date,
        time,
        amount,
        accountId,
        accountName: account.name,
        category,
        subcategory,
        vendor: document.getElementById('txnVendor').value,
        brand: document.getElementById('txnBrand').value,
        items: document.getElementById('txnItems').value,
        notes: document.getElementById('txnNotes').value,
        receipt: document.getElementById('txnReceipt').value,
        taxDeductible: document.getElementById('txnTaxDeductible').checked,
        recurring: document.getElementById('txnRecurring').checked,
        createdAt: new Date().toISOString()
    };

    // Handle installments
    if (category === 'Loans & Installments') {
        transaction.installment = {
            current: parseInt(document.getElementById('txnInstallmentCurrent').value) || 0,
            total: parseInt(document.getElementById('txnInstallmentTotal').value) || 0,
            remaining: parseFloat(document.getElementById('txnInstallmentRemaining').value) || 0
        };
    }

    // Update account balance
    if (type === 'expense') {
        account.balance -= amount;
    } else {
        account.balance += amount;
    }

    transaction.balanceAfter = account.balance;

    data.transactions.push(transaction);
    saveData();
    closeModal('transactionModal');
    updateAllDisplays();
}

function displayTransactions() {
    const container = document.getElementById('transactionsList');
    const sorted = [...data.transactions].sort((a, b) => 
        new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
    );

    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><p>No transactions yet</p></div>';
        return;
    }

    container.innerHTML = sorted.map(txn => {
        const installmentText = txn.installment ? 
            `<div class="installment-progress">Payment ${txn.installment.current}/${txn.installment.total} • Remaining: ₱${formatNumber(txn.installment.remaining)}</div>` : '';
        
        return `
            <div class="transaction-item" onclick="viewTransaction('${txn.id}')">
                <div class="transaction-header">
                    <div>
                        <div class="transaction-amount ${txn.type}">
                            ${txn.type === 'expense' ? '-' : '+'}₱${formatNumber(txn.amount)}
                        </div>
                        <div class="transaction-details">${txn.vendor || txn.category}</div>
                        ${installmentText}
                    </div>
                    <div style="text-align: right;">
                        <div>${formatDate(txn.date)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary)">${txn.time}</div>
                    </div>
                </div>
                <div class="transaction-category">${txn.category}${txn.subcategory ? ' • ' + txn.subcategory : ''}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
                    ${txn.accountName} • Balance: ₱${formatNumber(txn.balanceAfter || 0)}
                </div>
            </div>
        `;
    }).join('');
}

function filterTransactions(filter) {
    const container = document.getElementById('transactionsList');
    let filtered = [...data.transactions];

    if (filter !== 'all') {
        filtered = filtered.filter(txn => txn.type === filter);
    }

    filtered.sort((a, b) => 
        new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
    );

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No transactions found</p></div>';
        return;
    }

    container.innerHTML = filtered.map(txn => {
        const installmentText = txn.installment ? 
            `<div class="installment-progress">Payment ${txn.installment.current}/${txn.installment.total}</div>` : '';
        
        return `
            <div class="transaction-item">
                <div class="transaction-header">
                    <div>
                        <div class="transaction-amount ${txn.type}">
                            ${txn.type === 'expense' ? '-' : '+'}₱${formatNumber(txn.amount)}
                        </div>
                        <div class="transaction-details">${txn.vendor || txn.category}</div>
                        ${installmentText}
                    </div>
                    <div style="text-align: right;">
                        <div>${formatDate(txn.date)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary)">${txn.time}</div>
                    </div>
                </div>
                <div class="transaction-category">${txn.category}</div>
            </div>
        `;
    }).join('');
}

function searchTransactions(query) {
    if (!query) {
        displayTransactions();
        return;
    }

    const container = document.getElementById('transactionsList');
    const searchLower = query.toLowerCase();
    
    const results = data.transactions.filter(txn => 
        (txn.vendor && txn.vendor.toLowerCase().includes(searchLower)) ||
        (txn.category && txn.category.toLowerCase().includes(searchLower)) ||
        (txn.notes && txn.notes.toLowerCase().includes(searchLower)) ||
        (txn.items && txn.items.toLowerCase().includes(searchLower))
    );

    if (results.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No results found</p></div>';
        return;
    }

    container.innerHTML = results.map(txn => `
        <div class="transaction-item">
            <div class="transaction-header">
                <div>
                    <div class="transaction-amount ${txn.type}">
                        ${txn.type === 'expense' ? '-' : '+'}₱${formatNumber(txn.amount)}
                    </div>
                    <div class="transaction-details">${txn.vendor || txn.category}</div>
                </div>
                <div>${formatDate(txn.date)}</div>
            </div>
            <div class="transaction-category">${txn.category}</div>
        </div>
    `).join('');
}

// Transfers
function openTransferModal() {
    if (data.accounts.length < 2) {
        alert('You need at least 2 accounts to make a transfer');
        return;
    }
    populateAccountDropdowns();
    openModal('transferModal');
}

function saveTransfer() {
    const fromId = document.getElementById('transferFrom').value;
    const toId = document.getElementById('transferTo').value;
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const fee = parseFloat(document.getElementById('transferFee').value) || 0;
    const date = document.getElementById('transferDate').value;
    const time = document.getElementById('transferTime').value;
    const notes = document.getElementById('transferNotes').value;

    if (!fromId || !toId || !amount || !date) {
        alert('Please fill in all required fields');
        return;
    }

    if (fromId === toId) {
        alert('Cannot transfer to the same account');
        return;
    }

    const fromAccount = data.accounts.find(a => a.id === fromId);
    const toAccount = data.accounts.find(a => a.id === toId);

    if (!fromAccount || !toAccount) return;

    // Update balances
    fromAccount.balance -= (amount + fee);
    toAccount.balance += amount;

    // Create transfer transaction
    const transfer = {
        id: Date.now().toString(),
        type: 'transfer',
        date,
        time,
        amount,
        fee,
        fromAccountId: fromId,
        fromAccountName: fromAccount.name,
        toAccountId: toId,
        toAccountName: toAccount.name,
        notes,
        createdAt: new Date().toISOString()
    };

    data.transactions.push(transfer);

    // If there's a fee, create expense transaction
    if (fee > 0) {
        data.transactions.push({
            id: (Date.now() + 1).toString(),
            type: 'expense',
            date,
            time,
            amount: fee,
            accountId: fromId,
            accountName: fromAccount.name,
            category: 'Bills & Utilities',
            subcategory: 'Transfer Fee',
            vendor: 'Transfer Fee',
            notes: `Transfer fee: ${fromAccount.name} to ${toAccount.name}`,
            createdAt: new Date().toISOString()
        });
    }

    saveData();
    closeModal('transferModal');
    updateAllDisplays();
}

// Debt & Lending
function openDebtModal() {
    populateAccountDropdowns();
    openModal('debtModal');
}

function saveDebt() {
    const name = document.getElementById('debtName').value;
    const date = document.getElementById('debtDate').value;
    const time = document.getElementById('debtTime').value;
    const amount = parseFloat(document.getElementById('debtAmount').value);
    const methodId = document.getElementById('debtMethod').value;
    const purpose = document.getElementById('debtPurpose').value;
    const interest = parseFloat(document.getElementById('debtInterest').value) || 0;

    if (!name || !date || !amount || !methodId) {
        alert('Please fill in required fields');
        return;
    }

    const account = data.accounts.find(a => a.id === methodId);
    if (!account) return;

    // Deduct from account
    account.balance -= amount;

    const debt = {
        id: Date.now().toString(),
        borrowerName: name,
        date,
        time,
        originalAmount: amount,
        remainingAmount: amount,
        methodId,
        methodName: account.name,
        purpose,
        interest,
        status: 'outstanding',
        payments: [],
        createdAt: new Date().toISOString()
    };

    data.debts.push(debt);
    saveData();
    closeModal('debtModal');
    updateAllDisplays();
}

function openRepaymentModal(debtId) {
    populateAccountDropdowns();
    document.getElementById('repaymentDebtId').value = debtId;
    openModal('repaymentModal');
}

function handleCashHandling() {
    const handling = document.getElementById('cashHandling').value;
    const depositGroup = document.getElementById('depositAccountGroup');
    const partialGroup = document.getElementById('partialAmountGroup');

    depositGroup.classList.add('hidden');
    partialGroup.classList.add('hidden');

    if (handling === 'deposit') {
        depositGroup.classList.remove('hidden');
    } else if (handling === 'partial') {
        depositGroup.classList.remove('hidden');
        partialGroup.classList.remove('hidden');
    }
}

function saveRepayment() {
    const debtId = document.getElementById('repaymentDebtId').value;
    const date = document.getElementById('repaymentDate').value;
    const time = document.getElementById('repaymentTime').value;
    const amount = parseFloat(document.getElementById('repaymentAmount').value);
    const methodId = document.getElementById('repaymentMethod').value;
    const handling = document.getElementById('cashHandling').value;
    const notes = document.getElementById('repaymentNotes').value;

    if (!amount || !methodId || !date) {
        alert('Please fill in required fields');
        return;
    }

    const debt = data.debts.find(d => d.id === debtId);
    if (!debt) return;

    const method = data.accounts.find(a => a.id === methodId);

    // Record payment
    debt.payments.push({
        date,
        time,
        amount,
        methodId,
        methodName: method.name,
        handling,
        notes,
        createdAt: new Date().toISOString()
    });

    debt.remainingAmount -= amount;

    if (debt.remainingAmount <= 0) {
        debt.status = 'paid';
        debt.remainingAmount = 0;
    }

    // Handle cash
    if (handling === 'add_cash') {
        const cashAccount = data.accounts.find(a => a.type === 'Cash');
        if (cashAccount) {
            cashAccount.balance += amount;
        }
    } else if (handling === 'deposit') {
        const depositAccountId = document.getElementById('depositAccount').value;
        const depositAccount = data.accounts.find(a => a.id === depositAccountId);
        if (depositAccount) {
            depositAccount.balance += amount;
        }
    } else if (handling === 'partial') {
        const depositAmount = parseFloat(document.getElementById('partialDepositAmount').value) || 0;
        const cashAmount = amount - depositAmount;
        
        const depositAccountId = document.getElementById('depositAccount').value;
        const depositAccount = data.accounts.find(a => a.id === depositAccountId);
        if (depositAccount) {
            depositAccount.balance += depositAmount;
        }
        
        const cashAccount = data.accounts.find(a => a.type === 'Cash');
        if (cashAccount) {
            cashAccount.balance += cashAmount;
        }
    }

    saveData();
    closeModal('repaymentModal');
    displayDebts();
    updateAllDisplays();
}

function displayDebts() {
    const container = document.getElementById('debtList');
    const outstanding = data.debts.filter(d => d.status === 'outstanding');

    if (outstanding.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💸</div><p>No outstanding loans</p></div>';
        return;
    }

    container.innerHTML = outstanding.map(debt => `
        <div class="debt-item">
            <div class="debt-header">
                <div class="debt-name">${debt.borrowerName}</div>
                <div class="debt-amount">₱${formatNumber(debt.remainingAmount)}</div>
            </div>
            <div class="debt-details">
                Lent: ₱${formatNumber(debt.originalAmount)} on ${formatDate(debt.date)}<br>
                Via: ${debt.methodName}
                ${debt.purpose ? `<br>Purpose: ${debt.purpose}` : ''}
            </div>
            ${debt.payments.length > 0 ? `
                <div class="payment-history">
                    <strong>Payments:</strong>
                    ${debt.payments.map(p => `
                        <div class="payment-item">
                            <span>${formatDate(p.date)}</span>
                            <span>₱${formatNumber(p.amount)}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <button class="btn btn-secondary" style="margin-top:0.75rem" onclick="openRepaymentModal('${debt.id}')">
                Record Repayment
            </button>
        </div>
    `).join('');
}

// Budgets
function openBudgetModal() {
    const select = document.getElementById('budgetCategory');
    select.innerHTML = '<option value="">Select Category</option>' + 
        data.categories.expense.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    openModal('budgetModal');
}

function saveBudget() {
    const category = document.getElementById('budgetCategory').value;
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    const rollover = document.getElementById('budgetRollover').checked;

    if (!category || !amount) {
        alert('Please fill in all fields');
        return;
    }

    const existing = data.budgets.findIndex(b => b.category === category);
    if (existing >= 0) {
        data.budgets[existing] = { category, amount, rollover };
    } else {
        data.budgets.push({ category, amount, rollover });
    }

    saveData();
    closeModal('budgetModal');
    displayBudgets();
}

function displayBudgets() {
    const container = document.getElementById('budgetsList');
    
    if (data.budgets.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💰</div><p>No budgets set</p></div>';
        return;
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    
    container.innerHTML = data.budgets.map(budget => {
        const spent = data.transactions
            .filter(t => t.type === 'expense' && 
                        t.category === budget.category && 
                        t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);

        const percentage = (spent / budget.amount) * 100;
        const remaining = budget.amount - spent;
        
        let progressClass = '';
        if (percentage >= 100) progressClass = 'danger';
        else if (percentage >= 80) progressClass = 'warning';

        return `
            <div class="card">
                <h3>${budget.category}</h3>
                <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                    <span>Spent: ₱${formatNumber(spent)}</span>
                    <span>Budget: ₱${formatNumber(budget.amount)}</span>
                </div>
                <div class="budget-bar">
                    <div class="budget-progress ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div style="margin-top: 0.5rem; color: ${remaining >= 0 ? 'var(--success)' : 'var(--danger)'}">
                    ${remaining >= 0 ? 'Remaining' : 'Over budget'}: ₱${formatNumber(Math.abs(remaining))}
                </div>
            </div>
        `;
    }).join('');
}

// Reports
function displayReports() {
    displayCategoryReport();
    displayMonthlyComparison();
}

function displayCategoryReport() {
    const container = document.getElementById('categoryReport');
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const categoryTotals = {};
    
    data.transactions
        .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
        .forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

    const sorted = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary)">No expenses this month</p>';
        return;
    }

    const total = sorted.reduce((sum, [, amount]) => sum + amount, 0);

    container.innerHTML = sorted.map(([category, amount]) => {
        const percentage = (amount / total) * 100;
        return `
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>${category}</span>
                    <span>₱${formatNumber(amount)} (${percentage.toFixed(1)}%)</span>
                </div>
                <div class="budget-bar">
                    <div class="budget-progress" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function displayMonthlyComparison() {
    const container = document.getElementById('monthlyComparison');
    
    const last3Months = [];
    const now = new Date();
    
    for (let i = 2; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toISOString().slice(0, 7);
        last3Months.push(monthStr);
    }

    const monthlyData = last3Months.map(month => {
        const income = data.transactions
            .filter(t => t.type === 'income' && t.date.startsWith(month))
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = data.transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(month))
            .reduce((sum, t) => sum + t.amount, 0);

        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short' });

        return { month: monthName, income, expense, net: income - expense };
    });

    container.innerHTML = monthlyData.map(data => `
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--input-bg); border-radius: 8px;">
            <h4>${data.month}</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 0.5rem;">
                <div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary)">Income</div>
                    <div style="color: var(--success)">₱${formatNumber(data.income)}</div>
                </div>
                <div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary)">Expenses</div>
                    <div style="color: var(--danger)">₱${formatNumber(data.expense)}</div>
                </div>
                <div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary)">Net</div>
                    <div style="color: ${data.net >= 0 ? 'var(--success)' : 'var(--danger)'}">
                        ₱${formatNumber(data.net)}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Dashboard
function updateDashboard() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const monthIncome = data.transactions
        .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
        .reduce((sum, t) => sum + t.amount, 0);
    
    const monthExpense = data.transactions
        .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
        .reduce((sum, t) => sum + t.amount, 0);

    const totalDebt = data.debts
        .filter(d => d.status === 'outstanding')
        .reduce((sum, d) => sum + d.remainingAmount, 0);

    document.getElementById('monthIncome').textContent = '₱' + formatNumber(monthIncome);
    document.getElementById('monthExpense').textContent = '₱' + formatNumber(monthExpense);
    document.getElementById('totalDebt').textContent = '₱' + formatNumber(totalDebt);
    document.getElementById('transactionCount').textContent = data.transactions.length;

    // Recent transactions
    const recent = [...data.transactions]
        .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))
        .slice(0, 5);

    const recentContainer = document.getElementById('recentTransactions');
    
    if (recent.length === 0) {
        recentContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No transactions yet</p>';
        return;
    }

    recentContainer.innerHTML = recent.map(txn => `
        <div class="transaction-item" style="margin-bottom: 0.5rem;">
            <div class="transaction-header">
                <div>
                    <div class="transaction-amount ${txn.type}">
                        ${txn.type === 'expense' ? '-' : '+'}₱${formatNumber(txn.amount)}
                    </div>
                    <div class="transaction-details">${txn.vendor || txn.category}</div>
                </div>
                <div style="text-align: right; font-size: 0.85rem; color: var(--text-secondary)">
                    ${formatDate(txn.date)}
                </div>
            </div>
        </div>
    `).join('');
}

function updateAllDisplays() {
    updateTotalBalance();
    updateDashboard();
    displayAccounts();
    displayTransactions();
    displayDebts();
    displayBudgets();
    populateAccountDropdowns();
}

function updateTotalBalance() {
    const total = data.accounts.reduce((sum, acc) => sum + acc.balance, 0);
    document.getElementById('totalBalance').textContent = '₱' + formatNumber(total);
}

// Categories
function openCategoryModal() {
    displayCategoriesList();
    openModal('categoryModal');
}

function addCategory() {
    const name = document.getElementById('newCategory').value.trim();
    const type = document.getElementById('newCategoryType').value;

    if (!name) {
        alert('Please enter a category name');
        return;
    }

    if (data.categories[type].includes(name)) {
        alert('Category already exists');
        return;
    }

    data.categories[type].push(name);
    saveData();
    displayCategoriesList();
    document.getElementById('newCategory').value = '';
}

function displayCategoriesList() {
    const container = document.getElementById('categoriesList');
    
    let html = '<h4>Expense Categories</h4>';
    html += data.categories.expense.map(cat => `
        <div style="padding: 0.5rem; background: var(--input-bg); border-radius: 4px; margin-bottom: 0.25rem;">
            ${cat}
        </div>
    `).join('');

    html += '<h4 style="margin-top: 1rem;">Income Categories</h4>';
    html += data.categories.income.map(cat => `
        <div style="padding: 0.5rem; background: var(--input-bg); border-radius: 4px; margin-bottom: 0.25rem;">
            ${cat}
        </div>
    `).join('');

    container.innerHTML = html;
}

// Data Management
function exportData() {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (confirm('This will replace all current data. Continue?')) {
                data = imported;
                saveData();
                updateAllDisplays();
                alert('Data imported successfully');
            }
        } catch (err) {
            alert('Error importing file. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('Are you sure? This will delete ALL data permanently.')) {
        if (confirm('Really sure? This cannot be undone!')) {
            localStorage.removeItem('financeTrackerData');
            location.reload();
        }
    }
}

// Utilities
function formatNumber(num) {
    return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function viewTransaction(id) {
    const txn = data.transactions.find(t => t.id === id);
    if (!txn) return;

    let details = `
Type: ${txn.type}
Date: ${formatDate(txn.date)} ${txn.time}
Amount: ₱${formatNumber(txn.amount)}
Account: ${txn.accountName}
Category: ${txn.category}
    `;

    if (txn.subcategory) details += `\nSubcategory: ${txn.subcategory}`;
    if (txn.vendor) details += `\nVendor: ${txn.vendor}`;
    if (txn.brand) details += `\nBrand: ${txn.brand}`;
    if (txn.items) details += `\nItems: ${txn.items}`;
    if (txn.notes) details += `\nNotes: ${txn.notes}`;
    if (txn.installment) {
        details += `\nInstallment: ${txn.installment.current}/${txn.installment.total}`;
        details += `\nRemaining: ₱${formatNumber(txn.installment.remaining)}`;
    }

    alert(details);
}

// Initialize app
window.addEventListener('load', init);
window.addEventListener('beforeunload', saveData);
