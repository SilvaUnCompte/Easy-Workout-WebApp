// Storage management using localStorage (more reliable than cookies for larger data)

const Storage = {
  // Storage helpers
  setItem(name, value) {
    try {
      localStorage.setItem(name, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  },

  getItem(name) {
    try {
      const item = localStorage.getItem(name);
      if (item) {
        return JSON.parse(item);
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  removeItem(name) {
    localStorage.removeItem(name);
  },

  // Workouts
  getWorkouts() {
    return this.getItem('workouts') || [];
  },

  saveWorkouts(workouts) {
    this.setItem('workouts', workouts);
  },

  addWorkout(workout) {
    const workouts = this.getWorkouts();
    workout.id = Date.now().toString();
    workouts.push(workout);
    this.saveWorkouts(workouts);
    return workout;
  },

  updateWorkout(id, updatedWorkout) {
    const workouts = this.getWorkouts();
    const index = workouts.findIndex(w => w.id === id);
    if (index !== -1) {
      workouts[index] = { ...workouts[index], ...updatedWorkout };
      this.saveWorkouts(workouts);
      return workouts[index];
    }
    return null;
  },

  deleteWorkout(id) {
    const workouts = this.getWorkouts();
    const filtered = workouts.filter(w => w.id !== id);
    this.saveWorkouts(filtered);
  },

  getWorkoutById(id) {
    const workouts = this.getWorkouts();
    return workouts.find(w => w.id === id);
  },

  // Settings
  getSettings() {
    const defaults = {
      theme: 'blue',
      beepCount: 3,
      ttsEnabled: false,
      ttsLanguage: 'en-US'
    };

    const settings = this.getItem('settings');
    if (!settings) return defaults;
    
    const mergedSettings = { ...defaults, ...settings };
    // Ensure beepCount is a number
    mergedSettings.beepCount = parseInt(mergedSettings.beepCount) || 3;
    mergedSettings.ttsEnabled = !!mergedSettings.ttsEnabled;
    mergedSettings.ttsLanguage = mergedSettings.ttsLanguage === 'fr-FR' ? 'fr-FR' : 'en-US';
    return mergedSettings;
  },

  saveSettings(settings) {
    // Ensure beepCount is stored as a number
    settings.beepCount = parseInt(settings.beepCount) || 3;
    settings.ttsEnabled = !!settings.ttsEnabled;
    settings.ttsLanguage = settings.ttsLanguage === 'fr-FR' ? 'fr-FR' : 'en-US';
    this.setItem('settings', settings);
  },

  // Export
  exportWorkouts() {
    const workouts = this.getWorkouts();
    const data = JSON.stringify(workouts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'easy_counter_workouts.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  // Import
  importWorkouts(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workouts = JSON.parse(e.target.result);
          if (Array.isArray(workouts)) {
            // Merge with existing workouts, avoiding duplicates by name
            const existing = this.getWorkouts();
            const existingNames = new Set(existing.map(w => w.name));
            
            workouts.forEach(workout => {
              if (!existingNames.has(workout.name)) {
                workout.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                existing.push(workout);
                existingNames.add(workout.name);
              }
            });
            
            this.saveWorkouts(existing);
            resolve(existing);
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
};
