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

                                // Attach edit handlers (basic modal)
                                document.querySelectorAll('.edit-menu-item-btn').forEach(btn => {
                                    btn.onclick = async function() {
                                        const id = btn.getAttribute('data-id');
                                        // Fetch item details
                                        try {
                                            const res = await fetch(`/api/menu`);
                                            const data = await res.json();
                                            const item = (data.items || []).find(i => i._id === id);
                                            if (!item) return alert('Menu item not found');
                                            // Show a simple prompt for name edit (can be expanded)
                                            const newName = prompt('Edit pizza name:', item.name);
                                            if (newName && newName !== item.name) {
                                                // Send update
                                                const updateRes = await fetch(`/api/menu`, {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ ...item, name: newName })
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
                        } catch (err) {
                            alert('Error adding section: ' + err.message);
                        }
                    });
                // Refresh Preview button
                const refreshPreviewBtn = document.getElementById('refresh-menu-preview-btn');
                if (refreshPreviewBtn) {
                    refreshPreviewBtn.onclick = fetchAndRenderAdminMenuPreview;
                }
            // Section selector
            const sectionSelect = document.getElementById('pizza-section-select');

            // Fetch sections and populate dropdown
            async function populateSectionDropdown() {
                try {
                    const res = await fetch('/api/sections');
                    if (!res.ok) throw new Error('Failed to fetch sections');
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
            populateSectionDropdown();
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
        <hr>
        <label>Toppings (type and press Add):</label><br>
        <div id="toppings-list"></div>
        <input type="text" id="topping-input" placeholder="e.g. Pepperoni">
        <button type="button" id="add-topping-btn">Add Topping</button>
        <br><br>
        <button id="modal-add-btn">Add</button>
        <button id="modal-cancel-btn">Cancel</button>
    `;

    function renderToppings() {
        const toppingsList = modal.querySelector('#toppings-list');
        toppingsList.innerHTML = '';
        toppings.forEach((topping, idx) => {
            const span = document.createElement('span');
            span.textContent = topping;
            span.style.marginRight = '8px';
            const removeBtn = document.createElement('button');
            removeBtn.style.marginLeft = '4px';
            removeBtn.textContent = 'x';
            removeBtn.onclick = () => {
                toppings.splice(idx, 1);
                renderToppings();
                renderPreview();
            };
            span.appendChild(removeBtn);
            toppingsList.appendChild(span);
        });
    }

    modal.querySelector('#add-topping-btn').onclick = function() {
        const topping = modal.querySelector('#topping-input').value.trim();
        if (topping && !toppings.includes(topping)) {
            toppings.push(topping);
            modal.querySelector('#topping-input').value = '';
            renderToppings();
            renderPreview();
        }
    };

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
                        async function renderSectionsList() {
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
                                sections.forEach(sec => {
                                    html += `<li style="margin-bottom:6px;">`
                                        + `<b>${sec.name}</b> `
                                        + `<button data-id="${sec._id}" class="delete-section-btn" style="color:red;">Delete</button>`
                                        + `</li>`;
                                });
                                html += '</ul>';
                                sectionsListDiv.innerHTML = html;

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
        if (!pizzaNameInput.value || sizes.length === 0) {
            alert('Please enter a pizza name and at least one size.');
            return;
        }
        // Send new pizza to backend
        const newPizza = {
            name: pizzaNameInput.value,
            sizes: sizes,
            toppings: toppings,
            section: sectionSelect.value || 'Other'
        };
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
            sizes = [];
            toppings = [];
            renderSizes();
            renderToppings();
            renderPreview();
        })
        .catch(err => {
            alert('Error adding pizza: ' + err.message);
        });
    });

    // Initial render
    renderSizes();
    renderToppings();
    renderPreview();
    // Always load menu preview on page load
    fetchAndRenderAdminMenuPreview();
});
