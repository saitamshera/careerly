import { api } from './api';

export async function fetchGmailAuthUrl() {
  const response = await api.get('/gmail/auth-url');
  return response.data?.data?.authUrl;
}

export async function syncGmailInbox() {
  const response = await api.get('/gmail/sync');
  return response.data?.data || [];
}

export async function disconnectGmail() {
  const response = await api.delete('/gmail/disconnect');
  return response.data?.data;
}
