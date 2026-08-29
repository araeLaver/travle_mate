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
import Icon from '../components/icons/Icon';
import { palette, fonts, type, spacing, radii } from '../theme';

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
          <View style={styles.systemMessagePill}>
            <Icon name="stamp" size={14} color={palette.primary} />
            <Text style={styles.systemMessageText}>{item.content}</Text>
          </View>
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
              <Icon
                name="pin"
                size={22}
                color={isMyMessage ? palette.white : palette.primary}
              />
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
        <ActivityIndicator size="large" color={palette.primary} />
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
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleSendLocation}
          accessibilityLabel="위치 공유"
        >
          <Icon name="pin" size={20} color={palette.textSecondary} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor={palette.placeholder}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
          accessibilityLabel="전송"
        >
          {isSending ? (
            <ActivityIndicator size="small" color={palette.white} />
          ) : (
            <Icon name="send" size={20} color={palette.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundAlt,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.backgroundAlt,
  },
  headerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  headerButtonText: {
    ...type.bodySmall,
    color: palette.primary,
  },
  membersPanel: {
    backgroundColor: palette.background,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  membersPanelTitle: {
    ...type.bodySmall,
    fontFamily: fonts.bold,
    color: palette.textSecondary,
    marginBottom: spacing.md,
  },
  memberItem: {
    alignItems: 'center',
    marginRight: spacing.lg,
    position: 'relative',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberInfo: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  memberName: {
    ...type.caption,
    color: palette.textSecondary,
  },
  memberRole: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    color: palette.textMuted,
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
    borderColor: palette.white,
  },
  messagesContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-end',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: spacing.sm,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarPlaceholder: {
    backgroundColor: palette.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: palette.primary,
  },
  avatarSpacer: {
    width: 30,
  },
  messageBubbleContainer: {
    maxWidth: '75%',
  },
  messageBubbleContainerRight: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 15,
    color: palette.textMuted,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  messageBubble: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.hairline,
    borderRadius: radii.card,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myMessageBubble: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: 5,
  },
  messageText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 21,
    color: palette.ink,
  },
  myMessageText: {
    color: palette.white,
  },
  messageTime: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    color: palette.placeholder,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  messageTimeRight: {
    marginRight: spacing.xs,
    marginLeft: 0,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  systemMessagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.input,
  },
  systemMessageText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: palette.primary,
  },
  locationBubble: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.hairline,
    borderRadius: radii.card,
    padding: spacing.md,
    alignItems: 'center',
    minWidth: 150,
  },
  myLocationBubble: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  locationText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: palette.ink,
    marginTop: spacing.xs,
  },
  locationHint: {
    ...type.meta,
    color: palette.textTertiary,
    marginTop: spacing.xs,
  },
  myLocationHint: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  imageBubble: {
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: radii.card,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : spacing.md,
    backgroundColor: palette.background,
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: radii.iconButton,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radii.iconButton,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    fontFamily: fonts.medium,
    fontSize: 15,
    minHeight: 42,
    maxHeight: 100,
    color: palette.ink,
    marginLeft: spacing.sm,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: radii.iconButton,
    backgroundColor: palette.primary,
    marginLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: palette.disabled,
  },
});

export default ChatRoomScreen;
