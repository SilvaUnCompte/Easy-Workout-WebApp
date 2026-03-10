// Main application logic

const App = {
  currentPage: 'main-page',
  workoutToDelete: null,
  pendingImportData: null,

  init() {
    this.loadSettings();
    this.bindEvents();
    this.renderWorkoutList();
    Modal.init();
    Editor.init();
    Workout.init();
  },

  loadSettings() {
    const settings = Storage.getSettings();
    document.body.dataset.theme = settings.theme;
    document.getElementById('beep-count').textContent = settings.beepCount;
    document.getElementById('tts-enabled').checked = settings.ttsEnabled;
    document.querySelectorAll('.tts-lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === settings.ttsLanguage);
    });
    
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === settings.theme);
    });
  },

  bindEvents() {
    // Navigation
    document.getElementById('options-btn').addEventListener('click', () => this.showPage('options-page'));
    document.getElementById('options-back-btn').addEventListener('click', () => this.showPage('main-page'));
    document.getElementById('add-workout-btn').addEventListener('click', () => Editor.open());
    
    // Options page - color theme
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        document.body.dataset.theme = color;
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const settings = Storage.getSettings();
        settings.theme = color;
        Storage.saveSettings(settings);
      });
    });
    
    // Beep count controls
    const beepMinus = document.getElementById('beep-minus');
    const beepPlus = document.getElementById('beep-plus');
    const beepCountEl = document.getElementById('beep-count');
    
    beepMinus.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const settings = Storage.getSettings();
      if (settings.beepCount > 1) {
        settings.beepCount = settings.beepCount - 1;
        Storage.saveSettings(settings);
        beepCountEl.textContent = settings.beepCount;
      }
    };
    
    beepPlus.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const settings = Storage.getSettings();
      if (settings.beepCount < 99) {
        settings.beepCount = settings.beepCount + 1;
        Storage.saveSettings(settings);
        beepCountEl.textContent = settings.beepCount;
      }
    };

    // Text-to-speech toggle
    document.getElementById('tts-enabled').addEventListener('change', (e) => {
      const settings = Storage.getSettings();
      settings.ttsEnabled = e.target.checked;
      Storage.saveSettings(settings);
    });

    document.querySelectorAll('.tts-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const settings = Storage.getSettings();
        settings.ttsLanguage = btn.dataset.lang;
        Storage.saveSettings(settings);

        document.querySelectorAll('.tts-lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    
    // Export
    document.getElementById('export-btn').addEventListener('click', () => {
      Storage.exportWorkouts();
    });
    
    // Import
    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-input').click();
    });
    
    document.getElementById('import-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          this.pendingImportData = JSON.parse(text);
          document.getElementById('import-modal').classList.remove('hidden');
        } catch (err) {
          Modal.show('Import Error', 'Failed to read file: ' + err.message, 'OK', false);
        }
        e.target.value = '';
      }
    });

    // Import modal buttons
    document.getElementById('import-replace').addEventListener('click', () => {
      if (this.pendingImportData) {
        Storage.saveWorkouts(this.pendingImportData.workouts || this.pendingImportData);
        this.renderWorkoutList();
        this.pendingImportData = null;
      }
      document.getElementById('import-modal').classList.add('hidden');
    });

    document.getElementById('import-merge').addEventListener('click', () => {
      if (this.pendingImportData) {
        const existing = Storage.getWorkouts();
        const incoming = this.pendingImportData.workouts || this.pendingImportData;
        // Add each incoming workout with new IDs
        incoming.forEach(workout => {
          workout.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          existing.push(workout);
        });
        Storage.saveWorkouts(existing);
        this.renderWorkoutList();
        this.pendingImportData = null;
      }
      document.getElementById('import-modal').classList.add('hidden');
    });

    // Close import modal on backdrop click
    document.getElementById('import-modal').addEventListener('click', (e) => {
      if (e.target.id === 'import-modal') {
        document.getElementById('import-modal').classList.add('hidden');
        this.pendingImportData = null;
      }
    });
  },

  showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    this.currentPage = pageId;
  },

  renderWorkoutList() {
    const workouts = Storage.getWorkouts();
    const container = document.getElementById('workout-list');
    const emptyState = document.getElementById('empty-state');
    
    container.innerHTML = '';
    
    if (workouts.length === 0) {
      emptyState.classList.add('visible');
      return;
    }
    
    emptyState.classList.remove('visible');
    
    workouts.forEach(workout => {
      const card = document.createElement('div');
      card.className = 'workout-card';
      
      const blockCount = workout.timeline ? workout.timeline.reduce((count, item) => {
        if (item.type === 'block') return count + 1;
        if (item.type === 'loop') {
          const repetitions = item.repetitions || 2;
          const loopBlockCount = (item.items || []).reduce((loopCount, loopItem) => {
            const reps = loopItem.skipOnLastLoop ? (repetitions - 1) : repetitions;
            return loopCount + Math.max(0, reps);
          }, 0);
          return count + loopBlockCount;
        }
        return count;
      }, 0) : 0;
      
      const getBlockDuration = (blockId) => {
        const block = workout.blocks ? workout.blocks.find(b => b.id === blockId) : null;
        return block && block.timerType !== 'click' ? (block.duration || 0) : 0;
      };
      
      const totalDuration = workout.timeline ? workout.timeline.reduce((sum, item) => {
        if (item.type === 'block') {
          return sum + getBlockDuration(item.blockId);
        }
        if (item.type === 'loop') {
          const loopDuration = item.items.reduce((loopSum, loopItem) => {
            const reps = loopItem.skipOnLastLoop ? (item.repetitions - 1) : item.repetitions;
            return loopSum + (getBlockDuration(loopItem.blockId) * reps);
          }, 0);
          return sum + loopDuration;
        }
        return sum;
      }, 0) : 0;
      
      const formatDuration = (seconds) => {
        if (seconds === 0) return 'Variable';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      };
      
      card.innerHTML = `
        <div class="workout-card-icon">
          ${WorkoutIcons.getIcon(workout.icon)}
        </div>
        <div class="workout-card-info">
          <div class="workout-card-name">${workout.name}</div>
          <div class="workout-card-details">${blockCount} blocks - ${formatDuration(totalDuration)}</div>
        </div>
        <div class="workout-card-actions">
          <button class="card-action-btn edit" data-id="${workout.id}" aria-label="Edit workout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="card-action-btn delete" data-id="${workout.id}" aria-label="Delete workout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      `;
      
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.card-action-btn')) {
          Workout.start(workout.id);
        }
      });
      
      container.appendChild(card);
    });
    
    // Bind action buttons
    container.querySelectorAll('.card-action-btn.edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Editor.open(btn.dataset.id);
      });
    });
    
    container.querySelectorAll('.card-action-btn.delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = await Modal.show(
          'Delete Workout?',
          'Are you sure you want to delete this workout? This action cannot be undone.',
          'Delete',
          true
        );
        if (confirmed) {
          Storage.deleteWorkout(btn.dataset.id);
          this.renderWorkoutList();
        }
      });
    });
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((err) => {
        console.error('Service worker registration failed:', err);
      });
    });
  }
});
