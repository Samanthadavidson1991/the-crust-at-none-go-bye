// pos.js - Add/Remove Topping UI for POS

document.addEventListener('DOMContentLoaded', () => {
  let availableToppings = [];
  let selectedToppings = [];

  // Fetch toppings from backend (reuse /api/master-toppings or similar)
  async function loadToppings() {
    try {
      // Use full backend URL for topping stock
      const backendBase = 'https://admin.thecrustatngb.co.uk';
      const res = await fetch(backendBase + '/api/pizza-topping-stock', { credentials: 'include' });
      const data = await res.json();
      availableToppings = (data.toppings || []).map(t => t.name);
      renderToppingsList();
    } catch (err) {
      document.getElementById('pos-menu-content').innerHTML = '<span style="color:red;">Failed to load toppings</span>';
    }
  }

  function renderToppingsList() {
    const container = document.getElementById('pos-menu-content');
    let html = '<h3>Add/Remove Toppings</h3>';
    html += '<div id="topping-controls">';
    html += '<ul style="list-style:none;padding-left:0;">';
    availableToppings.forEach(topping => {
      const checked = selectedToppings.includes(topping) ? 'checked' : '';
      html += `<li><label><input type="checkbox" class="topping-checkbox" value="${topping}" ${checked}> ${topping}</label></li>`;
    });
    html += '</ul>';
    html += '</div>';
    html += '<div><strong>Selected Toppings:</strong> <span id="selected-toppings-list">' + selectedToppings.join(', ') + '</span></div>';
    container.innerHTML = html;

    // Attach event listeners
    container.querySelectorAll('.topping-checkbox').forEach(cb => {
      cb.addEventListener('change', function() {
        if (this.checked) {
          if (!selectedToppings.includes(this.value)) selectedToppings.push(this.value);
        } else {
          selectedToppings = selectedToppings.filter(t => t !== this.value);
        }
        document.getElementById('selected-toppings-list').textContent = selectedToppings.join(', ');
      });
    });
  }

  // Initial load
  loadToppings();
});
