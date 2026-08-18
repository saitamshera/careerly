import { api } from './api';

export async function fetchLeetCodeProfile(username) {
  const response = await api.get(`/leetcode/profile/${username}`);
  return response.data?.data;
}

export async function fetchLeetCodeSubmissions(username) {
  const response = await api.get(`/leetcode/submissions/${username}`);
  return response.data?.data || [];
}

export async function syncLeetCodeProfile(username) {
  const response = await api.post('/leetcode/sync', { username });
  return response.data?.data;
}
