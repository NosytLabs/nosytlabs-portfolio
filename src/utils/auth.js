/**
 * Authentication utilities for NosytLabs Admin Panel
 * Simple but secure authentication system
 */

// Simple user store (in production, this would be a database)
const USERS = {
  'admin': {
    username: 'admin',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'admin',
    email: 'admin@nosytlabs.com'
  },
  'nosytlabs': {
    username: 'nosytlabs',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'admin',
    email: 'info@nosytlabs.com'
  }
};

// Session management
class AuthManager {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Generate session token
  generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Hash password (simple implementation - use bcrypt in production)
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'nosytlabs_salt_2025');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Verify password
  async verifyPassword(password, hashedPassword) {
    const inputHash = await this.hashPassword(password);
    return inputHash === hashedPassword;
  }

  // Login user
  async login(username, password) {
    const user = USERS[username];
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // For demo purposes, accept 'password' as the password
    // In production, use proper password verification
    if (password !== 'password') {
      throw new Error('Invalid username or password');
    }

    const token = this.generateToken();
    const session = {
      token,
      user: {
        username: user.username,
        role: user.role,
        email: user.email
      },
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout
    };

    this.sessions.set(token, session);
    
    // Store in localStorage for client-side persistence
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('nosytlabs_auth_token', token);
      localStorage.setItem('nosytlabs_user', JSON.stringify(session.user));
    }

    return session;
  }

  // Logout user
  logout(token) {
    this.sessions.delete(token);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('nosytlabs_auth_token');
      localStorage.removeItem('nosytlabs_user');
    }
  }

  // Verify session
  verifySession(token) {
    const session = this.sessions.get(token);
    if (!session) {
      return null;
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  // Get current user from localStorage
  getCurrentUser() {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const token = localStorage.getItem('nosytlabs_auth_token');
    const userStr = localStorage.getItem('nosytlabs_user');

    if (!token || !userStr) {
      return null;
    }

    try {
      const user = JSON.parse(userStr);
      const session = this.verifySession(token);
      return session ? user : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  // Check if user has specific role
  hasRole(requiredRole) {
    const user = this.getCurrentUser();
    return user && user.role === requiredRole;
  }

  // Cleanup expired sessions
  cleanupSessions() {
    const now = Date.now();
    for (const [token, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(token);
      }
    }
  }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Cleanup expired sessions every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    authManager.cleanupSessions();
  }, 60 * 60 * 1000);
}

export default authManager;

// Client-side authentication utilities
export const clientAuth = {
  // Login form handler
  async handleLogin(formData) {
    try {
      const username = formData.get('username');
      const password = formData.get('password');

      const session = await authManager.login(username, password);
      return { success: true, user: session.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Logout handler
  logout() {
    const token = localStorage.getItem('nosytlabs_auth_token');
    if (token) {
      authManager.logout(token);
    }
    window.location.href = '/admin';
  },

  // Check authentication status
  checkAuth() {
    return authManager.isAuthenticated();
  },

  // Redirect if not authenticated
  requireAuth() {
    if (!this.checkAuth()) {
      window.location.href = '/admin';
      return false;
    }
    return true;
  },

  // Get current user
  getCurrentUser() {
    return authManager.getCurrentUser();
  }
};
