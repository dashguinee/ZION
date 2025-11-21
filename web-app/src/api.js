/**
 * API client for ZION Learning API
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.statusText}`);
  }

  return response.json();
}

export async function addSentence(data) {
  return fetchAPI('/api/corpus/add-sentence', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function detectPattern(sentence) {
  return fetchAPI('/api/pattern/detect', {
    method: 'POST',
    body: JSON.stringify({ sentence })
  });
}

export async function getStats() {
  return fetchAPI('/api/stats');
}

export async function getPendingVerification() {
  return fetchAPI('/api/corpus/pending-verification');
}

export async function verifySentence(sentenceId, verdict, correction, verifiedBy) {
  return fetchAPI('/api/corpus/verify', {
    method: 'POST',
    body: JSON.stringify({
      sentence_id: sentenceId,
      verdict,
      correction,
      verified_by: verifiedBy
    })
  });
}

export async function searchCorpus(query) {
  return fetchAPI(`/api/corpus/search?query=${encodeURIComponent(query)}`);
}
