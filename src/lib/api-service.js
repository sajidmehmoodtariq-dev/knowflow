// Simple API service for KnowFlow
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class ApiService {
  // Helper method to make API calls
  async makeRequest(url, options = {}) {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      // Add auth token if available
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${url}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${url}):`, error);
      throw error;
    }
  }

  // Token management
  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('knowflow_token');
    }
    return null;
  }

  setToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('knowflow_token', token);
    }
  }

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('knowflow_token');
      localStorage.removeItem('knowflow_user');
    }
  }

  // User management
  getUser() {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('knowflow_user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  setUser(user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('knowflow_user', JSON.stringify(user));
    }
  }

  // Authentication methods
  async register(userData) {
    const response = await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response;
  }

  async login(credentials) {
    const response = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token && response.user) {
      this.setToken(response.token);
      this.setUser(response.user);
    }

    return response;
  }

  async logout() {
    try {
      await this.makeRequest('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage
      this.removeToken();
    }
  }

  async getCurrentUser() {
    const response = await this.makeRequest('/api/auth/me');
    if (response.user) {
      this.setUser(response.user);
    }
    return response;
  }

  async verifyEmail(token) {
    const response = await this.makeRequest(`/api/auth/verify-email?token=${token}`);
    return response;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }

  // Check if user has specific role
  hasRole(role) {
    const user = this.getUser();
    return user?.role === role;
  }

  // Check if user is verified
  isVerified() {
    const user = this.getUser();
    return user?.verified === true;
  }

  // Check if user is approved (for moderators)
  isApproved() {
    const user = this.getUser();
    return user?.approved === true;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
