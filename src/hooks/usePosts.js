import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setPosts,
  setPostsLoading,
  setPostsError,
} from '../store/slices/postsSlice';
import { subscribeToPostFeed } from '../services/realtimeService';

const usePosts = () => {
  const dispatch = useDispatch();
  const { posts, isLoading, error } = useSelector(state => state.posts);

  useEffect(() => {
    dispatch(setPostsLoading(true));

    // Subscribe: this updates Redux store in real-time
    const unsubscribe = subscribeToPostFeed(
      updatedPosts => {
        dispatch(setPosts(updatedPosts));
      },
      err => {
        dispatch(setPostsError(err.message));
      },
    );

    // Cleanup: unsubscribe when component unmounts
    return () => unsubscribe();
  }, [dispatch]);

  return { posts, isLoading, error };
};

export default usePosts;
