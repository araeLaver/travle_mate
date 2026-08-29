import React, { useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { socialAuthService } from '../services/socialAuthService';
import { palette, fonts, radii } from '../theme';

interface GoogleAuthButtonProps {
  label: string;
  disabled?: boolean;
  buttonStyle: StyleProp<ViewStyle>;
  iconStyle: StyleProp<TextStyle>;
  textStyle: StyleProp<TextStyle>;
  onAuthenticated: (idToken?: string, accessToken?: string) => Promise<void>;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  label,
  disabled = false,
  buttonStyle,
  iconStyle,
  textStyle,
  onAuthenticated,
}) => {
  const [request, response, promptAsync] = Google.useAuthRequest(
    socialAuthService.getGoogleAuthConfig()
  );

  useEffect(() => {
    if (response?.type === 'success') {
      onAuthenticated(response.authentication?.idToken, response.authentication?.accessToken);
    }
  }, [onAuthenticated, response]);

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle]}
      onPress={() => promptAsync()}
      disabled={!request || disabled}
    >
      <Text style={[styles.icon, iconStyle]}>G</Text>
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Base auth-button style (Google brand guidelines: white bg, subtle border)
  button: {
    height: 54,
    borderRadius: radii.button,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.outline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#4285F4', // Google brand blue (kept per brand guidelines)
  },
  text: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: palette.ink,
  },
});

export default GoogleAuthButton;
