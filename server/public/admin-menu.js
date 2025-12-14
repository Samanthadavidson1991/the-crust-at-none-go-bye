
// --- Master Toppings Admin Logic ---
let masterToppings = [];
let masterMeatPrice = 0;
let masterVegPrice = 0;
let sections = [];
let sectionAssignments = {};

// Fetch all master toppings and settings
async function fetchMasterToppings() {
  const res = await fetch('/api/master-toppings');
  const data = await res.json();
  masterToppings = data.toppings || [];
  masterMeatPrice = data.settings?.masterMeatPrice || 0;
  masterVegPrice = data.settings?.masterVegPrice || 0;
  renderMasterPrices();
  renderToppings();
}

function renderMasterPrices() {
  document.getElementById('masterMeatPriceInput').value = masterMeatPrice;
  document.getElementById('masterVegPriceInput').value = masterVegPrice;
}

async function saveMasterPrices() {
  const meat = parseFloat(document.getElementById('masterMeatPriceInput').value) || 0;
  const veg = parseFloat(document.getElementById('masterVegPriceInput').value) || 0;
  await fetch('/api/master-toppings/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ masterMeatPrice: meat, masterVegPrice: veg })
  });
  await fetchMasterToppings();
}

function renderToppings() {
  const container = document.getElementById('toppingsContainer');
  container.innerHTML = '';
  masterToppings.forEach(topping => {
    const div = document.createElement('div');
    div.className = 'topping-row';
    div.innerHTML = `
      <b>${topping.name}</b> (${topping.category})
      <span>Price: £${
        topping.category === 'Meat' ? masterMeatPrice.toFixed(2) :
        topping.category === 'Veg' ? masterVegPrice.toFixed(2) :
        (topping.price ? topping.price.toFixed(2) : '0.00')
      }</span>
      <button data-id="${topping._id}" class="delete-topping-btn">Delete</button>
    `;
    container.appendChild(div);
  });
  // Attach delete listeners
  container.querySelectorAll('.delete-topping-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = btn.getAttribute('data-id');
      await fetch(`/api/master-toppings/${id}`, { method: 'DELETE' });
      await fetchMasterToppings();
      await fetchSectionAssignments();
    });
  });
}

document.getElementById('toppingCreatorForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const name = document.getElementById('toppingNameInput').value.trim();
  const category = document.getElementById('toppingCategoryInput').value;
  let price = document.getElementById('toppingPriceInput').value;
  if (!name || !category) return;
  let body = { name, category };
  if (category === 'Other') {
    price = parseFloat(price);
    if (isNaN(price)) {
      alert('Please enter a valid price for Other toppings.');
      return;
    }
    body.price = price;
  }
  try {
    const res = await fetch('/api/master-toppings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    document.getElementById('toppingCreatorForm').reset();
    await fetchMasterToppings();
    await fetchSectionAssignments();
  } catch (err) {
    alert('Failed to add topping: ' + (err.message || err));
  }
});

document.getElementById('saveMasterPricesBtn').addEventListener('click', saveMasterPrices);

// --- Section Management ---
async function fetchSections() {
  // For now, store in localStorage for demo; replace with API if needed
  const stored = localStorage.getItem('sections');
  sections = stored ? JSON.parse(stored) : [];
  renderSections();
  renderSectionDropdown();
  await fetchSectionAssignments();
}

function renderSections() {
  const container = document.getElementById('sectionsContainer');
  container.innerHTML = '';
  sections.forEach(section => {
    const div = document.createElement('div');
    div.className = 'section-card';
    div.innerHTML = `<b>${section}</b>`;
    container.appendChild(div);
  });
}

document.getElementById('sectionCreatorForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const input = document.getElementById('sectionNameInput');
  const name = input.value.trim();
  if (!name || sections.includes(name)) return;
  sections.push(name);
  localStorage.setItem('sections', JSON.stringify(sections));
  input.value = '';
  renderSections();
  renderSectionDropdown();
  fetchSectionAssignments();
});

function renderSectionDropdown() {
  const dropdown = document.getElementById('sectionToppingDropdown');
  dropdown.innerHTML = '';
  sections.forEach(section => {
    const opt = document.createElement('option');
    opt.value = section;
    opt.textContent = section;
    dropdown.appendChild(opt);
  });
  renderSectionToppingAssignment();
}

// --- Section-to-Topping Assignment ---
async function fetchSectionAssignments() {
  const res = await fetch('/api/section-topping-assignments');
  const data = await res.json();
  sectionAssignments = data.assignments || {};
  renderSectionToppingAssignment();
}

function renderSectionToppingAssignment() {
  const dropdown = document.getElementById('sectionToppingDropdown');
  const section = dropdown.value || (sections.length > 0 ? sections[0] : null);
  const container = document.getElementById('sectionToppingAssignment');
  if (!section) {
    container.innerHTML = '<i>No section selected</i>';
    return;
  }
  // List all master toppings with checkboxes
  container.innerHTML = '';
  masterToppings.forEach(topping => {
    const id = topping._id;
    const assigned = (sectionAssignments[section] || []).includes(id);
    const label = document.createElement('label');
    label.style.display = 'block';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = assigned;
    cb.addEventListener('change', async () => {
      await updateSectionAssignment(section, id, cb.checked);
    });
    label.appendChild(cb);
    label.appendChild(document.createTextNode(` ${topping.name} (${topping.category})`));
    container.appendChild(label);
  });
}

async function updateSectionAssignment(section, toppingId, assign) {
  await fetch('/api/section-topping-assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section, toppingId, assign })
  });
  await fetchSectionAssignments();
}

document.getElementById('sectionToppingDropdown').addEventListener('change', renderSectionToppingAssignment);

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  await fetchMasterToppings();
  await fetchSections();
});
