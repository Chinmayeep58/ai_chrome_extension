// ReadSmart Content Script - Main Entry Point
console.log('[ReadSmart] Content script loaded on:', window.location.hostname);

// Wait for page to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReadSmart);
} else {
  initReadSmart();
}

function initReadSmart() {
  console.log('[ReadSmart] Initializing...');
  
  // Set up text selection listeners
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('touchend', handleTextSelection);
  
  // Click outside to hide menu
  document.addEventListener('mousedown', (e) => {
    const menu = document.getElementById('readsmart-menu');
    if (menu && !menu.contains(e.target)) {
      hideSelectionMenu();
    }
  });
  
  // Initialize LinkedIn features if on LinkedIn
  if (window.readSmartHelpers && window.readSmartHelpers.isLinkedIn()) {
    console.log('[ReadSmart] LinkedIn detected, initializing LinkedIn features');
    if (typeof initLinkedInFeatures === 'function') {
      // Wait a bit for LinkedIn's dynamic content to load
      setTimeout(initLinkedInFeatures, 2000);
    }
  }
  
  console.log('[ReadSmart] Initialized successfully');
}

// Handle text selection
function handleTextSelection(e) {
  // Small delay to ensure selection is complete
  setTimeout(() => {
    const selectedText = window.readSmartHelpers.getSelectedText();
    
    // Only show menu if sufficient text is selected
    if (selectedText && selectedText.length >= 10) {
      const rect = window.readSmartHelpers.getSelectionRect();
      if (rect) {
        showSelectionMenu(selectedText, rect);
      }
    } else {
      hideSelectionMenu();
    }
  }, 10);
}

// Show selection menu
function showSelectionMenu(text, position) {
  // This function is defined in selection-menu.js
  if (typeof window.readSmartMenu !== 'undefined') {
    window.readSmartMenu.show(text, position);
  }
}

// Hide selection menu
function hideSelectionMenu() {
  if (typeof window.readSmartMenu !== 'undefined') {
    window.readSmartMenu.hide();
  }
}

// Listen for keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl + Shift + S to summarize selected text
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    const selectedText = window.readSmartHelpers.getSelectedText();
    if (selectedText && selectedText.length >= 10) {
      const rect = window.readSmartHelpers.getSelectionRect();
      if (rect) {
        showSelectionMenu(selectedText, rect);
        // Auto-trigger summarize
        setTimeout(() => {
          const summarizeBtn = document.querySelector('[data-action="summarize"]');
          if (summarizeBtn) summarizeBtn.click();
        }, 100);
      }
    }
  }
  
  // Escape to hide menu
  if (e.key === 'Escape') {
    hideSelectionMenu();
  }
});

console.log('[ReadSmart] Content script ready. Select text to see AI options!');