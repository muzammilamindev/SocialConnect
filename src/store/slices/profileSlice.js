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
      // Sanitize timestamps before storing in Redux (Firestore Timestamps aren't serializable)
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

    /**
     * @param {string} payload.currentUserId - The logged-in user's UID
     * @param {boolean} payload.isNowFollowing - true = add, false = remove
     */
    updateViewingProfileFollow: (state, action) => {
      if (!state.viewingProfile) return;

      const { currentUserId, isNowFollowing } = action.payload;
      const followers = state.viewingProfile.followers || [];

      if (isNowFollowing) {
        // Add currentUserId to followers if not already present
        if (!followers.includes(currentUserId)) {
          state.viewingProfile.followers = [...followers, currentUserId];
        }
      } else {
        // Remove currentUserId from followers
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