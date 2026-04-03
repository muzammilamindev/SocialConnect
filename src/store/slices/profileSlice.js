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
  viewingProfile: null,
  isLoading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setViewingProfile: (state, action) => {
      // ✅ Sanitize before storing
      state.viewingProfile = sanitizeProfile(action.payload);
      state.isLoading = false;
    },
    setProfileLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setProfileError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearViewingProfile: (state) => {
      state.viewingProfile = null;
    },
  },
});

export const {
  setViewingProfile,
  setProfileLoading,
  setProfileError,
  clearViewingProfile,
} = profileSlice.actions;

export default profileSlice.reducer;