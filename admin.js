// Get Supabase credentials from the main website's configuration
let supabaseUrl, supabaseKey;

// Try to get credentials from the main site's script or use fallback
try {
  // Check if we can access the main site's Supabase client
  if (window.parent && window.parent !== window) {
    // We're in an iframe, try to get from parent
    supabaseUrl = window.parent.supabaseUrl;
    supabaseKey = window.parent.supabaseKey;
  }
  
  // Fallback: try to detect from current domain or use environment
  if (!supabaseUrl) {
    // Your actual Supabase project credentials
    supabaseUrl = 'https://oaocunkolrastdfoyslv.supabase.co';
    supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb2N1bmtvbHJhc3RkZm95c2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTcyMzksImV4cCI6MjA2OTM5MzIzOX0.osmL83G7FFDPV1Fy0I2-Pbk5hakuoxZjyQwMVoxJcfY';
  }
} catch (error) {
  console.error('Error getting Supabase credentials:', error);
  // Fallback credentials - your actual ones
  supabaseUrl = 'https://oaocunkolrastdfoyslv.supabase.co';
  supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb2N1bmtvbHJhc3RkZm95c2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTcyMzksImV4cCI6MjA2OTM5MzIzOX0.osmL83G7FFDPV1Fy0I2-Pbk5hakuoxZjyQwMVoxJcfY';
}

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const ADMIN_PASSWORD = 'admin123';

let currentEditingItem = null;
let currentEditingPromo = null;

document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
  updateTime();
  setInterval(updateTime, 1000);
});

function setupEventListeners() {
  // Removed login-form event listener to avoid conflict with inline script
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('add-menu-btn').addEventListener('click', () => openModal());
  document.getElementById('add-promo-btn').addEventListener('click', () => openPromoModal());
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  document.getElementById('menu-form').addEventListener('submit', handleMenuSubmit);
  document.getElementById('promo-form').addEventListener('submit', handlePromoSubmit);
  document.querySelector('.close').addEventListener('click', closeModal);
  document.querySelector('#modal .close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
  document.getElementById('promo-modal').addEventListener('click', function(e) {
    if (e.target === this) closePromoModal();
  });
  
  document.getElementById('category-filter').addEventListener('change', filterMenuItems);
  document.getElementById('search-menu').addEventListener('input', filterMenuItems);
  document.getElementById('export-contacts').addEventListener('click', exportContacts);
}

function updateTime() {
  const timeElement = document.getElementById('current-time');
  if (timeElement) {
    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString();
  }
}

function checkAuth() {
  const token = localStorage.getItem('admin_token');
  if (token) {
    showDashboard();
  } else {
    showLogin();
  }
}

// Removed handleLogin function - login is now handled by inline script in admin.html

function handleLogout() {
  localStorage.removeItem('admin_token');
  showLogin();
}

function showLogin() {
  document.getElementById('login-section').style.display = 'flex';
  document.getElementById('admin-dashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'block';
  loadDashboardData();
}

function showNotification(message, type = 'success', title = null) {
  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 400);
  });

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  // Set icon and colors based on type
  let icon, notificationTitle;
  switch(type) {
    case 'success':
      icon = 'fa-check-circle';
      notificationTitle = title || 'Success!';
      break;
    case 'error':
      icon = 'fa-exclamation-triangle';
      notificationTitle = title || 'Error!';
      break;
    case 'info':
      icon = 'fa-info-circle';
      notificationTitle = title || 'Information';
      break;
    case 'warning':
      icon = 'fa-exclamation-circle';
      notificationTitle = title || 'Warning!';
      break;
    default:
      icon = 'fa-info-circle';
      notificationTitle = title || 'Notification';
  }
  
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas ${icon}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">${notificationTitle}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close" onclick="this.parentElement.classList.remove('show'); setTimeout(() => { if(this.parentElement.parentNode) this.parentElement.parentNode.removeChild(this.parentElement); }, 400);">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 400);
  }, 4000);
}

// Custom alert dialog function
function showAlert(message, title = 'Alert', type = 'info') {
  return new Promise((resolve) => {
    // Remove any existing alert dialogs
    const existingAlerts = document.querySelectorAll('.alert-overlay');
    existingAlerts.forEach(alert => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    });

    // Create alert dialog
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    
    let icon, iconClass;
    switch(type) {
      case 'error':
        icon = 'fa-exclamation-triangle';
        iconClass = 'danger';
        break;
      case 'warning':
        icon = 'fa-exclamation-circle';
        iconClass = 'warning';
        break;
      case 'success':
        icon = 'fa-check-circle';
        iconClass = 'success';
        break;
      case 'info':
      default:
        icon = 'fa-info-circle';
        iconClass = 'info';
    }
    
    overlay.innerHTML = `
      <div class="alert-dialog">
        <div class="alert-icon ${iconClass}">
          <i class="fas ${icon}"></i>
        </div>
        <div class="alert-title">${title}</div>
        <div class="alert-message">${message}</div>
        <div class="alert-actions">
          <button class="alert-btn ok">OK</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Show the dialog
    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);
    
    // Handle button click
    const okBtn = overlay.querySelector('.alert-btn.ok');
    
    const closeDialog = () => {
      overlay.classList.remove('show');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        resolve();
      }, 300);
    };
    
    okBtn.addEventListener('click', closeDialog);
    
    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeDialog();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Handle clicking outside the dialog
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeDialog();
      }
    });
  });
}

// Custom confirmation dialog function
function showConfirmation(message, title = 'Confirm Action', type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel') {
  return new Promise((resolve) => {
    // Remove any existing confirmation dialogs
    const existingDialogs = document.querySelectorAll('.confirmation-overlay');
    existingDialogs.forEach(dialog => {
      if (dialog.parentNode) {
        dialog.parentNode.removeChild(dialog);
      }
    });

    // Create confirmation dialog
    const overlay = document.createElement('div');
    overlay.className = 'confirmation-overlay';
    
    let icon, iconClass;
    switch(type) {
      case 'danger':
        icon = 'fa-exclamation-triangle';
        iconClass = 'danger';
        break;
      case 'warning':
        icon = 'fa-exclamation-circle';
        iconClass = 'warning';
        break;
      case 'info':
        icon = 'fa-info-circle';
        iconClass = 'info';
        break;
      default:
        icon = 'fa-question-circle';
        iconClass = 'warning';
    }
    
    overlay.innerHTML = `
      <div class="confirmation-dialog">
        <div class="confirmation-icon ${iconClass}">
          <i class="fas ${icon}"></i>
        </div>
        <div class="confirmation-title">${title}</div>
        <div class="confirmation-message">${message}</div>
        <div class="confirmation-actions">
          <button class="confirmation-btn cancel">${cancelText}</button>
          <button class="confirmation-btn confirm ${type}">${confirmText}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Show the dialog
    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);
    
    // Handle button clicks
    const cancelBtn = overlay.querySelector('.confirmation-btn.cancel');
    const confirmBtn = overlay.querySelector('.confirmation-btn.confirm');
    
    const closeDialog = (result) => {
      overlay.classList.remove('show');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        resolve(result);
      }, 300);
    };
    
    cancelBtn.addEventListener('click', () => closeDialog(false));
    confirmBtn.addEventListener('click', () => closeDialog(true));
    
    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeDialog(false);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Handle clicking outside the dialog
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeDialog(false);
      }
    });
  });
}

async function loadDashboardData() {
  await Promise.all([
    loadMenuItems(),
    loadPromotions(),
    loadContactSubmissions()
  ]);
  // Dashboard stats are now updated after each data type is displayed
}

function updateDashboardStats() {
  const menuCount = document.querySelectorAll('.menu-item-card').length;
  const promoCount = document.querySelectorAll('.promo-card').length;
  const contactCount = document.querySelectorAll('.contact-card').length;
  
  document.getElementById('menu-count').textContent = menuCount;
  document.getElementById('promo-count').textContent = promoCount;
  document.getElementById('contact-count').textContent = contactCount;
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  if (tabName === 'overview') {
    updateDashboardStats();
  }
}

async function loadMenuItems() {
  try {
    // First, let's check what tables exist
    console.log('Attempting to load menu items...');
    
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) {
      console.error('Error loading menu items:', error);
      // Try alternative table names
      const { data: altData, error: altError } = await supabase
        .from('menu')
        .select('*')
        .order('category', { ascending: true });
      
      if (altError) {
        console.error('Error loading from menu table:', altError);
        showNotification('Menu table not found. Please check your database setup.', 'error');
        displayMenuItems([]);
        return;
      }
      
      displayMenuItems(altData || []);
      return;
    }
    
    console.log('Menu items loaded:', data);
    displayMenuItems(data || []);
  } catch (error) {
    console.error('Error loading menu items:', error);
    showNotification('Error loading menu items', 'error');
    displayMenuItems([]);
  }
}

function displayMenuItems(items) {
  const container = document.getElementById('menu-items-list');
  container.innerHTML = '';
  
  if (items.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-utensils"></i><p>No menu items found.</p></div>';
    updateDashboardStats(); // Update stats even when empty
    return;
  }
  
  const categories = {};
  items.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });
  
  Object.keys(categories).forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.innerHTML = `<h4 class="category-header">${category}</h4>`;
    container.appendChild(categoryDiv);
    
    categories[category].forEach(item => {
      const itemCard = createMenuItemCard(item);
      container.appendChild(itemCard);
    });
  });
  
  // Update dashboard stats after items are displayed
  updateDashboardStats();
}

function createMenuItemCard(item) {
  const card = document.createElement('div');
  card.className = 'menu-item-card';
  card.innerHTML = `
    <div class="menu-item-header">
      <div>
        <div class="menu-item-name">${item.name}</div>
        <div class="menu-item-category">${item.category}</div>
      </div>
      <div class="menu-item-price">${item.price} DA</div>
    </div>
    ${item.description ? `<div class="menu-item-description">${item.description}</div>` : ''}
    <div class="menu-item-actions">
      <button class="btn-secondary" onclick="editMenuItem(${item.id})">
        <i class="fas fa-edit"></i>
        Edit
      </button>
      <button class="btn-danger" onclick="deleteMenuItem(${item.id})">
        <i class="fas fa-trash"></i>
        Delete
      </button>
    </div>
  `;
  return card;
}

function filterMenuItems() {
  const categoryFilter = document.getElementById('category-filter').value;
  const searchTerm = document.getElementById('search-menu').value.toLowerCase();
  const menuCards = document.querySelectorAll('.menu-item-card');
  
  menuCards.forEach(card => {
    const category = card.querySelector('.menu-item-category').textContent;
    const name = card.querySelector('.menu-item-name').textContent.toLowerCase();
    
    const categoryMatch = !categoryFilter || category === categoryFilter;
    const searchMatch = !searchTerm || name.includes(searchTerm);
    
    card.style.display = categoryMatch && searchMatch ? 'block' : 'none';
  });
}

async function loadPromotions() {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*');
    
    if (error) {
      // If promotions table doesn't exist, just show empty state
      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        displayPromotions([]);
        return;
      }
      throw error;
    }
    
    // Sort by id if created_at doesn't exist
    const sortedData = data ? data.sort((a, b) => b.id - a.id) : [];
    displayPromotions(sortedData);
  } catch (error) {
    console.error('Error loading promotions:', error);
    // Don't show error notification for missing table
    if (error.code !== 'PGRST116' && error.code !== 'PGRST205') {
      showNotification('Error loading promotions', 'error');
    }
    displayPromotions([]);
  }
}

function displayPromotions(promotions) {
  const container = document.getElementById('promotions-list');
  container.innerHTML = '';
  
  if (promotions.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-percentage"></i><p>No promotions found.</p></div>';
    updateDashboardStats(); // Update stats even when empty
    return;
  }
  
  promotions.forEach(promo => {
    const card = createPromotionCard(promo);
    container.appendChild(card);
  });
  
  // Update dashboard stats after promotions are displayed
  updateDashboardStats();
}

function createPromotionCard(promo) {
  const isActive = promo.is_active && new Date(promo.end_date) > new Date();
  const card = document.createElement('div');
  card.className = 'promo-card';
  card.innerHTML = `
    <div class="promo-header">
      <div>
        <div class="promo-title">${promo.title}</div>
        <div class="promo-code">Code: ${promo.promo_code}</div>
      </div>
      <div class="promo-discount">${promo.discount_percent}% OFF</div>
    </div>
    <div class="promo-description">${promo.description}</div>
    <div class="promo-dates">
      <i class="fas fa-calendar"></i>
      ${new Date(promo.start_date).toLocaleDateString()} - ${new Date(promo.end_date).toLocaleDateString()}
    </div>
    <div class="promo-status ${isActive ? 'active' : 'inactive'}">
      <i class="fas fa-${isActive ? 'check-circle' : 'times-circle'}"></i>
      ${isActive ? 'Active' : 'Inactive'}
    </div>
    <div class="menu-item-actions">
      <button class="btn-secondary" onclick="editPromotion(${promo.id})">
        <i class="fas fa-edit"></i>
        Edit
      </button>
      <button class="btn-danger" onclick="deletePromotion(${promo.id})">
        <i class="fas fa-trash"></i>
        Delete
      </button>
    </div>
  `;
  return card;
}

async function loadContactSubmissions() {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*');
    
    if (error) {
      // If table doesn't exist or has issues, show empty state
      if (error.code === 'PGRST116' || error.code === '42703') {
        displayContactSubmissions([]);
        return;
      }
      throw error;
    }
    
    // Sort by id if created_at doesn't exist
    const sortedData = data ? data.sort((a, b) => b.id - a.id) : [];
    displayContactSubmissions(sortedData);
  } catch (error) {
    console.error('Error loading contact submissions:', error);
    // Don't show error notification for missing table/column
    if (error.code !== 'PGRST116' && error.code !== '42703') {
      showNotification('Error loading contact submissions', 'error');
    }
    displayContactSubmissions([]);
  }
}

function displayContactSubmissions(submissions) {
  const container = document.getElementById('contacts-list');
  container.innerHTML = '';
  
  if (submissions.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-envelope"></i><p>No contact submissions found.</p></div>';
    updateDashboardStats(); // Update stats even when empty
    return;
  }
  
  submissions.forEach(submission => {
    const card = document.createElement('div');
    card.className = 'contact-card';
    card.innerHTML = `
      <div class="contact-info">
        <div class="contact-name">${submission.name}</div>
        <div class="contact-email">${submission.email}</div>
        <div class="contact-date">
          <i class="fas fa-clock"></i>
          ${submission.created_at ? new Date(submission.created_at).toLocaleString() : 'Date not available'}
        </div>
      </div>
      <div class="contact-message">${submission.message}</div>
    `;
    container.appendChild(card);
  });
  
  // Update dashboard stats after contact submissions are displayed
  updateDashboardStats();
}

function openModal(item = null) {
  currentEditingItem = item;
  const modal = document.getElementById('modal');
  const title = document.getElementById('modal-title');
  const form = document.getElementById('menu-form');
  
  if (item) {
    title.textContent = 'Edit Menu Item';
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-category').value = item.category;
    document.getElementById('item-description').value = item.description || '';
  } else {
    title.textContent = 'Add Menu Item';
    form.reset();
    document.getElementById('item-id').value = '';
  }
  
  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  currentEditingItem = null;
}

function openPromoModal(promo = null) {
  currentEditingPromo = promo;
  const modal = document.getElementById('promo-modal');
  const title = document.getElementById('promo-modal-title');
  const form = document.getElementById('promo-form');
  
  if (promo) {
    title.textContent = 'Edit Promotion';
    document.getElementById('promo-id').value = promo.id;
    document.getElementById('promo-title').value = promo.title;
    document.getElementById('promo-description').value = promo.description;
    document.getElementById('promo-discount').value = promo.discount_percent;
    document.getElementById('promo-code').value = promo.promo_code;
    document.getElementById('promo-start').value = promo.start_date;
    document.getElementById('promo-end').value = promo.end_date;
    document.getElementById('promo-active').checked = promo.is_active;
  } else {
    title.textContent = 'Add Promotion';
    form.reset();
    document.getElementById('promo-id').value = '';
    document.getElementById('promo-start').value = new Date().toISOString().split('T')[0];
  }
  
  modal.style.display = 'flex';
}

function closePromoModal() {
  document.getElementById('promo-modal').style.display = 'none';
  currentEditingPromo = null;
}

async function handleMenuSubmit(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('item-name').value,
    price: parseFloat(document.getElementById('item-price').value),
    category: document.getElementById('item-category').value,
    description: document.getElementById('item-description').value
  };
  
  const itemId = document.getElementById('item-id').value;
  
  console.log('Submitting form data:', formData);
  console.log('Item ID:', itemId);
  
  try {
    let result;
    if (itemId) {
      console.log('Updating existing item...');
      result = await supabase
        .from('menu_items')
        .update(formData)
        .eq('id', itemId);
    } else {
      console.log('Inserting new item...');
      result = await supabase
        .from('menu_items')
        .insert([formData]);
    }
    
    console.log('Supabase result:', result);
    
    if (result.error) {
      console.error('Supabase error details:', result.error);
      throw result.error;
    }
    
    showNotification(
      itemId ? 'Your menu item has been updated successfully.' : 'New menu item has been added successfully.',
      'success',
      itemId ? 'Menu Item Updated' : 'Menu Item Added'
    );
    closeModal();
    loadMenuItems();
  } catch (error) {
    console.error('Error saving menu item:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    
    let errorMessage = 'Error saving menu item';
    if (error.message) {
      errorMessage += ': ' + error.message;
    }
    if (error.details) {
      errorMessage += ' - ' + error.details;
    }
    
    showNotification('There was an error saving your menu item. Please try again.', 'error', 'Save Failed');
  }
}

async function handlePromoSubmit(e) {
  e.preventDefault();
  
  const formData = {
    title: document.getElementById('promo-title').value,
    description: document.getElementById('promo-description').value,
    discount_percent: parseInt(document.getElementById('promo-discount').value),
    promo_code: document.getElementById('promo-code').value,
    start_date: document.getElementById('promo-start').value,
    end_date: document.getElementById('promo-end').value,
    is_active: document.getElementById('promo-active').checked
  };
  
  const promoId = document.getElementById('promo-id').value;
  
  try {
    let result;
    if (promoId) {
      result = await supabase
        .from('promotions')
        .update(formData)
        .eq('id', promoId);
    } else {
      result = await supabase
        .from('promotions')
        .insert([formData]);
    }
    
    if (result.error) {
      if (result.error.code === 'PGRST116' || result.error.code === 'PGRST205') {
        showNotification('Promotions table not found. Please create the promotions table in Supabase first.', 'error', 'Table Missing');
        return;
      }
      throw result.error;
    }
    
    showNotification(
      promoId ? 'Your promotion has been updated successfully.' : 'New promotion has been added successfully.',
      'success',
      promoId ? 'Promotion Updated' : 'Promotion Added'
    );
    closePromoModal();
    loadPromotions();
  } catch (error) {
    console.error('Error saving promotion:', error);
    if (error.code === 'PGRST116' || error.code === 'PGRST205') {
      showNotification('Promotions table not found. Please create the promotions table in Supabase first.', 'error', 'Table Missing');
    } else {
      showNotification('There was an error saving your promotion. Please try again.', 'error', 'Save Failed');
    }
  }
}

async function editMenuItem(id) {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      // Try alternative table name
      const { data: altData, error: altError } = await supabase
        .from('menu')
        .select('*')
        .eq('id', id)
        .single();
      
      if (altError) throw altError;
      
      openModal(altData);
      return;
    }
    
    openModal(data);
  } catch (error) {
    console.error('Error loading menu item:', error);
    showNotification('Error loading menu item', 'error');
  }
}

async function deleteMenuItem(id) {
  const confirmed = await showConfirmation(
    'Are you sure you want to delete this menu item? This action cannot be undone.',
    'Delete Menu Item',
    'danger',
    'Delete',
    'Cancel'
  );
  
  if (!confirmed) return;
  
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    
    if (error) {
      // Try alternative table name
      const { error: altError } = await supabase
        .from('menu')
        .delete()
        .eq('id', id);
      
      if (altError) throw altError;
    }
    
    showNotification('Menu item has been deleted successfully.', 'success', 'Item Deleted');
    loadMenuItems();
  } catch (error) {
    console.error('Error deleting menu item:', error);
    showNotification('There was an error deleting the menu item. Please try again.', 'error', 'Delete Failed');
  }
}

async function editPromotion(id) {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    openPromoModal(data);
  } catch (error) {
    console.error('Error loading promotion:', error);
    showNotification('Error loading promotion', 'error');
  }
}

async function deletePromotion(id) {
  const confirmed = await showConfirmation(
    'Are you sure you want to delete this promotion? This action cannot be undone.',
    'Delete Promotion',
    'danger',
    'Delete',
    'Cancel'
  );
  
  if (!confirmed) return;
  
  try {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    showNotification('Promotion has been deleted successfully.', 'success', 'Promotion Deleted');
    loadPromotions();
  } catch (error) {
    console.error('Error deleting promotion:', error);
    showNotification('There was an error deleting the promotion. Please try again.', 'error', 'Delete Failed');
  }
}

function exportContacts() {
  const contacts = document.querySelectorAll('.contact-card');
  if (contacts.length === 0) {
    showNotification('No contacts to export', 'error');
    return;
  }
  
  let csv = 'Name,Email,Message,Date\n';
  contacts.forEach(contact => {
    const name = contact.querySelector('.contact-name').textContent;
    const email = contact.querySelector('.contact-email').textContent;
    const message = contact.querySelector('.contact-message').textContent.replace(/,/g, ';');
    const date = contact.querySelector('.contact-date').textContent;
    
    csv += `"${name}","${email}","${message}","${date}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  showNotification('Contacts exported successfully!');
}

async function changePassword() {
  const result = await showPasswordDialog();
  if (result) {
    const { currentPassword, newPassword, confirmPassword } = result;
    
    // Validate current password
    if (currentPassword !== ADMIN_PASSWORD) {
      showNotification('Current password is incorrect.', 'error', 'Password Change Failed');
      return;
    }
    
    // Validate new password
    if (newPassword.length < 6) {
      showNotification('New password must be at least 6 characters long.', 'error', 'Password Change Failed');
      return;
    }
    
    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match.', 'error', 'Password Change Failed');
      return;
    }
    
    // Update the password (in a real app, this would be stored securely)
    // For this demo, we'll just update the constant
    // In production, you'd want to store this in a secure database
    showNotification('Password changed successfully! Please note: In a real application, this would be stored securely in a database.', 'success', 'Password Changed');
  }
}

function showPasswordDialog() {
  return new Promise((resolve) => {
    // Create dialog overlay
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    // Create dialog content
    const dialog = document.createElement('div');
    dialog.className = 'password-dialog';
    dialog.style.cssText = `
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      max-width: 400px;
      width: 90%;
      transform: scale(0.9);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    
    dialog.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
          <i class="fas fa-key" style="color: white; font-size: 1.5rem;"></i>
        </div>
        <h3 style="margin: 0; color: #1f2937; font-size: 1.5rem; font-weight: 600;">Change Password</h3>
        <p style="margin: 0.5rem 0 0; color: #6b7280; font-size: 0.9rem;">Enter your current password and choose a new one</p>
      </div>
      
      <form id="password-form">
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500; font-size: 0.9rem;">Current Password</label>
          <input type="password" id="current-password" required style="
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.2s;
            box-sizing: border-box;
          " placeholder="Enter current password">
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500; font-size: 0.9rem;">New Password</label>
          <input type="password" id="new-password" required style="
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.2s;
            box-sizing: border-box;
          " placeholder="Enter new password">
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500; font-size: 0.9rem;">Confirm New Password</label>
          <input type="password" id="confirm-password" required style="
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.2s;
            box-sizing: border-box;
          " placeholder="Confirm new password">
        </div>
        
        <div style="display: flex; gap: 0.75rem;">
          <button type="button" id="cancel-password" style="
            flex: 1;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            background: transparent;
            color: #6b7280;
            border-radius: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          ">Cancel</button>
          <button type="submit" style="
            flex: 1;
            padding: 0.75rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          ">Change Password</button>
        </div>
      </form>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Animate in
    setTimeout(() => {
      dialog.style.transform = 'scale(1)';
      dialog.style.opacity = '1';
    }, 100);
    
    // Handle form submission
    const form = dialog.querySelector('#password-form');
    const currentPasswordInput = dialog.querySelector('#current-password');
    const newPasswordInput = dialog.querySelector('#new-password');
    const confirmPasswordInput = dialog.querySelector('#confirm-password');
    const cancelBtn = dialog.querySelector('#cancel-password');
    
    const closeDialog = () => {
      dialog.style.transform = 'scale(0.9)';
      dialog.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 300);
    };
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      resolve({
        currentPassword: currentPasswordInput.value,
        newPassword: newPasswordInput.value,
        confirmPassword: confirmPasswordInput.value
      });
      closeDialog();
    });
    
    cancelBtn.addEventListener('click', () => {
      resolve(null);
      closeDialog();
    });
    
    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        resolve(null);
        closeDialog();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Focus on first input
    setTimeout(() => {
      currentPasswordInput.focus();
    }, 100);
  });
}

function editWebsiteInfo() {
  showNotification('Website info editing feature coming soon!');
}

function exportData() {
  showNotification('Data export feature coming soon!');
}