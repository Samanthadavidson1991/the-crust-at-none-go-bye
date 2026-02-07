// Load and display master toppings and allow price entry
async function loadMasterToppings() {
  const container = document.getElementById('master-toppings-container');
  container.innerHTML = '<em>Loading master toppings...</em>';
  try {
    const res = await fetch('/api/master-toppings');
    if (!res.ok) throw new Error('Failed to fetch master toppings');
    const data = await res.json();
    const toppings = data.toppings || [];
    if (!toppings.length) {
      container.innerHTML = '<em>No master toppings found.</em>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr><th>Name</th><th>Category</th><th>Total Spent This Week (£)</th></tr></thead><tbody>';
    toppings.forEach(t => {
      html += `<tr><td>${t.name}</td><td>${t.category}</td><td><input type="number" step="0.01" min="0" value="${t.price !== undefined ? t.price : ''}" data-topping="${t.name}" class="topping-price-input" placeholder="Total Spent"></td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<span style='color:red'>Error: ${err.message}</span>`;
  }

  // Attach save logic to button
  const saveBtn = document.getElementById('save-topping-prices-btn');
  if (saveBtn) {
    saveBtn.onclick = async function() {
      const inputs = document.querySelectorAll('.topping-price-input');
      let success = true;
      for (const input of inputs) {
        const name = input.getAttribute('data-topping');
        const price = parseFloat(input.value);
        if (isNaN(price)) continue;
        try {
          const res = await fetch('/api/master-toppings/update-price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price })
          });
          if (!res.ok) success = false;
        } catch {
          success = false;
        }
      }
      if (success) {
        alert('Topping prices saved!');
        await loadMasterToppings();
        // Always reload the sales table to reflect new prices
        const weekInput = document.getElementById('week-picker');
        if (weekInput && weekInput.value) {
          await loadSalesTable(weekInput.value);
        } else {
          await loadSalesTable();
        }
      } else {
        alert('Some prices may not have saved.');
      }
    };
  }

}
// admin-sales.js
// Fetches and displays sales counts per menu item


async function loadSalesTable(weekStr) {
  const container = document.getElementById('sales-table-container');
  container.innerHTML = '<em>Loading sales data...</em>';
  try {
    // Calculate start and end date from week string (YYYY-Wxx)
    let startDate, endDate;
    if (weekStr) {
      const [year, week] = weekStr.split('-W');
      // Week starts on Monday
      const firstDayOfYear = new Date(year, 0, 1);
      const daysOffset = ((parseInt(week) - 1) * 7) + (firstDayOfYear.getDay() <= 4 ? 1 - firstDayOfYear.getDay() : 8 - firstDayOfYear.getDay());
      startDate = new Date(year, 0, 1 + daysOffset);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    }
    // Fetch both sales and live menu
    const salesUrl = weekStr && startDate && endDate
      ? `/api/sales-counts?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      : '/api/sales-counts';
    const [salesRes, menuRes] = await Promise.all([
      fetch(salesUrl, { credentials: 'include' }),
      fetch('/api/menu')
    ]);
    if (!salesRes.ok) throw new Error('Failed to fetch sales data');
    if (!menuRes.ok) throw new Error('Failed to fetch menu data');
    const sales = await salesRes.json();
    const menu = await menuRes.json();
    // menu may be an array or {items: [...]}, support both
    const menuItems = Array.isArray(menu) ? menu : (menu.items || []);
    // Build a map of sales counts by item name
    const salesMap = {};
    sales.forEach(row => { salesMap[row.name] = row.count; });

    // Fetch master toppings for price calculation
    let masterToppings = [];
    try {
      const toppingsRes = await fetch('/api/master-toppings');
      if (toppingsRes.ok) {
        const toppingsData = await toppingsRes.json();
        masterToppings = toppingsData.toppings || [];
      }
    } catch {}

    // Build a map of topping name to total spent
    const toppingSpentMap = {};
    let masterMeatPrice = 0, masterVegPrice = 0;
    if (masterToppings.length && masterToppings[0].category) {
      // Try to get global prices from settings
      if (typeof masterToppings.settings === 'object') {
        masterMeatPrice = masterToppings.settings.masterMeatPrice || 0;
        masterVegPrice = masterToppings.settings.masterVegPrice || 0;
      }
    }
    masterToppings.forEach(t => {
      if (typeof t.price === 'number') {
        toppingSpentMap[t.name] = t.price;
      } else if (t.category === 'Meat') {
        toppingSpentMap[t.name] = masterMeatPrice;
      } else if (t.category === 'Veg') {
        toppingSpentMap[t.name] = masterVegPrice;
      }
    });

    // Count how many pizzas use each topping
    const toppingUsage = {};
    menuItems.forEach(item => {
      if (Array.isArray(item.toppings)) {
        item.toppings.forEach(t => {
          toppingUsage[t] = (toppingUsage[t] || 0) + (salesMap[item.name] || 0);
        });
      }
    });

    // Calculate estimated cost per week for each pizza
    let html = '<table class="admin-table"><thead><tr><th>Item</th><th>Sold</th><th>Estimated Cost per Pizza</th><th>Estimated Cost per Week</th></tr></thead><tbody>';
    menuItems.forEach(item => {
      const count = salesMap[item.name] || 0;
      // Calculate estimated cost per pizza
      let estCost = 0;
      if (Array.isArray(item.toppings)) {
        item.toppings.forEach(t => {
          const spent = toppingSpentMap[t] || 0;
          const usage = toppingUsage[t] || 1; // avoid div by zero
          estCost += spent / usage;
        });
      }
      // Estimated cost per week = estCost * count
      let estCostWeek = estCost * count;
      html += `<tr><td>${item.name}</td><td>${count}</td><td>£${estCost.toFixed(2)}</td><td>£${estCostWeek.toFixed(2)}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<span style='color:red'>Error: ${err.message}</span>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const weekInput = document.getElementById('week-picker');
  const weekForm = document.getElementById('week-form');
  // Set default week to current week
  const now = new Date();
  const weekNum = ((d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2,'0')}`;
  })(now);
  weekInput.value = weekNum;
  weekForm.onsubmit = (e) => {
    e.preventDefault();
    loadSalesTable(weekInput.value);
  };
  loadSalesTable(weekInput.value);
  loadMasterToppings();
});
