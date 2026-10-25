// =====================================================================
// Main Application Scripts: Theme Toggle, Filters & Live Search
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Management (Dark Mode / Light Mode)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('edustudy_theme') || 'light';
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
      localStorage.setItem('edustudy_theme', currentTheme);
    });
  }

  // 2. Study Task Filtering (All / Open / Done) & Search Box
  const filterPills = document.querySelectorAll('.filter-pill');
  const searchInput = document.getElementById('searchInput');
  const todoItems = document.querySelectorAll('.todo-item');
  const emptyState = document.getElementById('emptyState');
  const noMatchState = document.getElementById('noMatchState');

  let currentFilter = 'all';

  function applyFiltersAndSearch() {
    const searchTerm = (searchInput ? searchInput.value.toLowerCase().trim() : '');
    let visibleCount = 0;

    todoItems.forEach(item => {
      const status = item.getAttribute('data-status'); // 'open' or 'done'
      const titleInput = item.querySelector('.todo-title-input');
      const titleText = (titleInput ? titleInput.value.toLowerCase() : '');

      const matchesFilter = (currentFilter === 'all') || (currentFilter === status);
      const matchesSearch = titleText.includes(searchTerm);

      if (matchesFilter && matchesSearch) {
        item.style.display = 'flex';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    // Handle empty search feedback
    if (todoItems.length > 0) {
      if (visibleCount === 0) {
        if (noMatchState) noMatchState.classList.remove('hidden');
      } else {
        if (noMatchState) noMatchState.classList.add('hidden');
      }
    }
  }

  // Filter Pill Click Handlers
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.getAttribute('data-filter');
      applyFiltersAndSearch();
    });
  });

  // Search Input Handler
  if (searchInput) {
    searchInput.addEventListener('input', applyFiltersAndSearch);
  }
});
