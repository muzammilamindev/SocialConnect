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
      const incomingPosts = action.payload;

      state.posts = incomingPosts.map(incomingPost => {
        const existingPost = state.posts.find(p => p.id === incomingPost.id);

        if (existingPost) {
          return {
            ...incomingPost,
            createdAt: existingPost.createdAt?.seconds
              ? existingPost.createdAt
              : incomingPost.createdAt,
          };
        }

        return incomingPost;
      });
      state.posts = state.posts.filter(p => {
        if (!p.id.startsWith('local_')) return true;

        return !incomingPosts.find(
          rp =>
            rp.userId === p.userId &&
            Math.abs(
              (rp.createdAt?.seconds || 0) - (p.createdAt?.seconds || 0),
            ) < 30,
        );
      });

      state.isLoading = false;
    },

    addPost: (state, action) => {
      const exists = state.posts.find(p => p.id === action.payload.id);
      if (!exists) {
        state.posts.unshift(action.payload);
      }
      state.isCreating = false;
    },

    updatePost: (state, action) => {
      const index = state.posts.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = {
          ...action.payload,

          createdAt: state.posts[index].createdAt,
        };
      }
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
  setPosts,
  addPost,
  updatePost,
  deletePost,
  toggleLike,
  setPostsLoading,
  setCreating,
  setPostsError,
} = postsSlice.actions;

export default postsSlice.reducer;
