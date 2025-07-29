const supabaseUrl = 'https://oaocunkolrastdfoyslv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb2N1bmtvbHJhc3RkZm95c2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTcyMzksImV4cCI6MjA2OTM5MzIzOX0.osmL83G7FFDPV1Fy0I2-Pbk5hakuoxZjyQwMVoxJcfY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

async function loadMenuItems() {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      displayMenuItems(data);
    }
  } catch (error) {
    console.error('Error loading menu items:', error);
  }
}

function displayMenuItems(items) {
  const menuGrid = document.querySelector('.menu-grid');
  if (!menuGrid) return;
  
  const categories = {};
  items.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });
  
  menuGrid.innerHTML = '';
  
  Object.keys(categories).forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'menu-item';
    categoryDiv.innerHTML = `
      <h3>${category}</h3>
      <p>${categories[category].map(item => 
        `${item.name} - ${item.price} DA`
      ).join('<br>')}</p>
    `;
    menuGrid.appendChild(categoryDiv);
  });
}

async function submitContactForm(formData) {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([{
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
      }]);
    
    if (error) throw error;
    
    alert('Thank you! Your message has been sent successfully.');
    return true;
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('Sorry, there was an error sending your message. Please try again.');
    return false;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  loadMenuItems();
  
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      await submitContactForm(formData);
      this.reset();
    });
  }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      window.scrollTo({
        top: target.offsetTop - 60,
        behavior: 'smooth'
      });
    }
  });
});

window.addEventListener('scroll', function() {
  const nav = document.querySelector('nav');
  if (window.scrollY > 10) {
    nav.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
  } else {
    nav.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
  }
}); 