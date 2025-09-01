// Mobile Refresh Token Manager
class MobileRefreshTokenManager {
  
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }

  // Initial login - store both tokens
  async login(phone, otpCode) {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token: otpCode })
      });

      const data = await response.json();
      
      if (data.session) {
        await this.storeTokens(data.session);
        return { success: true, user: data.user };
      }
      
      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Store tokens securely
  async storeTokens(session) {
    this.accessToken = session.access_token;
    this.refreshToken = session.refresh_token;
    this.expiresAt = session.expires_at;

    // Store in secure storage (AsyncStorage, Keychain, etc.)
    const tokenData = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      stored_at: Date.now()
    };

    await AsyncStorage.setItem('@auth_tokens', JSON.stringify(tokenData));
  }

  // Check if access token needs refresh (5 minutes before expiry)
  needsRefresh() {
    if (!this.expiresAt) return true;
    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 300; // 5 minutes
    return now >= (this.expiresAt - bufferTime);
  }

  // Get valid access token (auto-refresh if needed)
  async getValidAccessToken() {
    try {
      // Load tokens if not in memory
      if (!this.accessToken) {
        await this.loadStoredTokens();
      }

      // Check if we need to refresh
      if (this.needsRefresh()) {
        console.log('🔄 Access token expired, refreshing...');
        await this.refreshAccessToken();
      }

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get valid token:', error);
      throw new Error('Authentication required');
    }
  }

  // Refresh the access token using refresh token
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      // Use Supabase's refresh endpoint
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          refresh_token: this.refreshToken 
        })
      });

      const data = await response.json();
      
      if (data.session) {
        console.log('✅ Token refreshed successfully');
        await this.storeTokens(data.session);
        return this.accessToken;
      } else {
        throw new Error('Refresh failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('🚨 Refresh token failed:', error);
      // Refresh token expired or invalid - need to re-login
      await this.logout();
      throw new Error('Session expired, please login again');
    }
  }

  // Load stored tokens from storage
  async loadStoredTokens() {
    try {
      const tokenDataString = await AsyncStorage.getItem('@auth_tokens');
      if (!tokenDataString) return false;

      const tokenData = JSON.parse(tokenDataString);
      this.accessToken = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token;
      this.expiresAt = tokenData.expires_at;

      return true;
    } catch (error) {
      console.error('Failed to load stored tokens:', error);
      return false;
    }
  }

  // Make authenticated API calls with auto-refresh
  async apiCall(endpoint, options = {}) {
    try {
      const token = await this.getValidAccessToken();
      
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle 401 - token might be invalid
      if (response.status === 401) {
        console.log('🔄 Got 401, trying to refresh token...');
        await this.refreshAccessToken();
        
        // Retry with new token
        const newToken = await this.getValidAccessToken();
        return fetch(endpoint, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          }
        });
      }

      return response;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await this.getValidAccessToken();
      return !!token;
    } catch {
      return false;
    }
  }

  // Logout - clear all tokens
  async logout() {
    try {
      // Call logout endpoint to invalidate tokens on server
      if (this.accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local tokens regardless
      this.accessToken = null;
      this.refreshToken = null;
      this.expiresAt = null;
      await AsyncStorage.removeItem('@auth_tokens');
    }
  }

  // Get token info for debugging
  getTokenInfo() {
    if (!this.expiresAt) return null;
    
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = this.expiresAt - now;
    
    return {
      expires_at: new Date(this.expiresAt * 1000).toISOString(),
      time_left_seconds: timeLeft,
      time_left_minutes: Math.floor(timeLeft / 60),
      needs_refresh: this.needsRefresh()
    };
  }
}

// Export singleton instance
export const authManager = new MobileRefreshTokenManager();
