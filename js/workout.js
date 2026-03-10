// Workout execution functionality

const Workout = {
  currentWorkout: null,
  executionPlan: [],
  currentIndex: 0,
  timer: null,
  timeRemaining: 0,
  isPaused: false,
  settings: null,

  completionImages: ['&#128170;', '&#127942;', '&#127881;', '&#11088;', '&#128293;', '&#128079;', '&#129351;', '&#128175;'],

  init() {
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('cancel-workout-btn').addEventListener('click', () => this.cancel());
    document.getElementById('click-continue').addEventListener('click', () => this.handleClick());
    document.getElementById('back-to-main').addEventListener('click', () => {
      App.showPage('main-page');
    });

    // Allow clicking anywhere on the workout display for "on click" blocks
    document.getElementById('workout-display').addEventListener('click', (e) => {
      // Don't trigger if clicking the cancel button or the tap button itself
      if (e.target.closest('#cancel-workout-btn') || e.target.closest('#click-continue')) {
        return;
      }
      this.handleClick();
    });
  },

  start(workoutId) {
    this.currentWorkout = Storage.getWorkoutById(workoutId);
    this.settings = Storage.getSettings();
    
    if (!this.currentWorkout || !this.currentWorkout.timeline || this.currentWorkout.timeline.length === 0) {
      Modal.show('Invalid Workout', 'This workout is empty or invalid.', 'OK', false);
      return;
    }
    
    this.buildExecutionPlan();
    
    if (this.executionPlan.length === 0) {
      Modal.show('Empty Workout', 'No blocks in timeline.', 'OK', false);
      return;
    }
    
    this.currentIndex = -1;
    
    App.showPage('workout-page');
    
    Audio.init();
    
    this.startCountdown();
  },

  getBlockById(id) {
    return this.currentWorkout.blocks.find(b => b.id === id);
  },

  buildExecutionPlan() {
    this.executionPlan = [];
    const timeline = this.currentWorkout.timeline;
    
    timeline.forEach(item => {
      if (item.type === 'block') {
        const block = this.getBlockById(item.blockId);
        if (block) {
          this.executionPlan.push({
            ...block,
            loopInfo: '',
            skipOnLastLoop: false
          });
        }
      } else if (item.type === 'loop') {
        const repetitions = item.repetitions || 2;
        
        for (let rep = 0; rep < repetitions; rep++) {
          const isLastRep = rep === repetitions - 1;
          
          item.items.forEach(loopItem => {
            if (isLastRep && loopItem.skipOnLastLoop) {
              return;
            }
            
            const block = this.getBlockById(loopItem.blockId);
            if (block) {
              this.executionPlan.push({
                ...block,
                loopInfo: `Loop ${rep + 1}/${repetitions}`,
                skipOnLastLoop: loopItem.skipOnLastLoop
              });
            }
          });
        }
      }
    });
  },

  startCountdown() {
    const display = document.getElementById('workout-display');
    const blockName = document.getElementById('current-block-name');
    const timerDisplay = document.getElementById('current-timer');
    const loopInfo = document.getElementById('loop-info');
    const clickBtn = document.getElementById('click-continue');
    
    display.style.backgroundColor = '#2c3e50';
    blockName.textContent = 'Get Ready!';
    loopInfo.textContent = '';
    clickBtn.classList.add('hidden');
    
    this.timeRemaining = 10;
    timerDisplay.textContent = this.timeRemaining;
    
    this.timer = setInterval(() => {
      this.timeRemaining--;
      timerDisplay.textContent = this.timeRemaining;
      
      if (this.timeRemaining <= 0) {
        clearInterval(this.timer);
        Audio.playStartBeep();
        this.nextBlock();
      } else {
        Audio.playCountdownBeep();
      }
    }, 1000);
  },

  nextBlock() {
    this.currentIndex++;
    
    if (this.currentIndex >= this.executionPlan.length) {
      this.complete();
      return;
    }
    
    const block = this.executionPlan[this.currentIndex];
    this.playBlock(block);
  },

  playBlock(block) {
    const display = document.getElementById('workout-display');
    const blockName = document.getElementById('current-block-name');
    const timerDisplay = document.getElementById('current-timer');
    const loopInfo = document.getElementById('loop-info');
    const clickBtn = document.getElementById('click-continue');
    
    display.style.backgroundColor = block.color;
    blockName.textContent = block.name;
    loopInfo.textContent = block.loopInfo || '';
    
    if (block.timerType === 'click') {
      timerDisplay.textContent = '∞';
      clickBtn.classList.remove('hidden');
    } else {
      clickBtn.classList.add('hidden');
      this.timeRemaining = block.duration;
      timerDisplay.textContent = this.timeRemaining;
      
      this.timer = setInterval(() => {
        this.timeRemaining--;
        timerDisplay.textContent = this.timeRemaining;
        
        if (this.timeRemaining <= this.settings.beepCount && this.timeRemaining > 0) {
          Audio.playEndBlockBeep();
        }
        
        if (this.timeRemaining <= 0) {
          clearInterval(this.timer);
          this.nextBlock();
        }
      }, 1000);
    }
  },

  handleClick() {
    if (this.currentIndex < 0) return; // Still in countdown
    
    const block = this.executionPlan[this.currentIndex];
    if (block && block.timerType === 'click') {
      Audio.playStartBeep();
      this.nextBlock();
    }
  },

  complete() {
    clearInterval(this.timer);
    
    Audio.playFinalBeep(() => {
      const completeImage = document.getElementById('complete-image');
      const randomImage = this.completionImages[Math.floor(Math.random() * this.completionImages.length)];
      completeImage.innerHTML = randomImage;
      
      App.showPage('complete-page');
    });
  },

  async cancel() {
    const confirmed = await Modal.show(
      'Cancel Workout?',
      'Are you sure you want to cancel this workout?',
      'Cancel Workout',
      true
    );
    if (confirmed) {
      clearInterval(this.timer);
      App.showPage('main-page');
    }
  }
};
