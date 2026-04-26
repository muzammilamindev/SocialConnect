import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const USERNAME_CANDIDATES = [
  'displayName',
  'username',
  'name',
  'userName',
  'fullName',
  'handle',
];
const AVATAR_CANDIDATES = [
  'profilePicture',
  'photoURL',
  'avatarUrl',
  'avatar',
  'photo',
  'profilePhoto',
  'profileImage',
];
const FOLLOWERS_CANDIDATES = [
  'followersCount',
  'followers',
  'followerCount',
  'followersNum',
];

const POST_IMAGE_CANDIDATES = [
  'imageUrl',
  'imageURL',
  'image',
  'photo',
  'mediaUrl',
  'media',
  'photoUrl',
  'thumbnail',
  'coverImage',
  'downloadURL',
  'url',
  'fileUrl',
  'mediaURL',
  'imgUrl',
];
const POST_TEXT_CANDIDATES = [
  'content',
  'text',
  'body',
  'postText',
  'caption',
  'description',
  'message',
];
const AUTHOR_ID_CANDIDATES = [
  'userId',
  'authorId',
  'uid',
  'createdBy',
  'ownerId',
  'posterId',
];

const pickString = (obj, keys) => {
  for (const k of keys) {
    if (typeof obj[k] === 'string' && obj[k] !== '') return obj[k];
  }
  return null;
};
const pickAny = (obj, keys) => {
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== '') return obj[k];
  }
  return null;
};

const extractUserName = u =>
  pickString(u, USERNAME_CANDIDATES) ?? 'Unknown User';
const extractUserAvatar = u => pickString(u, AVATAR_CANDIDATES);
const extractFollowers = u => pickAny(u, FOLLOWERS_CANDIDATES);
const extractPostImage = p => pickString(p, POST_IMAGE_CANDIDATES);
const extractPostText = p => pickString(p, POST_TEXT_CANDIDATES) ?? '';
const extractAuthorId = p => pickString(p, AUTHOR_ID_CANDIDATES);

const formatCount = n => {
  if (n == null) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const extractDate = post =>
  post.createdAt?.toDate
    ? post.createdAt.toDate().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 3;
const GRID_SIZE = (SCREEN_WIDTH - 32 - GRID_GAP * 2) / 3;

// ─── Firestore queries ────────────────────────────────────────────────────────

const getSuggestedUsers = () => firestore().collection('users').limit(8).get();

const getTrendingPosts = () =>
  firestore().collection('posts').orderBy('createdAt', 'desc').limit(9).get();

const searchUsersByName = (prefix, nameField) =>
  firestore()
    .collection('users')
    .where(nameField, '>=', prefix)
    .where(nameField, '<=', prefix + '\uf8ff')
    .limit(10)
    .get();

const getAllPostsForSearch = () =>
  firestore().collection('posts').limit(300).get();

const getUserById = id => firestore().collection('users').doc(id).get();

const Avatar = ({ uri, name, size = 48 }) => {
  const radius = size / 2;
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          marginRight: 12,
        }}
      />
    );
  }
  return (
    <View
      style={[
        styles.avatarFallback,
        { width: size, height: size, borderRadius: radius, marginRight: 12 },
      ]}
    >
      <Text style={[styles.avatarInitial, { fontSize: size * 0.38 }]}>
        {(name ?? '?').charAt(0).toUpperCase()}
      </Text>
    </View>
  );
};
const UserRow = ({ item, onPress, onFollow }) => {
  const name = extractUserName(item);
  const avatar = extractUserAvatar(item);

  return (
    <TouchableOpacity
      style={styles.userRow}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <Avatar uri={avatar} name={name} />
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.followBtn}
        onPress={() => onFollow?.(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.followBtnText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const PostRow = ({ item, onPress }) => {
  const text = extractPostText(item);
  const image = extractPostImage(item);
  const date = extractDate(item);
  const likes = item.likesCount ?? item.likes ?? 0;

  return (
    <TouchableOpacity
      style={styles.postRow}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.postThumb} />
      ) : (
        <View style={[styles.postThumb, styles.postThumbFallback]}>
          <Text style={styles.postThumbIcon}>📝</Text>
        </View>
      )}
      <View style={styles.postInfo}>
        <Text style={styles.postText} numberOfLines={2}>
          {text || '(no content)'}
        </Text>
        <Text style={styles.postMeta}>
          {[date, `${likes} likes`].filter(Boolean).join('  ·  ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const SectionTitle = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const EmptyState = ({ query }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>🔍</Text>
    <Text style={styles.emptyTitle}>No results for "{query}"</Text>
    <Text style={styles.emptyHint}>
      Try different keywords or check spelling
    </Text>
  </View>
);

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [postResults, setPostResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [defaultLoading, setDefaultLoading] = useState(true);

  const detectedNameField = useRef('displayName');
  
  useEffect(() => {
    (async () => {
      try {
        const [uSnap, pSnap] = await Promise.all([
          getSuggestedUsers(),
          getTrendingPosts(),
        ]);

        if (uSnap.docs.length > 0) {
          const keys = Object.keys(uSnap.docs[0].data());
          console.log('[USER FIELDS]', keys);
          const found = USERNAME_CANDIDATES.find(c => keys.includes(c));
          if (found) {
            detectedNameField.current = found;
            console.log('[SEARCH] Detected username field:', found);
          }
        }

        if (pSnap.docs.length > 0) {
          console.log('[POST FIELDS]', Object.keys(pSnap.docs[0].data()));
        }

        setSuggestedUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setTrendingPosts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('[SearchScreen] Default load error:', e.message);
      } finally {
        setDefaultLoading(false);
      }
    })();
  }, []);

  const runSearch = useCallback(async text => {
    setLoading(true);
    try {
      const lower = text.toLowerCase();

      const [userSnap, postSnap] = await Promise.all([
        searchUsersByName(text, detectedNameField.current),
        getAllPostsForSearch(),
      ]);

      const nameMatchUsers = userSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
      const foundIds = new Set(nameMatchUsers.map(u => u.id));

      const matchedPosts = postSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(post => extractPostText(post).toLowerCase().includes(lower))
        .sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
        );

      const authorIds = [
        ...new Set(
          matchedPosts
            .map(p => extractAuthorId(p))
            .filter(id => id && !foundIds.has(id)),
        ),
      ].slice(0, 5);

      if (authorIds.length > 0) {
        const snaps = await Promise.all(authorIds.map(id => getUserById(id)));
        snaps.forEach(snap => {
          if (snap.exists) nameMatchUsers.push({ id: snap.id, ...snap.data() });
        });
      }

      console.log(
        `[SEARCH] "${text}" → ${nameMatchUsers.length} users, ${matchedPosts.length} posts`,
      );
      setUserResults(nameMatchUsers);
      setPostResults(matchedPosts);
    } catch (e) {
      console.error('[SearchScreen] Search error:', e.code, e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setUserResults([]);
      setPostResults([]);
      return;
    }
    const timer = setTimeout(() => runSearch(trimmed), 400);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const handleUserPress = user =>
    navigation.navigate('UserProfile', { userId: user.uid ?? user.id });

  const handlePostPress = post => navigation.navigate('PostDetail', { post });

  const handleFollow = user => {
    console.log('[Follow]', user.id);
  };

  const buildSearchList = () => {
    const data = [];
    if (userResults.length > 0) {
      data.push({ _type: 'section', _key: '__uh__', title: 'People' });
      userResults.forEach(u =>
        data.push({ _type: 'user', _key: `u-${u.id}`, ...u }),
      );
    }
    if (postResults.length > 0) {
      data.push({ _type: 'section', _key: '__ph__', title: 'Posts' });
      postResults.forEach(p =>
        data.push({ _type: 'post', _key: `p-${p.id}`, ...p }),
      );
    }
    if (!loading && userResults.length === 0 && postResults.length === 0) {
      data.push({ _type: 'empty', _key: '__empty__' });
    }
    return data;
  };

  const renderSearchItem = ({ item }) => {
    switch (item._type) {
      case 'section':
        return <SectionTitle title={item.title} />;
      case 'user':
        return (
          <UserRow
            item={item}
            onPress={handleUserPress}
            onFollow={handleFollow}
          />
        );
      case 'post':
        return <PostRow item={item} onPress={handlePostPress} />;
      case 'empty':
        return <EmptyState query={query.trim()} />;
      default:
        return null;
    }
  };

  const isSearching = query.trim().length >= 2;
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchMagnifier}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users and posts..."
            placeholderTextColor="#ADADAD"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>
      </View>

      {loading && (
        <ActivityIndicator style={styles.loader} size="small" color="#8B5CF6" />
      )}

      {isSearching ? (
        <FlatList
          data={buildSearchList()}
          keyExtractor={item => item._key}
          renderItem={renderSearchItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {defaultLoading ? (
            <ActivityIndicator
              style={styles.loader}
              size="small"
              color="#8B5CF6"
            />
          ) : (
            <>
              {suggestedUsers.length > 0 && (
                <>
                  <SectionTitle title="Suggested Users" />
                  {suggestedUsers.map(u => (
                    <UserRow
                      key={u.id}
                      item={u}
                      onPress={handleUserPress}
                      onFollow={handleFollow}
                    />
                  ))}
                </>
              )}

              {trendingPosts.length > 0 && (
                <>
                  <SectionTitle title="Trending Posts" />
                  <View style={styles.grid}>
                    {trendingPosts.map(post => {
                      const img = extractPostImage(post);
                      return (
                        <TouchableOpacity
                          key={post.id}
                          style={styles.gridCell}
                          onPress={() => handlePostPress(post)}
                          activeOpacity={0.8}
                        >
                          {img ? (
                            <Image
                              source={{ uri: img }}
                              style={styles.gridImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View
                              style={[styles.gridImage, styles.gridFallback]}
                            >
                              <Text
                                style={styles.gridFallbackText}
                                numberOfLines={4}
                              >
                                {extractPostText(post)}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {!defaultLoading &&
                suggestedUsers.length === 0 &&
                trendingPosts.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyHint}>
                      Type to start searching
                    </Text>
                  </View>
                )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.3,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#fff',
  },
  searchMagnifier: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111', paddingVertical: 0 },
  loader: { marginTop: 20 },
  listContent: { paddingBottom: 32 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  avatarFallback: {
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700' },
  userInfo: { flex: 1, marginRight: 10 },
  userName: { fontSize: 15, fontWeight: '600', color: '#111' },
  userMeta: { fontSize: 13, color: '#888', marginTop: 2 },
  followBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  followBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  postThumb: {
    width: 58,
    height: 58,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#EEE',
  },
  postThumbFallback: {
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postThumbIcon: { fontSize: 22 },
  postInfo: { flex: 1 },
  postText: { fontSize: 14, fontWeight: '500', color: '#111', lineHeight: 20 },
  postMeta: { fontSize: 12, color: '#888', marginTop: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: GRID_GAP,
  },
  gridCell: { width: GRID_SIZE, height: GRID_SIZE },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#E5E5E5',
  },
  gridFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#EDE9FE',
  },
  gridFallbackText: {
    fontSize: 10,
    color: '#6D4CC7',
    textAlign: 'center',
    lineHeight: 14,
  },
  emptyState: { paddingVertical: 56, alignItems: 'center' },
  emptyIcon: { fontSize: 42, marginBottom: 14 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
  },
  emptyHint: { fontSize: 14, color: '#AAA', textAlign: 'center' },
});

export default SearchScreen;
