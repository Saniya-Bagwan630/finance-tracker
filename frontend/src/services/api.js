const API_BASE_URL = 'http://localhost:5000';

const getToken = () => localStorage.getItem('token');

const apiCall = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem('token');
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Something went wrong');
  }

  return data;
};

// ============ AUTH APIs ============
export const authAPI = {
  signup: async (userData) => {
    return apiCall('/auth/signup', { method: 'POST', body: JSON.stringify(userData) });
  },
  login: async (credentials) => {
    const data = await apiCall('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    if (data.token) localStorage.setItem('token', data.token);
    return data;
  },
  logout: () => localStorage.removeItem('token'),
  isAuthenticated: () => !!getToken(),
  updateProfile: async (data) => {
    return apiCall('/auth/update', { method: 'PUT', body: JSON.stringify(data) });
  },
};

// ============ EXPENSES APIs ============
export const expensesAPI = {
  add: async (expenseData) => {
    return apiCall('/expenses/add', { method: 'POST', body: JSON.stringify(expenseData) });
  },
  list: async () => apiCall('/expenses/list', { method: 'GET' }),
  summary: async () => apiCall('/expenses/summary', { method: 'GET' }),
};

// ============ INCOME APIs ============
export const incomeAPI = {
  add: async (data) => apiCall('/income/add', { method: 'POST', body: JSON.stringify(data) }),
  list: async () => apiCall('/income/list', { method: 'GET' }),
};

// ============ GOALS APIs ============
export const goalsAPI = {
  create: async (goalData) => {
    return apiCall('/goals/create', { method: 'POST', body: JSON.stringify(goalData) });
  },
  list: async () => apiCall('/goals/list', { method: 'GET' }),
  progress: async (goalId) => {
    return apiCall(`/goals/progress${goalId ? `?goal_id=${goalId}` : ''}`, { method: 'GET' });
  },
};

// ============ CHAT APIs ============
export const chatAPI = {
  sendMessage: async (messageData) => {
    return apiCall('/chat/messages', { method: 'POST', body: JSON.stringify(messageData) });
  },
  getMessages: async (limit = 20) => {
    return apiCall(`/chat/messages?limit=${limit}`, { method: 'GET' });
  },
};

// ============ BUDGET APIs ============
export const budgetsAPI = {
  get: async () => apiCall('/budgets', { method: 'GET' }),
  update: async (data) => apiCall('/budgets', { method: 'PUT', body: JSON.stringify(data) }),
};

// ============ SAVINGS APIs ============
export const savingsAPI = {
  add: async (data) => {
    return apiCall('/savings/add', { method: 'POST', body: JSON.stringify(data) });
  },
  list: async () => apiCall('/savings/list', { method: 'GET' }),
};

export default {
  auth: authAPI,
  expenses: expensesAPI,
  income: incomeAPI,
  goals: goalsAPI,
  savings: savingsAPI,
  budgets: budgetsAPI,
  chat: chatAPI,
};