import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Animated,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const getChatId = (uid1, uid2) => [uid1, uid2].sort().join('_');

const ChatScreen = ({ route, navigation }) => {
  const { otherUser } = route.params;
  const currentUser = auth().currentUser;
  const chatId = getChatId(currentUser.uid, otherUser.uid);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const flatListRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: otherUser.displayName ?? 'Chat',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: Platform.OS === 'android' ? 8 : 4, padding: 6 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ color: 'black', fontSize: 28, fontWeight: '600' }}>
            {'‹  '}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUser.displayName]);

  // Real-time Firestore listener
  useEffect(() => {
    const messagesRef = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'asc');

    const unsubscribe = messagesRef.onSnapshot(
      snapshot => {
        const fetched = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(fetched);
        setLoading(false);
      },
      error => {
        console.error('ChatScreen onSnapshot error:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const openDeleteModal = message => {
    if (message.senderId !== currentUser.uid) return;
    setSelectedMessage(message);
    scaleAnim.setValue(0.85);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const closeDeleteModal = () => setSelectedMessage(null);

  const handleDelete = async () => {
    if (!selectedMessage) return;
    const messageToDelete = selectedMessage;

    setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
    setSelectedMessage(null);

    try {
      await firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .doc(messageToDelete.id)
        .delete();
    } catch (error) {
      console.error('Failed to delete message:', error);
      // 2. Restore the message if Firestore deletion failed
      setMessages(prev =>
        [...prev, messageToDelete].sort((a, b) => {
          const aTime = a.createdAt?.seconds ?? 0;
          const bTime = b.createdAt?.seconds ?? 0;
          return aTime - bTime;
        }),
      );
    }
  };

  // Send a message
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');

    try {
      const chatDocRef = firestore().collection('chats').doc(chatId);

      await chatDocRef.set(
        {
          participants: [currentUser.uid, otherUser.uid],
          lastMessage: text,
          lastMessageAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      await chatDocRef.collection('messages').add({
        senderId: currentUser.uid,
        text,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setInputText(text);
    }
  };

  const renderMessage = ({ item }) => {
    const isMine = item.senderId === currentUser.uid;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() => openDeleteModal(item)}
        delayLongPress={350}
      >
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myBubble : styles.theirBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMine ? styles.myText : styles.theirText,
            ]}
          >
            {item.text}
          </Text>
          {item.createdAt?.toDate && (
            <Text style={[styles.timestamp, !isMine && styles.theirTimestamp]}>
              {item.createdAt.toDate().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 56}
      >
        {/* Message list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No messages yet. Say hello! 👋</Text>
          }
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message…"
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Delete confirmation modal */}
      <Modal
        visible={!!selectedMessage}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteModal}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={closeDeleteModal}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        {/* Animated card */}
        <View style={styles.modalWrapper} pointerEvents="box-none">
          <Animated.View
            style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}
          >
            <View style={styles.modalIconWrap}>
              <Text style={styles.modalIcon}>🗑️</Text>
            </View>
            <Text style={styles.modalTitle}>Delete message?</Text>
            <Text style={styles.modalSubtitle}>
              This will permanently remove the message for everyone.
            </Text>

            <View style={styles.modalDivider} />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={closeDeleteModal}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.deleteBtn]}
                onPress={handleDelete}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

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
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 4,
  },
  myBubble: {
    backgroundColor: '#4A90E2',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
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
  theirTimestamp: {
    color: 'rgba(0,0,0,0.35)',
  },
  emptyText: {
    textAlign: 'center',
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 40,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
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
    backgroundColor: '#B0C9EE',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIcon: {
    fontSize: 24,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    margin: 4,
  },
  cancelBtn: {
    backgroundColor: '#F5F5F5',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  deleteBtn: {
    backgroundColor: '#EF4444',
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ChatScreen;
