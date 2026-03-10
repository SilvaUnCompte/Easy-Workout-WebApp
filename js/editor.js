// Workout editor functionality with blocks library, timeline, and drag-and-drop

const Editor = {
  currentWorkout: null,
  isEditing: false,
  selectedIcon: 'dumbbell',
  blocks: [],
  timeline: [],
  draggedItem: null,
  draggedParent: null,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('add-block-btn').addEventListener('click', () => this.addBlockDefinition());
    document.getElementById('add-timeline-block-btn').addEventListener('click', () => this.showAddBlockModal());
    document.getElementById('add-timeline-loop-btn').addEventListener('click', () => this.addTimelineLoop());
    document.getElementById('save-workout-btn').addEventListener('click', () => this.saveWorkout());
    document.getElementById('editor-back-btn').addEventListener('click', () => this.handleBack());
    
    // Block picker modal events
    document.getElementById('close-block-picker').addEventListener('click', () => this.hideAddBlockModal());
    document.getElementById('block-picker-modal').addEventListener('click', (e) => {
      if (e.target.id === 'block-picker-modal') this.hideAddBlockModal();
    });
  },

  open(workoutId = null) {
    if (workoutId) {
      this.currentWorkout = Storage.getWorkoutById(workoutId);
      this.isEditing = true;
      document.getElementById('editor-title').textContent = 'Edit Workout';
    } else {
      this.currentWorkout = null;
      this.isEditing = false;
      document.getElementById('editor-title').textContent = 'New Workout';
    }
    
    this.loadWorkoutData();
    App.showPage('editor-page');
  },

  loadWorkoutData() {
    const nameInput = document.getElementById('workout-name');
    
    if (this.currentWorkout) {
      nameInput.value = this.currentWorkout.name || '';
      this.selectedIcon = this.currentWorkout.icon || 'dumbbell';
      this.blocks = JSON.parse(JSON.stringify(this.currentWorkout.blocks || []));
      this.timeline = JSON.parse(JSON.stringify(this.currentWorkout.timeline || []));
    } else {
      nameInput.value = '';
      this.selectedIcon = 'dumbbell';
      this.blocks = [];
      this.timeline = [];
    }
    
    WorkoutIcons.renderIconGrid('icon-grid', this.selectedIcon, (icon) => {
      this.selectedIcon = icon;
    });
    
    this.renderBlocks();
    this.renderTimeline();
  },

  // --- Block Definitions (Library) ---

  addBlockDefinition() {
    const newBlock = {
      id: Date.now().toString(),
      name: `Block ${this.blocks.length + 1}`,
      timerType: 'timer',
      duration: 30,
      color: '#4a6fa5'
    };
    this.blocks.push(newBlock);
    this.renderBlocks();
  },

  async removeBlockDefinition(id) {
    const confirmed = await Modal.show(
      'Delete Block?',
      'This will remove the block and all its references from the timeline.',
      'Delete',
      true
    );
    if (confirmed) {
      this.blocks = this.blocks.filter(b => b.id !== id);
      this.removeBlockFromTimeline(id);
      this.renderBlocks();
      this.renderTimeline();
    }
  },

  removeBlockFromTimeline(blockId) {
    this.timeline = this.timeline.filter(item => {
      if (item.type === 'block' && item.blockId === blockId) return false;
      return true;
    });
    this.timeline.forEach(item => {
      if (item.type === 'loop') {
        item.items = item.items.filter(loopItem => loopItem.blockId !== blockId);
      }
    });
    this.timeline = this.timeline.filter(item => {
      if (item.type === 'loop' && item.items.length === 0) return false;
      return true;
    });
  },

  updateBlockDefinition(id, field, value) {
    const block = this.blocks.find(b => b.id === id);
    if (block) {
      block[field] = value;
      if (field === 'timerType' || field === 'color' || field === 'name') {
        this.renderBlocks();
        this.renderTimeline();
      }
    }
  },

  renderBlocks() {
    const container = document.getElementById('blocks-container');
    container.innerHTML = '';
    
    if (this.blocks.length === 0) {
      container.innerHTML = '<div class="empty-hint-card">No blocks yet. Add one to get started!</div>';
      return;
    }
    
    this.blocks.forEach((block, index) => {
      const blockEl = document.createElement('div');
      blockEl.className = 'block-item';
      blockEl.innerHTML = `
        <div class="block-header">
          <div class="block-color-indicator" style="background-color: ${block.color}"></div>
          <span class="block-number">${block.name}</span>
          <button type="button" class="block-delete" data-id="${block.id}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="block-fields">
          <div class="block-field">
            <label>Name</label>
            <input type="text" class="block-name" data-id="${block.id}" value="${block.name}" maxlength="30">
          </div>
          <div class="block-row">
            <div class="block-field">
              <label>Timer Type</label>
              <div class="timer-type-toggle">
                <button type="button" class="timer-type-btn ${block.timerType === 'timer' ? 'active' : ''}" data-id="${block.id}" data-type="timer">Timer</button>
                <button type="button" class="timer-type-btn ${block.timerType === 'click' ? 'active' : ''}" data-id="${block.id}" data-type="click">On Click</button>
              </div>
            </div>
            <div class="block-field duration-field" ${block.timerType === 'click' ? 'style="opacity:0.5"' : ''}>
              <label>Duration (sec)</label>
              <input type="number" class="block-duration" data-id="${block.id}" value="${block.duration}" min="1" max="3600" ${block.timerType === 'click' ? 'disabled' : ''}>
            </div>
          </div>
          <div class="block-field">
            <label>Color</label>
            <div class="color-field">
              <input type="color" class="block-color" data-id="${block.id}" value="${block.color}">
              <div class="color-preview-box" style="background-color: ${block.color}"></div>
            </div>
          </div>
        </div>
      `;
      container.appendChild(blockEl);
    });
    
    this.bindBlockEvents(container);
  },

  bindBlockEvents(container) {
    container.querySelectorAll('.block-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeBlockDefinition(btn.dataset.id);
      });
    });
    
    container.querySelectorAll('.block-name').forEach(input => {
      input.addEventListener('input', (e) => {
        this.updateBlockDefinition(e.target.dataset.id, 'name', e.target.value);
      });
    });
    
    container.querySelectorAll('.timer-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.updateBlockDefinition(btn.dataset.id, 'timerType', btn.dataset.type);
      });
    });
    
    container.querySelectorAll('.block-duration').forEach(input => {
      input.addEventListener('input', (e) => {
        this.updateBlockDefinition(e.target.dataset.id, 'duration', parseInt(e.target.value) || 30);
      });
    });
    
    container.querySelectorAll('.block-color').forEach(input => {
      input.addEventListener('input', (e) => {
        this.updateBlockDefinition(e.target.dataset.id, 'color', e.target.value);
        e.target.parentElement.querySelector('.color-preview-box').style.backgroundColor = e.target.value;
      });
    });
  },

  // --- Timeline ---

  showAddBlockModal(targetLoopId = null) {
    if (this.blocks.length === 0) {
      Modal.show('No Blocks', 'Please create at least one block first.', 'OK', false);
      return;
    }
    
    const modal = document.getElementById('block-picker-modal');
    const list = document.getElementById('block-picker-list');
    modal.dataset.targetLoop = targetLoopId || '';
    
    list.innerHTML = '';
    this.blocks.forEach(block => {
      const item = document.createElement('button');
      item.className = 'block-picker-item';
      item.innerHTML = `
        <div class="block-picker-color" style="background-color: ${block.color}"></div>
        <span>${block.name}</span>
        <span class="block-picker-duration">${block.timerType === 'click' ? 'Click' : block.duration + 's'}</span>
      `;
      item.addEventListener('click', () => {
        this.addBlockToTimeline(block.id, targetLoopId);
        this.hideAddBlockModal();
      });
      list.appendChild(item);
    });
    
    modal.classList.remove('hidden');
  },

  hideAddBlockModal() {
    document.getElementById('block-picker-modal').classList.add('hidden');
  },

  addBlockToTimeline(blockId, targetLoopId = null) {
    const timelineItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: 'block',
      blockId: blockId,
      skipOnLastLoop: false
    };
    
    if (targetLoopId) {
      const loop = this.timeline.find(item => item.id === targetLoopId);
      if (loop) {
        loop.items.push(timelineItem);
      }
    } else {
      this.timeline.push(timelineItem);
    }
    
    this.renderTimeline();
  },

  addTimelineLoop() {
    this.timeline.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: 'loop',
      repetitions: 3,
      items: []
    });
    this.renderTimeline();
  },

  removeTimelineItem(id, parentLoopId = null) {
    if (parentLoopId) {
      const loop = this.timeline.find(item => item.id === parentLoopId);
      if (loop) {
        loop.items = loop.items.filter(item => item.id !== id);
      }
    } else {
      this.timeline = this.timeline.filter(item => item.id !== id);
    }
    this.renderTimeline();
  },

  updateLoopRepetitions(loopId, value) {
    const loop = this.timeline.find(item => item.id === loopId);
    if (loop) {
      loop.repetitions = Math.max(2, Math.min(100, parseInt(value) || 2));
    }
  },

  toggleSkipOnLastLoop(itemId, parentLoopId) {
    const loop = this.timeline.find(item => item.id === parentLoopId);
    if (loop) {
      const item = loop.items.find(i => i.id === itemId);
      if (item) {
        item.skipOnLastLoop = !item.skipOnLastLoop;
        this.renderTimeline();
      }
    }
  },

  getBlockById(id) {
    return this.blocks.find(b => b.id === id);
  },

  renderTimeline() {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '';
    
    if (this.timeline.length === 0) {
      container.innerHTML = '<div class="empty-hint-card">No timeline items. Add blocks or loops to build your workout sequence.</div>';
      return;
    }
    
    this.timeline.forEach((item, index) => {
      if (item.type === 'block') {
        container.appendChild(this.createTimelineBlockElement(item, null, index));
      } else if (item.type === 'loop') {
        container.appendChild(this.createTimelineLoopElement(item, index));
      }
    });

    // Setup main timeline as drop zone
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      // Handle drop at end of timeline if not dropped on a specific item
      if (this.draggedItem && e.target === container) {
        this.moveTimelineItemToEnd(this.draggedItem.id, this.draggedParent);
      }
    });
  },

  createTimelineBlockElement(item, parentLoopId, index) {
    const block = this.getBlockById(item.blockId);
    if (!block) return document.createElement('div');
    
    const el = document.createElement('div');
    el.className = `timeline-block ${item.skipOnLastLoop ? 'skip-last' : ''}`;
    el.draggable = true;
    el.dataset.id = item.id;
    el.dataset.parent = parentLoopId || '';
    
    let skipCheckbox = '';
    if (parentLoopId) {
      skipCheckbox = `
        <label class="skip-checkbox-label" title="Skip on last loop iteration">
          <input type="checkbox" class="skip-checkbox-input" ${item.skipOnLastLoop ? 'checked' : ''} data-id="${item.id}" data-parent="${parentLoopId}">
          <span class="skip-checkbox-custom"></span>
          <span class="skip-checkbox-text">Skip last</span>
        </label>
      `;
    }
    
    el.innerHTML = `
      <div class="drag-handle">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="2"></circle>
          <circle cx="15" cy="6" r="2"></circle>
          <circle cx="9" cy="12" r="2"></circle>
          <circle cx="15" cy="12" r="2"></circle>
          <circle cx="9" cy="18" r="2"></circle>
          <circle cx="15" cy="18" r="2"></circle>
        </svg>
      </div>
      <div class="timeline-block-color" style="background-color: ${block.color}"></div>
      <div class="timeline-block-info">
        <span class="timeline-block-name">${block.name}</span>
        <span class="timeline-block-duration">${block.timerType === 'click' ? 'Tap to Continue' : block.duration + 's'}</span>
      </div>
      ${skipCheckbox}
      <button type="button" class="timeline-remove" data-id="${item.id}" data-parent="${parentLoopId || ''}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    
    // Drag events
    el.addEventListener('dragstart', (e) => {
      this.draggedItem = item;
      this.draggedParent = parentLoopId;
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      this.draggedItem = null;
      this.draggedParent = null;
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });
    
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.draggedItem && this.draggedItem.id !== item.id) {
        el.classList.add('drag-over');
      }
    });
    
    el.addEventListener('dragleave', () => {
      el.classList.remove('drag-over');
    });
    
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drag-over');
      if (this.draggedItem && this.draggedItem.id !== item.id) {
        this.moveTimelineItem(this.draggedItem.id, this.draggedParent, item.id, parentLoopId);
      }
    });
    
    // Remove button
    el.querySelector('.timeline-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = e.target.closest('.timeline-remove').dataset.parent;
      this.removeTimelineItem(item.id, parent || null);
    });
    
    // Skip checkbox
    const checkbox = el.querySelector('.skip-checkbox-input');
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        this.toggleSkipOnLastLoop(item.id, parentLoopId);
      });
    }
    
    return el;
  },

  moveTimelineItem(draggedId, draggedParentId, targetId, targetParentId) {
    // Get source array and item
    let sourceArray = draggedParentId 
      ? this.timeline.find(item => item.id === draggedParentId)?.items 
      : this.timeline;
    
    if (!sourceArray) return;
    
    const draggedIndex = sourceArray.findIndex(item => item.id === draggedId);
    if (draggedIndex === -1) return;
    
    const [draggedItem] = sourceArray.splice(draggedIndex, 1);
    
    // Get target array
    let targetArray = targetParentId 
      ? this.timeline.find(item => item.id === targetParentId)?.items 
      : this.timeline;
    
    if (!targetArray) {
      // If target doesn't exist, put item back
      sourceArray.splice(draggedIndex, 0, draggedItem);
      return;
    }
    
    const targetIndex = targetArray.findIndex(item => item.id === targetId);
    if (targetIndex === -1) {
      targetArray.push(draggedItem);
    } else {
      targetArray.splice(targetIndex, 0, draggedItem);
    }
    
    this.renderTimeline();
  },

  moveTimelineItemToEnd(draggedId, draggedParentId) {
    // Get source array and remove item
    let sourceArray = draggedParentId 
      ? this.timeline.find(item => item.id === draggedParentId)?.items 
      : this.timeline;
    
    if (!sourceArray) return;
    
    const draggedIndex = sourceArray.findIndex(item => item.id === draggedId);
    if (draggedIndex === -1) return;
    
    const [draggedItem] = sourceArray.splice(draggedIndex, 1);
    
    // Add to end of main timeline
    this.timeline.push(draggedItem);
    
    this.renderTimeline();
  },

  createTimelineLoopElement(loop, index) {
    const el = document.createElement('div');
    el.className = 'timeline-loop';
    el.draggable = true;
    el.dataset.id = loop.id;
    el.dataset.type = 'loop';
    
    // Loop drag events
    el.addEventListener('dragstart', (e) => {
      // Only start drag if we're dragging the loop itself, not a block inside
      if (e.target !== el) return;
      this.draggedItem = loop;
      this.draggedParent = null;
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      this.draggedItem = null;
      this.draggedParent = null;
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });
    
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      // Only show drag-over if dragging a different top-level item
      if (this.draggedItem && this.draggedItem.id !== loop.id && !this.draggedParent) {
        el.classList.add('drag-over');
      }
    });
    
    el.addEventListener('dragleave', (e) => {
      if (!el.contains(e.relatedTarget)) {
        el.classList.remove('drag-over');
      }
    });
    
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove('drag-over');
      // Only accept drops from main timeline items (not from inside loops)
      if (this.draggedItem && this.draggedItem.id !== loop.id && !this.draggedParent) {
        this.moveTimelineItem(this.draggedItem.id, null, loop.id, null);
      }
    });
    
    el.innerHTML = `
      <div class="timeline-loop-header">
        <div class="drag-handle loop-drag-handle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="2"></circle>
            <circle cx="15" cy="6" r="2"></circle>
            <circle cx="9" cy="12" r="2"></circle>
            <circle cx="15" cy="12" r="2"></circle>
            <circle cx="9" cy="18" r="2"></circle>
            <circle cx="15" cy="18" r="2"></circle>
          </svg>
        </div>
        <div class="loop-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
          </svg>
        </div>
        <span class="loop-label">Loop</span>
        <div class="loop-reps-control">
          <button type="button" class="loop-reps-btn minus" data-id="${loop.id}">-</button>
          <input type="number" class="loop-reps-input" data-id="${loop.id}" value="${loop.repetitions}" min="2" max="100">
          <button type="button" class="loop-reps-btn plus" data-id="${loop.id}">+</button>
          <span class="loop-reps-label">times</span>
        </div>
        <button type="button" class="timeline-remove" data-id="${loop.id}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="timeline-loop-content" id="loop-content-${loop.id}">
        ${loop.items.length === 0 ? '<p class="loop-empty-hint">Add blocks to this loop</p>' : ''}
      </div>
      <button type="button" class="loop-add-block-btn" data-loop="${loop.id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Block
      </button>
    `;
    
    // Add blocks inside loop
    const contentArea = el.querySelector(`#loop-content-${loop.id}`);
    if (loop.items.length > 0) {
      contentArea.innerHTML = '';
      loop.items.forEach((item, i) => {
        contentArea.appendChild(this.createTimelineBlockElement(item, loop.id, i));
      });
    }
    
    // Drop zone for loop content
    contentArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.draggedItem && this.draggedParent !== loop.id) {
        contentArea.classList.add('drag-over');
      }
    });
    
    contentArea.addEventListener('dragleave', (e) => {
      if (!contentArea.contains(e.relatedTarget)) {
        contentArea.classList.remove('drag-over');
      }
    });
    
    contentArea.addEventListener('drop', (e) => {
      e.preventDefault();
      contentArea.classList.remove('drag-over');
      if (this.draggedItem && loop.items.length === 0) {
        // Move into empty loop
        this.moveTimelineItem(this.draggedItem.id, this.draggedParent, null, loop.id);
      }
    });
    
    // Bind events
    el.querySelector('.timeline-remove').addEventListener('click', () => {
      this.removeTimelineItem(loop.id, null);
    });
    
    el.querySelector('.loop-add-block-btn').addEventListener('click', () => {
      this.showAddBlockModal(loop.id);
    });
    
    const repsInput = el.querySelector('.loop-reps-input');
    repsInput.addEventListener('input', (e) => {
      this.updateLoopRepetitions(loop.id, e.target.value);
    });
    
    el.querySelector('.loop-reps-btn.minus').addEventListener('click', () => {
      const newVal = Math.max(2, loop.repetitions - 1);
      this.updateLoopRepetitions(loop.id, newVal);
      repsInput.value = newVal;
    });
    
    el.querySelector('.loop-reps-btn.plus').addEventListener('click', () => {
      const newVal = Math.min(100, loop.repetitions + 1);
      this.updateLoopRepetitions(loop.id, newVal);
      repsInput.value = newVal;
    });
    
    return el;
  },

  // --- Save ---

  saveWorkout() {
    let name = document.getElementById('workout-name').value.trim();
    
    // Default name if empty
    if (!name) {
      name = 'New Workout';
    }
    
    if (this.timeline.length === 0) {
      Modal.show('Empty Timeline', 'Please add at least one block to the timeline.', 'OK', false);
      return;
    }
    
    const workout = {
      name,
      icon: this.selectedIcon,
      blocks: JSON.parse(JSON.stringify(this.blocks)),
      timeline: JSON.parse(JSON.stringify(this.timeline))
    };
    
    if (this.isEditing && this.currentWorkout) {
      Storage.updateWorkout(this.currentWorkout.id, workout);
    } else {
      Storage.addWorkout(workout);
    }
    
    App.showPage('main-page');
    App.renderWorkoutList();
  },

  async handleBack() {
    const confirmed = await Modal.show(
      'Discard Changes?',
      'Are you sure you want to go back? Any unsaved changes will be lost.',
      'Discard',
      true
    );
    if (confirmed) {
      App.showPage('main-page');
    }
  }
};
