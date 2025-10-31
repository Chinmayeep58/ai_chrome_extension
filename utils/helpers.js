// ReadSmart Helper Utilities

// Show toast notification
function showToast(message, duration = 3000) {
  // Remove existing toast if any
  const existingToast = document.querySelector('.readsmart-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = 'readsmart-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Truncate text to specified length
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Format date relative to now
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  
  return date.toLocaleDateString();
}

// Format date as readable string
function formatDateFull(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
    return true;
  } catch (error) {
    console.error('[ReadSmart] Copy failed:', error);
    // Fallback method
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Copied to clipboard!');
      return true;
    } catch (err) {
      console.error('[ReadSmart] Fallback copy failed:', err);
      showToast('Failed to copy', 2000);
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// Get selected text from page
function getSelectedText() {
  return window.getSelection().toString().trim();
}

// Check if element is visible
function isElementVisible(element) {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.offsetWidth > 0 &&
         element.offsetHeight > 0;
}

// Detect if current page is LinkedIn
function isLinkedIn() {
  return window.location.hostname.includes('linkedin.com');
}

// Detect if current page is Twitter/X
function isTwitter() {
  return window.location.hostname.includes('twitter.com') || 
         window.location.hostname.includes('x.com');
}

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
}

// Clean text (remove extra spaces, newlines, etc.)
function cleanText(text) {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim();
}

// Estimate reading time (words per minute)
function estimateReadingTime(text, wpm = 200) {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wpm);
  return minutes;
}

// Count words in text
function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

// Debounce function (useful for search inputs)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Sanitize HTML (basic XSS prevention)
function sanitizeHTML(html) {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Check if device is mobile
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Get cursor position for floating menu
function getCursorPosition(event) {
  return {
    x: event.clientX + window.scrollX,
    y: event.clientY + window.scrollY
  };
}

// Get selection bounding rect
function getSelectionRect() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return null;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  return {
    x: rect.left + rect.width / 2 + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height
  };
}

// Wait for element to appear in DOM
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// Create element with attributes
function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key.startsWith('on')) {
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      element.appendChild(child);
    }
  });
  
  return element;
}

// Load settings from Chrome storage
async function loadSettings() {
  const defaults = {
    summaryFormat: 'bullets',
    translationLanguage: 'es',
    autoBookmark: false,
    linkedinAutoSummarize: true,
    showWordCount: true
  };
  
  try {
    const settings = await chrome.storage.sync.get(defaults);
    return settings;
  } catch (error) {
    console.error('[ReadSmart] Error loading settings:', error);
    return defaults;
  }
}

// Save settings to Chrome storage
async function saveSettings(settings) {
  try {
    await chrome.storage.sync.set(settings);
    return true;
  } catch (error) {
    console.error('[ReadSmart] Error saving settings:', error);
    return false;
  }
}

// Validate email format
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validate URL format
function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Language name mappings
const LANGUAGE_NAMES = {
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'hi': 'Hindi',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ar': 'Arabic',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'it': 'Italian',
  'ko': 'Korean',
  'nl': 'Dutch',
  'pl': 'Polish',
  'tr': 'Turkish',
  'vi': 'Vietnamese'
};

function getLanguageName(code) {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

// Make helpers available globally
if (typeof window !== 'undefined') {
  window.readSmartHelpers = {
    showToast,
    truncateText,
    formatDate,
    formatDateFull,
    copyToClipboard,
    getSelectedText,
    isElementVisible,
    isLinkedIn,
    isTwitter,
    extractDomain,
    cleanText,
    estimateReadingTime,
    countWords,
    debounce,
    generateId,
    sanitizeHTML,
    formatNumber,
    isMobileDevice,
    getCursorPosition,
    getSelectionRect,
    waitForElement,
    createElement,
    loadSettings,
    saveSettings,
    isValidEmail,
    isValidURL,
    getLanguageName,
    LANGUAGE_NAMES
  };
}