import api from './api';

export const authService = {
  /**
   * Login user with phone and OTP (or credentials)
   */
  async login(loginDataOrPhone, maybeOtp) {
    const payload =
      typeof loginDataOrPhone === 'object'
        ? loginDataOrPhone
        : typeof loginDataOrPhone === 'string' && loginDataOrPhone.includes('@')
        ? { email: loginDataOrPhone, password: maybeOtp }
        : { phone: loginDataOrPhone, otp: maybeOtp };
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
   * Send OTP to phone number for verification
   */
  async sendOtp(phone) {
    const response = await api.post('/auth/send-otp', { phone });
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
