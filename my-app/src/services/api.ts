import axios, { AxiosInstance, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface LoginRequest {
  username: string; // email
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Meeting {
  id: number;
  host_id: number;
  meeting_code: string;
  start_time?: string;
  end_time?: string;
  created_at?: string;
}

export interface CreateMeetingResponse {
  meeting_id: number;
  meeting_code: string;
}

export interface Recording {
  id: number;
  meeting_id: number;
  file_path: string;
  created_at: string;
}

export interface Transcript {
  id: number;
  meeting_id: number;
  content: string;
  created_at: string;
}

export interface Summary {
  id: number;
  meeting_id: number;
  overview: string;
  key_points: string;
  action_items: string;
  decisions: string;
  created_at: string;
}

// API Service
export const api = {
  // Authentication
  auth: {
    register: async (data: RegisterRequest): Promise<User> => {
      const response = await apiClient.post<User>('/auth/register', data);
      return response.data;
    },

    login: async (data: LoginRequest): Promise<TokenResponse> => {
      const formData = new URLSearchParams();
      formData.append('username', data.username);
      formData.append('password', data.password);

      const response = await apiClient.post<TokenResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data;
    },

    getCurrentUser: async (): Promise<User> => {
      const response = await apiClient.get<User>('/users/me');
      return response.data;
    },
  },

  // Meetings
  meetings: {
    create: async (): Promise<CreateMeetingResponse> => {
      const response = await apiClient.post<CreateMeetingResponse>('/meetings/meetings');
      return response.data;
    },

    list: async (): Promise<Meeting[]> => {
      const response = await apiClient.get<Meeting[]>('/meetings/');
      return response.data;
    },

    get: async (meetingCode: string): Promise<Meeting> => {
      const response = await apiClient.get<Meeting>(`/meetings/meetings/${meetingCode}`);
      return response.data;
    },
  },

  // Recordings
  recordings: {
    process: async (recordingId: number): Promise<{ msg: string; recording_id: number }> => {
      const response = await apiClient.post(`/recordings/${recordingId}/process`);
      return response.data;
    },
  },
};

export default apiClient;
