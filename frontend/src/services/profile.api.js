import { api } from './api';

export async function fetchUserProfile() {
  const response = await api.get('/profile');
  return response.data?.data;
}

export async function updateUserProfile(payload) {
  const response = await api.put('/profile', payload);
  return response.data?.data;
}

export async function syncLeetCodeStats() {
  const response = await api.post('/profile/sync-leetcode');
  return response.data?.data;
}
