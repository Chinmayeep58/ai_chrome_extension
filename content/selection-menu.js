// ReadSmart Selection Menu - Core Functionality

window.readSmartMenu = {
  currentText: '',
  currentPosition: null,
  
  show: function(text, position) {
    this.currentText = text;
    this.currentPosition = position;
    
    // Remove existing menu if any
    this.hide();
    
    // Create menu
    const menu = this.createMenu();
    document.body.appendChild(menu);
    
    // Position menu
    this.positionMenu(menu, position);
  },
  
  hide: function() {
    const existingMenu = document.getElementById('readsmart-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
  },
  
  createMenu: function() {
    const menu = document.createElement('div');
    menu.id = 'readsmart-menu';
    menu.className = 'readsmart-floating-menu';
    
    menu.innerHTML = `
      <div class="readsmart-menu-buttons">
        <button data-action="summarize" title="Summarize">
          <span class="icon">📝</span>
          <span class="label">Summarize</span>
        </button>
        <button data-action="rewrite" title="Rewrite">
          <span class="icon">🔄</span>
          <span class="label">Rewrite</span>
        </button>
        <button data-action="translate" title="Translate">
          <span class="icon">🌐</span>
          <span class="label">Translate</span>
        </button>
        <button data-action="proofread" title="Proofread">
          <span class="icon">✓</span>
          <span class="label">Check</span>
        </button>
        <button data-action="save" title="Save">
          <span class="icon">💾</span>
          <span class="label">Save</span>
        </button>
      </div>
      <div id="readsmart-result" class="readsmart-result hidden"></div>
    `;
    
    // Add event listeners
    const buttons = menu.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        this.handleAction(action);
      });
    });
    
    return menu;
  },
  
  positionMenu: function(menu, position) {
    // Position above the selection
    menu.style.left = `${position.x}px`;
    menu.style.top = `${position.y - 10}px`;
    
    // Check if menu goes off screen
    setTimeout(() => {
      const rect = menu.getBoundingClientRect();
      
      // Adjust if off right edge
      if (rect.right > window.innerWidth) {
        menu.style.left = `${window.innerWidth - rect.width - 10}px`;
      }
      
      // Adjust if off left edge
      if (rect.left < 0) {
        menu.style.left = '10px';
      }
      
      // Adjust if off top edge
      if (rect.top < 0) {
        menu.style.top = `${position.y + position.height + 10}px`;
        menu.style.transform = 'translateX(-50%)';
      }
    }, 0);
  },
  
  handleAction: async function(action) {
    console.log('[ReadSmart] Action:', action, 'Text length:', this.currentText.length);
    
    const resultDiv = document.getElementById('readsmart-result');
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = '<div class="loading">🔄 Processing with Chrome AI...</div>';
    
    try {
      let result;
      
      switch(action) {
        case 'summarize':
          result = await this.processSummarize();
          break;
        case 'rewrite':
          result = await this.processRewrite();
          break;
        case 'translate':
          result = await this.processTranslate();
          break;
        case 'proofread':
          result = await this.processProofread();
          break;
        case 'save':
          result = await this.processSave();
          break;
        default:
          throw new Error('Unknown action');
      }
      
      this.displayResult(result, action);
    } catch (error) {
      console.error('[ReadSmart] Error:', error);
      resultDiv.innerHTML = `<div class="error">❌ ${error.message}</div>`;
    }
  },
  
  processSummarize: async function() {
    // Show format options first
    const format = await this.showOptions('Choose format:', ['Bullets', 'Paragraph', 'One-liner']);
    
    // Send to background script
    const response = await chrome.runtime.sendMessage({
      action: 'processText',
      type: 'summarize',
      text: this.currentText,
      options: { format: format.toLowerCase() }
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response;
  },
  
  processRewrite: async function() {
    const tone = await this.showOptions('Choose tone:', ['Simple', 'Formal', 'Casual']);
    
    const response = await chrome.runtime.sendMessage({
      action: 'processText',
      type: 'rewrite',
      text: this.currentText,
      options: { tone: tone.toLowerCase() }
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response;
  },
  
  processTranslate: async function() {
    const language = await this.showOptions('Translate to:', ['Spanish', 'French', 'German', 'Hindi', 'Chinese']);
    
    const languageCodes = {
      'Spanish': 'es',
      'French': 'fr',
      'German': 'de',
      'Hindi': 'hi',
      'Chinese': 'zh'
    };
    
    const response = await chrome.runtime.sendMessage({
      action: 'processText',
      type: 'translate',
      text: this.currentText,
      options: { targetLanguage: languageCodes[language] }
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response;
  },
  
  processProofread: async function() {
    const response = await chrome.runtime.sendMessage({
      action: 'processText',
      type: 'proofread',
      text: this.currentText
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response;
  },
  
  processSave: async function() {
    // Simple save for now
    if (typeof window.readSmartStorage !== 'undefined') {
      const saved = await window.readSmartStorage.saveToLibrary({
        text: this.currentText,
        pageTitle: document.title,
        url: window.location.href
      });
      
      return {
        success: true,
        output: 'Content saved to library!',
        id: saved
      };
    } else {
      throw new Error('Storage not available');
    }
  },
  
  showOptions: function(title, options) {
    return new Promise((resolve) => {
      const resultDiv = document.getElementById('readsmart-result');
      
      const optionsHTML = options.map(opt => 
        `<button class="option-btn" data-value="${opt}">${opt}</button>`
      ).join('');
      
      resultDiv.innerHTML = `
        <div style="text-align: center;">
          <div style="margin-bottom: 8px; font-weight: 600;">${title}</div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${optionsHTML}
          </div>
        </div>
      `;
      
      resultDiv.querySelectorAll('.option-btn').forEach(btn => {
        btn.style.padding = '8px 12px';
        btn.style.border = '1px solid #e0e0e0';
        btn.style.background = 'white';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '13px';
        
        btn.addEventListener('click', () => {
          resolve(btn.dataset.value);
        });
        
        btn.addEventListener('mouseenter', () => {
          btn.style.background = '#f5f5f5';
        });
        
        btn.addEventListener('mouseleave', () => {
          btn.style.background = 'white';
        });
      });
    });
  },
  
  displayResult: function(result, action) {
    const resultDiv = document.getElementById('readsmart-result');
    
    const output = result.output || result.text || 'No result';
    const wordCount = window.readSmartHelpers.countWords(output);
    
    resultDiv.innerHTML = `
      <div class="result-header">
        <span class="result-title">${action.charAt(0).toUpperCase() + action.slice(1)} Result</span>
        <div class="result-actions">
          <button class="copy-btn" title="Copy">📋</button>
          <button class="close-btn" title="Close">✕</button>
        </div>
      </div>
      <div class="result-content">
        ${this.formatOutput(output, action)}
        ${action === 'summarize' ? `<div style="margin-top: 8px; font-size: 11px; color: #999;">${wordCount} words</div>` : ''}
      </div>
    `;
    
    // Copy button
    resultDiv.querySelector('.copy-btn').addEventListener('click', () => {
      window.readSmartHelpers.copyToClipboard(output);
    });
    
    // Close button
    resultDiv.querySelector('.close-btn').addEventListener('click', () => {
      this.hide();
    });
  },
  
  formatOutput: function(output, action) {
    // Format bullets if it's a summary
    if (action === 'summarize' && output.includes('\n')) {
      const lines = output.split('\n').filter(line => line.trim());
      return '<ul style="margin: 0; padding-left: 20px;">' + 
             lines.map(line => `<li>${line.replace(/^[•\-*]\s*/, '')}</li>`).join('') + 
             '</ul>';
    }
    
    return output.replace(/\n/g, '<br>');
  }
};

console.log('[ReadSmart] Selection menu loaded');