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
      state.profile = sanitizeProfile(action.payload);
    },

    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    clearAuth: state => {
      state.user = null;
      state.profile = null;
      state.error = null;
      state.isLoading = false;
    },

    /**
     * @param {string} payload.targetUserId
     * @param {boolean} payload.isNowFollowing
     */
    updateCurrentUserFollowing: (state, action) => {
      if (!state.profile) return;

      const { targetUserId, isNowFollowing } = action.payload;
      const following = state.profile.following || [];

      if (isNowFollowing) {
        if (!following.includes(targetUserId)) {
          state.profile.following = [...following, targetUserId];
        }
      } else {
        state.profile.following = following.filter(id => id !== targetUserId);
      }
    },
  },
});

export const {
  setUser,
  setProfile,
  setLoading,
  setError,
  clearAuth,
  updateCurrentUserFollowing,
} = authSlice.actions;

export default authSlice.reducer;
