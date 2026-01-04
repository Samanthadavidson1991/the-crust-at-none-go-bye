// --- Add Topping for Pizza ---
const addToppingBtn = document.getElementById('add-topping-btn');
if (addToppingBtn) {
  addToppingBtn.addEventListener('click', function() {
    const nameInput = document.getElementById('new-topping-name');
    const name = nameInput.value.trim();
    if (!name) return alert('Enter topping name');
    const list = document.getElementById('pizza-toppings-list');
    const row = document.createElement('div');
    row.innerHTML = `<span class='topping-name'>${name}</span> <button type='button' class='remove-topping-btn' style='margin-left:8px;'>Remove</button>`;
    list.appendChild(row);
    row.querySelector('.remove-topping-btn').onclick = () => row.remove();
    nameInput.value = '';
  });
}

// --- Add Ingredient for Salad ---
const addIngredientBtn = document.getElementById('add-ingredient-btn');
if (addIngredientBtn) {
  addIngredientBtn.addEventListener('click', function() {
    const nameInput = document.getElementById('new-ingredient-name');
    const name = nameInput.value.trim();
    if (!name) return alert('Enter ingredient name');
    const list = document.getElementById('salad-ingredients-list');
    const row = document.createElement('div');
    row.innerHTML = `<span class='ingredient-name'>${name}</span> <button type='button' class='remove-ingredient-btn' style='margin-left:8px;'>Remove</button>`;
    list.appendChild(row);
    row.querySelector('.remove-ingredient-btn').onclick = () => row.remove();
    nameInput.value = '';
  });
}

// --- Add Side Type ---
const addSideTypeBtn = document.getElementById('add-side-type-btn');
if (addSideTypeBtn) {
  addSideTypeBtn.addEventListener('click', function() {
    const nameInput = document.getElementById('new-side-type-name');
    const priceInput = document.getElementById('new-side-type-price');
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    if (!name || isNaN(price)) return alert('Enter type and price');
    const list = document.getElementById('side-types-list');
    const row = document.createElement('div');
    row.innerHTML = `<span class='side-type-name'>${name}</span> - £<span class='side-type-price'>${price.toFixed(2)}</span> <button type='button' class='remove-side-type-btn' style='margin-left:8px;'>Remove</button>`;
    list.appendChild(row);
    row.querySelector('.remove-side-type-btn').onclick = () => row.remove();
    nameInput.value = '';
    priceInput.value = '';
  });
}

// --- Add Size/Price for Chicken ---
const addChickenSizeBtn = document.getElementById('add-chicken-size-price-btn');
if (addChickenSizeBtn) {
  addChickenSizeBtn.addEventListener('click', function() {
    const nameInput = document.getElementById('new-chicken-size-name');
    const priceInput = document.getElementById('new-chicken-size-price');
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    if (!name || isNaN(price)) return alert('Enter size and price');
    const list = document.getElementById('chicken-sizes-list');
    const row = document.createElement('div');
    row.innerHTML = `<span class='chicken-size-name'>${name}</span> - £<span class='chicken-size-price'>${price.toFixed(2)}</span> <button type='button' class='remove-chicken-size-btn' style='margin-left:8px;'>Remove</button>`;
    list.appendChild(row);
    row.querySelector('.remove-chicken-size-btn').onclick = () => row.remove();
    nameInput.value = '';
    priceInput.value = '';
  });
}
// --- Menu Items Backend Sync ---
let menuItems = [];

async function fetchMenuItems() {
  const res = await fetch('/api/menu');
  const data = await res.json();
  menuItems = data.items || [];
  renderMenuItems();
}

async function addMenuItem(item) {
  const res = await fetch('/api/menu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) {
    const text = await res.text();
    alert('Failed to add menu item: ' + text);
    return;
  }
  await fetchMenuItems();
}

async function updateMenuItem(item) {
  const res = await fetch('/api/menu', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) {
    const text = await res.text();
    alert('Failed to update menu item: ' + text);
    return;
  }
  await fetchMenuItems();
}

async function deleteMenuItem(id) {
  const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text();
    alert('Failed to delete menu item: ' + text);
    return;
  }
  await fetchMenuItems();
}

function renderMenuItems() {
  const list = document.getElementById('menu-items-list');
  if (!list) return;
  if (!menuItems.length) {
    list.innerHTML = '<li style="text-align:center;color:#888;">No menu items found.</li>';
    return;
  }
  list.innerHTML = '';
  menuItems.forEach(item => {
    const li = document.createElement('li');
    li.className = 'menu-item-card';
    li.innerHTML = `
      <b>${item.name}</b>
      <div>Section: ${item.section || ''}</div>
      <div>${item.description ? item.description : ''}</div>
      <div>${item.sizes && item.sizes.length ? 'Sizes: ' + item.sizes.map(s => `${s.name} (£${parseFloat(s.price).toFixed(2)})`).join(', ') : ''}</div>
      <button class="edit-menu-item-btn">Edit</button>
      <button class="delete-menu-item-btn" style="background:#b9472e;">Delete</button>
    `;
    // Edit button (for now, just alert JSON)
    li.querySelector('.edit-menu-item-btn').onclick = () => {
      alert('Edit not yet implemented.\n' + JSON.stringify(item, null, 2));
      // TODO: Populate form for editing, then call updateMenuItem
    };
    // Delete button
    li.querySelector('.delete-menu-item-btn').onclick = async () => {
      if (confirm('Delete this menu item?')) {
        await deleteMenuItem(item._id);
      }
    };
    list.appendChild(li);
  });
}

// --- Helper: Gather all fields from the add item form ---
function getMenuItemFromForm() {
  const name = document.getElementById('new-item-name').value.trim();
  const section = document.querySelector('.menu-category-btn.active')?.getAttribute('data-category') || '';
  // Gather sizes
  let sizes = [];
  const sizeList = document.getElementById('pizza-sizes-list');
  if (sizeList && sizeList.children.length) {
    sizes = Array.from(sizeList.children).map(row => {
      return {
        name: row.querySelector('.size-name')?.textContent || '',
        price: parseFloat(row.querySelector('.size-price')?.textContent || '0')
      };
    });
  }
  // Gather toppings (for pizza)
  let toppings = [];
  const toppingList = document.getElementById('pizza-toppings-list');
  if (toppingList && toppingList.children.length) {
    toppings = Array.from(toppingList.children).map(row => row.textContent.trim());
  }
  // Gather price (for simple items)
  const priceInput = document.getElementById('new-item-price');
  let price = priceInput ? parseFloat(priceInput.value) : undefined;
  if (isNaN(price)) price = undefined;
  // Gather chicken sizes
  let chickenSizes = [];
  const chickenList = document.getElementById('chicken-sizes-list');
  if (chickenList && chickenList.children.length) {
    chickenSizes = Array.from(chickenList.children).map(row => {
      return {
        name: row.querySelector('.chicken-size-name')?.textContent || '',
        price: parseFloat(row.querySelector('.chicken-size-price')?.textContent || '0')
      };
    });
  }
  // Gather side types
  let sideTypes = [];
  const sideList = document.getElementById('side-types-list');
  if (sideList && sideList.children.length) {
    sideTypes = Array.from(sideList.children).map(row => {
      return {
        name: row.querySelector('.side-type-name')?.textContent || '',
        price: parseFloat(row.querySelector('.side-type-price')?.textContent || '0')
      };
    });
  }
  // Gather salad ingredients
  let ingredients = [];
  const saladList = document.getElementById('salad-ingredients-list');
  if (saladList && saladList.children.length) {
    ingredients = Array.from(saladList.children).map(row => row.textContent.trim());
  }
  // Compose item object
  const item = { name, section };
  if (sizes.length) item.sizes = sizes;
  if (toppings.length) item.toppings = toppings;
  if (typeof price === 'number') item.price = price;
  if (chickenSizes.length) item.sizes = chickenSizes;
  if (sideTypes.length) item.sizes = sideTypes;
  if (ingredients.length) item.ingredients = ingredients;
  return item;
}

// --- Preview Menu Modal ---
function showMenuPreview() {
  const preview = document.createElement('div');
  preview.className = 'menu-preview-modal';
  preview.innerHTML = `
    <div class='menu-preview-content'>
      <h2>Menu Preview</h2>
      <button class='close-preview-btn' style='float:right;'>Close</button>
      <div id='menu-preview-list'></div>
    </div>
  `;
  document.body.appendChild(preview);
  const closeBtn = preview.querySelector('.close-preview-btn');
  closeBtn.onclick = () => preview.remove();
  // Render menu items
  const list = preview.querySelector('#menu-preview-list');
  list.innerHTML = menuItems.map(item => `
    <div class='menu-item-card' style='margin-bottom:16px;'>
      <b>${item.name}</b> <span style='color:#888;'>(${item.section})</span><br>
      ${item.sizes ? 'Sizes: ' + item.sizes.map(s => `${s.name} (£${parseFloat(s.price).toFixed(2)})`).join(', ') + '<br>' : ''}
      ${item.toppings ? 'Toppings: ' + item.toppings.join(', ') + '<br>' : ''}
      ${item.ingredients ? 'Ingredients: ' + item.ingredients.join(', ') + '<br>' : ''}
      ${typeof item.price === 'number' ? 'Price: £' + item.price.toFixed(2) : ''}
    </div>
  `).join('');
}

// Add preview button to admin UI
if (!document.getElementById('menu-preview-btn')) {
  const btn = document.createElement('button');
  btn.id = 'menu-preview-btn';
  btn.textContent = 'Preview Menu';
  btn.style = 'margin: 16px 0 24px 0; float:right;';
  btn.onclick = showMenuPreview;
  const section = document.querySelector('.admin-section');
  if (section) section.insertBefore(btn, section.firstChild.nextSibling);
}

// Add item form handler
const addItemForm = document.getElementById('add-item-form');
if (addItemForm) {
  addItemForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const item = getMenuItemFromForm();
    if (!item.name || !item.section) return alert('Name and section required');
    await addMenuItem(item);
    addItemForm.reset();
  });
}

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

// --- Add Size/Price for Pizza ---
const addSizeBtn = document.getElementById('add-size-price-btn');
if (addSizeBtn) {
  addSizeBtn.addEventListener('click', function() {
    const nameInput = document.getElementById('new-size-name');
    const priceInput = document.getElementById('new-size-price');
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    if (!name || isNaN(price)) return alert('Enter size and price');
    const list = document.getElementById('pizza-sizes-list');
    const row = document.createElement('div');
    row.innerHTML = `<span class='size-name'>${name}</span> - £<span class='size-price'>${price.toFixed(2)}</span> <button type='button' class='remove-size-btn' style='margin-left:8px;'>Remove</button>`;
    list.appendChild(row);
    // Remove handler
    row.querySelector('.remove-size-btn').onclick = () => row.remove();
    nameInput.value = '';
    priceInput.value = '';
  });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  await fetchMasterToppings();
  await fetchSections();
  // Call fetchMenuItems on page load
  fetchMenuItems();
});
