import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  posts: [],
  isLoading: false,
  error: null,
  isCreating: false,
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload;
      state.isLoading = false;
    },
    addPost: (state, action) => {
      state.posts.unshift(action.payload);   // Add to top of feed
      state.isCreating = false;
    },
    updatePost: (state, action) => {
      const index = state.posts.findIndex(p => p.id === action.payload.id);
      if (index !== -1) state.posts[index] = action.payload;
    },
    deletePost: (state, action) => {
      state.posts = state.posts.filter(p => p.id !== action.payload);
    },
    toggleLike: (state, action) => {
      const { postId, userId } = action.payload;
      const post = state.posts.find(p => p.id === postId);
      if (!post) return;
      const liked = post.likes.includes(userId);
      if (liked) {
        post.likes = post.likes.filter(id => id !== userId);
      } else {
        post.likes.push(userId);
      }
    },
    setPostsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setCreating: (state, action) => {
      state.isCreating = action.payload;
    },
    setPostsError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setPosts, addPost, updatePost, deletePost,
  toggleLike, setPostsLoading, setCreating, setPostsError,
} = postsSlice.actions;
export default postsSlice.reducer;