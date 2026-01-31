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
    let html = '<table class="admin-table"><thead><tr><th>Name</th><th>Category</th><th>Price (this week)</th></tr></thead><tbody>';
    toppings.forEach(t => {
      html += `<tr><td>${t.name}</td><td>${t.category}</td><td><input type="number" step="0.01" min="0" value="${t.price !== undefined ? t.price : ''}" data-topping="${t.name}" class="topping-price-input"></td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<span style='color:red'>Error: ${err.message}</span>`;
  }
}
// admin-sales.js
// Fetches and displays sales counts per menu item


async function loadSalesTable() {
  const container = document.getElementById('sales-table-container');
  container.innerHTML = '<em>Loading sales data...</em>';
  try {
    // Fetch both sales and live menu
    const [salesRes, menuRes] = await Promise.all([
      fetch('/api/sales-counts', { credentials: 'include' }),
      fetch('/api/menu')
    ]);
    if (!salesRes.ok) throw new Error('Failed to fetch sales data');
    if (!menuRes.ok) throw new Error('Failed to fetch menu data');
    const sales = await salesRes.json();
    const menu = await menuRes.json();
    const liveNames = new Set((menu.items || []).map(i => i.name));
    // Only show sales for items currently on the live menu
    const filteredSales = sales.filter(row => liveNames.has(row.name));
    if (!filteredSales.length) {
      container.innerHTML = '<em>No sales data for current menu items.</em>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr><th>Item</th><th>Sold</th></tr></thead><tbody>';
    filteredSales.forEach(row => {
      html += `<tr><td>${row.name}</td><td>${row.count}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<span style='color:red'>Error: ${err.message}</span>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refresh-sales-btn').onclick = loadSalesTable;
  loadSalesTable();
  loadMasterToppings();
});
