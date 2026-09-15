import api from './api';

export const authService = {
  /**
   * Login user with role, phone, and OTP
   */
  async login(loginDataOrIdentifier, maybeOtp) {
    const payload =
      typeof loginDataOrIdentifier === 'object'
        ? loginDataOrIdentifier
        : { identifier: loginDataOrIdentifier, otp: maybeOtp };
    const response = await api.post('/auth/login', payload);
    return response.data;
  },

  /**
   * Register a new user
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Send OTP to phone number
   */
  async sendOtp(phoneOrIdentifier) {
    const payload =
      typeof phoneOrIdentifier === 'object'
        ? phoneOrIdentifier
        : { phone: phoneOrIdentifier, identifier: phoneOrIdentifier };
    const response = await api.post('/auth/send-otp', payload);
    return response.data;
  },

  /**
   * Verify OTP for phone number
   */
  async verifyOtp(phone, otp) {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    return response.data;
  },

  /**
   * Fetch current authenticated profile
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Get supported platform roles
   */
  async getRoles() {
    const response = await api.get('/auth/roles');
    return response.data;
  },
};

export default authService;
