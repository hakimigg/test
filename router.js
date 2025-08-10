// Simple client-side router for GitHub Pages
(function() {
  const path = window.location.pathname;
  
  // Handle /admin route for GitHub Pages
  if (path === '/test/admin' || path === '/admin') {
    console.log('Loading admin panel...');
    
    // Load admin.html content
    fetch('admin.html')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load admin panel');
        }
        return response.text();
      })
      .then(html => {
        // Replace the entire document content
        document.open();
        document.write(html);
        document.close();
      })
      .catch(error => {
        console.error('Error loading admin panel:', error);
        // Fallback: redirect to admin.html directly
        window.location.href = 'admin.html';
      });
  }
})(); 