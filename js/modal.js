// Reusable modal system

const Modal = {
  resolveCallback: null,

  init() {
    document.getElementById('confirm-modal-cancel').addEventListener('click', () => {
      this.resolve(false);
    });
    
    document.getElementById('confirm-modal-ok').addEventListener('click', () => {
      this.resolve(true);
    });
    
    document.getElementById('confirm-modal').addEventListener('click', (e) => {
      if (e.target.id === 'confirm-modal') {
        this.resolve(false);
      }
    });
  },

  show(title, message, confirmText = 'Confirm', isDanger = true) {
    return new Promise((resolve) => {
      this.resolveCallback = resolve;
      
      document.getElementById('confirm-modal-title').textContent = title;
      document.getElementById('confirm-modal-message').textContent = message;
      
      const okBtn = document.getElementById('confirm-modal-ok');
      okBtn.textContent = confirmText;
      okBtn.className = isDanger ? 'action-btn danger' : 'action-btn primary';
      
      document.getElementById('confirm-modal').classList.remove('hidden');
    });
  },

  resolve(value) {
    const callback = this.resolveCallback;
    this.resolveCallback = null;
    document.getElementById('confirm-modal').classList.add('hidden');
    if (callback) callback(value);
  },

  hide() {
    document.getElementById('confirm-modal').classList.add('hidden');
    this.resolveCallback = null;
  }
};
