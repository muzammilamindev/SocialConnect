import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,           // Firebase user object
  profile: null,        // Firestore user profile
  isLoading: false,
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
      state.profile = action.payload;
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

export const { setUser, setProfile, setLoading, setError, clearAuth } = authSlice.actions;
export default authSlice.reducer;