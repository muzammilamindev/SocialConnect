import { createSlice } from '@reduxjs/toolkit';

const sanitizeProfile = (profile) => {
  if (!profile) return null;
  return {
    ...profile,
    createdAt: profile.createdAt?.seconds
      ? profile.createdAt.seconds
      : typeof profile.createdAt === 'number'
      ? profile.createdAt
      : null,
  };
};

const initialState = {
  user: null,
  profile: null,
  isLoading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setProfile: (state, action) => {
      // ✅ Always sanitize before storing
      state.profile = sanitizeProfile(action.payload);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.profile = null;
      state.error = null;
      state.isLoading = false;
    },
  },
});

export const { setUser, setProfile, setLoading, setError, clearAuth } =
  authSlice.actions;
export default authSlice.reducer;