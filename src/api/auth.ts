import apiClient from './client';

interface RegisterData {
  email: string;
  username: string;
  password: string;
}

interface LoginData {
  username: string; // This is actually the email
  password: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
}

interface User {
  id: number;
  email: string;
  username: string;
}

export const authService = {
  register: async (data: RegisterData) => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },
  
  login: async (data: LoginData) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    
    // Store token in localStorage
    localStorage.setItem('token', response.data.access_token);
    
    // Set default auth header
    apiClient.defaults.headers.common['Authorization'] = 
      `Bearer ${response.data.access_token}`;
      
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
  },
  
  getCurrentUser: async () => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
}; 