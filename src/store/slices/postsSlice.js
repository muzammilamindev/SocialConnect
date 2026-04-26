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
      const localPostsToKeep = state.posts.filter(p => {
        if (!p.id.startsWith('local_')) return false;

        const hasRealMatch = incomingPosts.some(
          rp =>
            rp.userId === p.userId &&
            Math.abs(
              (rp.createdAt?.seconds || 0) - (p.createdAt?.seconds || 0),
            ) < 30,
        );

        return !hasRealMatch;
      });

      const realPosts = incomingPosts.map(incomingPost => {
        const existingPost = state.posts.find(p => p.id === incomingPost.id);
        if (existingPost?.createdAt?.seconds) {
          return { ...incomingPost, createdAt: existingPost.createdAt };
        }
        return incomingPost;
      });
      const merged = [...localPostsToKeep, ...realPosts];
      merged.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
      );

      state.posts = merged;
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
      const { postId, text } = action.payload;
      const target = state.posts.find(p => p.id === postId);
      if (target) {
        target.text = text;
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
    updateCommentsCount: (state, action) => {
      const { postId, count } = action.payload;
      const post = state.posts.find(p => p.id === postId);
      if (post) {
        post.commentsCount = count;
      }
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
  updateCommentsCount,
} = postsSlice.actions;

export default postsSlice.reducer;
