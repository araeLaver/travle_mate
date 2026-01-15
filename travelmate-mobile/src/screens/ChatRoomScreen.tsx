/**
 * Chat Room Screen for TravelMate Mobile
 * Real-time chat within a group
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { chatService, ChatMessage, GroupMember } from '../services/chatService';
import * as Location from 'expo-location';

type ChatRoomScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatRoom'>;
type ChatRoomScreenRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;

interface Props {
  navigation: ChatRoomScreenNavigationProp;
  route: ChatRoomScreenRouteProp;
}

const ChatRoomScreen: React.FC<Props> = ({ navigation, route }) => {
  const { groupId, groupName } = route.params;
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      const response = await chatService.getMessages(groupId);
      setMessages(response.content.reverse());
      await chatService.markAsRead(groupId);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const loadMembers = useCallback(async () => {
    try {
      const memberList = await chatService.getGroupMembers(groupId);
      setMembers(memberList);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  }, [groupId]);

  useEffect(() => {
    loadMessages();
    loadMembers();

    // Poll for new messages every 5 seconds
    const pollInterval = setInterval(loadMessages, 5000);

    return () => clearInterval(pollInterval);
  }, [loadMessages, loadMembers]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: groupName,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowMembers(!showMembers)}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>
            {members.length} 명
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, groupName, members.length, showMembers]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      const newMessage = await chatService.sendMessage(groupId, {
        content: inputText.trim(),
        messageType: 'TEXT',
      });
      setMessages(prev => [...prev, newMessage]);
      setInputText('');

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('오류', '메시지 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '위치 공유를 위해 위치 권한이 필요합니다.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocoding to get location name
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const locationName = address
        ? `${address.city || ''} ${address.street || ''}`.trim()
        : '현재 위치';

      const newMessage = await chatService.sendMessage(groupId, {
        content: locationName,
        messageType: 'LOCATION',
        latitude,
        longitude,
        locationName,
      });
      setMessages(prev => [...prev, newMessage]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('오류', '위치 공유에 실패했습니다.');
    }
  };

  const openLocation = (latitude: number, longitude: number) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMyMessage = item.isMine;
    const showAvatar = !isMyMessage && (index === 0 || messages[index - 1]?.senderId !== item.senderId);
    const showName = showAvatar;

    // System message
    if (item.messageType === 'SYSTEM') {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isMyMessage && styles.messageRowRight]}>
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              item.senderProfileImageUrl ? (
                <Image source={{ uri: item.senderProfileImageUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{item.senderNickname.charAt(0)}</Text>
                </View>
              )
            ) : (
              <View style={styles.avatarSpacer} />
            )}
          </View>
        )}

        <View style={[styles.messageBubbleContainer, isMyMessage && styles.messageBubbleContainerRight]}>
          {showName && (
            <Text style={styles.senderName}>{item.senderNickname}</Text>
          )}

          {item.messageType === 'LOCATION' ? (
            <TouchableOpacity
              style={[styles.locationBubble, isMyMessage && styles.myLocationBubble]}
              onPress={() => openLocation(item.latitude!, item.longitude!)}
            >
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={[styles.locationText, isMyMessage && styles.myMessageText]}>
                {item.locationName || item.content}
              </Text>
              <Text style={[styles.locationHint, isMyMessage && styles.myLocationHint]}>
                탭하여 지도 열기
              </Text>
            </TouchableOpacity>
          ) : item.messageType === 'IMAGE' ? (
            <TouchableOpacity style={styles.imageBubble}>
              <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.messageBubble, isMyMessage && styles.myMessageBubble]}>
              <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
                {item.content}
              </Text>
            </View>
          )}

          <Text style={[styles.messageTime, isMyMessage && styles.messageTimeRight]}>
            {new Date(item.createdAt).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderMemberItem = ({ item }: { item: GroupMember }) => (
    <View style={styles.memberItem}>
      {item.profileImageUrl ? (
        <Image source={{ uri: item.profileImageUrl }} style={styles.memberAvatar} />
      ) : (
        <View style={[styles.memberAvatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{item.nickname.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.nickname}</Text>
        <Text style={styles.memberRole}>
          {item.role === 'OWNER' ? '방장' : item.role === 'ADMIN' ? '관리자' : '멤버'}
        </Text>
      </View>
      {item.isOnline && <View style={styles.onlineIndicator} />}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Members Panel */}
      {showMembers && (
        <View style={styles.membersPanel}>
          <Text style={styles.membersPanelTitle}>멤버 ({members.length}명)</Text>
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton} onPress={handleSendLocation}>
          <Text style={styles.attachButtonText}>📍</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>전송</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  membersPanel: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  membersPanelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  memberItem: {
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberInfo: {
    alignItems: 'center',
    marginTop: 4,
  },
  memberName: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  memberRole: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  onlineIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  avatarSpacer: {
    width: 36,
  },
  messageBubbleContainer: {
    maxWidth: '75%',
  },
  messageBubbleContainerRight: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  myMessageBubble: {
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    marginLeft: 4,
  },
  messageTimeRight: {
    marginRight: 4,
    marginLeft: 0,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#9CA3AF',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  myLocationBubble: {
    backgroundColor: '#3B82F6',
  },
  locationIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  locationHint: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  myLocationHint: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  imageBubble: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachButtonText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#111827',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ChatRoomScreen;
