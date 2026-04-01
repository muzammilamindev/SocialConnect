import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import postsReducer from './slices/postsSlice';
import profileReducer from './slices/profileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    profile: profileReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Firebase Timestamps aren't serializable — tell Redux to ignore them
        ignoredActions: [
          'auth/setUser',
          'auth/setProfile',
          'posts/setPosts',
          'posts/addPost',
          'posts/updatePost',
        ],
        ignoredPaths: ['auth.user', 'auth.profile', 'posts.posts'],
      },
    }),
});
