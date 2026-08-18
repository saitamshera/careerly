import { api } from './api';

function unwrap(response) { return response.data?.data; }

export async function listProblems() {
  const response = await api.get('/dsa');
  return unwrap(response);
}

export async function createProblem(payload) {
  const response = await api.post('/dsa', payload);
  return unwrap(response);
}

export async function updateProblem(id, payload) {
  const response = await api.put(`/dsa/${id}`, payload);
  return unwrap(response);
}

export async function deleteProblem(id) {
  const response = await api.delete(`/dsa/${id}`);
  return unwrap(response);
}

export async function getDsaStats() {
  const response = await api.get('/dsa/stats');
  return unwrap(response);
}

export async function getTodayProblems() {
  const response = await api.get('/dsa/today');
  return unwrap(response);
}

export async function getDsaStreak() {
  const response = await api.get('/dsa/streak');
  return unwrap(response);
}
