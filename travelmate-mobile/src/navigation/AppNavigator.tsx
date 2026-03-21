/**
 * App Navigator for TravelMate Mobile
 */

import React from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { linkingConfig, setNavigationRef } from '../services/deepLinkService';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import CollectionScreen from '../screens/CollectionScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LocationDetailScreen from '../screens/LocationDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GroupsScreen from '../screens/GroupsScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PremiumScreen from '../screens/PremiumScreen';
import UserSearchScreen from '../screens/UserSearchScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import ReviewScreen from '../screens/ReviewScreen';
import MatchingScreen from '../screens/MatchingScreen';

// Contexts
import { useNotifications } from '../contexts/NotificationContext';

// Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  LocationDetail: { locationId: number };
  Settings: undefined;
  Groups: undefined;
  ChatRoom: { groupId: number; groupName: string };
  CreateGroup: undefined;
  Notifications: undefined;
  Premium: undefined;
  UserSearch: undefined;
  UserProfile: { userId: number };
  Review: { matchId: number; targetUserNickname: string };
  Matching: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  Groups: undefined;
  Collection: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab Bar Icons
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    Home: '🏠',
    Map: '🗺️',
    Groups: '💬',
    Collection: '🎨',
    Profile: '👤',
  };

  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icons[name] || '📱'}
      </Text>
    </View>
  );
};

// Auth Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: '홈' }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ tabBarLabel: '지도' }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{ tabBarLabel: '채팅' }}
      />
      <Tab.Screen
        name="Collection"
        component={CollectionScreen}
        options={{ tabBarLabel: '컬렉션' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: '프로필' }}
      />
    </Tab.Navigator>
  );
};

// App Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigationRef = React.useRef<NavigationContainerRef<RootStackParamList>>(null);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Fryndo</Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={isAuthenticated ? linkingConfig : undefined}
      onReady={() => setNavigationRef(navigationRef.current)}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="LocationDetail"
              component={LocationDetailScreen}
              options={{
                headerShown: true,
                headerTitle: '장소 상세',
                headerBackTitle: '뒤로',
                headerTintColor: '#3B82F6',
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                headerShown: true,
                headerTitle: '설정',
                headerBackTitle: '뒤로',
                headerTintColor: '#3B82F6',
              }}
            />
            <Stack.Screen
              name="ChatRoom"
              component={ChatRoomScreen}
              options={{
                headerShown: true,
                headerBackTitle: '뒤로',
                headerTintColor: '#3B82F6',
              }}
            />
            <Stack.Screen
              name="CreateGroup"
              component={CreateGroupScreen}
              options={{
                headerShown: true,
                headerTitle: '새 그룹 만들기',
                headerBackTitle: '뒤로',
                headerTintColor: '#3B82F6',
              }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                headerShown: true,
                headerTitle: '알림',
                headerBackTitle: '뒤로',
                headerTintColor: '#3B82F6',
              }}
            />
            <Stack.Screen
              name="Premium"
              component={PremiumScreen}
              options={{
                headerShown: true,
                headerTitle: '프리미엄',
                headerBackTitle: '뒤로',
                headerTintColor: '#3B82F6',
              }}
            />
            <Stack.Screen
              name="UserSearch"
              component={UserSearchScreen}
              options={{
                headerShown: true,
                headerTitle: '동행자 찾기',
                headerBackTitle: '뒤로',
                headerTintColor: '#3B82F6',
              }}
            />
            <Stack.Screen
              name="UserProfile"
              component={UserProfileScreen}
              options={{
                headerShown: true,
                headerTitle: '프로필',
                headerBackTitle: '뒤로',
                headerTintColor: '#3B82F6',
              }}
            />
            <Stack.Screen
              name="Review"
              component={ReviewScreen}
              options={{
                headerShown: true,
                headerTitle: '리뷰 작성',
                headerBackTitle: '뒤로',
                headerTintColor: '#3B82F6',
              }}
            />
            <Stack.Screen
              name="Matching"
              component={MatchingScreen}
              options={{
                headerShown: true,
                headerTitle: '매칭 관리',
                headerBackTitle: '뒤로',
                headerTintColor: '#3B82F6',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
  },
  loadingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
});

export default AppNavigator;
