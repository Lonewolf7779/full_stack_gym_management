/**
 * API Service for IronForge Gym System
 */

const API_BASE_URL = '/api';

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
