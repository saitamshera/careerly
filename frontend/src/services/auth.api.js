import { api } from './api';

function unwrap(response) {
  return response.data?.data;
}

export async function loginUser(payload) {
  const response = await api.post('/auth/login', payload);
  return unwrap(response);
}

export async function registerUser(payload) {
  const response = await api.post('/auth/register', payload);
  return unwrap(response);
}

export async function googleLoginUser(payload) {
  const response = await api.post('/auth/google', payload);
  return unwrap(response);
}

export async function refreshSession(payload) {
  const response = await api.post('/auth/refresh', payload);
  return unwrap(response);
}

export async function forgotPassword(payload) {
  const response = await api.post('/auth/forgot-password', payload);
  return unwrap(response);
}

export async function verifyResetOtp(payload) {
  const response = await api.post('/auth/verify-reset-otp', payload);
  return unwrap(response);
}

export async function resetPassword(payload) {
  const response = await api.post('/auth/reset-password', payload);
  return unwrap(response);
}

export async function verifyEmail(payload) {
  const response = await api.post('/auth/verify-email', payload);
  return unwrap(response);
}

export async function resendVerification(payload) {
  const response = await api.post('/auth/resend-verification', payload);
  return unwrap(response);
}