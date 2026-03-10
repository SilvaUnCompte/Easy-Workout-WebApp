// Workout icons collection

const WorkoutIcons = {
  icons: {
    dumbbell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6.5 6.5h11v11h-11z" transform="rotate(45 12 12)"></path>
      <line x1="3" y1="3" x2="21" y2="21"></line>
      <line x1="3" y1="21" x2="21" y2="3"></line>
    </svg>`,
    
    arm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
      <line x1="4" y1="22" x2="4" y2="15"></line>
    </svg>`,
    
    running: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="5" r="2"></circle>
      <path d="M4 17l4-4 3 3 4-4 4 4"></path>
      <line x1="9" y1="21" x2="9" y2="12"></line>
      <line x1="15" y1="21" x2="15" y2="16"></line>
    </svg>`,
    
    heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>`,
    
    timer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>`,
    
    stretch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="4" r="2"></circle>
      <path d="M12 6v6"></path>
      <path d="M8 12l4 4 4-4"></path>
      <path d="M6 18h12"></path>
    </svg>`,
    
    yoga: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="4" r="2"></circle>
      <path d="M12 6v4"></path>
      <path d="M4 14l8-4 8 4"></path>
      <path d="M8 22l4-8 4 8"></path>
    </svg>`,
    
    cycling: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="6" cy="17" r="3"></circle>
      <circle cx="18" cy="17" r="3"></circle>
      <path d="M12 17V9l-4 4h8"></path>
      <circle cx="12" cy="5" r="2"></circle>
    </svg>`,
    
    weight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="8" width="4" height="8" rx="1"></rect>
      <rect x="18" y="8" width="4" height="8" rx="1"></rect>
      <line x1="6" y1="12" x2="18" y2="12"></line>
      <rect x="6" y="6" width="3" height="12" rx="1"></rect>
      <rect x="15" y="6" width="3" height="12" rx="1"></rect>
    </svg>`,
    
    fire: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
    </svg>`
  },

  getIcon(name) {
    return this.icons[name] || this.icons.dumbbell;
  },

  getAllIcons() {
    return Object.keys(this.icons);
  },

  renderIconGrid(containerId, selectedIcon, onSelect) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    this.getAllIcons().forEach(iconName => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `icon-option ${iconName === selectedIcon ? 'selected' : ''}`;
      btn.dataset.icon = iconName;
      btn.innerHTML = this.getIcon(iconName);
      btn.addEventListener('click', () => {
        container.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
        btn.classList.add('selected');
        if (onSelect) onSelect(iconName);
      });
      container.appendChild(btn);
    });
  }
};
