                    // Ensure selectedMasterToppings is defined to prevent ReferenceError
                    if (typeof selectedMasterToppings === 'undefined') {
                        var selectedMasterToppings = [];
                    }
                // Helper to collect all four sets
                function getSelectedSets() {
                    const sets = [];
                    for (let i = 1; i <= 4; i++) {
                        const section = document.getElementById(`section-dropdown-${i}`).value;
                        const item = document.getElementById(`menu-item-dropdown-${i}`).value;
                        const size = document.getElementById(`size-dropdown-${i}`).value;
                        if (section && item && size) {
                            sets.push({ section, item, size });
                        }
                    }
                    return sets;
                }

                // Save sets to backend
                async function saveSelectedSets() {
                    const sets = getSelectedSets();
                    try {
                        await fetch('/api/selected-menu-sets', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sets })
                        });
                    } catch (err) {
                        alert('Error saving selected sets: ' + err.message);
                    }
                }

                // ...existing code...
    // --- Master Toppings Management ---
    let masterToppings = [];
    let masterToppingPrices = { Vegetable: 0, Meat: 0, Salad: 0, Other: 0 };

    // Load master toppings and prices from backend
    async function loadMasterToppingsAndPrices() {
        try {
            const res = await fetch('/api/master-toppings');
            const data = await res.json();
            masterToppings = (data.toppings || []).map(t => ({ _id: t._id, name: t.name, category: t.category, price: t.price, glutenFree: t.glutenFree }));
            // Map backend settings to local keys
            if (data.settings) {
                masterToppingPrices.Vegetable = data.settings.masterVegPrice || 0;
                masterToppingPrices.Meat = data.settings.masterMeatPrice || 0;
                masterToppingPrices.Salad = data.settings.masterSaladPrice || 0;
                masterToppingPrices.Other = 0; // Only set by individual topping price
            }
            renderMasterToppingsList();
            masterVegPriceInput.value = masterToppingPrices.Vegetable;
            masterMeatPriceInput.value = masterToppingPrices.Meat;
            masterSaladPriceInput.value = masterToppingPrices.Salad;
            masterOtherPriceInput.value = masterToppingPrices.Other;
        } catch (err) {
            console.error('Failed to load master toppings:', err);
        }
    }

    const masterToppingNameInput = document.getElementById('master-topping-name');
    const masterToppingCategorySelect = document.getElementById('master-topping-category');
    const addMasterToppingForm = document.getElementById('add-master-topping-form');
    const masterToppingsListDiv = document.getElementById('master-toppings-list');
    const masterVegPriceInput = document.getElementById('master-veg-price');
    const masterMeatPriceInput = document.getElementById('master-meat-price');
    const masterOtherPriceInput = document.getElementById('master-other-price');
    const masterSaladPriceInput = document.getElementById('master-salad-price');
    const saveMasterToppingPricesBtn = document.getElementById('save-master-topping-prices');

    function renderMasterToppingsList() {
        // Group toppings by category
        const categories = ['Veg', 'Meat', 'Salad', 'Other'];
        let html = '';
        categories.forEach(cat => {
            html += `<div style="margin-bottom:12px;">
                <h4 style="margin-bottom:4px;">${cat} <span style='font-size:0.95em;color:#888;'>(£${parseFloat(masterToppingPrices[cat]).toFixed(2)})</span></h4>`;
            const toppingsInCat = masterToppings.filter(t => t.category === cat);
            if (toppingsInCat.length) {
                html += '<ul style="list-style:none;padding-left:0;">';
                toppingsInCat.forEach((topping, idx) => {
                    // Find the index in masterToppings for delete
                    const realIdx = masterToppings.findIndex(t => t.name === topping.name && t.category === topping.category);
                    html += `<li style="margin-bottom:6px;">`
                        + `<b>${topping.name}</b> `;
                    // GF Checkbox
                    html += `<label style='margin-left:8px;font-size:0.95em;'><input type='checkbox' class='gf-checkbox' data-id='${topping._id}' ${topping.glutenFree ? 'checked' : ''}/> GF</label> `;
                    if (cat === 'Other') {
                        html += ` Price: <input type='number' class='edit-other-topping-price' data-name='${topping.name}' value='${topping.price !== undefined ? topping.price : 0}' step='0.01' min='0' style='width:60px;'>`;
                        html += ` <button data-name='${topping.name}' class='save-other-topping-price-btn' style='color:green;'>Save Price</button> `;
                    }
                    // Add data-id for deletion
                    html += `<button data-idx="${realIdx}" data-name="${topping.name}" data-category="${topping.category}" class="delete-master-topping-btn" style="color:red;">Delete</button>`
                        + `</li>`;
                });
                        // Attach GF checkbox handlers
                        document.querySelectorAll('.gf-checkbox').forEach(checkbox => {
                            checkbox.onchange = async function() {
                                const id = checkbox.getAttribute('data-id');
                                const checked = checkbox.checked;
                                try {
                                    const res = await fetch(`/api/master-toppings/${id}/gluten-free`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ glutenFree: checked })
                                    });
                                    if (!res.ok) throw new Error('Failed to update GF status');
                                    await loadMasterToppingsAndPrices(); // reload to reflect DB state
                                } catch (err) {
                                    alert('Error updating GF status: ' + err.message);
                                    checkbox.checked = !checked; // revert
                                }
                            };
                        });
                html += '</ul>';
            } else {
                html += `<em style='color:#888;'>No ${cat.toLowerCase()} toppings</em>`;
            }
            html += '</div>';
        });
        masterToppingsListDiv.innerHTML = html;
        // Attach GF checkbox handlers after rendering
        document.querySelectorAll('.gf-checkbox').forEach(checkbox => {
            checkbox.onchange = async function() {
                const id = checkbox.getAttribute('data-id');
                const checked = checkbox.checked;
                try {
                    const res = await fetch(`/api/master-toppings/${id}/gluten-free`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ glutenFree: checked })
                    });
                    if (!res.ok) throw new Error('Failed to update GF status');
                    await loadMasterToppingsAndPrices(); // reload to reflect DB state
                } catch (err) {
                    alert('Error updating GF status: ' + err.message);
                    checkbox.checked = !checked; // revert
                }
            };
        });
        document.querySelectorAll('.delete-master-topping-btn').forEach(btn => {
            btn.onclick = async function() {
                if (!confirm('Are you sure you want to delete this topping?')) return;
                const idx = parseInt(btn.getAttribute('data-idx'));
                const name = btn.getAttribute('data-name');
                const category = btn.getAttribute('data-category');
                // Find the topping object to get its _id
                const topping = masterToppings.find(t => t.name === name && t.category === category);
                if (!topping || !topping._id) {
                    alert('Could not find topping ID for deletion.');
                    return;
                }
                try {
                    const res = await fetch(`/api/master-toppings/${topping._id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Failed to delete topping');
                    await loadMasterToppingsAndPrices();
                } catch (err) {
                    alert('Error deleting topping: ' + err.message);
                }
            };
        });
        // Save price for 'Other' toppings
        document.querySelectorAll('.save-other-topping-price-btn').forEach(btn => {
            btn.onclick = async function() {
                const name = btn.getAttribute('data-name');
                const input = document.querySelector(`.edit-other-topping-price[data-name='${name}']`);
                const price = parseFloat(input.value) || 0;
                try {
                    const res = await fetch('/api/master-toppings/update-price', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, price })
                    });
                    if (!res.ok) throw new Error('Failed to save price');
                    await loadMasterToppingsAndPrices();
                } catch (err) {
                    alert('Error saving price: ' + err.message);
                }
            };
        });
    }

    addMasterToppingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = masterToppingNameInput.value.trim();
        const category = masterToppingCategorySelect.value;
        let price = undefined;
        if (!name || !category) return;
        if (category === 'Other') price = parseFloat(masterOtherPriceInput.value) || 0;
        try {
            const res = await fetch('/api/master-toppings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, category, price })
            });
            if (!res.ok) throw new Error('Failed to save topping');
            await loadMasterToppingsAndPrices();
            masterToppingNameInput.value = '';
            masterToppingCategorySelect.value = 'Vegetable';
        } catch (err) {
            alert('Error saving topping: ' + err.message);
        }
    });

    saveMasterToppingPricesBtn.onclick = async function() {
        masterToppingPrices.Vegetable = parseFloat(masterVegPriceInput.value) || 0;
        masterToppingPrices.Meat = parseFloat(masterMeatPriceInput.value) || 0;
        masterToppingPrices.Salad = parseFloat(masterSaladPriceInput.value) || 0;
        // Other price is per-topping, not global
        try {
            const res = await fetch('/api/master-toppings/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ masterVegPrice: masterToppingPrices.Vegetable, masterMeatPrice: masterToppingPrices.Meat, masterSaladPrice: masterToppingPrices.Salad })
            });
            if (!res.ok) throw new Error('Failed to save prices');
            alert('Master topping prices saved!');
            await loadMasterToppingsAndPrices();
            // Force reload of sales tracker if present
            if (window.loadSalesTable) {
                const weekInput = document.getElementById('week-picker');
                if (weekInput && weekInput.value) {
                    await window.loadSalesTable(weekInput.value);
                } else {
                    await window.loadSalesTable();
                }
            }
        } catch (err) {
            alert('Error saving prices: ' + err.message);
        }
    };

    // Initial render
    loadMasterToppingsAndPrices();
    // Populate toppings select for pizza form
    async function populatePizzaToppingsSelect() {
        try {
            const res = await fetch('/api/master-toppings');
            const data = await res.json();
            const toppings = data.toppings || [];
            const pizzaSelect = document.getElementById('pizza-toppings-select');
            const saladSelect = document.getElementById('salad-toppings-select');
            // Get currently selected salad toppings (if any)
            let selectedSaladToppings = [];
            if (saladSelect) {
                selectedSaladToppings = Array.from(saladSelect.selectedOptions).map(opt => opt.value);
            }
            if (pizzaSelect) {
                pizzaSelect.innerHTML = '';
                toppings.forEach(t => {
                    // Only show non-Salad toppings, unless already in saladToppings
                    if (t.category !== 'Salad' || selectedSaladToppings.includes(t.name)) {
                        const option = document.createElement('option');
                        option.value = t.name;
                        option.textContent = t.name + ' (' + t.category + ')';
                        pizzaSelect.appendChild(option);
                    }
                });
            }
            if (saladSelect) {
                saladSelect.innerHTML = '';
                toppings.forEach(t => {
                    const option = document.createElement('option');
                    option.value = t.name;
                    option.textContent = t.name + ' (' + t.category + ')';
                    saladSelect.appendChild(option);
                });
            }
        } catch (err) {
            console.error('Failed to load toppings for pizza/salad form:', err);
        }
    }
    populatePizzaToppingsSelect();

    // Use selected toppings when adding pizza
    const addPizzaForm = document.getElementById('add-pizza-form');
    // --- Enhanced toppings selection UI ---
    let chosenToppings = [];
    const toppingsSelect = document.getElementById('pizza-toppings-select');
    // Create a div to show chosen toppings with remove buttons
    const chosenToppingsDiv = document.createElement('div');
    chosenToppingsDiv.id = 'chosen-toppings-list';
    chosenToppingsDiv.style.margin = '8px 0';
    toppingsSelect.parentNode.insertBefore(chosenToppingsDiv, toppingsSelect.nextSibling);

    function renderChosenToppings() {
        chosenToppingsDiv.innerHTML = '';
        chosenToppings.forEach((topping, idx) => {
            const span = document.createElement('span');
            span.textContent = topping;
            span.style.marginRight = '8px';
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'x';
            removeBtn.style.marginLeft = '4px';
            removeBtn.onclick = () => {
                chosenToppings.splice(idx, 1);
                renderChosenToppings();
                // Also update select
                Array.from(toppingsSelect.options).forEach(opt => {
                    if (opt.value === topping) opt.selected = false;
                });
            };
            span.appendChild(removeBtn);
            chosenToppingsDiv.appendChild(span);
        });
    }

    // When user selects toppings in the select, update chosenToppings
    toppingsSelect.addEventListener('change', () => {
        chosenToppings = Array.from(toppingsSelect.selectedOptions).map(opt => opt.value);
        renderChosenToppings();
    });

    addPizzaForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        // ...existing code for name, section, etc...
        // Use chosenToppings instead of direct select
        const selectedToppings = chosenToppings;
        // ...existing code for collecting other fields...
        const directPrice = document.getElementById('pizza-direct-price')?.value;
        const pizzaNameInput = document.getElementById('pizza-name');
        const pizzaDescriptionInput = document.getElementById('pizza-description');
        const sectionSelect = document.getElementById('pizza-section-select');
        const glutenFreeCheckbox = document.getElementById('pizza-glutenfree-checkbox');
        const allowMasterToppingsCheckbox = document.getElementById('allow-master-toppings-checkbox');
        const allowAddToppingsCheckbox = document.getElementById('allow-add-toppings-checkbox');
        const allowRemoveToppingsCheckbox = document.getElementById('allow-remove-toppings-checkbox');
        const saladToppingsSelect = document.getElementById('salad-toppings-select');
        const selectedSaladToppings = saladToppingsSelect ? Array.from(saladToppingsSelect.selectedOptions).map(opt => opt.value) : [];
        // ...existing code for sizes, etc...
        if (!pizzaNameInput.value || (sizes.length === 0 && (!directPrice || isNaN(parseFloat(directPrice))))) {
            alert('Please enter a pizza name and at least one size or a direct price.');
            return;
        }
        // Salad toppings logic
        let allowMasterToppings = allowMasterToppingsCheckbox ? allowMasterToppingsCheckbox.checked : true;
        let allowAddToppings = allowAddToppingsCheckbox ? allowAddToppingsCheckbox.checked : true;
        let allowRemoveToppings = allowRemoveToppingsCheckbox ? allowRemoveToppingsCheckbox.checked : true;
        const newPizza = {
            name: pizzaNameInput.value,
            description: pizzaDescriptionInput.value.trim() || undefined,
            sizes: sizes,
            toppings: selectedToppings,
            saladToppings: selectedSaladToppings,
            section: sectionSelect.value || 'Other',
            allowMasterToppings,
            allowAddToppings,
            allowRemoveToppings,
            masterToppings: selectedMasterToppings && Array.isArray(selectedMasterToppings) ? selectedMasterToppings.map(key => {
                const [name, category] = key.split('|');
                return {
                    name,
                    category,
                    price: selectedMasterToppingPrices && selectedMasterToppingPrices[key] ? selectedMasterToppingPrices[key] : 0
                };
            }) : [],
            glutenFree: glutenFreeCheckbox ? glutenFreeCheckbox.checked : false
        };
        if (sizes.length === 0 && directPrice && !isNaN(parseFloat(directPrice))) {
            newPizza.price = parseFloat(directPrice);
        }
        fetch('/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPizza)
        })
        .then(res => {
            if (!res.ok) return res.json().then(data => { throw new Error(data.error || 'Failed to add pizza'); });
            return res.json();
        })
        .then(data => {
            alert('Pizza added to live menu!');
            pizzaNameInput.value = '';
            pizzaDescriptionInput.value = '';
            if (typeof includeMasterToppingsCheckbox !== 'undefined' && includeMasterToppingsCheckbox) includeMasterToppingsCheckbox.checked = false;
            sizes = [];
            chosenToppings = [];
            renderSizes();
            renderChosenToppings();
            renderPreview();
        })
        .catch(err => {
            alert('Error adding pizza: ' + err.message);
        });
        setTimeout(fetchAndRenderAdminMenuPreview, 500);
    });
document.addEventListener('DOMContentLoaded', () => {
                        // --- Admin Menu Preview ---
                        async function fetchAndRenderAdminMenuPreview() {
                            const previewDiv = document.getElementById('admin-menu-preview');
                            previewDiv.innerHTML = '<em>Loading menu...</em>';
                            try {
                                const res = await fetch('/api/menu');
                                if (!res.ok) throw new Error('Failed to fetch menu');
                                const data = await res.json();
                                const items = data.items || [];
                                if (!items.length) {
                                    previewDiv.innerHTML = '<em>No menu items found.</em>';
                                    return;
                                }
                                // Group by section
                                const sectionMap = {};
                                items.forEach(item => {
                                    const section = item.section || 'Other';
                                    if (!sectionMap[section]) sectionMap[section] = [];
                                    sectionMap[section].push(item);
                                });
                                let html = '';
                                Object.keys(sectionMap).forEach(section => {
                                    html += `<h4>${section}</h4><ul style="margin-bottom:12px;">`;
                                    sectionMap[section].forEach(item => {
                                        html += `<li><b>${item.name}</b>`;
                                        if (item.sizes && Array.isArray(item.sizes)) {
                                            html += ' - Sizes: ' + item.sizes.map(s => `${s.name} (£${parseFloat(s.price).toFixed(2)})`).join(', ');
                                        }
                                        if (item.toppings && Array.isArray(item.toppings) && item.toppings.length) {
                                            html += '<br><span style="font-size:0.95em;color:#444;">Toppings: ' + item.toppings.join(', ') + '</span>';
                                        }
                                        // Edit button
                                        html += ` <button data-id="${item._id}" class="edit-menu-item-btn">Edit</button>`;
                                        // Delete button
                                        html += ` <button data-id="${item._id}" class="delete-menu-item-btn" style="color:red;">Delete</button>`;
                                        html += '</li>';
                                    });
                                    html += '</ul>';
                                });
                                previewDiv.innerHTML = html;

                                // Attach delete handlers
                                document.querySelectorAll('.delete-menu-item-btn').forEach(btn => {
                                    btn.onclick = async function() {
                                        if (!confirm('Are you sure you want to delete this menu item?')) return;
                                        const id = btn.getAttribute('data-id');
                                        try {
                                            const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
                                            if (!res.ok) throw new Error('Failed to delete');
                                            fetchAndRenderAdminMenuPreview();
                                        } catch (err) {
                                            alert('Error deleting item: ' + err.message);
                                        }
                                    };
                                });

                                // Attach edit handlers (enhanced modal)
                                document.querySelectorAll('.edit-menu-item-btn').forEach(btn => {
                                    btn.onclick = async function() {
                                        const id = btn.getAttribute('data-id');
                                        // Fetch item details
                                        try {
                                            const res = await fetch(`/api/menu`);
                                            const data = await res.json();
                                            const item = (data.items || []).find(i => i._id === id);
                                            if (!item) return alert('Menu item not found');
                                            // Prompt for name
                                            const newName = prompt('Edit item name:', item.name);
                                            if (!newName) return;
                                            // Prompt for toppings (comma-separated)
                                            const newToppingsStr = prompt('Edit toppings (comma-separated):', (item.toppings || []).join(", "));
                                            let newToppings = item.toppings;
                                            if (newToppingsStr !== null) {
                                                newToppings = newToppingsStr.split(',').map(t => t.trim()).filter(Boolean);
                                            }
                                            // Prompt for description
                                            const newDescription = prompt('Edit description:', item.description || '');
                                            // Prompt for topping options
                                            const newAllowMasterToppings = confirm('Allow master toppings? (OK = Yes, Cancel = No)\nCurrent: ' + (item.allowMasterToppings ? 'Yes' : 'No'));
                                            const newAllowAddToppings = confirm('Allow customer to add toppings? (OK = Yes, Cancel = No)\nCurrent: ' + (item.allowAddToppings ? 'Yes' : 'No'));
                                            const newAllowRemoveToppings = confirm('Allow customer to remove toppings? (OK = Yes, Cancel = No)\nCurrent: ' + (item.allowRemoveToppings ? 'Yes' : 'No'));
                                            // Only update if changed
                                            if (
                                                newName !== item.name ||
                                                JSON.stringify(newToppings) !== JSON.stringify(item.toppings) ||
                                                (newDescription !== null && newDescription !== item.description) ||
                                                newAllowMasterToppings !== item.allowMasterToppings ||
                                                newAllowAddToppings !== item.allowAddToppings ||
                                                newAllowRemoveToppings !== item.allowRemoveToppings
                                            ) {
                                                const updateRes = await fetch(`/api/menu/${item._id}`, {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        ...item,
                                                        name: newName,
                                                        toppings: newToppings,
                                                        description: newDescription,
                                                        allowMasterToppings: newAllowMasterToppings,
                                                        allowAddToppings: newAllowAddToppings,
                                                        allowRemoveToppings: newAllowRemoveToppings
                                                    })
                                                });
                                                if (!updateRes.ok) throw new Error('Failed to update');
                                                fetchAndRenderAdminMenuPreview();
                                            }
                                        } catch (err) {
                                            alert('Error editing item: ' + err.message);
                                        }
                                    };
                                });
                            } catch (err) {
                                previewDiv.innerHTML = `<span style="color:red;">Error loading menu preview: ${err.message}</span>`;
                            }
                        }
                        // Add Section form handler
                    const addSectionForm = document.getElementById('add-section-form');
                    const sectionNameInput = document.getElementById('section-name');
                    addSectionForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const name = sectionNameInput.value.trim();
                        if (!name) return;
                        try {
                            const res = await fetch('/api/sections', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name })
                            });
                            if (!res.ok) {
                                const data = await res.json();
                                alert(data.error || 'Failed to add section');
                                return;
                            }
                            sectionNameInput.value = '';
                            await populateSectionDropdown();
                            await renderSectionsList();
                        } catch (err) {
                            alert('Error adding section: ' + err.message);
                        }
                    });
                    // Ensure sections list is rendered on page load
                    // renderSectionsList(); // Disabled: function not defined, caused ReferenceError
                // Refresh Preview button
                const refreshPreviewBtn = document.getElementById('refresh-menu-preview-btn');
                console.log('Looking for Refresh Preview button:', refreshPreviewBtn);
                if (refreshPreviewBtn) {
                    refreshPreviewBtn.onclick = function() {
                        console.log('Refresh Preview button clicked');
                        fetchAndRenderAdminMenuPreview();
                    };
                    console.log('Refresh Preview button handler set.');
                } else {
                    console.error('Refresh Preview button NOT found!');
                }
            // ...existing code...
        console.log('admin-menu.js loaded and DOMContentLoaded fired');
    // State
    let sizes = [];
    let toppings = [];

    // Elements
    const addSizeBtn = document.getElementById('add-size-btn');
    if (!addSizeBtn) {
        console.error('Add Size button not found!');
    } else {
        console.log('Add Size button found, attaching event');
    }
    const sizesList = document.getElementById('sizes-list');
    const pizzaPreview = document.getElementById('pizza-preview');
    const addPizzaForm = document.getElementById('add-pizza-form');
    const pizzaNameInput = document.getElementById('pizza-name');
    const pizzaDescriptionInput = document.getElementById('pizza-description');
    const sectionSelect = document.getElementById('pizza-section-select');

    // Populate section dropdown

    // Make section dropdown population function global for all handlers
    window.populateSectionDropdown = async function populateSectionDropdown() {
        try {
            const res = await fetch('/api/sections');
            const data = await res.json();
            const sections = data.sections || [];
            sectionSelect.innerHTML = '';
            sections.forEach(sec => {
                const opt = document.createElement('option');
                opt.value = sec.name;
                opt.textContent = sec.name;
                sectionSelect.appendChild(opt);
            });
        } catch (err) {
            sectionSelect.innerHTML = '<option value="Other">Other</option>';
        }
    }
    window.populateSectionDropdown();

    // Modal for size/price and toppings
    let modalBg = document.createElement('div');
    modalBg.style.position = 'fixed';
    modalBg.style.top = '0';
    modalBg.style.left = '0';
    modalBg.style.width = '100vw';
    modalBg.style.height = '100vh';
    modalBg.style.background = 'rgba(0,0,0,0.5)';
    modalBg.style.border = '2px solid red';
    modalBg.style.display = 'none';
    modalBg.style.justifyContent = 'center';
    modalBg.style.alignItems = 'center';
    modalBg.style.zIndex = '1000';
    document.body.appendChild(modalBg);

    let modal = document.createElement('div');
    modal.style.background = '#fff';
    modal.style.padding = '24px';
    modal.style.borderRadius = '8px';
    modal.style.boxShadow = '0 2px 16px rgba(0,0,0,0.2)';
    modal.style.minWidth = '320px';
    modal.style.border = '3px solid blue';
    modalBg.appendChild(modal);

    modal.innerHTML = `
        <h3>Add Pizza Size</h3>
        <label>Size:</label><br>
        <input type="text" id="modal-size-input" placeholder="e.g. Small, Medium, Large"><br><br>
        <label>Price (£):</label><br>
        <input type="number" id="modal-price-input" placeholder="e.g. 9.99" step="0.01" min="0"><br><br>
        <button id="modal-add-btn">Add</button>
        <button id="modal-cancel-btn">Cancel</button>
    `;

    // Topping input and logic removed: toppings are now only selected from master list in main form.

    // Ensure renderToppings is defined (no-op if not present)
    if (typeof renderToppings !== 'function') {
        function renderToppings() {}
    }
    function showModal() {
        modalBg.style.display = 'flex';
        modal.querySelector('#modal-size-input').value = '';
        modal.querySelector('#modal-price-input').value = '';
        // Do NOT reset toppings here
        renderToppings();
    }
    function hideModal() {
        modalBg.style.display = 'none';
    }

    addSizeBtn.addEventListener('click', () => {
        console.log('Add Size button clicked');
        showModal();
    });
    modal.querySelector('#modal-cancel-btn').onclick = hideModal;
    modal.querySelector('#modal-add-btn').onclick = function() {
        const size = modal.querySelector('#modal-size-input').value.trim();
        const price = modal.querySelector('#modal-price-input').value.trim();
        if (!size || !price || isNaN(price)) {
            alert('Please enter both size and price.');
            return;
        }
        if (sizes.some(s => s.name === size)) {
            alert('This size already exists.');
            return;
        }
        sizes.push({ name: size, price: parseFloat(price) });
        renderSizes();
        renderPreview();
        hideModal();
    };

    function renderSizes() {
        sizesList.innerHTML = '';

                        // Render section list with delete buttons

// --- Render Sections List (moved to very top of file) ---
window.renderSectionsList = async function renderSectionsList() {
    const sectionsListDiv = document.getElementById('sections-list');
    sectionsListDiv.innerHTML = '<em>Loading sections...</em>';
    try {
        const res = await fetch('/api/sections');
        if (!res.ok) throw new Error('Failed to fetch sections');
        const data = await res.json();
        const sections = data.sections || [];
        if (!sections.length) {
            sectionsListDiv.innerHTML = '<em>No sections found.</em>';
            return;
        }
        let html = '<ul style="list-style:none;padding-left:0;">';
        sections.forEach((sec, idx) => {
            html += `<li style="margin-bottom:6px;">`
                + `<b>${sec.name}</b> `
                + `<button data-id="${sec._id}" class="move-section-up-btn" ${idx === 0 ? 'disabled' : ''}>↑</button> `
                + `<button data-id="${sec._id}" class="move-section-down-btn" ${idx === sections.length - 1 ? 'disabled' : ''}>↓</button> `
                + `<button data-id="${sec._id}" class="delete-section-btn" style="color:red;">Delete</button>`
                + `</li>`;
        });
        html += '</ul>';
        sectionsListDiv.innerHTML = html;

        // Attach move up/down handlers
        document.querySelectorAll('.move-section-up-btn').forEach(btn => {
            btn.onclick = async function() {
                const id = btn.getAttribute('data-id');
                const idx = sections.findIndex(s => s._id === id);
                if (idx > 0) {
                    // Swap order with previous
                    const prev = sections[idx - 1];
                    const curr = sections[idx];
                    await updateSectionOrder([ { id: prev._id, order: idx }, { id: curr._id, order: idx - 1 } ]);
                    await renderSectionsList();
                    await populateSectionDropdown();
                }
            };
        });
        document.querySelectorAll('.move-section-down-btn').forEach(btn => {
            btn.onclick = async function() {
                const id = btn.getAttribute('data-id');
                const idx = sections.findIndex(s => s._id === id);
                if (idx < sections.length - 1) {
                    // Swap order with next
                    const next = sections[idx + 1];
                    const curr = sections[idx];
                    await updateSectionOrder([ { id: next._id, order: idx }, { id: curr._id, order: idx + 1 } ]);
                    await renderSectionsList();
                    await populateSectionDropdown();
                }
            };
        });
        // Attach delete handlers
        document.querySelectorAll('.delete-section-btn').forEach(btn => {
            btn.onclick = async function() {
                if (!confirm('Are you sure you want to delete this section?')) return;
                const id = btn.getAttribute('data-id');
                try {
                    const res = await fetch(`/api/sections/${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Failed to delete section');
                    await populateSectionDropdown();
                    await renderSectionsList();
                } catch (err) {
                    alert('Error deleting section: ' + err.message);
                }
            };
        });

        // Helper to update section order
        async function updateSectionOrder(updates) {
            for (const u of updates) {
                await fetch(`/api/sections/${u.id}/order`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order: u.order })
                });
            }
        }
    } catch (err) {
        sectionsListDiv.innerHTML = `<span style="color:red;">Error loading sections: ${err.message}</span>`;
    }
}

    // Initial render
    renderSectionsList();

        sizes.forEach((obj, idx) => {
            const div = document.createElement('div');
            div.textContent = `${obj.size} (£${obj.price.toFixed(2)})`;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = () => {
                sizes.splice(idx, 1);
                renderSizes();
                renderPreview();
            };
            div.appendChild(removeBtn);
            sizesList.appendChild(div);
        });
    }

    function renderPreview() {
        const previewText = sizes.map(obj => `${obj.size} (£${obj.price.toFixed(2)})`).join(', ');
        let toppingsText = toppings.length ? `<br><strong>Toppings:</strong> ${toppings.join(', ')}` : '';
        pizzaPreview.innerHTML = `<strong>Preview:</strong> ${pizzaNameInput.value} (${previewText})${toppingsText}`;
    }

    pizzaNameInput.addEventListener('input', renderPreview);

    addPizzaForm.addEventListener('submit', (e) => {
                console.log('Add Pizza form submitted');
                // Show a visible message when Add Pizza is pressed
                let msg = document.getElementById('add-pizza-feedback');
                if (!msg) {
                    msg = document.createElement('div');
                    msg.id = 'add-pizza-feedback';
                    msg.style = 'color: blue; font-weight: bold; margin-top: 10px;';
                    addPizzaForm.parentNode.insertBefore(msg, addPizzaForm.nextSibling);
                }
                msg.textContent = 'Add Pizza button pressed!';
                setTimeout(() => { if (msg) msg.textContent = ''; }, 2000);

                // After adding, refresh the admin menu preview
                setTimeout(fetchAndRenderAdminMenuPreview, 500);
        e.preventDefault();
        const directPrice = document.getElementById('pizza-direct-price')?.value;
        if (!pizzaNameInput.value || (sizes.length === 0 && (!directPrice || isNaN(parseFloat(directPrice))))) {
            alert('Please enter a pizza name and at least one size or a direct price.');
            return;
        }
        // Send new pizza to backend
        const glutenFreeCheckbox = document.getElementById('pizza-glutenfree-checkbox');
        const saladToppingsSelect = document.getElementById('salad-toppings-select');
        const selectedSaladToppings = saladToppingsSelect ? Array.from(saladToppingsSelect.selectedOptions).map(opt => opt.value) : [];
        const newPizza = {
            name: pizzaNameInput.value,
            description: pizzaDescriptionInput.value.trim() || undefined,
            sizes: sizes,
            toppings: toppings,
            saladToppings: selectedSaladToppings,
            section: sectionSelect.value || 'Other',
            allowMasterToppings: (typeof includeMasterToppingsCheckbox !== 'undefined' && includeMasterToppingsCheckbox) ? !!includeMasterToppingsCheckbox.checked : false,
            masterToppings: selectedMasterToppings && Array.isArray(selectedMasterToppings) ? selectedMasterToppings.map(key => {
                const [name, category] = key.split('|');
                return {
                    name,
                    category,
                    price: selectedMasterToppingPrices && selectedMasterToppingPrices[key] ? selectedMasterToppingPrices[key] : 0
                };
            }) : [],
            glutenFree: glutenFreeCheckbox ? glutenFreeCheckbox.checked : false
        };
        if (sizes.length === 0 && directPrice && !isNaN(parseFloat(directPrice))) {
            newPizza.price = parseFloat(directPrice);
        }
        fetch('/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPizza)
        })
        .then(res => {
            if (!res.ok) return res.json().then(data => { throw new Error(data.error || 'Failed to add pizza'); });
            return res.json();
        })
        .then(data => {
            alert('Pizza added to live menu!');
            pizzaNameInput.value = '';
            pizzaDescriptionInput.value = '';
            if (typeof includeMasterToppingsCheckbox !== 'undefined' && includeMasterToppingsCheckbox) includeMasterToppingsCheckbox.checked = false;
            sizes = [];
            toppings = [];
            renderSizes();
            renderPreview();
        })
        .catch(err => {
            alert('Error adding pizza: ' + err.message);
        });
    });

    // Add direct price input to the form
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.id = 'pizza-direct-price';
    priceInput.placeholder = 'Direct price (e.g. 7.99)';
    priceInput.step = '0.01';
    priceInput.min = '0';
    priceInput.style.marginBottom = '8px';
    pizzaNameInput.parentNode.insertBefore(priceInput, pizzaDescriptionInput);

    // Initial render
    renderSizes();
    renderPreview();
    // Always load menu preview on page load
    fetchAndRenderAdminMenuPreview();
});
