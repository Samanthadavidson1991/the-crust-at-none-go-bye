// --- Master Save Button Logic ---
const masterSaveBtn = document.getElementById('master-save-btn');
if (masterSaveBtn) {
  masterSaveBtn.onclick = async function() {
    await saveAllMenuItems();
    alert('All menu items saved!');
    await fetchMenuItems();
  };
}

// Also add to edit modal
const editMasterSaveBtn = document.getElementById('edit-master-save-btn');
if (editMasterSaveBtn) {
  editMasterSaveBtn.onclick = async function() {
    await saveAllMenuItems();
    alert('All menu items saved!');
    await fetchMenuItems();
  };
}

// Save all menu items to backend (PUT /api/menu)
async function saveAllMenuItems() {
  // menuItems is the current in-memory list
  const res = await fetch('/api/menu', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(menuItems)
  });
  if (!res.ok) {
    const text = await res.text();
    alert('Failed to save all menu items: ' + text);
    return;
  }
}
// --- Section Switching Logic ---
const categoryButtons = document.querySelectorAll('.menu-category-btn');
const sectionsMap = {
  'PIZZAS': 'pizza-sizes-section',
  'SALADS': 'salad-ingredients-section',
  'SIDES': 'side-types-section',
  'CHICKEN': 'chicken-sizes-section',
  'DRINKS': null,
  'DESSERTS': null
};
categoryButtons.forEach(btn => {
  btn.addEventListener('click', function() {
    categoryButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(sectionsMap).forEach(id => {
      if (!id) return;
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    const activeId = sectionsMap[btn.getAttribute('data-category')];
    if (activeId) {
      const activeSection = document.getElementById(activeId);
      if (activeSection) activeSection.classList.remove('hidden');
    }
  });
});
document.addEventListener('DOMContentLoaded', async function() {
  document.addEventListener('DOMContentLoaded', async function() {
  // Show pizzas section by default
  Object.values(sectionsMap).forEach(id => {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  const pizzaSection = document.getElementById('pizza-sizes-section');
  if (pizzaSection) pizzaSection.classList.remove('hidden');

  // --- Live Preview for Add Item Form ---
  function renderLiveItemPreview() {
    const name = document.getElementById('new-item-name')?.value.trim() || '';
    let html = '';
    if (name) html += `<b>${name}</b><br>`;
    // Sizes
    const sizeList = document.getElementById('pizza-sizes-list');
    if (sizeList && sizeList.children.length) {
      html += '<div><b>Sizes:</b> ' + Array.from(sizeList.children).map(row => row.textContent.trim()).join(', ') + '</div>';
    }
    // Toppings
    const toppingList = document.getElementById('pizza-toppings-list');
    if (toppingList && toppingList.children.length) {
      html += '<div><b>Toppings:</b> ' + Array.from(toppingList.children).map(row => row.textContent.trim()).join(', ') + '</div>';
    }
    // Ingredients
    const saladList = document.getElementById('salad-ingredients-list');
    if (saladList && saladList.children.length) {
      html += '<div><b>Ingredients:</b> ' + Array.from(saladList.children).map(row => row.textContent.trim()).join(', ') + '</div>';
    }
    // Types
    const sideList = document.getElementById('side-types-list');
    if (sideList && sideList.children.length) {
      html += '<div><b>Types:</b> ' + Array.from(sideList.children).map(row => row.textContent.trim()).join(', ') + '</div>';
    }
    // Chicken sizes
    const chickenList = document.getElementById('chicken-sizes-list');
    if (chickenList && chickenList.children.length) {
      html += '<div><b>Chicken Sizes:</b> ' + Array.from(chickenList.children).map(row => row.textContent.trim()).join(', ') + '</div>';
    }
    document.getElementById('live-preview-content').innerHTML = html || '<i>No options added yet.</i>';
  }

  // Attach live preview updates to all relevant inputs/buttons
  const previewInputs = [
    'new-item-name', 'new-size-name', 'new-size-price', 'add-size-price-btn',
    'new-topping-name', 'add-topping-btn',
    'new-ingredient-name', 'add-ingredient-btn',
    'new-side-type-name', 'new-side-type-price', 'add-side-type-btn',
    'new-chicken-size-name', 'new-chicken-size-price', 'add-chicken-size-price-btn'
  ];
  previewInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'BUTTON') {
        el.addEventListener('click', renderLiveItemPreview);
      } else {
        el.addEventListener('input', renderLiveItemPreview);
      }
    }
  });
  // Also update preview when removing any option
  document.getElementById('add-item-form').addEventListener('click', function(e) {
    if (e.target && e.target.tagName === 'BUTTON' && e.target.textContent === 'Remove') {
      setTimeout(renderLiveItemPreview, 10);
    }
  });
  // --- Edit Modal Logic ---
  const editModalBg = document.getElementById('edit-modal-bg');
  const editModalClose = document.getElementById('edit-modal-close');
  const editItemForm = document.getElementById('edit-item-form');
  const editItemId = document.getElementById('edit-item-id');
  const editItemSection = document.getElementById('edit-item-section');
  const editItemName = document.getElementById('edit-item-name');
  const editPizzaSizesList = document.getElementById('edit-pizza-sizes-list');
  const editSizeName = document.getElementById('edit-size-name');
  const editSizePrice = document.getElementById('edit-size-price');
  const editAddSizeBtn = document.getElementById('edit-add-size-price-btn');
  const editPizzaToppingsList = document.getElementById('edit-pizza-toppings-list');
  const editToppingName = document.getElementById('edit-topping-name');
  const editAddToppingBtn = document.getElementById('edit-add-topping-btn');
  const editChickenSizesList = document.getElementById('edit-chicken-sizes-list');
  const editChickenSizeName = document.getElementById('edit-chicken-size-name');
  const editChickenSizePrice = document.getElementById('edit-chicken-size-price');
  const editAddChickenSizeBtn = document.getElementById('edit-add-chicken-size-price-btn');
  const editSaladIngredientsList = document.getElementById('edit-salad-ingredients-list');
  const editIngredientName = document.getElementById('edit-ingredient-name');
  const editAddIngredientBtn = document.getElementById('edit-add-ingredient-btn');
  const editSideTypesList = document.getElementById('edit-side-types-list');
  const editSideTypeName = document.getElementById('edit-side-type-name');
  const editSideTypePrice = document.getElementById('edit-side-type-price');
  const editAddSideTypeBtn = document.getElementById('edit-add-side-type-btn');
  const editItemPrice = document.getElementById('edit-item-price');

  function showEditSection(section) {
    // Hide all
    document.querySelectorAll('.edit-section-block').forEach(el => el.style.display = 'none');
    if (section === 'PIZZAS') {
      editPizzaSizesList.parentElement.parentElement.style.display = '';
      editPizzaToppingsList.parentElement.parentElement.style.display = '';
    } else if (section === 'CHICKEN') {
      editChickenSizesList.parentElement.parentElement.style.display = '';
    } else if (section === 'SALADS') {
      editSaladIngredientsList.parentElement.parentElement.style.display = '';
    } else if (section === 'SIDES') {
      editSideTypesList.parentElement.parentElement.style.display = '';
    } else if (section === 'DRINKS' || section === 'DESSERTS') {
      document.getElementById('edit-drinks-desserts-section').style.display = '';
    }
  }

  function openEditModal(item) {
    editModalBg.style.display = 'flex';
    editItemId.value = item._id || '';
    editItemSection.value = item.section || '';
    editItemName.value = item.name || '';
    // Clear all lists
    editPizzaSizesList.innerHTML = '';
    editPizzaToppingsList.innerHTML = '';
    editChickenSizesList.innerHTML = '';
    editSaladIngredientsList.innerHTML = '';
    editSideTypesList.innerHTML = '';
    // Populate fields by section
    showEditSection(item.section);
    if (item.section === 'PIZZAS') {
      if (item.sizes && Array.isArray(item.sizes)) {
        item.sizes.forEach(size => {
          const row = document.createElement('div');
          row.innerHTML = `<span class='size-name'>${size.name}</span> - £<span class='size-price'>${parseFloat(size.price).toFixed(2)}</span> <button type='button' class='remove-size-btn' style='margin-left:8px;'>Remove</button>`;
          row.querySelector('.remove-size-btn').onclick = () => row.remove();
          editPizzaSizesList.appendChild(row);
        });
      }
      if (item.toppings && Array.isArray(item.toppings)) {
        item.toppings.forEach(topping => {
          const row = document.createElement('div');
          row.innerHTML = `<span class='topping-name'>${topping}</span> <button type='button' class='remove-topping-btn' style='margin-left:8px;'>Remove</button>`;
          row.querySelector('.remove-topping-btn').onclick = () => row.remove();
          editPizzaToppingsList.appendChild(row);
        });
      }
    } else if (item.section === 'CHICKEN') {
      if (item.sizes && Array.isArray(item.sizes)) {
        item.sizes.forEach(size => {
          const row = document.createElement('div');
          row.innerHTML = `<span class='chicken-size-name'>${size.name}</span> - £<span class='chicken-size-price'>${parseFloat(size.price).toFixed(2)}</span> <button type='button' class='remove-chicken-size-btn' style='margin-left:8px;'>Remove</button>`;
          row.querySelector('.remove-chicken-size-btn').onclick = () => row.remove();
          editChickenSizesList.appendChild(row);
        });
      }
    } else if (item.section === 'SALADS') {
      if (item.ingredients && Array.isArray(item.ingredients)) {
        item.ingredients.forEach(ing => {
          const row = document.createElement('div');
          row.innerHTML = `<span class='ingredient-name'>${ing}</span> <button type='button' class='remove-ingredient-btn' style='margin-left:8px;'>Remove</button>`;
          row.querySelector('.remove-ingredient-btn').onclick = () => row.remove();
          editSaladIngredientsList.appendChild(row);
        });
      }
    } else if (item.section === 'SIDES') {
      if (item.sizes && Array.isArray(item.sizes)) {
        item.sizes.forEach(type => {
          const row = document.createElement('div');
          row.innerHTML = `<span class='side-type-name'>${type.name}</span> - £<span class='side-type-price'>${parseFloat(type.price).toFixed(2)}</span> <button type='button' class='remove-side-type-btn' style='margin-left:8px;'>Remove</button>`;
          row.querySelector('.remove-side-type-btn').onclick = () => row.remove();
          editSideTypesList.appendChild(row);
        });
      }
    } else if (item.section === 'DRINKS' || item.section === 'DESSERTS') {
      editItemPrice.value = item.price || '';
    }
  }

  editModalClose.onclick = function() {
    editModalBg.style.display = 'none';
  };

  // Add handlers for all add buttons in modal
  editAddSizeBtn.onclick = function() {
    const name = editSizeName.value.trim();
    const price = parseFloat(editSizePrice.value);
    if (!name || isNaN(price)) return alert('Enter size and price');
    const row = document.createElement('div');
    row.innerHTML = `<span class='size-name'>${name}</span> - £<span class='size-price'>${price.toFixed(2)}</span> <button type='button' class='remove-size-btn' style='margin-left:8px;'>Remove</button>`;
    row.querySelector('.remove-size-btn').onclick = () => row.remove();
    editPizzaSizesList.appendChild(row);
    editSizeName.value = '';
    editSizePrice.value = '';
  };
  editAddToppingBtn.onclick = function() {
    const name = editToppingName.value.trim();
    if (!name) return alert('Enter topping name');
    const row = document.createElement('div');
    row.innerHTML = `<span class='topping-name'>${name}</span> <button type='button' class='remove-topping-btn' style='margin-left:8px;'>Remove</button>`;
    row.querySelector('.remove-topping-btn').onclick = () => row.remove();
    editPizzaToppingsList.appendChild(row);
    editToppingName.value = '';
  };
  editAddChickenSizeBtn.onclick = function() {
    const name = editChickenSizeName.value.trim();
    const price = parseFloat(editChickenSizePrice.value);
    if (!name || isNaN(price)) return alert('Enter size and price');
    const row = document.createElement('div');
    row.innerHTML = `<span class='chicken-size-name'>${name}</span> - £<span class='chicken-size-price'>${price.toFixed(2)}</span> <button type='button' class='remove-chicken-size-btn' style='margin-left:8px;'>Remove</button>`;
    row.querySelector('.remove-chicken-size-btn').onclick = () => row.remove();
    editChickenSizesList.appendChild(row);
    editChickenSizeName.value = '';
    editChickenSizePrice.value = '';
  };
  editAddIngredientBtn.onclick = function() {
    const name = editIngredientName.value.trim();
    if (!name) return alert('Enter ingredient name');
    const row = document.createElement('div');
    row.innerHTML = `<span class='ingredient-name'>${name}</span> <button type='button' class='remove-ingredient-btn' style='margin-left:8px;'>Remove</button>`;
    row.querySelector('.remove-ingredient-btn').onclick = () => row.remove();
    editSaladIngredientsList.appendChild(row);
    editIngredientName.value = '';
  };
  editAddSideTypeBtn.onclick = function() {
    const name = editSideTypeName.value.trim();
    const price = parseFloat(editSideTypePrice.value);
    if (!name || isNaN(price)) return alert('Enter type and price');
    const row = document.createElement('div');
    row.innerHTML = `<span class='side-type-name'>${name}</span> - £<span class='side-type-price'>${price.toFixed(2)}</span> <button type='button' class='remove-side-type-btn' style='margin-left:8px;'>Remove</button>`;
    row.querySelector('.remove-side-type-btn').onclick = () => row.remove();
    editSideTypesList.appendChild(row);
    editSideTypeName.value = '';
    editSideTypePrice.value = '';
  };

  editItemForm.onsubmit = async function(e) {
    e.preventDefault();
    const id = editItemId.value;
    const section = editItemSection.value;
    const name = editItemName.value.trim();
    const item = { _id: id, name, section };
    if (section === 'PIZZAS') {
      item.sizes = Array.from(editPizzaSizesList.children).map(row => ({
        name: row.querySelector('.size-name')?.textContent || '',
        price: parseFloat(row.querySelector('.size-price')?.textContent || '0')
      }));
      item.toppings = Array.from(editPizzaToppingsList.children).map(row => row.querySelector('.topping-name')?.textContent.trim() || '');
    } else if (section === 'CHICKEN') {
      item.sizes = Array.from(editChickenSizesList.children).map(row => ({
        name: row.querySelector('.chicken-size-name')?.textContent || '',
        price: parseFloat(row.querySelector('.chicken-size-price')?.textContent || '0')
      }));
    } else if (section === 'SALADS') {
      item.ingredients = Array.from(editSaladIngredientsList.children).map(row => row.querySelector('.ingredient-name')?.textContent.trim() || '');
    } else if (section === 'SIDES') {
      item.sizes = Array.from(editSideTypesList.children).map(row => ({
        name: row.querySelector('.side-type-name')?.textContent || '',
        price: parseFloat(row.querySelector('.side-type-price')?.textContent || '0')
      }));
    } else if (section === 'DRINKS' || section === 'DESSERTS') {
      const price = parseFloat(editItemPrice.value);
      if (!isNaN(price)) item.price = price;
    }
    await updateMenuItem(item);
    editModalBg.style.display = 'none';
  };
  await fetchMasterToppings();
  await fetchSections();
  fetchMenuItems();
});
  // --- Live Preview for Add Item Form ---
  function renderLiveItemPreview() {
    const name = document.getElementById('new-item-name')?.value.trim() || '';
    let html = '';
    if (name) html += `<b>${name}</b><br>`;
    // Sizes
    const sizeList = document.getElementById('pizza-sizes-list');
    if (sizeList && sizeList.children.length) {
      html += '<div><b>Sizes:</b> ' + Array.from(sizeList.children).map(row => row.textContent.trim()).join(', ') + '</div>';
    }
    // Toppings
    const toppingList = document.getElementById('pizza-toppings-list');
    if (toppingList && toppingList.children.length) {
      html += '<div><b>Toppings:</b> ' + Array.from(toppingList.children).map(row => row.textContent.trim()).join(', ') + '</div>';
    }
    // Ingredients
    const saladList = document.getElementById('salad-ingredients-list');
    if (saladList && saladList.children.length) {
      html += '<div><b>Ingredients:</b> ' + Array.from(saladList.children).map(row => row.textContent.trim()).join(', ') + '</div>';
    }
    // Types
    const sideList = document.getElementById('side-types-list');
    if (sideList && sideList.children.length) {
      html += '<div><b>Types:</b> ' + Array.from(sideList.children).map(row => row.textContent.trim()).join(', ') + '</div>';
    }
    // Chicken sizes
    const chickenList = document.getElementById('chicken-sizes-list');
    if (chickenList && chickenList.children.length) {
      html += '<div><b>Chicken Sizes:</b> ' + Array.from(chickenList.children).map(row => row.textContent.trim()).join(', ') + '</div>';
    }
    document.getElementById('live-preview-content').innerHTML = html || '<i>No options added yet.</i>';
  }

  // Attach live preview updates to all relevant inputs/buttons
  const previewInputs = [
    'new-item-name', 'new-size-name', 'new-size-price', 'add-size-price-btn',
    'new-topping-name', 'add-topping-btn',
    'new-ingredient-name', 'add-ingredient-btn',
    'new-side-type-name', 'new-side-type-price', 'add-side-type-btn',
    'new-chicken-size-name', 'new-chicken-size-price', 'add-chicken-size-price-btn'
  ];
  previewInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'BUTTON') {
        el.addEventListener('click', renderLiveItemPreview);
      } else {
        el.addEventListener('input', renderLiveItemPreview);
      }
    }
  });
  // Also update preview when removing any option
  document.getElementById('add-item-form').addEventListener('click', function(e) {
    if (e.target && e.target.tagName === 'BUTTON' && e.target.textContent === 'Remove') {
      setTimeout(renderLiveItemPreview, 10);
    }
  });
  // Initial render
  renderLiveItemPreview();
  // --- Add Size/Price for Create Your Own Pizza ---
  const addCustomSizeBtn = document.getElementById('add-custom-size-price-btn');
  if (addCustomSizeBtn) {
    addCustomSizeBtn.addEventListener('click', function() {
      const nameInput = document.getElementById('custom-size-name');
      const priceInput = document.getElementById('custom-size-price');
      const name = nameInput.value.trim();
      const price = parseFloat(priceInput.value);
      if (!name || isNaN(price)) return alert('Enter size and price');
      const list = document.getElementById('custom-pizza-sizes-list');
      const row = document.createElement('div');
      row.innerHTML = `<span class='custom-size-name'>${name}</span> - £<span class='custom-size-price'>${price.toFixed(2)}</span> <button type='button' class='remove-custom-size-btn' style='margin-left:8px;'>Remove</button>`;
      list.appendChild(row);
      row.querySelector('.remove-custom-size-btn').onclick = () => row.remove();
      nameInput.value = '';
      priceInput.value = '';
    });
  }

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
});
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
      openEditModal(item);
    };
    // --- Edit Modal Logic ---
    const editModalBg = document.getElementById('edit-modal-bg');
    const editModalClose = document.getElementById('edit-modal-close');
    const editItemForm = document.getElementById('edit-item-form');
    const editItemId = document.getElementById('edit-item-id');
    const editItemName = document.getElementById('edit-item-name');
    const editPizzaSizesList = document.getElementById('edit-pizza-sizes-list');
    const editSizeName = document.getElementById('edit-size-name');
    const editSizePrice = document.getElementById('edit-size-price');
    const editAddSizeBtn = document.getElementById('edit-add-size-price-btn');
    const editItemPrice = document.getElementById('edit-item-price');

    function openEditModal(item) {
      editModalBg.style.display = 'flex';
      editItemId.value = item._id || '';
      editItemName.value = item.name || '';
      // Populate sizes
      editPizzaSizesList.innerHTML = '';
      if (item.sizes && Array.isArray(item.sizes)) {
        item.sizes.forEach(size => {
          const row = document.createElement('div');
          row.innerHTML = `<span class='size-name'>${size.name}</span> - £<span class='size-price'>${parseFloat(size.price).toFixed(2)}</span> <button type='button' class='remove-size-btn' style='margin-left:8px;'>Remove</button>`;
          row.querySelector('.remove-size-btn').onclick = () => row.remove();
          editPizzaSizesList.appendChild(row);
        });
      }
      // Price (for drinks/desserts)
      editItemPrice.value = item.price || '';
    }

    editModalClose.onclick = function() {
      editModalBg.style.display = 'none';
    };

    editAddSizeBtn.onclick = function() {
      const name = editSizeName.value.trim();
      const price = parseFloat(editSizePrice.value);
      if (!name || isNaN(price)) return alert('Enter size and price');
      const row = document.createElement('div');
      row.innerHTML = `<span class='size-name'>${name}</span> - £<span class='size-price'>${price.toFixed(2)}</span> <button type='button' class='remove-size-btn' style='margin-left:8px;'>Remove</button>`;
      row.querySelector('.remove-size-btn').onclick = () => row.remove();
      editPizzaSizesList.appendChild(row);
      editSizeName.value = '';
      editSizePrice.value = '';
    };

    editItemForm.onsubmit = async function(e) {
      e.preventDefault();
      const id = editItemId.value;
      const name = editItemName.value.trim();
      const sizes = Array.from(editPizzaSizesList.children).map(row => ({
        name: row.querySelector('.size-name')?.textContent || '',
        price: parseFloat(row.querySelector('.size-price')?.textContent || '0')
      }));
      const price = parseFloat(editItemPrice.value);
      const item = { _id: id, name, sizes };
      if (!isNaN(price)) item.price = price;
      await updateMenuItem(item);
      editModalBg.style.display = 'none';
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
  const item = { name, section };

  // Gather fields based on section
  if (section === 'PIZZAS') {
    // Pizza: sizes and toppings
    const sizeList = document.getElementById('pizza-sizes-list');
    if (sizeList && sizeList.children.length) {
      item.sizes = Array.from(sizeList.children).map(row => ({
        name: row.querySelector('.size-name')?.textContent || '',
        price: parseFloat(row.querySelector('.size-price')?.textContent || '0')
      }));
    }
    const toppingList = document.getElementById('pizza-toppings-list');
    if (toppingList && toppingList.children.length) {
      item.toppings = Array.from(toppingList.children).map(row => row.textContent.trim());
    }
  } else if (section === 'CHICKEN') {
    // Chicken: sizes only
    const chickenList = document.getElementById('chicken-sizes-list');
    if (chickenList && chickenList.children.length) {
      item.sizes = Array.from(chickenList.children).map(row => ({
        name: row.querySelector('.chicken-size-name')?.textContent || '',
        price: parseFloat(row.querySelector('.chicken-size-price')?.textContent || '0')
      }));
    }
  } else if (section === 'SIDES') {
    // Sides: types (as sizes)
    const sideList = document.getElementById('side-types-list');
    if (sideList && sideList.children.length) {
      item.sizes = Array.from(sideList.children).map(row => ({
        name: row.querySelector('.side-type-name')?.textContent || '',
        price: parseFloat(row.querySelector('.side-type-price')?.textContent || '0')
      }));
    }
  } else if (section === 'SALADS') {
    // Salads: ingredients
    const saladList = document.getElementById('salad-ingredients-list');
    if (saladList && saladList.children.length) {
      item.ingredients = Array.from(saladList.children).map(row => row.textContent.trim());
    }
  } else if (section === 'DRINKS' || section === 'DESSERTS') {
    // Drinks/Desserts: simple price
    const priceInput = document.getElementById('new-item-price');
    let price = priceInput ? parseFloat(priceInput.value) : undefined;
    if (!isNaN(price)) item.price = price;
  }
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
    // Only clear the pizza sizes list if in pizza section
    if (document.querySelector('.menu-category-btn.active')?.getAttribute('data-category') === 'PIZZAS') {
      const sizeList = document.getElementById('pizza-sizes-list');
      if (sizeList) sizeList.innerHTML = '';
      const toppingList = document.getElementById('pizza-toppings-list');
      if (toppingList) toppingList.innerHTML = '';
    }
    // Also clear other lists for other sections
    if (document.querySelector('.menu-category-btn.active')?.getAttribute('data-category') === 'CHICKEN') {
      const chickenList = document.getElementById('chicken-sizes-list');
      if (chickenList) chickenList.innerHTML = '';
    }
    if (document.querySelector('.menu-category-btn.active')?.getAttribute('data-category') === 'SIDES') {
      const sideList = document.getElementById('side-types-list');
      if (sideList) sideList.innerHTML = '';
    }
    if (document.querySelector('.menu-category-btn.active')?.getAttribute('data-category') === 'SALADS') {
      const saladList = document.getElementById('salad-ingredients-list');
      if (saladList) saladList.innerHTML = '';
    }
    addItemForm.reset();
    renderLiveItemPreview();
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
const sectionCreatorForm = document.getElementById('sectionCreatorForm');
if (sectionCreatorForm) {
  sectionCreatorForm.addEventListener('submit', function(e) {
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
}
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
const sectionToppingDropdown = document.getElementById('sectionToppingDropdown');
if (sectionToppingDropdown) {
  sectionToppingDropdown.addEventListener('change', renderSectionToppingAssignment);
}


// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  await fetchMasterToppings();
  await fetchSections();
  // Call fetchMenuItems on page load
  fetchMenuItems();
});
