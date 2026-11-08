/**
 * RealtorScope - Live Search & Web UI for Realtors Research Data
 * Built for GitHub Pages (100% static, client-side, zero backend required)
 */

// Configuration
const CONFIG = {
  SHEET_ID: '1w7GbikvxTk7eJoNONTOsaHn3M7OzuLrJ',
  SHEET_NAME: 'All Results',
  STORAGE_KEY: 'realtor_scope_cache_v1',
  FALLBACK_CACHE: 'data_cache.json'
};

// Application State
const state = {
  allRealtors: [],
  filteredRealtors: [],
  lastSynced: null,
  isSyncing: false,
  filters: {
    search: '',
    activeOnly: false,
    licensedOnly: false,
    lastSoldOnly: false,
    highConfidenceOnly: false,
    hideJunk: true, // Default: Hide junk/test entries
    state: '',
    city: '',
    sort: 'default'
  },
  pagination: {
    page: 1,
    pageSize: 24
  }
};

// DOM Elements Cache
const dom = {};

document.addEventListener('DOMContentLoaded', () => {
  initDom();
  bindEvents();
  initData();
});

function initDom() {
  dom.searchInput = document.getElementById('searchInput');
  dom.clearSearchBtn = document.getElementById('clearSearchBtn');
  dom.syncBtn = document.getElementById('syncBtn');
  dom.syncIcon = document.getElementById('syncIcon');
  dom.syncBtnText = document.getElementById('syncBtnText');
  dom.syncStatusText = document.getElementById('syncStatusText');
  dom.syncTimestamp = document.getElementById('syncTimestamp');
  dom.syncStatusBadge = document.getElementById('syncStatusBadge');
  
  dom.filterActiveBtn = document.getElementById('filterActiveBtn');
  dom.filterLicensedBtn = document.getElementById('filterLicensedBtn');
  dom.filterLastSoldBtn = document.getElementById('filterLastSoldBtn');
  dom.filterConfidenceBtn = document.getElementById('filterConfidenceBtn');
  dom.filterHideJunkBtn = document.getElementById('filterHideJunkBtn');
  
  dom.stateSelect = document.getElementById('stateSelect');
  dom.citySelect = document.getElementById('citySelect');
  dom.sortSelect = document.getElementById('sortSelect');
  dom.resetFiltersBtn = document.getElementById('resetFiltersBtn');
  dom.clearAllFiltersBtn = document.getElementById('clearAllFiltersBtn');
  dom.exportCsvBtn = document.getElementById('exportCsvBtn');
  
  dom.realtorGrid = document.getElementById('realtorGrid');
  dom.loadingState = document.getElementById('loadingState');
  dom.emptyState = document.getElementById('emptyState');
  
  dom.displayedCount = document.getElementById('displayedCount');
  dom.totalCount = document.getElementById('totalCount');
  dom.metricActiveCount = document.getElementById('metricActiveCount');
  dom.metricPhoneCount = document.getElementById('metricPhoneCount');
  dom.metricLastSoldCount = document.getElementById('metricLastSoldCount');
  
  dom.pageSizeSelect = document.getElementById('pageSizeSelect');
  dom.prevPageBtn = document.getElementById('prevPageBtn');
  dom.nextPageBtn = document.getElementById('nextPageBtn');
  dom.currentPageNum = document.getElementById('currentPageNum');
  dom.totalPagesNum = document.getElementById('totalPagesNum');
  dom.paginationContainer = document.getElementById('paginationContainer');
  
  dom.detailModal = document.getElementById('detailModal');
  dom.modalBox = document.getElementById('modalBox');
  dom.closeModalBtn = document.getElementById('closeModalBtn');
  dom.modalCloseActionBtn = document.getElementById('modalCloseActionBtn');
  dom.modalAvatar = document.getElementById('modalAvatar');
  dom.modalName = document.getElementById('modalName');
  dom.modalBrokerage = document.getElementById('modalBrokerage');
  dom.modalBody = document.getElementById('modalBody');
  dom.modalMeta = document.getElementById('modalMeta');
  
  dom.toast = document.getElementById('toast');
  dom.toastIcon = document.getElementById('toastIcon');
  dom.toastMessage = document.getElementById('toastMessage');
}

/**
 * Event Bindings
 */
function bindEvents() {
  // Search with debounce
  let searchDebounceTimer = null;
  dom.searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    dom.clearSearchBtn.classList.toggle('hidden', !val);
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      state.filters.search = val.trim();
      state.pagination.page = 1;
      applyFilters();
    }, 120);
  });

  dom.clearSearchBtn.addEventListener('click', () => {
    dom.searchInput.value = '';
    dom.clearSearchBtn.classList.add('hidden');
    state.filters.search = '';
    state.pagination.page = 1;
    applyFilters();
    dom.searchInput.focus();
  });

  // Keyboard shortcut '/' to search
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== dom.searchInput) {
      e.preventDefault();
      dom.searchInput.focus();
      dom.searchInput.select();
    } else if (e.key === 'Escape') {
      closeModal();
    }
  });

  // Quick filter buttons
  dom.filterActiveBtn.addEventListener('click', () => toggleQuickFilter('active'));
  dom.filterLicensedBtn.addEventListener('click', () => toggleQuickFilter('licensed'));
  dom.filterLastSoldBtn.addEventListener('click', () => toggleQuickFilter('lastSold'));
  dom.filterConfidenceBtn.addEventListener('click', () => toggleQuickFilter('highConfidence'));
  dom.filterHideJunkBtn.addEventListener('click', () => toggleQuickFilter('hideJunk'));

  // Dropdown changes
  dom.stateSelect.addEventListener('change', (e) => {
    state.filters.state = e.target.value;
    updateCityDropdown();
    state.pagination.page = 1;
    applyFilters();
  });

  dom.citySelect.addEventListener('change', (e) => {
    state.filters.city = e.target.value;
    state.pagination.page = 1;
    applyFilters();
  });

  dom.sortSelect.addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    applyFilters();
  });

  dom.pageSizeSelect.addEventListener('change', (e) => {
    state.pagination.pageSize = parseInt(e.target.value, 10);
    state.pagination.page = 1;
    renderCards();
  });

  // Pagination buttons
  dom.prevPageBtn.addEventListener('click', () => {
    if (state.pagination.page > 1) {
      state.pagination.page--;
      renderCards();
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  });

  dom.nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(state.filteredRealtors.length / state.pagination.pageSize) || 1;
    if (state.pagination.page < totalPages) {
      state.pagination.page++;
      renderCards();
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  });

  // Reset filters
  dom.resetFiltersBtn.addEventListener('click', resetFilters);
  dom.clearAllFiltersBtn.addEventListener('click', resetFilters);

  // Sync button
  dom.syncBtn.addEventListener('click', () => {
    syncFromGoogleSheet(true);
  });

  // Export CSV
  dom.exportCsvBtn.addEventListener('click', exportFilteredToCsv);

  // Modal close handlers
  dom.closeModalBtn.addEventListener('click', closeModal);
  dom.modalCloseActionBtn.addEventListener('click', closeModal);
  dom.detailModal.addEventListener('click', (e) => {
    if (e.target === dom.detailModal) closeModal();
  });
}

function toggleQuickFilter(type) {
  if (type === 'active') {
    state.filters.activeOnly = !state.filters.activeOnly;
    updateButtonState(dom.filterActiveBtn, state.filters.activeOnly, 'bg-emerald-50 border-emerald-300 text-emerald-800');
  } else if (type === 'licensed') {
    state.filters.licensedOnly = !state.filters.licensedOnly;
    updateButtonState(dom.filterLicensedBtn, state.filters.licensedOnly, 'bg-blue-50 border-blue-300 text-blue-800');
  } else if (type === 'lastSold') {
    state.filters.lastSoldOnly = !state.filters.lastSoldOnly;
    updateButtonState(dom.filterLastSoldBtn, state.filters.lastSoldOnly, 'bg-amber-50 border-amber-300 text-amber-800');
  } else if (type === 'highConfidence') {
    state.filters.highConfidenceOnly = !state.filters.highConfidenceOnly;
    updateButtonState(dom.filterConfidenceBtn, state.filters.highConfidenceOnly, 'bg-purple-50 border-purple-300 text-purple-800');
  } else if (type === 'hideJunk') {
    state.filters.hideJunk = !state.filters.hideJunk;
    if (state.filters.hideJunk) {
      dom.filterHideJunkBtn.className = 'quick-filter-btn px-3 py-1.5 rounded-full border border-rose-200 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition flex items-center space-x-1.5 ml-auto';
      dom.filterHideJunkBtn.innerHTML = `<span>🛡️</span><span>Hide Test/Junk (On)</span>`;
    } else {
      dom.filterHideJunkBtn.className = 'quick-filter-btn px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-500 bg-white hover:bg-slate-50 transition flex items-center space-x-1.5 ml-auto';
      dom.filterHideJunkBtn.innerHTML = `<span>🛡️</span><span>Hide Test/Junk (Off)</span>`;
    }
  }
  state.pagination.page = 1;
  applyFilters();
}

function updateButtonState(btn, isActive, activeClasses) {
  if (isActive) {
    btn.className = `quick-filter-btn px-3 py-1.5 rounded-full border text-xs font-semibold shadow-2xs transition flex items-center space-x-1.5 ${activeClasses}`;
  } else {
    btn.className = 'quick-filter-btn px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 bg-white transition flex items-center space-x-1.5';
  }
}

function resetFilters() {
  state.filters = {
    search: '',
    activeOnly: false,
    licensedOnly: false,
    lastSoldOnly: false,
    highConfidenceOnly: false,
    hideJunk: true,
    state: '',
    city: '',
    sort: 'default'
  };

  dom.searchInput.value = '';
  dom.clearSearchBtn.classList.add('hidden');
  updateButtonState(dom.filterActiveBtn, false);
  updateButtonState(dom.filterLicensedBtn, false);
  updateButtonState(dom.filterLastSoldBtn, false);
  updateButtonState(dom.filterConfidenceBtn, false);
  
  dom.filterHideJunkBtn.className = 'quick-filter-btn px-3 py-1.5 rounded-full border border-rose-200 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition flex items-center space-x-1.5 ml-auto';
  dom.filterHideJunkBtn.innerHTML = `<span>🛡️</span><span>Hide Test/Junk (On)</span>`;

  dom.stateSelect.value = '';
  dom.citySelect.value = '';
  dom.sortSelect.value = 'default';
  
  state.pagination.page = 1;
  updateCityDropdown();
  applyFilters();
  showToast('Filters reset to default', '🔄');
}

/**
 * Data Initialization Strategy:
 * 1. Load from localStorage (instant paint if visited before)
 * 2. If no localStorage, load pre-bundled data_cache.json
 * 3. Immediately trigger live sync from Google Sheets in background
 */
async function initData() {
  let loadedFromLocal = false;

  // Try localStorage
  try {
    const cached = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.data && parsed.data.length > 0) {
        state.allRealtors = parsed.data;
        state.lastSynced = new Date(parsed.syncedAt);
        updateSyncStatusUi('Cached Snapshot', state.lastSynced);
        populateDropdowns();
        applyFilters();
        loadedFromLocal = true;
      }
    }
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }

  // Fallback to data_cache.json if empty
  if (!loadedFromLocal) {
    showLoading(true);
    try {
      const res = await fetch(CONFIG.FALLBACK_CACHE);
      if (res.ok) {
        const json = await res.json();
        state.allRealtors = json.data;
        state.lastSynced = new Date(json.syncedAt);
        updateSyncStatusUi('Ready', state.lastSynced);
        populateDropdowns();
        applyFilters();
      }
    } catch (e) {
      console.warn('Could not load data_cache.json:', e);
    } finally {
      showLoading(false);
    }
  }

  // ALWAYS trigger live fetch from Google Sheets upon page reload!
  syncFromGoogleSheet(false);
}

/**
 * Fetch fresh data directly from Google Sheets via JSONP (No CORS issues, GitHub Pages compatible)
 */
function syncFromGoogleSheet(isManual = false) {
  if (state.isSyncing) return;
  state.isSyncing = true;
  setSyncButtonLoading(true);

  if (isManual) {
    showToast('Fetching live data from Google Sheet...', '⏳');
  }

  const callbackName = 'gvizCallback_' + Date.now();
  const scriptId = 'gvizScript_' + Date.now();

  const timeout = setTimeout(() => {
    cleanup();
    state.isSyncing = false;
    setSyncButtonLoading(false);
    if (isManual) showToast('Sync timed out. Using local data.', '⚠️');
  }, 20000);

  function cleanup() {
    clearTimeout(timeout);
    delete window[callbackName];
    const script = document.getElementById(scriptId);
    if (script && script.parentNode) script.parentNode.removeChild(script);
  }

  window[callbackName] = function(jsonpData) {
    cleanup();
    state.isSyncing = false;
    setSyncButtonLoading(false);

    try {
      if (!jsonpData || !jsonpData.table) {
        throw new Error('Invalid Google Sheet response structure');
      }

      const cols = jsonpData.table.cols.map(c => c.label || c.id || '');
      const rawRows = jsonpData.table.rows || [];

      const realtors = rawRows.map((r) => {
        const cells = r.c || [];
        const item = {};
        cols.forEach((col, idx) => {
          if (idx < cells.length && cells[idx]) {
            const v = cells[idx].f !== undefined ? cells[idx].f : cells[idx].v;
            item[col] = v !== null && v !== undefined ? String(v).trim() : '';
          } else {
            item[col] = '';
          }
        });
        return item;
      });

      state.allRealtors = realtors;
      state.lastSynced = new Date();

      // Persist to localStorage
      try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
          syncedAt: state.lastSynced.toISOString(),
          total: realtors.length,
          data: realtors
        }));
      } catch (storageErr) {
        console.warn('LocalStorage save failed:', storageErr);
      }

      updateSyncStatusUi('Live Synced', state.lastSynced);
      populateDropdowns();
      applyFilters();

      showToast(`Synced ${realtors.length} realtors live!`, '✅');

    } catch (err) {
      console.error('Error processing live sheet data:', err);
      if (isManual) showToast('Error processing live data: ' + err.message, '❌');
    }
  };

  const script = document.createElement('script');
  script.id = scriptId;
  script.src = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=responseHandler:${callbackName}&sheet=${encodeURIComponent(CONFIG.SHEET_NAME)}&_ts=${Date.now()}`;
  script.onerror = function() {
    cleanup();
    state.isSyncing = false;
    setSyncButtonLoading(false);
    console.warn('Live fetch failed (offline or network error).');
    if (isManual) showToast('Network error fetching from Google Sheets.', '❌');
  };

  document.head.appendChild(script);
}

function setSyncButtonLoading(loading) {
  if (loading) {
    dom.syncIcon.classList.add('animate-spin-sync');
    dom.syncBtnText.textContent = 'Syncing...';
    dom.syncBtn.disabled = true;
  } else {
    dom.syncIcon.classList.remove('animate-spin-sync');
    dom.syncBtnText.textContent = 'Sync Now';
    dom.syncBtn.disabled = false;
  }
}

function updateSyncStatusUi(label, date) {
  dom.syncStatusBadge.classList.remove('hidden');
  dom.syncStatusText.textContent = `${label} (${state.allRealtors.length} records)`;
  if (date) {
    dom.syncTimestamp.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Test/Junk detection logic
 */
function isJunkRecord(r) {
  const junkFlag = (r['Junk / Test Entry?'] || '').toLowerCase();
  if (junkFlag === 'yes' || junkFlag === 'true' || junkFlag === 'y') return true;
  
  const notes = (r['Notes'] || '').toLowerCase();
  if (notes.includes('test/junk') || notes.includes('not a realtor') || notes.includes('placeholder name') || notes.includes('keyboard-mash')) {
    return true;
  }

  const email = (r['Email'] || '').toLowerCase();
  if (email.includes('leadbucks.us') || email.includes('gmaul.com')) return true;

  const conf = (r['Confidence'] || '').toLowerCase();
  const name = (r['Full Name'] || '').trim().toLowerCase();
  if (conf === 'low' && (name === 'a a' || name.length <= 3)) return true;

  return false;
}

/**
 * Filter and Sort logic
 */
function applyFilters() {
  const { search, activeOnly, licensedOnly, lastSoldOnly, highConfidenceOnly, hideJunk, state: selState, city: selCity, sort } = state.filters;
  
  const searchTerms = search.toLowerCase().split(/\s+/).filter(Boolean);
  const cleanSearchPhone = search.replace(/\D/g, '');

  state.filteredRealtors = state.allRealtors.filter((r) => {
    // Junk filter
    if (hideJunk && isJunkRecord(r)) return false;

    // Quick toggles
    if (activeOnly && (r['Active'] || '').toLowerCase() !== 'yes') return false;
    if (licensedOnly && (r['Licensed'] || '').toLowerCase() !== 'yes') return false;
    if (highConfidenceOnly && (r['Confidence'] || '').toLowerCase() !== 'high') return false;
    if (lastSoldOnly) {
      const soldAddr = (r['Last Sold Address'] || '').trim();
      const soldDate = (r['Last Sold Date'] || '').trim();
      const soldCity = (r['Last Sold City'] || '').trim();
      const hasSold = (soldAddr && soldAddr !== 'Not shown') || soldDate || (soldCity && soldCity !== 'Not shown');
      if (!hasSold) return false;
    }

    // State / Province dropdown
    if (selState) {
      const rState = (r['Operating State/Province'] || '').trim().toUpperCase();
      if (rState !== selState) return false;
    }

    // City dropdown
    if (selCity) {
      const rCity = (r['Operating City'] || '').trim().toLowerCase();
      if (rCity !== selCity.toLowerCase()) return false;
    }

    // Search query matching
    if (searchTerms.length > 0) {
      const name = (r['Full Name'] || `${r['First Name'] || ''} ${r['Last Name'] || ''}`).toLowerCase();
      const phone = (r['Phone'] || '').toLowerCase();
      const m1 = (r['Mobile 1'] || '').toLowerCase();
      const m2 = (r['Mobile 2'] || '').toLowerCase();
      const m3 = (r['Mobile 3'] || '').toLowerCase();
      const email = (r['Email'] || '').toLowerCase();
      const brokerage = (r['Brokerage'] || '').toLowerCase();
      const opCity = (r['Operating City'] || '').toLowerCase();
      const opState = (r['Operating State/Province'] || '').toLowerCase();
      const opSuburbs = (r['Operating Suburbs'] || '').toLowerCase();
      const lastSoldAddr = (r['Last Sold Address'] || '').toLowerCase();
      const lastSoldCity = (r['Last Sold City'] || '').toLowerCase();
      const lastSoldState = (r['Last Sold State'] || '').toLowerCase();

      // Check digit-only phone match
      let phoneMatch = false;
      if (cleanSearchPhone.length >= 3) {
        const rawPhones = [phone, m1, m2, m3].map(p => p.replace(/\D/g, ''));
        phoneMatch = rawPhones.some(p => p.includes(cleanSearchPhone));
      }

      const combinedText = `${name} ${brokerage} ${opCity} ${opState} ${opSuburbs} ${lastSoldAddr} ${lastSoldCity} ${lastSoldState} ${email} ${phone} ${m1}`;

      const textMatch = searchTerms.every(term => combinedText.includes(term));
      if (!textMatch && !phoneMatch) return false;
    }

    return true;
  });

  // Sorting
  sortRealtors(state.filteredRealtors, sort);

  // Update counters and render
  updateMetricsUi();
  renderCards();
}

function sortRealtors(list, sortMode) {
  if (sortMode === 'name_asc') {
    list.sort((a, b) => (a['Full Name'] || '').localeCompare(b['Full Name'] || ''));
  } else if (sortMode === 'name_desc') {
    list.sort((a, b) => (b['Full Name'] || '').localeCompare(a['Full Name'] || ''));
  } else if (sortMode === 'last_sold_desc') {
    list.sort((a, b) => (b['Last Sold Date'] || '').localeCompare(a['Last Sold Date'] || ''));
  } else if (sortMode === 'confidence_high') {
    const rank = { 'high': 3, 'medium': 2, 'low': 1, '': 0 };
    list.sort((a, b) => (rank[(b['Confidence'] || '').toLowerCase()] || 0) - (rank[(a['Confidence'] || '').toLowerCase()] || 0));
  }
}

function updateMetricsUi() {
  const filtered = state.filteredRealtors;
  dom.displayedCount.textContent = filtered.length.toLocaleString();
  dom.totalCount.textContent = state.allRealtors.length.toLocaleString();

  const activeCount = filtered.filter(r => (r['Active'] || '').toLowerCase() === 'yes').length;
  const mobileCount = filtered.filter(r => (r['Mobile 1'] || r['Phone'] || '').trim().length > 0).length;
  const soldCount = filtered.filter(r => {
    const a = (r['Last Sold Address'] || '').trim();
    const d = (r['Last Sold Date'] || '').trim();
    return (a && a !== 'Not shown') || d;
  }).length;

  dom.metricActiveCount.textContent = activeCount.toLocaleString();
  dom.metricPhoneCount.textContent = mobileCount.toLocaleString();
  dom.metricLastSoldCount.textContent = soldCount.toLocaleString();
}

/**
 * Dropdowns Population
 */
function populateDropdowns() {
  const stateCounts = {};
  state.allRealtors.forEach(r => {
    if (state.filters.hideJunk && isJunkRecord(r)) return;
    const s = (r['Operating State/Province'] || '').trim().toUpperCase();
    if (s && s !== 'UNKNOWN' && s.length <= 10) {
      stateCounts[s] = (stateCounts[s] || 0) + 1;
    }
  });

  const sortedStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]);
  
  const currentVal = dom.stateSelect.value;
  dom.stateSelect.innerHTML = '<option value="">All States / Provinces</option>' + 
    sortedStates.map(([st, cnt]) => `<option value="${st}">${st} (${cnt})</option>`).join('');
  dom.stateSelect.value = currentVal;

  updateCityDropdown();
}

function updateCityDropdown() {
  const selState = state.filters.state;
  const cityCounts = {};

  state.allRealtors.forEach(r => {
    if (state.filters.hideJunk && isJunkRecord(r)) return;
    const rState = (r['Operating State/Province'] || '').trim().toUpperCase();
    if (selState && rState !== selState) return;

    const c = (r['Operating City'] || '').trim();
    if (c && c.toLowerCase() !== 'unknown' && c.length <= 40) {
      cityCounts[c] = (cityCounts[c] || 0) + 1;
    }
  });

  const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 50);

  const currentCity = dom.citySelect.value;
  dom.citySelect.innerHTML = '<option value="">All Cities</option>' + 
    sortedCities.map(([ct, cnt]) => `<option value="${ct}">${ct} (${cnt})</option>`).join('');
  
  if (sortedCities.some(([ct]) => ct === currentCity)) {
    dom.citySelect.value = currentCity;
  } else {
    dom.citySelect.value = '';
    state.filters.city = '';
  }
}

/**
 * Render Cards Grid & Pagination
 */
function renderCards() {
  const { page, pageSize } = state.pagination;
  const filtered = state.filteredRealtors;
  const total = filtered.length;

  if (total === 0) {
    dom.realtorGrid.innerHTML = '';
    dom.emptyState.classList.remove('hidden');
    dom.paginationContainer.classList.add('hidden');
    return;
  }

  dom.emptyState.classList.add('hidden');
  dom.paginationContainer.classList.remove('hidden');

  const totalPages = Math.ceil(total / pageSize) || 1;
  const validPage = Math.min(Math.max(1, page), totalPages);
  state.pagination.page = validPage;

  dom.currentPageNum.textContent = validPage;
  dom.totalPagesNum.textContent = totalPages;
  dom.prevPageBtn.disabled = validPage === 1;
  dom.nextPageBtn.disabled = validPage === totalPages;

  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pageItems = filtered.slice(startIndex, endIndex);

  dom.realtorGrid.innerHTML = pageItems.map(r => generateCardHtml(r)).join('');

  // Bind card action buttons
  attachCardEvents();
}

/**
 * Generate Visual Card HTML
 */
function generateCardHtml(r) {
  const id = r['ID'] || '';
  const fullName = r['Full Name'] || `${r['First Name'] || ''} ${r['Last Name'] || ''}`.trim() || 'Unknown Realtor';
  const brokerage = r['Brokerage'] || 'Independent / Not specified';
  const office = r['Office Location'] || '';
  
  // Statuses
  const isActive = (r['Active'] || '').toLowerCase() === 'yes';
  const activeLabel = r['Active'] || 'Unknown';
  const isLicensed = (r['Licensed'] || '').toLowerCase() === 'yes';
  const confidence = r['Confidence'] || 'Medium';

  // Contact info
  const mobile1 = r['Mobile 1'] || '';
  const mobile1Source = r['Mobile 1 Source'] || '';
  const phone = r['Phone'] || '';
  const email = r['Email'] || '';
  const website = r['Website / Profile'] || '';

  // Operating Location
  const opCity = r['Operating City'] || '';
  const opState = r['Operating State/Province'] || '';
  const opCountry = r['Operating Country'] || '';
  const opSuburbs = r['Operating Suburbs'] || '';

  // Last Sold Property
  const lastSoldAddr = r['Last Sold Address'] || '';
  const lastSoldCity = r['Last Sold City'] || '';
  const lastSoldState = r['Last Sold State'] || '';
  const lastSoldDate = r['Last Sold Date'] || '';
  const lastSoldPrice = r['Last Sold Price'] || '';
  const lastSoldLink = r['Last Sold Source Link'] || '';

  const hasLastSold = (lastSoldAddr && lastSoldAddr !== 'Not shown') || lastSoldDate || (lastSoldCity && lastSoldCity !== 'Not shown');

  // Suburbs tags (split by comma)
  const suburbsList = opSuburbs ? opSuburbs.split(/[,;]/).map(s => s.trim()).filter(Boolean).slice(0, 5) : [];

  // Initials for avatar
  const initials = getInitials(fullName);
  const avatarBg = getAvatarColor(fullName);

  return `
    <div class="realtor-card bg-white rounded-2xl p-5 shadow-2xs flex flex-col justify-between" data-realtor-id="${escapeHtml(id)}">
      
      <!-- Card Top: Avatar, Name & Status Badges -->
      <div>
        <div class="flex items-start justify-between gap-3">
          
          <div class="flex items-start space-x-3 min-w-0">
            <!-- Initials Avatar -->
            <div class="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-extrabold text-sm shadow-sm ${avatarBg}">
              ${initials}
            </div>
            
            <!-- Realtor Name & Brokerage -->
            <div class="min-w-0">
              <h3 class="font-bold text-slate-900 text-base leading-snug truncate hover:text-blue-600 cursor-pointer view-details-trigger" title="${escapeHtml(fullName)}">
                ${highlightMatch(fullName)}
              </h3>
              <p class="text-xs text-slate-500 font-medium truncate mt-0.5" title="${escapeHtml(brokerage)}">
                🏢 ${highlightMatch(brokerage)}
              </p>
            </div>
          </div>

          <!-- Status Badge -->
          <div class="flex flex-col items-end space-y-1 flex-shrink-0">
            ${isActive ? `
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 pulse-dot"></span> Active
              </span>
            ` : activeLabel.toLowerCase() === 'no' ? `
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                Inactive
              </span>
            ` : `
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
                Active: ?
              </span>
            `}

            ${isLicensed ? `
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700" title="Licensed Realtor">
                ✓ Licensed
              </span>
            ` : ''}
          </div>

        </div>

        <!-- Contact Strip (Primary Important Info) -->
        <div class="mt-4 pt-3 border-t border-slate-100 space-y-2">
          
          <!-- Mobile 1 (Featured Button) -->
          ${mobile1 ? `
            <div class="flex items-center justify-between bg-blue-50/70 hover:bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 transition group">
              <a href="tel:${escapePhone(mobile1)}" class="flex items-center space-x-2 text-blue-700 font-semibold text-xs tracking-wide truncate" title="Click to call mobile">
                <span class="text-sm">📱</span>
                <span class="font-mono text-[13px]">${highlightMatch(mobile1)}</span>
                ${mobile1Source.toLowerCase().includes('confirmed') ? `
                  <span class="bg-blue-600 text-white text-[9px] px-1.5 py-0.2 rounded font-sans uppercase font-bold tracking-wider">Verified</span>
                ` : ''}
              </a>
              <button class="copy-btn text-blue-400 hover:text-blue-700 p-1 rounded hover:bg-blue-100/70 transition" data-copy="${escapeHtml(mobile1)}" title="Copy Mobile">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </button>
            </div>
            ${mobile1Source ? `
              <p class="text-[10px] text-slate-400 italic px-1 truncate" title="${escapeHtml(mobile1Source)}">
                Source: ${escapeHtml(mobile1Source)}
              </p>
            ` : ''}
          ` : phone ? `
            <div class="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2 transition">
              <a href="tel:${escapePhone(phone)}" class="flex items-center space-x-2 text-slate-700 font-medium text-xs truncate">
                <span class="text-sm">📞</span>
                <span class="font-mono text-xs">${highlightMatch(phone)}</span>
                <span class="text-[10px] text-slate-400">(Office)</span>
              </a>
              <button class="copy-btn text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition" data-copy="${escapeHtml(phone)}" title="Copy Phone">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </button>
            </div>
          ` : `
            <div class="text-[11px] text-slate-400 italic px-1 py-1">No phone number recorded</div>
          `}

          <!-- Email & Website Row -->
          <div class="flex items-center justify-between text-xs pt-1 px-1">
            ${email ? `
              <div class="flex items-center space-x-1.5 min-w-0 max-w-[70%]">
                <span class="text-slate-400">✉️</span>
                <a href="mailto:${escapeHtml(email)}" class="text-slate-600 hover:text-blue-600 truncate text-[11px]" title="${escapeHtml(email)}">
                  ${escapeHtml(email)}
                </a>
              </div>
            ` : `<span class="text-[11px] text-slate-400">No email</span>`}

            ${website ? `
              <a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 text-[11px] font-semibold flex items-center space-x-0.5 ml-auto hover:underline" title="Open Realtor Website/Profile">
                <span>Website</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              </a>
            ` : ''}
          </div>

        </div>

        <!-- Operating Areas Section -->
        <div class="mt-3 pt-3 border-t border-slate-100">
          <div class="flex items-center space-x-1.5 text-xs text-slate-700 font-semibold mb-1">
            <span class="text-rose-500">📍</span>
            <span>${opCity || 'Area Unspecified'}${opState ? `, ${opState}` : ''}${opCountry ? ` (${opCountry})` : ''}</span>
          </div>

          <!-- Suburbs Chips -->
          ${suburbsList.length > 0 ? `
            <div class="flex flex-wrap gap-1 mt-1.5">
              ${suburbsList.map(s => `
                <span class="suburb-chip cursor-pointer bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-medium transition" data-suburb="${escapeHtml(s)}" title="Filter by ${escapeHtml(s)}">
                  ${highlightMatch(s)}
                </span>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Last Sold & Its Areas (Visual Highlight Box) -->
        <div class="mt-4">
          ${hasLastSold ? `
            <div class="last-sold-box rounded-xl p-3 text-xs">
              <div class="flex items-center justify-between font-bold text-emerald-900 mb-1">
                <span class="flex items-center space-x-1">
                  <span>🏡</span>
                  <span>Last Sold Activity</span>
                </span>
                ${lastSoldDate ? `
                  <span class="text-[11px] font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                    ${escapeHtml(lastSoldDate)}
                  </span>
                ` : ''}
              </div>

              <!-- Address & City -->
              <p class="font-bold text-slate-800 text-xs leading-snug">
                ${lastSoldAddr && lastSoldAddr !== 'Not shown' ? highlightMatch(lastSoldAddr) : 'Address not listed'}
              </p>
              <p class="text-[11px] text-emerald-800 mt-0.5 font-medium">
                ${lastSoldCity ? highlightMatch(lastSoldCity) : ''}${lastSoldState ? `, ${lastSoldState}` : ''}
                ${lastSoldPrice && lastSoldPrice !== 'Undisclosed' && lastSoldPrice !== 'Not shown' ? ` &bull; <span class="font-bold text-slate-900">${escapeHtml(lastSoldPrice)}</span>` : ''}
              </p>

              ${lastSoldLink ? `
                <div class="mt-2 text-right">
                  <a href="${escapeHtml(lastSoldLink)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 hover:text-emerald-950 underline" title="View property sale record">
                    <span>View Sale Record</span>
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>
                </div>
              ` : ''}
            </div>
          ` : `
            <div class="last-sold-box empty rounded-xl p-3 text-xs text-slate-400 flex items-center justify-between">
              <span class="flex items-center space-x-1 text-[11px]">
                <span>🏡</span>
                <span>No recent sold data recorded</span>
              </span>
              <span class="text-[10px]">&mdash;</span>
            </div>
          `}
        </div>

      </div>

      <!-- Card Bottom Actions -->
      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="text-[11px] text-slate-400 font-mono">ID: #${id || '--'}</span>
        
        <button class="view-details-btn text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center space-x-1 hover:underline transition">
          <span>Full Details</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>

    </div>
  `;
}

/**
 * Attach Card Click Events (Copy, Suburb tag filter, Details modal)
 */
function attachCardEvents() {
  // Copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-copy');
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          showToast(`Copied ${text}`, '📋');
        }).catch(() => {
          showToast(`Copied: ${text}`, '📋');
        });
      }
    });
  });

  // Suburb tags click
  document.querySelectorAll('.suburb-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const sub = chip.getAttribute('data-suburb');
      if (sub) {
        dom.searchInput.value = sub;
        dom.clearSearchBtn.classList.remove('hidden');
        state.filters.search = sub.trim();
        state.pagination.page = 1;
        applyFilters();
      }
    });
  });

  // View Details triggers
  document.querySelectorAll('.view-details-btn, .view-details-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      const card = trigger.closest('.realtor-card');
      const id = card.getAttribute('data-realtor-id');
      const realtor = state.allRealtors.find(r => String(r['ID']) === String(id));
      if (realtor) openModal(realtor);
    });
  });
}

/**
 * Realtor Detailed Modal
 */
function openModal(r) {
  const fullName = r['Full Name'] || `${r['First Name'] || ''} ${r['Last Name'] || ''}`.trim() || 'Unknown Realtor';
  const brokerage = r['Brokerage'] || 'Independent';
  
  dom.modalName.textContent = fullName;
  dom.modalBrokerage.textContent = brokerage;
  dom.modalMeta.textContent = `Batch: ${r['Batch'] || '--'} | ID: ${r['ID'] || '--'} | Checked: ${r['Checked On'] || '--'}`;

  dom.modalAvatar.textContent = getInitials(fullName);
  dom.modalAvatar.className = `w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shadow ${getAvatarColor(fullName)}`;

  const sections = [
    {
      title: '📞 Contact & Outreach',
      items: [
        { label: 'Mobile 1', val: r['Mobile 1'], link: r['Mobile 1'] ? `tel:${escapePhone(r['Mobile 1'])}` : null, copyable: true },
        { label: 'Mobile 1 Source', val: r['Mobile 1 Source'] },
        { label: 'Mobile 2', val: r['Mobile 2'], link: r['Mobile 2'] ? `tel:${escapePhone(r['Mobile 2'])}` : null, copyable: true },
        { label: 'Mobile 3', val: r['Mobile 3'], link: r['Mobile 3'] ? `tel:${escapePhone(r['Mobile 3'])}` : null, copyable: true },
        { label: 'Direct Phone', val: r['Phone'], link: r['Phone'] ? `tel:${escapePhone(r['Phone'])}` : null, copyable: true },
        { label: 'Email', val: r['Email'], link: r['Email'] ? `mailto:${r['Email']}` : null, copyable: true },
        { label: 'Website / Profile', val: r['Website / Profile'], link: r['Website / Profile'] }
      ]
    },
    {
      title: '📍 Operating Territories',
      items: [
        { label: 'Operating City', val: r['Operating City'] },
        { label: 'Operating State / Province', val: r['Operating State/Province'] },
        { label: 'Operating Country', val: r['Operating Country'] },
        { label: 'Operating Suburbs', val: r['Operating Suburbs'] },
        { label: 'Office Location', val: r['Office Location'] }
      ]
    },
    {
      title: '🏡 Last Sold Property Transaction',
      items: [
        { label: 'Last Sold Address', val: r['Last Sold Address'] },
        { label: 'Last Sold City', val: r['Last Sold City'] },
        { label: 'Last Sold State / Country', val: [r['Last Sold State'], r['Last Sold Country']].filter(Boolean).join(', ') },
        { label: 'Last Sold Date', val: r['Last Sold Date'] },
        { label: 'Last Sold Price', val: r['Last Sold Price'] },
        { label: 'Last Sold Source Link', val: r['Last Sold Source Link'], link: r['Last Sold Source Link'] }
      ]
    },
    {
      title: '🛡️ License & Research Verification',
      items: [
        { label: 'Active Status', val: r['Active'] },
        { label: 'Licensed Status', val: r['Licensed'] },
        { label: 'License # / State', val: r['License # / State'] },
        { label: 'Research Confidence', val: r['Confidence'] },
        { label: 'Checked On Date', val: r['Checked On'] },
        { label: 'Research Notes', val: r['Notes'] }
      ]
    }
  ];

  let bodyHtml = '';
  sections.forEach(sec => {
    bodyHtml += `
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h4 class="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 pb-2 border-b border-slate-200">
          ${sec.title}
        </h4>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
          ${sec.items.map(it => {
            const val = it.val ? it.val.trim() : '';
            return `
              <div class="flex flex-col">
                <dt class="text-slate-400 font-medium text-[11px]">${it.label}</dt>
                <dd class="text-slate-800 font-semibold mt-0.5 break-words">
                  ${val ? (
                    it.link ? `
                      <a href="${escapeHtml(it.link)}" target="_blank" class="text-blue-600 hover:underline">
                        ${escapeHtml(val)}
                      </a>
                    ` : escapeHtml(val)
                  ) : '<span class="text-slate-300 font-normal italic">None</span>'}
                </dd>
              </div>
            `;
          }).join('')}
        </dl>
      </div>
    `;
  });

  dom.modalBody.innerHTML = bodyHtml;
  dom.detailModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  dom.detailModal.classList.add('hidden');
  document.body.style.overflow = '';
}

/**
 * Toast Notifications
 */
let toastTimer = null;
function showToast(message, icon = '📋') {
  clearTimeout(toastTimer);
  dom.toastIcon.textContent = icon;
  dom.toastMessage.textContent = message;
  dom.toast.classList.remove('translate-y-16', 'opacity-0');

  toastTimer = setTimeout(() => {
    dom.toast.classList.add('translate-y-16', 'opacity-0');
  }, 2800);
}

function showLoading(show) {
  dom.loadingState.classList.toggle('hidden', !show);
  if (show) dom.realtorGrid.classList.add('hidden');
  else dom.realtorGrid.classList.remove('hidden');
}

/**
 * Export filtered records to CSV
 */
function exportFilteredToCsv() {
  const data = state.filteredRealtors;
  if (!data || data.length === 0) {
    showToast('No records to export', '⚠️');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  data.forEach(row => {
    const values = headers.map(h => {
      const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `realtors_export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Exported ${data.length} realtors to CSV`, '💾');
}

/**
 * Utilities
 */
function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name) {
  const colors = [
    'bg-gradient-to-tr from-blue-600 to-indigo-600',
    'bg-gradient-to-tr from-emerald-600 to-teal-600',
    'bg-gradient-to-tr from-violet-600 to-purple-600',
    'bg-gradient-to-tr from-rose-600 to-pink-600',
    'bg-gradient-to-tr from-amber-600 to-orange-600',
    'bg-gradient-to-tr from-cyan-600 to-sky-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function highlightMatch(text) {
  if (!text) return '';
  const search = state.filters.search;
  if (!search || search.length < 2) return escapeHtml(text);

  const words = search.split(/\s+/).filter(w => w.length >= 2).map(escapeRegex);
  if (words.length === 0) return escapeHtml(text);

  const regex = new RegExp(`(${words.join('|')})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark class="search-highlight">$1</mark>');
}

function escapePhone(p) {
  return p ? p.replace(/[^\d+]/g, '') : '';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

