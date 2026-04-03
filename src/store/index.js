import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';
import authReducer from './slices/authSlice';
import postsReducer from './slices/postsSlice';
import profileReducer from './slices/profileSlice';

const postsPersistConfig = {
  key: 'posts',
  storage: AsyncStorage,
  whitelist: ['posts'], // only persist the posts array
};

const rootReducer = combineReducers({
  auth: authReducer,
  posts: persistReducer(postsPersistConfig, postsReducer),
  profile: profileReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
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

export const persistor = persistStore(store);
