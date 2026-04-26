import { createSlice } from '@reduxjs/toolkit';

const sanitizeProfile = profile => {
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

    clearViewingProfile: state => {
      state.viewingProfile = null;
    },

    /**
     * @param {string} payload.currentUserId
     * @param {boolean} payload.isNowFollowing
     */
    updateViewingProfileFollow: (state, action) => {
      if (!state.viewingProfile) return;

      const { currentUserId, isNowFollowing } = action.payload;
      const followers = state.viewingProfile.followers || [];

      if (isNowFollowing) {
        if (!followers.includes(currentUserId)) {
          state.viewingProfile.followers = [...followers, currentUserId];
        }
      } else {
        state.viewingProfile.followers = followers.filter(
          id => id !== currentUserId,
        );
      }
    },
  },
});

export const {
  setViewingProfile,
  setProfileLoading,
  setProfileError,
  clearViewingProfile,
  updateViewingProfileFollow,
} = profileSlice.actions;

export default profileSlice.reducer;
