import { configureStore, createSlice } from '@reduxjs/toolkit';

const storedSession = typeof window !== 'undefined' ? window.localStorage.getItem('auth.session') : null;
const initialSession = storedSession
  ? JSON.parse(storedSession)
  : { user: null, accessToken: null, refreshToken: null };

const authSlice = createSlice({
  name: 'auth',
  initialState: initialSession,
  reducers: {
    setSession(state, action) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('auth.session', JSON.stringify(action.payload));
      }
    },
    clearSession(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('auth.session');
      }
    }
  }
});

export const { setSession, clearSession } = authSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer
  }
});