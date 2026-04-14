import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
}

// Projects API
export const projectsAPI = {
  getClientProjects: (clientId: string) => api.get(`/projects/client/${clientId}`),
  getProject: (id: string) => api.get(`/projects/${id}`),
  createProject: (data: any) => api.post('/projects', data),
  updateProject: (id: string, data: any) => api.put(`/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/projects/${id}`)
}

// Invoices API
export const invoicesAPI = {
  getClientInvoices: (clientId: string) => api.get(`/invoices/client/${clientId}`),
  getInvoice: (id: string) => api.get(`/invoices/${id}`),
  createInvoice: (data: any) => api.post('/invoices', data),
  updateInvoice: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  payInvoice: (id: string) => api.put(`/invoices/${id}/pay`),
  deleteInvoice: (id: string) => api.delete(`/invoices/${id}`)
}

// Subscriptions API
export const subscriptionsAPI = {
  getClientSubscription: (clientId: string) => api.get(`/subscriptions/client/${clientId}`),
  getSubscription: (id: string) => api.get(`/subscriptions/${id}`),
  createSubscription: (data: any) => api.post('/subscriptions', data),
  updateSubscription: (id: string, data: any) => api.put(`/subscriptions/${id}`, data),
  cancelSubscription: (id: string) => api.put(`/subscriptions/${id}/cancel`),
  deleteSubscription: (id: string) => api.delete(`/subscriptions/${id}`)
}

// Portfolio API
export const portfolioAPI = {
  getPortfolio: () => api.get('/portfolio'),
  getPortfolioByCategory: (category: string) => api.get(`/portfolio/category/${category}`),
  getPortfolioItem: (id: string) => api.get(`/portfolio/${id}`)
}

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getClients: () => api.get('/admin/clients'),
  getProjects: () => api.get('/admin/projects'),
  getInvoices: () => api.get('/admin/invoices'),
  getSubscriptions: () => api.get('/admin/subscriptions'),
  getMonthlyRevenue: () => api.get('/admin/revenue/monthly'),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`)
}

// Users API - Profile Management
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  updateEmail: (data: any) => api.put('/users/email', data),
  changePassword: (data: any) => api.put('/users/password', data),
  getPreferences: () => api.get('/users/preferences'),
  updatePreferences: (data: any) => api.put('/users/preferences', data)
}

// Payment Methods API
export const paymentMethodsAPI = {
  getPaymentMethods: () => api.get('/payment-methods'),
  addPaymentMethod: (data: any) => api.post('/payment-methods', data),
  updatePaymentMethod: (id: string, data: any) => api.put(`/payment-methods/${id}`, data),
  deletePaymentMethod: (id: string) => api.delete(`/payment-methods/${id}`),
  setDefaultPaymentMethod: (id: string) => api.put(`/payment-methods/${id}/default`)
}

export default api
