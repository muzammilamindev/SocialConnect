import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Produces a deterministic chat document ID from two UIDs.
 * Sorting alphabetically guarantees uid_A + uid_B and uid_B + uid_A
 * always resolve to the exact same Firestore document.
 */
const getChatId = (uid1, uid2) => [uid1, uid2].sort().join('_');

// ─── Component ──────────────────────────────────────────────────────────────

const ChatScreen = ({ route, navigation }) => {
  // otherUser is passed from UserProfileScreen: { uid, displayName }
  const { otherUser } = route.params;

  // The currently signed-in user
  const currentUser = auth().currentUser;

  // Stable chat document ID shared by both participants
  const chatId = getChatId(currentUser.uid, otherUser.uid);

  // Live list of message objects from Firestore
  const [messages, setMessages] = useState([]);

  // Controlled value for the text input
  const [inputText, setInputText] = useState('');

  // True while the initial snapshot is loading
  const [loading, setLoading] = useState(true);

  // Ref to the FlatList so we can call scrollToEnd imperatively
  const flatListRef = useRef(null);

  // ── Set the navigation header title to the other person's name ────────────
  useEffect(() => {
    navigation.setOptions({ title: otherUser.displayName ?? 'Chat' });
  }, [navigation, otherUser.displayName]);

  // ── Real-time Firestore listener ──────────────────────────────────────────
  useEffect(() => {
    const messagesRef = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'asc'); // oldest → newest so FlatList reads top→bottom

    const unsubscribe = messagesRef.onSnapshot(
      snapshot => {
        const fetched = snapshot.docs.map(doc => ({
          id: doc.id,       // Firestore auto-generated message ID
          ...doc.data(),    // senderId, text, createdAt
        }));
        setMessages(fetched);
        setLoading(false);
      },
      error => {
        console.error('ChatScreen onSnapshot error:', error);
        setLoading(false);
      },
    );

    // Clean up the listener when the screen unmounts
    return () => unsubscribe();
  }, [chatId]);

  // ── Auto-scroll whenever the message list grows ───────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      // Small timeout lets the FlatList finish its layout pass before scrolling
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // ── Send a message ────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return; // ignore empty sends

    // Clear the input immediately for a snappy UX feel
    setInputText('');

    try {
      const chatDocRef = firestore().collection('chats').doc(chatId);

      // Ensure the parent chat document exists (upsert with merge so we never
      // overwrite an existing doc, but create it on first message)
      await chatDocRef.set(
        {
          participants: [currentUser.uid, otherUser.uid],
          lastMessage: text,
          lastMessageAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }, // non-destructive — safe to call every time
      );

      // Add the message to the subcollection
      await chatDocRef.collection('messages').add({
        senderId: currentUser.uid,
        text,
        createdAt: firestore.FieldValue.serverTimestamp(), // server-side timestamp for reliable ordering
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore the text so the user doesn't lose their message on failure
      setInputText(text);
    }
  };

  // ── Render a single message bubble ───────────────────────────────────────
  const renderMessage = ({ item }) => {
    const isMine = item.senderId === currentUser.uid;

    return (
      <View
        style={[
          styles.messageBubble,
          isMine ? styles.myBubble : styles.theirBubble,
        ]}
      >
        <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText]}>
          {item.text}
        </Text>
        {/* Show a human-readable timestamp if the server has written it yet */}
        {item.createdAt?.toDate && (
          <Text style={styles.timestamp}>
            {item.createdAt.toDate().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>
    );
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/*
        KeyboardAvoidingView pushes the input bar above the soft keyboard.
        'padding' works well on iOS; 'height' is more reliable on Android.
      */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ── Message list ── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          // Show a hint when no messages have been sent yet
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No messages yet. Say hello! 👋
            </Text>
          }
          // Keep the list pinned to the bottom as new items arrive
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        {/* ── Input bar ── */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message…"
            placeholderTextColor="#999"
            multiline           // lets the input grow for longer messages
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              // Dim the button visually when there's nothing to send
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexGrow: 1,           // ensures the empty state centres correctly
    justifyContent: 'flex-end', // messages stack from the bottom up
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 4,
  },
  myBubble: {
    backgroundColor: '#4A90E2',  // blue for sent messages
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,  // classic "tail" visual
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',  // white card for received messages
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myText: {
    color: '#FFFFFF',
  },
  theirText: {
    color: '#1A1A1A',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  emptyText: {
    textAlign: 'center',
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 40,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',     // aligns send button to bottom for multiline input
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,             // caps how tall the input grows
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: '#1A1A1A',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#B0C9EE',  // muted blue when disabled
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default ChatScreen;