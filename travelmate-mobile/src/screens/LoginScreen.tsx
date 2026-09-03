/**
 * Login Screen for TravelMate Mobile
 */

import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { socialAuthService } from '../services/socialAuthService';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useTheme } from '../contexts/ThemeContext';
import { ThemePalette, fonts, type, spacing, radii } from '../theme';

WebBrowser.maybeCompleteAuthSession();

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { login, loginWithGoogle, loginWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      Alert.alert('Google 로그인 실패', error.message || 'Google 계정으로 로그인할 수 없습니다.');
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsSocialLoading(true);
    try {
      await loginWithApple();
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        Alert.alert('Apple 로그인 실패', error.message || 'Apple 계정으로 로그인할 수 없습니다.');
      }
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
    } catch (error: any) {
      Alert.alert('로그인 실패', error.message || '이메일 또는 비밀번호를 확인해주세요.');
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
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Fryndo</Text>
          <Text style={styles.tagline}>AI 여행 동반자</Text>
        </View>

        {/* Social Login */}
        <View style={styles.socialContainer}>
          {isGoogleAvailable && (
            <GoogleAuthButton
              label="Google로 계속하기"
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
              onPress={handleAppleLogin}
              disabled={anyLoading}
            >
              <Text style={[styles.socialIcon, styles.appleIcon]}>{''}</Text>
              <Text style={[styles.socialButtonText, styles.appleButtonText]}>Apple로 계속하기</Text>
            </TouchableOpacity>
          )}

          {isSocialLoading && (
            <ActivityIndicator style={styles.socialLoading} color={palette.primary} />
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="이메일"
            placeholderTextColor={palette.placeholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor={palette.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, anyLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={anyLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={palette.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>로그인</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>계정이 없으신가요?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (palette: ThemePalette) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenH,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    ...type.display,
    color: palette.ink,
  },
  tagline: {
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
    backgroundColor: palette.background,
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
    color: palette.background,
    fontSize: 20,
  },
  socialButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: palette.ink,
  },
  appleButtonText: {
    color: palette.background,
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
    paddingHorizontal: spacing.lg,
    ...type.caption,
    color: palette.placeholder,
  },
  form: {
    gap: spacing.md,
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
    color: palette.onPrimary,
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

export default LoginScreen;
