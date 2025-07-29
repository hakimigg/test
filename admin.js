const supabaseUrl = 'https://oaocunkolrastdfoyslv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb2N1bmtvbHJhc3RkZm95c2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTcyMzksImV4cCI6MjA2OTM5MzIzOX0.osmL83G7FFDPV1Fy0I2-Pbk5hakuoxZjyQwMVoxJcfY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const ADMIN_PASSWORD = 'admin123';

let currentEditingItem = null;
let currentEditingPromo = null;

document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
  checkAuth();
  updateTime();
  setInterval(updateTime, 1000);
});

function setupEventListeners() {
  document.getElementById('login-form').addEventListener('submit', handleLogin);
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
  const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
  if (isAuthenticated) {
    showDashboard();
  } else {
    showLogin();
  }
}

function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById('admin-password').value;
  
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem('adminAuthenticated', 'true');
    showDashboard();
  } else {
    showNotification('Incorrect password!', 'error');
  }
}

function handleLogout() {
  sessionStorage.removeItem('adminAuthenticated');
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

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

async function loadDashboardData() {
  await Promise.all([
    loadMenuItems(),
    loadPromotions(),
    loadContactSubmissions()
  ]);
  updateDashboardStats();
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
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) throw error;
    
    displayMenuItems(data || []);
  } catch (error) {
    console.error('Error loading menu items:', error);
    showNotification('Error loading menu items', 'error');
  }
}

function displayMenuItems(items) {
  const container = document.getElementById('menu-items-list');
  container.innerHTML = '';
  
  if (items.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-utensils"></i><p>No menu items found.</p></div>';
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
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      // If promotions table doesn't exist, just show empty state
      if (error.code === 'PGRST116') {
        displayPromotions([]);
        return;
      }
      throw error;
    }
    
    displayPromotions(data || []);
  } catch (error) {
    console.error('Error loading promotions:', error);
    // Don't show error notification for missing table
    if (error.code !== 'PGRST116') {
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
    return;
  }
  
  promotions.forEach(promo => {
    const card = createPromotionCard(promo);
    container.appendChild(card);
  });
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
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    displayContactSubmissions(data || []);
  } catch (error) {
    console.error('Error loading contact submissions:', error);
    showNotification('Error loading contact submissions', 'error');
  }
}

function displayContactSubmissions(submissions) {
  const container = document.getElementById('contacts-list');
  container.innerHTML = '';
  
  if (submissions.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-envelope"></i><p>No contact submissions found.</p></div>';
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
          ${new Date(submission.created_at).toLocaleString()}
        </div>
      </div>
      <div class="contact-message">${submission.message}</div>
    `;
    container.appendChild(card);
  });
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
  
  try {
    let result;
    if (itemId) {
      result = await supabase
        .from('menu_items')
        .update(formData)
        .eq('id', itemId);
    } else {
      result = await supabase
        .from('menu_items')
        .insert([formData]);
    }
    
    if (result.error) throw result.error;
    
    showNotification(itemId ? 'Menu item updated successfully!' : 'Menu item added successfully!');
    closeModal();
    loadMenuItems();
  } catch (error) {
    console.error('Error saving menu item:', error);
    showNotification('Error saving menu item', 'error');
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
      if (result.error.code === 'PGRST116') {
        showNotification('Promotions table not found. Please create the promotions table in Supabase first.', 'error');
        return;
      }
      throw result.error;
    }
    
    showNotification(promoId ? 'Promotion updated successfully!' : 'Promotion added successfully!');
    closePromoModal();
    loadPromotions();
  } catch (error) {
    console.error('Error saving promotion:', error);
    if (error.code === 'PGRST116') {
      showNotification('Promotions table not found. Please create the promotions table in Supabase first.', 'error');
    } else {
      showNotification('Error saving promotion', 'error');
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
    
    if (error) throw error;
    
    openModal(data);
  } catch (error) {
    console.error('Error loading menu item:', error);
    showNotification('Error loading menu item', 'error');
  }
}

async function deleteMenuItem(id) {
  if (!confirm('Are you sure you want to delete this menu item?')) return;
  
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    showNotification('Menu item deleted successfully!');
    loadMenuItems();
  } catch (error) {
    console.error('Error deleting menu item:', error);
    showNotification('Error deleting menu item', 'error');
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
  if (!confirm('Are you sure you want to delete this promotion?')) return;
  
  try {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    showNotification('Promotion deleted successfully!');
    loadPromotions();
  } catch (error) {
    console.error('Error deleting promotion:', error);
    showNotification('Error deleting promotion', 'error');
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

function changePassword() {
  const newPassword = prompt('Enter new admin password:');
  if (newPassword && newPassword.length >= 6) {
    showNotification('Password changed successfully! (Note: This is a demo - password is not actually saved)');
  } else if (newPassword) {
    showNotification('Password must be at least 6 characters', 'error');
  }
}

function editWebsiteInfo() {
  showNotification('Website info editing feature coming soon!');
}

function exportData() {
  showNotification('Data export feature coming soon!');
} 



 