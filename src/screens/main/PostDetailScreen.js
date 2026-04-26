import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const PostDetailScreen = ({ route, navigation }) => {
  const { post } = route.params ?? {};

  if (!post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Post not found.</Text>
      </View>
    );
  }

  const formattedDate = post.createdAt?.toDate
    ? post.createdAt.toDate().toLocaleString()
    : 'Unknown date';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
      </TouchableOpacity>

      {/* Post content */}
      <View style={styles.card}>
        <Text style={styles.contentText}>{post.content}</Text>

        <View style={styles.metaRow}>
          {/* Likes */}
          <View style={styles.metaItem}>
            <Ionicons name="heart-outline" size={16} color="#E74C3C" />
            <Text style={styles.metaText}>{post.likes ?? 0} likes</Text>
          </View>

          {/* Date */}
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
      </View>
      <View style={styles.commentsPlaceholder}>
        <Text style={styles.commentsPlaceholderText}>
          Comments coming soon…
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#999',
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  contentText: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ECECEC',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#AAA',
  },
  commentsPlaceholder: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ECECEC',
  },
  commentsPlaceholderText: {
    fontSize: 14,
    color: '#BBB',
  },
});

export default PostDetailScreen;
