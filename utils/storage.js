// ReadSmart Storage Utilities
// Handles IndexedDB for saved content

const DB_NAME = 'ReadSmartDB';
const DB_VERSION = 1;
const STORE_NAME = 'savedContent';

let db = null;

// Initialize IndexedDB
async function initDB() {
  if (db) return db;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('[ReadSmart] IndexedDB error:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      db = request.result;
      console.log('[ReadSmart] IndexedDB initialized');
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      console.log('[ReadSmart] Creating object store');
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });
        
        // Create indexes for efficient querying
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('source', 'source', { unique: false });
        objectStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        objectStore.createIndex('url', 'url', { unique: false });
      }
    };
  });
}

// Save content to library
async function saveToLibrary(content) {
  try {
    await initDB();
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    
    const item = {
      ...content,
      date: content.date || new Date().toISOString(),
      source: content.source || window.location.hostname,
      url: content.url || window.location.href
    };
    
    return new Promise((resolve, reject) => {
      const request = objectStore.add(item);
      
      request.onsuccess = () => {
        console.log('[ReadSmart] Saved to library:', request.result);
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('[ReadSmart] Save error:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[ReadSmart] SaveToLibrary error:', error);
    throw error;
  }
}

// Get all saved items
async function getAllSaved() {
  try {
    await initDB();
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = objectStore.getAll();
      
      request.onsuccess = () => {
        const items = request.result;
        // Sort by date, newest first
        items.sort((a, b) => new Date(b.date) - new Date(a.date));
        resolve(items);
      };
      
      request.onerror = () => {
        console.error('[ReadSmart] GetAll error:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[ReadSmart] GetAllSaved error:', error);
    return [];
  }
}

// Get a single saved item by ID
async function getSavedById(id) {
  try {
    await initDB();
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = objectStore.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ReadSmart] GetSavedById error:', error);
    return null;
  }
}

// Delete saved item
async function deleteSaved(id) {
  try {
    await initDB();
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = objectStore.delete(id);
      
      request.onsuccess = () => {
        console.log('[ReadSmart] Deleted item:', id);
        resolve();
      };
      
      request.onerror = () => {
        console.error('[ReadSmart] Delete error:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[ReadSmart] DeleteSaved error:', error);
    throw error;
  }
}

// Update saved item
async function updateSaved(id, updates) {
  try {
    await initDB();
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    
    // First get the existing item
    const getRequest = objectStore.get(id);
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (!item) {
          reject(new Error('Item not found'));
          return;
        }
        
        // Merge updates
        const updatedItem = { ...item, ...updates, id: id };
        
        const putRequest = objectStore.put(updatedItem);
        putRequest.onsuccess = () => resolve(updatedItem);
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error('[ReadSmart] UpdateSaved error:', error);
    throw error;
  }
}

// Search library
async function searchLibrary(query) {
  try {
    const allItems = await getAllSaved();
    
    if (!query || query.trim() === '') {
      return allItems;
    }
    
    const lowerQuery = query.toLowerCase();
    
    return allItems.filter(item => {
      const searchText = `
        ${item.text || ''} 
        ${item.summary || ''} 
        ${item.pageTitle || ''} 
        ${item.notes || ''} 
        ${item.tags?.join(' ') || ''}
      `.toLowerCase();
      
      return searchText.includes(lowerQuery);
    });
  } catch (error) {
    console.error('[ReadSmart] SearchLibrary error:', error);
    return [];
  }
}

// Get items by source (e.g., 'linkedin.com')
async function getItemsBySource(source) {
  try {
    await initDB();
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const index = objectStore.index('source');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(source);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ReadSmart] GetItemsBySource error:', error);
    return [];
  }
}

// Get items by tag
async function getItemsByTag(tag) {
  try {
    await initDB();
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const index = objectStore.index('tags');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(tag);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ReadSmart] GetItemsByTag error:', error);
    return [];
  }
}

// Get recent items (last N items)
async function getRecentItems(count = 5) {
  try {
    const allItems = await getAllSaved();
    return allItems.slice(0, count);
  } catch (error) {
    console.error('[ReadSmart] GetRecentItems error:', error);
    return [];
  }
}

// Clear all saved items (use with caution!)
async function clearAllSaved() {
  try {
    await initDB();
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = objectStore.clear();
      
      request.onsuccess = () => {
        console.log('[ReadSmart] All items cleared');
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ReadSmart] ClearAllSaved error:', error);
    throw error;
  }
}

// Export library as JSON
async function exportLibrary() {
  try {
    const allItems = await getAllSaved();
    return JSON.stringify(allItems, null, 2);
  } catch (error) {
    console.error('[ReadSmart] ExportLibrary error:', error);
    throw error;
  }
}

// Import library from JSON
async function importLibrary(jsonData) {
  try {
    const items = JSON.parse(jsonData);
    
    if (!Array.isArray(items)) {
      throw new Error('Invalid import data format');
    }
    
    await initDB();
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    
    let imported = 0;
    
    for (const item of items) {
      // Remove id to let DB auto-generate new ones
      const { id, ...itemData } = item;
      
      try {
        await new Promise((resolve, reject) => {
          const request = objectStore.add(itemData);
          request.onsuccess = () => {
            imported++;
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.warn('[ReadSmart] Skipped item during import:', error);
      }
    }
    
    console.log(`[ReadSmart] Imported ${imported} items`);
    return imported;
  } catch (error) {
    console.error('[ReadSmart] ImportLibrary error:', error);
    throw error;
  }
}

// Get library statistics
async function getLibraryStats() {
  try {
    const allItems = await getAllSaved();
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    return {
      total: allItems.length,
      thisWeek: allItems.filter(item => new Date(item.date) > weekAgo).length,
      thisMonth: allItems.filter(item => new Date(item.date) > monthAgo).length,
      timeSaved: allItems.length * 3, // Estimate 3 minutes saved per item
      sources: [...new Set(allItems.map(item => item.source))],
      tags: [...new Set(allItems.flatMap(item => item.tags || []))]
    };
  } catch (error) {
    console.error('[ReadSmart] GetLibraryStats error:', error);
    return {
      total: 0,
      thisWeek: 0,
      thisMonth: 0,
      timeSaved: 0,
      sources: [],
      tags: []
    };
  }
}

// Make functions available globally for content scripts
if (typeof window !== 'undefined') {
  window.readSmartStorage = {
    saveToLibrary,
    getAllSaved,
    getSavedById,
    deleteSaved,
    updateSaved,
    searchLibrary,
    getItemsBySource,
    getItemsByTag,
    getRecentItems,
    clearAllSaved,
    exportLibrary,
    importLibrary,
    getLibraryStats
  };
}