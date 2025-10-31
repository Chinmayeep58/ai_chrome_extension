// ReadSmart Background Service Worker
// MOCK VERSION - Works without Chrome AI for testing

console.log('[ReadSmart] Background service worker loaded (MOCK MODE)');

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[ReadSmart] Received message:', request.action);
  
  if (request.action === 'processText') {
    handleTextProcessing(request)
      .then(sendResponse)
      .catch(error => {
        console.error('[ReadSmart] Error:', error);
        sendResponse({ error: error.message });
      });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'checkAIAvailability') {
    sendResponse({ 
      languageModel: true, 
      summarizer: true, 
      rewriter: true, 
      translator: true,
      mode: 'MOCK' 
    });
    return true;
  }
});

// Main text processing handler
async function handleTextProcessing(request) {
  const { type, text, options } = request;
  
  console.log(`[ReadSmart] Processing ${type} for text length: ${text.length}`);
  
  // Simulate processing delay (like real AI)
  await sleep(800);
  
  switch(type) {
    case 'summarize':
      return await summarizeText(text, options);
    case 'rewrite':
      return await rewriteText(text, options);
    case 'translate':
      return await translateText(text, options);
    case 'proofread':
      return await proofreadText(text);
    default:
      throw new Error('Unknown action type');
  }
}

// Mock Summarize
async function summarizeText(text, options = {}) {
  try {
    const { format = 'key-points' } = options;
    
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    let summary;
    
    if (format === 'bullets' || format === 'key-points') {
      // Generate bullet points based on sentences
      const numPoints = Math.min(3, sentences.length);
      const points = [];
      
      for (let i = 0; i < numPoints; i++) {
        const sentence = sentences[Math.floor(i * sentences.length / numPoints)].trim();
        if (sentence) {
          points.push(sentence.substring(0, 80) + (sentence.length > 80 ? '...' : ''));
        }
      }
      
      summary = points.map(p => `• ${p}`).join('\n');
      
    } else if (format === 'paragraph') {
      // Create a concise paragraph
      const firstSentence = sentences[0]?.trim() || '';
      const lastSentence = sentences[sentences.length - 1]?.trim() || '';
      summary = `${firstSentence} ${lastSentence}`.substring(0, 150) + '...';
      
    } else if (format === 'oneliner' || format === 'headline') {
      // Create a one-liner
      const firstSentence = sentences[0]?.trim() || text.substring(0, 100);
      summary = firstSentence.substring(0, 80) + (firstSentence.length > 80 ? '...' : '');
    }
    
    return {
      success: true,
      output: summary || 'Summary generated',
      format: format,
      note: '[MOCK AI] Using simulated summarization'
    };
  } catch (error) {
    console.error('[ReadSmart] Summarize error:', error);
    throw new Error(`Summarization failed: ${error.message}`);
  }
}

// Mock Rewrite
async function rewriteText(text, options = {}) {
  try {
    const { tone = 'simple' } = options;
    
    let rewritten = text;
    
    if (tone === 'simple') {
      // Simplify: shorter sentences, simpler words
      rewritten = text
        .replace(/\b(utilize|implementation|facilitate)\b/gi, match => {
          const simple = { utilize: 'use', implementation: 'use', facilitate: 'help' };
          return simple[match.toLowerCase()] || match;
        })
        .replace(/,\s*which\s+/g, '. This ')
        .substring(0, text.length * 0.9);
      
      rewritten = 'Here is a simpler version: ' + rewritten;
      
    } else if (tone === 'formal') {
      // Make more formal
      rewritten = text
        .replace(/\bdon't\b/g, 'do not')
        .replace(/\bcan't\b/g, 'cannot')
        .replace(/\bwon't\b/g, 'will not')
        .replace(/\bit's\b/g, 'it is');
      
      rewritten = 'Formal version: ' + rewritten;
      
    } else if (tone === 'casual') {
      // Make more casual
      rewritten = text
        .replace(/\bhowever\b/gi, 'but')
        .replace(/\btherefore\b/gi, 'so')
        .replace(/\badditionally\b/gi, 'also');
      
      rewritten = 'Casual version: ' + rewritten;
    }
    
    return {
      success: true,
      output: rewritten,
      tone: tone,
      note: '[MOCK AI] Using simulated rewriting'
    };
  } catch (error) {
    console.error('[ReadSmart] Rewrite error:', error);
    throw new Error(`Rewriting failed: ${error.message}`);
  }
}

// Mock Translate
async function translateText(text, options = {}) {
  try {
    const { targetLanguage = 'es' } = options;
    
    const languageNames = {
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'hi': 'Hindi',
      'zh': 'Chinese'
    };
    
    const langName = languageNames[targetLanguage] || targetLanguage;
    
    // Mock translation with placeholder
    const translated = `[${langName} translation of: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"]`;
    
    // Add some realistic-looking text
    const mockTranslations = {
      'es': 'Este es el texto traducido al español. ',
      'fr': 'Ceci est le texte traduit en français. ',
      'de': 'Dies ist der ins Deutsche übersetzte Text. ',
      'hi': 'यह हिंदी में अनुवादित पाठ है। ',
      'zh': '这是翻译成中文的文本。 '
    };
    
    const mockPrefix = mockTranslations[targetLanguage] || '';
    
    return {
      success: true,
      output: mockPrefix + translated,
      targetLanguage: targetLanguage,
      note: '[MOCK AI] Using simulated translation'
    };
  } catch (error) {
    console.error('[ReadSmart] Translation error:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

// Mock Proofread
async function proofreadText(text) {
  try {
    // Simple mock corrections
    let corrected = text
      .replace(/\bteh\b/g, 'the')
      .replace(/\brecieve\b/g, 'receive')
      .replace(/\boccured\b/g, 'occurred')
      .replace(/\bwich\b/g, 'which')
      .replace(/\byour\b(?=\s+(going|doing))/g, "you're")
      .replace(/\bits\b(?=\s+a\b)/g, "it's");
    
    // If no changes, note that
    if (corrected === text) {
      corrected = text + '\n\n✓ No errors found!';
    } else {
      corrected = '✓ Corrected version:\n\n' + corrected;
    }
    
    return {
      success: true,
      output: corrected,
      original: text,
      note: '[MOCK AI] Using simulated proofreading'
    };
  } catch (error) {
    console.error('[ReadSmart] Proofread error:', error);
    throw new Error(`Proofreading failed: ${error.message}`);
  }
}

// Helper: Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[ReadSmart] Extension installed! Running in MOCK MODE (for testing without Chrome AI)');
    console.log('[ReadSmart] To use real Chrome AI, enable AI flags in chrome://flags');
  }
});

console.log('[ReadSmart] Ready! Select text on any webpage to test.');