import React, { useEffect } from 'react';
import { Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { socialAuthService } from '../services/socialAuthService';

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
      style={buttonStyle}
      onPress={() => promptAsync()}
      disabled={!request || disabled}
    >
      <Text style={iconStyle}>G</Text>
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
};

export default GoogleAuthButton;
