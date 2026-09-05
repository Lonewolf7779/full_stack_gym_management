/**
 * API Service for IronForge Gym System
 */

const API_BASE_URL = '/api';

/**
 * Check backend health & MongoDB connectivity
 */
export const checkServerHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    return {
      online: true,
      data: data.data,
      message: data.message,
    };
  } catch (error) {
    console.warn('[API Service] Backend health check failed:', error.message);
    return {
      online: false,
      error: error.message,
    };
  }
};

/**
 * Authentication API methods
 */
export const authApi = {
  /**
   * Register a new member
   */
  register: async ({ name, email, password }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },

  /**
   * Login user with email and password
   */
  login: async ({ email, password }) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Invalid email or password');
    }
    return data;
  },

  /**
   * Logout user and clear session cookie
   */
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Logout failed');
    }
    return data;
  },

  /**
   * Get current authenticated user profile
   */
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null; // Guest user
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to fetch session');
    }

    const data = await response.json();
    return data.data?.user || null;
  },
};
