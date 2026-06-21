// App State
const state = {
  habits: [],
  currentFilter: 'all', // 'all' | 'active' | 'completed'
  currentDate: ''       // YYYY-MM-DD
};

// DOM Elements
const currentDateEl = document.getElementById('current-date');
const currentTimeEl = document.getElementById('current-time');
const completionPercentageEl = document.getElementById('completion-percentage');
const completionRatioEl = document.getElementById('completion-ratio');
const completionBarEl = document.getElementById('completion-bar');
const totalHabitsCountEl = document.getElementById('total-habits-count');
const bestStreakCountEl = document.getElementById('best-streak-count');

const habitForm = document.getElementById('habit-form');
const habitInput = document.getElementById('habit-input');
const charCounter = document.getElementById('char-counter');
const errorMessage = document.getElementById('error-message');
const habitListEl = document.getElementById('habit-list');
const emptyStateEl = document.getElementById('empty-state');

const filterTabs = document.querySelectorAll('.filter-tab');
const btnDemo = document.getElementById('btn-demo');
const btnClearAll = document.getElementById('btn-clear-all');

// Helper: Get local YYYY-MM-DD string
function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Get formatted date string for header (Korean)
function getFormattedHeaderDate(date) {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const dayNum = date.getDate();
  const dayOfWeek = days[date.getDay()];
  return `${year}년 ${month}월 ${dayNum}일 ${dayOfWeek}`;
}

// Helper: Update Header Time and Date
function updateClock() {
  const now = new Date();
  
  // Update time display
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  currentTimeEl.textContent = `${hours}:${minutes}`;
  
  // Update date display
  currentDateEl.textContent = getFormattedHeaderDate(now);
}

// Streak Calculation Logic
function calculateStreak(logs) {
  if (!logs || logs.length === 0) return 0;
  
  const logSet = new Set(logs);
  let streak = 0;
  let checkDate = new Date();
  
  const todayStr = getLocalDateString(checkDate);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);
  
  // Determine start date
  if (logSet.has(todayStr)) {
    // Start from today if completed today
  } else if (logSet.has(yesterdayStr)) {
    // Start from yesterday if not completed today but completed yesterday
    checkDate = yesterday;
  } else {
    // Streak broken (neither completed today nor yesterday)
    return 0;
  }
  
  // Walk backwards day by day
  while (true) {
    const dateStr = getLocalDateString(checkDate);
    if (logSet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

// Update Statistics Dashboard
function updateStats() {
  const total = state.habits.length;
  const todayStr = getLocalDateString(new Date());
  
  // Count completed today
  const completedToday = state.habits.filter(habit => {
    return habit.logs && habit.logs.includes(todayStr);
  }).length;
  
  // Calculate completion percentage
  const percentage = total > 0 ? Math.round((completedToday / total) * 100) : 0;
  
  // Find best streak
  let bestStreak = 0;
  state.habits.forEach(habit => {
    const streak = calculateStreak(habit.logs);
    if (streak > bestStreak) {
      bestStreak = streak;
    }
  });
  
  // Update DOM
  completionPercentageEl.textContent = `${percentage}%`;
  completionRatioEl.textContent = `${completedToday} / ${total} 완료`;
  completionBarEl.style.width = `${percentage}%`;
  
  totalHabitsCountEl.textContent = total;
  bestStreakCountEl.textContent = `${bestStreak}일`;
}

// Render Habit List
function renderHabits() {
  const todayStr = getLocalDateString(new Date());
  habitListEl.innerHTML = '';
  
  // Filter habits
  let filteredHabits = state.habits;
  if (state.currentFilter === 'active') {
    filteredHabits = state.habits.filter(h => !h.logs.includes(todayStr));
  } else if (state.currentFilter === 'completed') {
    filteredHabits = state.habits.filter(h => h.logs.includes(todayStr));
  }
  
  // Toggle empty state
  if (filteredHabits.length === 0) {
    emptyStateEl.classList.remove('hidden');
    habitListEl.classList.add('hidden');
    
    // Change empty state description depending on filter
    const pEl = emptyStateEl.querySelector('p');
    if (state.currentFilter === 'active') {
      pEl.innerHTML = '오늘 아직 하지 않은 습관이 없습니다.<br>모두 완료했거나 습관을 새로 등록해 보세요!';
    } else if (state.currentFilter === 'completed') {
      pEl.innerHTML = '오늘 완료한 습관이 아직 없습니다.<br>습관을 달성하고 체크해 보세요!';
    } else {
      pEl.innerHTML = '아직 등록된 습관이 없습니다.<br>새로운 목표를 추가하고 시작해 보세요!';
    }
  } else {
    emptyStateEl.classList.add('hidden');
    habitListEl.classList.remove('hidden');
    
    filteredHabits.forEach(habit => {
      const isCompleted = habit.logs.includes(todayStr);
      const streak = calculateStreak(habit.logs);
      
      const habitItem = document.createElement('div');
      habitItem.className = `habit-item ${isCompleted ? 'completed' : ''}`;
      habitItem.dataset.id = habit.id;
      
      habitItem.innerHTML = `
        <div class="habit-left">
          <label class="checkbox-wrapper">
            <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="toggleHabit('${habit.id}')">
            <span class="custom-checkbox">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          </label>
          <span class="habit-name">${escapeHTML(habit.name)}</span>
        </div>
        
        <div class="habit-right">
          <div class="streak-badge ${streak > 0 ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"></path>
              <path d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"></path>
            </svg>
            <span>${streak}일 연속</span>
          </div>
          
          <button class="btn-delete" onclick="deleteHabit('${habit.id}')" title="삭제">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      `;
      
      habitListEl.appendChild(habitItem);
    });
  }
}

// Escape HTML utility
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Save to LocalStorage
function saveToLocalStorage() {
  localStorage.setItem('habits', JSON.stringify(state.habits));
}

// Actions: Toggle Habit
window.toggleHabit = function(id) {
  const todayStr = getLocalDateString(new Date());
  state.habits = state.habits.map(habit => {
    if (habit.id === id) {
      const logs = [...habit.logs];
      const index = logs.indexOf(todayStr);
      if (index > -1) {
        logs.splice(index, 1); // Uncheck
      } else {
        logs.push(todayStr);   // Check
      }
      return { ...habit, logs };
    }
    return habit;
  });
  
  saveToLocalStorage();
  renderHabits();
  updateStats();
};

// Actions: Delete Habit
window.deleteHabit = function(id) {
  if (confirm('이 습관을 삭제하시겠습니까?')) {
    state.habits = state.habits.filter(habit => habit.id !== id);
    saveToLocalStorage();
    renderHabits();
    updateStats();
  }
};

// Error feedback display
function showValidationError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('error-hidden');
  habitInput.classList.add('input-shake');
  habitInput.setAttribute('aria-invalid', 'true');
  
  // Reset shake class after animation completes
  setTimeout(() => {
    habitInput.classList.remove('input-shake');
  }, 500);
}

function hideValidationError() {
  errorMessage.classList.add('error-hidden');
  habitInput.setAttribute('aria-invalid', 'false');
}

// Real-time character counter & length validation
habitInput.addEventListener('input', () => {
  const length = habitInput.value.length;
  charCounter.textContent = `${length} / 20`;
  
  if (length > 20) {
    charCounter.style.color = 'var(--accent-rose)';
  } else {
    charCounter.style.color = 'var(--text-muted)';
  }
  
  if (length > 0) {
    hideValidationError();
  }
});

// Form Submission
habitForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const rawValue = habitInput.value;
  const name = rawValue.trim();
  
  // Validation
  if (name.length === 0) {
    showValidationError('습관을 입력해 주세요.');
    return;
  }
  
  if (rawValue.length > 20) {
    showValidationError('습관명은 20자 이내로 입력해 주세요.');
    return;
  }

  // Check for duplicates (case-insensitive and trim-aware)
  const isDuplicate = state.habits.some(habit => habit.name.toLowerCase().trim() === name.toLowerCase());
  if (isDuplicate) {
    showValidationError('이미 등록된 습관입니다.');
    return;
  }
  
  // Create New Habit
  const newHabit = {
    id: Date.now().toString(),
    name: name,
    createdAt: new Date().toISOString(),
    logs: []
  };
  
  state.habits.unshift(newHabit);
  saveToLocalStorage();
  
  // Reset Form
  habitInput.value = '';
  charCounter.textContent = '0 / 20';
  charCounter.style.color = 'var(--text-muted)';
  hideValidationError();
  
  // Update UI
  renderHabits();
  updateStats();
});

// Filter selection
filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.currentFilter = tab.dataset.filter;
    renderHabits();
  });
});

// Demo Data Generation
btnDemo.addEventListener('click', () => {
  if (state.habits.length > 0 && !confirm('기존 데이터를 유지하고 데모 데이터를 추가하시겠습니까?')) {
    return;
  }
  
  const today = new Date();
  
  // Helper to generate date strings going back N days
  const getPastDateStr = (daysAgo) => {
    const d = new Date();
    d.setDate(today.getDate() - daysAgo);
    return getLocalDateString(d);
  };
  
  const demoHabits = [
    {
      id: 'demo-1',
      name: '매일 30분 코딩 💻',
      createdAt: new Date().toISOString(),
      logs: [
        getPastDateStr(0), // today
        getPastDateStr(1), // yesterday
        getPastDateStr(2),
        getPastDateStr(3),
        getPastDateStr(4)  // 5 days streak
      ]
    },
    {
      id: 'demo-2',
      name: '아침 스트레칭 10분 🧘',
      createdAt: new Date().toISOString(),
      logs: [
        getPastDateStr(1), // yesterday
        getPastDateStr(2),
        getPastDateStr(3)  // 3 days streak (today not checked yet)
      ]
    },
    {
      id: 'demo-3',
      name: '하루 물 2L 마시기 💧',
      createdAt: new Date().toISOString(),
      logs: [] // 0 days streak
    }
  ];
  
  state.habits = [...demoHabits, ...state.habits];
  saveToLocalStorage();
  renderHabits();
  updateStats();
  
  alert('데모 습관이 등록되었습니다. 스트릭 동작을 확인해 보세요!');
});

// Clear All
btnClearAll.addEventListener('click', () => {
  if (confirm('모든 습관 데이터와 기록이 초기화됩니다. 계속하시겠습니까?')) {
    state.habits = [];
    saveToLocalStorage();
    renderHabits();
    updateStats();
  }
});

// Real-time Date Change (Midnight Reset) Checker
function checkDateReset() {
  const todayStr = getLocalDateString(new Date());
  if (state.currentDate && state.currentDate !== todayStr) {
    state.currentDate = todayStr;
    renderHabits();
    updateStats();
    console.log(`Midnight reset triggered: changed to ${todayStr}`);
  }
}

// Initialization
function init() {
  // Set initial current date
  state.currentDate = getLocalDateString(new Date());
  
  // Load from LocalStorage
  const stored = localStorage.getItem('habits');
  if (stored) {
    try {
      state.habits = JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored habits:', e);
      state.habits = [];
    }
  }
  
  // Initial draw
  updateClock();
  renderHabits();
  updateStats();
  
  // Set intervals
  setInterval(updateClock, 1000);        // Clock updates every second
  setInterval(checkDateReset, 10000);    // Checks for date change every 10 seconds
  
  // Visibility change check (handles lock/unlock or tab switch immediately)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      updateClock();
      checkDateReset();
    }
  });
}

// Run App
init();
