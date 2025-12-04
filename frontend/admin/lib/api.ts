import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 секунд таймаут
});

// Добавляем обработчик ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.error('Не удалось подключиться к backend:', API_URL);
      console.error('Убедитесь, что backend запущен на порту 3002');
    }
    return Promise.reject(error);
  }
);

export interface Game {
  id: string;
  start_time: string | null;
  end_time: string | null;
  experts_score: number;
  viewers_score: number;
  status: string;
  current_round_number: number;
  max_rounds: number;
  game_date: string | null;
  season_number: number | null;
  episode_number: number | null;
  created_at: string;
  updated_at: string;
}

export interface Round {
  id: string;
  game_id: string;
  question_id: string | null;
  round_number: number;
  is_answered_correctly: boolean;
  experts_answer: string | null;
  time_started: string | null;
  time_answered: string | null;
  time_limit_seconds: number;
  display_status: any;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  viewer_id: string | null;
  text: string;
  type: string;
  answer: string;
  keywords: string[];
  media_url: string | null;
  media_thumbnail_url: string | null;
  difficulty: number | null;
  category: string | null;
  is_approved: boolean;
  approved_at: string | null;
  question_status: string;
  created_at: string;
  updated_at: string;
}

export interface Expert {
  id: string;
  name: string;
  status: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Viewer {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  created_at: string;
}

export const gamesApi = {
  getAll: () => api.get<Game[]>('/api/games'),
  getActive: () => api.get<Game | null>('/api/games/active'),
  getById: (id: string) => api.get<Game>(`/api/games/${id}`),
  create: (data: Partial<Game>) => api.post<Game>('/api/games', data),
  update: (id: string, data: Partial<Game>) => api.patch<Game>(`/api/games/${id}`, data),
  start: (id: string) => api.post<Game>(`/api/games/${id}/start`),
};

export const roundsApi = {
  getAll: () => api.get<Round[]>('/api/rounds'),
  getByGame: (gameId: string) => api.get<Round[]>(`/api/rounds/game/${gameId}`),
  getById: (id: string) => api.get<Round>(`/api/rounds/${id}`),
  create: (data: Partial<Round>) => api.post<Round>('/api/rounds', data),
  update: (id: string, data: Partial<Round>) => api.patch<Round>(`/api/rounds/${id}`, data),
  updateDisplayStatus: (id: string, displayStatus: any) =>
    api.patch<Round>(`/api/rounds/${id}/display-status`, displayStatus),
};

export const questionsApi = {
  getAll: () => api.get<Question[]>('/api/questions'),
  getApproved: () => api.get<Question[]>('/api/questions/approved'),
  getById: (id: string) => api.get<Question>(`/api/questions/${id}`),
  create: (data: Partial<Question>) => api.post<Question>('/api/questions', data),
  update: (id: string, data: Partial<Question>) => api.patch<Question>(`/api/questions/${id}`, data),
  approve: (id: string) => api.patch<Question>(`/api/questions/${id}/approve`),
};

export const expertsApi = {
  getAll: () => api.get<Expert[]>('/api/experts'),
  getById: (id: string) => api.get<Expert>(`/api/experts/${id}`),
  create: (data: Partial<Expert>) => api.post<Expert>('/api/experts', data),
  update: (id: string, data: Partial<Expert>) => api.patch<Expert>(`/api/experts/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/experts/${id}`),
};

export const viewersApi = {
  getAll: () => api.get<Viewer[]>('/api/viewers'),
  getById: (id: string) => api.get<Viewer>(`/api/viewers/${id}`),
  create: (data: Partial<Viewer>) => api.post<Viewer>('/api/viewers', data),
  update: (id: string, data: Partial<Viewer>) => api.patch<Viewer>(`/api/viewers/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/viewers/${id}`),
};

export const uploadApi = {
  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{
      success: boolean;
      filename: string;
      originalName: string;
      mimetype: string;
      size: number;
      url: string;
    }>('/api/upload/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;

