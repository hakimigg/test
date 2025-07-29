// Simple client-side router for GitHub Pages
(function() {
  const path = window.location.pathname;
  
  // Handle /admin route
  if (path === '/test/admin' || path === '/admin') {
    // Load admin.html content
    fetch('admin.html')
      .then(response => response.text())
      .then(html => {
        document.documentElement.innerHTML = html;
        // Re-initialize admin functionality
        if (typeof setupEventListeners === 'function') {
          setupEventListeners();
          checkAuth();
        }
      })
      .catch(error => {
        console.error('Error loading admin panel:', error);
        window.location.href = 'admin.html';
      });
  }
})(); 