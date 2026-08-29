/**
 * Register Screen for TravelMate Mobile
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { socialAuthService } from '../services/socialAuthService';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { palette, fonts, type, spacing, radii } from '../theme';

WebBrowser.maybeCompleteAuthSession();

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register, loginWithGoogle, loginWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  const isGoogleAvailable = socialAuthService.isGoogleSignInConfigured();

  useEffect(() => {
    socialAuthService.isAppleSignInAvailable().then(setIsAppleAvailable);
  }, []);

  const handleGoogleResponse = async (idToken?: string, accessToken?: string) => {
    if (!idToken && !accessToken) return;
    setIsSocialLoading(true);
    try {
      await loginWithGoogle(idToken, accessToken);
    } catch (error: any) {
      Alert.alert('Google 가입 실패', error.message || 'Google 계정으로 가입할 수 없습니다.');
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleAppleSignup = async () => {
    setIsSocialLoading(true);
    try {
      await loginWithApple();
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        Alert.alert('Apple 가입 실패', error.message || 'Apple 계정으로 가입할 수 없습니다.');
      }
    } finally {
      setIsSocialLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !nickname) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('오류', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('오류', '비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (nickname.length < 2 || nickname.length > 20) {
      Alert.alert('오류', '닉네임은 2~20자 사이로 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await register({ email, password, nickname });
    } catch (error: any) {
      Alert.alert('회원가입 실패', error.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const anyLoading = isLoading || isSocialLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>회원가입</Text>
            <Text style={styles.subtitle}>Fryndo와 함께 여행을 시작하세요</Text>
          </View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            {isGoogleAvailable && (
              <GoogleAuthButton
                label="Google로 가입하기"
                buttonStyle={[styles.socialButton, styles.googleButton]}
                iconStyle={styles.socialIcon}
                textStyle={styles.socialButtonText}
                disabled={anyLoading}
                onAuthenticated={handleGoogleResponse}
              />
            )}

            {isAppleAvailable && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                onPress={handleAppleSignup}
                disabled={anyLoading}
              >
                <Text style={[styles.socialIcon, styles.appleIcon]}>{''}</Text>
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>Apple로 가입하기</Text>
              </TouchableOpacity>
            )}

            {isSocialLoading && (
              <ActivityIndicator style={styles.socialLoading} color={palette.primary} />
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는 이메일로 가입</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor={palette.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>닉네임</Text>
              <TextInput
                style={styles.input}
                placeholder="2~20자 닉네임"
                placeholderTextColor={palette.placeholder}
                value={nickname}
                onChangeText={setNickname}
                autoCapitalize="none"
                maxLength={20}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>비밀번호</Text>
              <TextInput
                style={styles.input}
                placeholder="8자 이상"
                placeholderTextColor={palette.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>비밀번호 확인</Text>
              <TextInput
                style={styles.input}
                placeholder="비밀번호 재입력"
                placeholderTextColor={palette.placeholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, anyLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={anyLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={palette.white} />
              ) : (
                <Text style={styles.buttonText}>가입하기</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>이미 계정이 있으신가요?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>로그인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenH,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...type.title,
    color: palette.ink,
  },
  subtitle: {
    ...type.bodySmall,
    color: palette.textTertiary,
    marginTop: spacing.sm,
  },
  socialContainer: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  socialButton: {
    height: 54,
    borderRadius: radii.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleButton: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.outline,
  },
  appleButton: {
    backgroundColor: palette.ink,
  },
  socialIcon: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#4285F4', // Google brand blue (kept per brand guidelines)
  },
  appleIcon: {
    color: palette.white,
    fontSize: 20,
  },
  socialButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: palette.ink,
  },
  appleButtonText: {
    color: palette.white,
  },
  socialLoading: {
    marginTop: spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.hairline,
  },
  dividerText: {
    paddingHorizontal: spacing.md,
    ...type.caption,
    color: palette.placeholder,
  },
  form: {
    gap: spacing.lg,
  },
  inputContainer: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: palette.textSecondary,
  },
  input: {
    height: 52,
    borderRadius: radii.input,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    fontFamily: fonts.medium,
    backgroundColor: palette.surface,
    color: palette.ink,
  },
  button: {
    height: 54,
    backgroundColor: palette.primary,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...type.button,
    color: palette.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  footerText: {
    ...type.bodySmall,
    color: palette.textTertiary,
  },
  linkText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: palette.primary,
  },
});

export default RegisterScreen;
