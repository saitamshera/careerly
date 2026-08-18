import { api } from './api';

function unwrap(response) { return response.data?.data; }

export async function listJobs() {
  const response = await api.get('/jobs');
  return unwrap(response);
}

export async function createJob(payload) {
  const response = await api.post('/jobs', payload);
  return unwrap(response);
}

export async function updateJob(id, payload) {
  const response = await api.put(`/jobs/${id}`, payload);
  return unwrap(response);
}

export async function deleteJob(id) {
  const response = await api.delete(`/jobs/${id}`);
  return unwrap(response);
}

export async function getJobPipeline() {
  const response = await api.get('/jobs/pipeline');
  return unwrap(response);
}

export async function getUpcomingOAs() {
  const response = await api.get('/jobs/upcoming-oas');
  return unwrap(response);
}

export async function matchSkills() {
  const response = await api.get('/jobs/match-skills');
  return unwrap(response);
}
