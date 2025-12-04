import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export interface Game {
  id: string;
  experts_score: number;
  viewers_score: number;
  status: string;
}

export interface Question {
  id: string;
  text: string;
  type: string;
  answer: string;
  media_url: string | null;
  media_thumbnail_url: string | null;
}

export interface Viewer {
  id: string;
  name: string;
  city: string | null;
  photo_url: string | null;
}

export const gamesApi = {
  getActive: () => api.get<Game | null>('/api/games/active'),
  getById: (id: string) => api.get<Game>(`/api/games/${id}`),
};

export const questionsApi = {
  getById: (id: string) => api.get<Question>(`/api/questions/${id}`),
};

export const viewersApi = {
  getById: (id: string) => api.get<Viewer>(`/api/viewers/${id}`),
};

export default api;

