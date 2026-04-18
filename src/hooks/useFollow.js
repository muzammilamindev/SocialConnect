import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleFollow } from '../services/followService';
import { updateViewingProfileFollow } from '../store/slices/profileSlice';
import { updateCurrentUserFollowing } from '../store/slices/authSlice';
import { showGlobalToast } from './useToast';

/**
 * @param {string} targetUserId  - The UID of the profile being viewed
 * @returns {{ isFollowing, followersCount, toggleFollowUser, isLoading }}
 */
const useFollow = targetUserId => {
  const dispatch = useDispatch();

  const currentUser = useSelector(state => state.auth.profile);

  const viewingProfile = useSelector(state => state.profile.viewingProfile);

  const [isFollowing, setIsFollowing] = useState(false);

  const [followersCount, setFollowersCount] = useState(0);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!viewingProfile || !currentUser) return;

    const followers = viewingProfile.followers || [];

    setIsFollowing(followers.includes(currentUser.uid));
    setFollowersCount(followers.length);
  }, [viewingProfile, currentUser]);

  const toggleFollowUser = useCallback(async () => {
    if (!currentUser || !targetUserId || isLoading) return;

    const wasFollowing = isFollowing;
    const previousCount = followersCount;

    const newIsFollowing = !wasFollowing;
    const newCount = wasFollowing ? previousCount - 1 : previousCount + 1;

    setIsFollowing(newIsFollowing);
    setFollowersCount(newCount);
    setIsLoading(true);

    dispatch(
      updateViewingProfileFollow({
        currentUserId: currentUser.uid,
        isNowFollowing: newIsFollowing,
      }),
    );

    dispatch(
      updateCurrentUserFollowing({
        targetUserId,
        isNowFollowing: newIsFollowing,
      }),
    );

    const result = await toggleFollow(
      currentUser.uid,
      targetUserId,
      wasFollowing,
    );

    setIsLoading(false);

    if (!result.success) {
 
      setIsFollowing(wasFollowing);
      setFollowersCount(previousCount);
      
      // Rollback Redux too
      dispatch(
        updateViewingProfileFollow({
          currentUserId: currentUser.uid,
          isNowFollowing: wasFollowing,
        }),
      );
      dispatch(
        updateCurrentUserFollowing({
          targetUserId,
          isNowFollowing: wasFollowing,
        }),
      );

      showGlobalToast('Something went wrong. Please try again.', 'error');
    }
  }, [
    currentUser,
    targetUserId,
    isFollowing,
    followersCount,
    isLoading,
    dispatch,
  ]);

  return {
    isFollowing,
    followersCount,
    toggleFollowUser,
    isLoading,
  };
};

export default useFollow;
