// Simple section creator logic
const sections = [];

function renderSections() {
  const container = document.getElementById('sectionsContainer');
  container.innerHTML = '';
  sections.forEach(section => {
    const card = document.createElement('div');
    card.className = 'section-card';
    card.textContent = section;
    container.appendChild(card);
  });
}

document.getElementById('sectionCreatorForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const input = document.getElementById('sectionNameInput');
  const name = input.value.trim();
  if (!name || sections.includes(name)) return;
  sections.push(name);
  input.value = '';
  renderSections();
});

// Initial render
renderSections();
// Minimal admin menu logic
let sections = [];

function renderSections() {
  const container = document.getElementById('sectionsContainer');
  container.innerHTML = '';
  sections.forEach((section, idx) => {
    const div = document.createElement('div');
    div.className = 'section-card';
    div.innerHTML = `<b>${section}</b>`;
    container.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const addSectionBtn = document.getElementById('addSectionBtn');
  const newSectionInput = document.getElementById('newSectionInput');
  addSectionBtn.addEventListener('click', () => {
    const name = newSectionInput.value.trim();
    if (!name) {
      alert('Enter a section name');
      return;
    }
    if (sections.includes(name)) {
      alert('Section already exists');
      return;
    }
    sections.push(name);
    newSectionInput.value = '';
    renderSections();
  });
  renderSections();
});
