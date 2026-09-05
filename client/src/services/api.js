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
        return null;
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to fetch session');
    }

    const data = await response.json();
    return data.data?.user || null;
  },
};

/**
 * Members API methods
 */
export const membersApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.planId) query.append('planId', params.planId);
    if (params.trainerId) query.append('trainerId', params.trainerId);

    const response = await fetch(`${API_BASE_URL}/members?${query.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch members');
    return data.data?.members || [];
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch member');
    return data.data?.member;
  },

  getMyProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/members/me/profile`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch member profile');
    return data.data?.member;
  },

  create: async (memberData) => {
    const response = await fetch(`${API_BASE_URL}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(memberData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create member');
    return data.data?.member;
  },

  update: async (id, memberData) => {
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(memberData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update member');
    return data.data?.member;
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete member');
    return data;
  },
};

/**
 * Trainers API methods
 */
export const trainersApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/trainers?${query.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch trainers');
    return data.data?.trainers || [];
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/trainers/${id}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch trainer');
    return data.data?.trainer;
  },

  getMyProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/trainers/me/profile`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch trainer profile');
    return data.data?.trainer;
  },

  create: async (trainerData) => {
    const response = await fetch(`${API_BASE_URL}/trainers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(trainerData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create trainer');
    return data.data?.trainer;
  },

  update: async (id, trainerData) => {
    const response = await fetch(`${API_BASE_URL}/trainers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(trainerData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update trainer');
    return data.data?.trainer;
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/trainers/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete trainer');
    return data;
  },
};

/**
 * Membership Plans API methods
 */
export const membershipPlansApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.activeOnly) query.append('activeOnly', 'true');

    const response = await fetch(`${API_BASE_URL}/membership-plans?${query.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch plans');
    return data.data?.plans || [];
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/membership-plans/${id}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch plan');
    return data.data?.plan;
  },

  create: async (planData) => {
    const response = await fetch(`${API_BASE_URL}/membership-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(planData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create plan');
    return data.data?.plan;
  },

  update: async (id, planData) => {
    const response = await fetch(`${API_BASE_URL}/membership-plans/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(planData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update plan');
    return data.data?.plan;
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/membership-plans/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete plan');
    return data;
  },
};

/**
 * Dashboard Statistics API methods
 */
export const dashboardApi = {
  getAdminStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch admin statistics');
    return data.data;
  },

  getTrainerData: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/trainer`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch trainer dashboard');
    return data.data;
  },

  getMemberData: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/member`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch member dashboard');
    return data.data;
  },
};
