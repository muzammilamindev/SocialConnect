import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  viewingProfile: null,   // Profile of another user being viewed
  isLoading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setViewingProfile: (state, action) => {
      state.viewingProfile = action.payload;
      state.isLoading = false;
    },
    setProfileLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setProfileError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setViewingProfile, setProfileLoading, setProfileError } = profileSlice.actions;
export default profileSlice.reducer;