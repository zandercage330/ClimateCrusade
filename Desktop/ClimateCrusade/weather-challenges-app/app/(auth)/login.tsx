import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext'; // Adjust path as needed
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Example using Ionicons for social icons

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [nextLoginAttemptTime, setNextLoginAttemptTime] = useState<Date | null>(null);
  const { signIn, signInWithSocial } = useAuth();

  // Reset login attempts counter after 15 minutes
  useEffect(() => {
    if (loginAttempts >= 5 && nextLoginAttemptTime) {
      const timer = setTimeout(() => {
        setLoginAttempts(0);
        setNextLoginAttemptTime(null);
      }, Math.max(0, nextLoginAttemptTime.getTime() - Date.now()));
      
      return () => clearTimeout(timer);
    }
  }, [loginAttempts, nextLoginAttemptTime]);
  
  const validateEmail = (email: string): boolean => {
    // Basic email validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const validatePassword = (password: string): boolean => {
    // Minimum length check
    return password.length >= 6;
  };

  const handleLogin = async () => {
    // Check for too many login attempts
    if (loginAttempts >= 5) {
      const waitTimeMinutes = Math.ceil((nextLoginAttemptTime?.getTime() || 0 - Date.now()) / 60000);
      Alert.alert(
        'Too Many Attempts', 
        `Please try again after ${waitTimeMinutes} minute${waitTimeMinutes !== 1 ? 's' : ''}.`
      );
      return;
    }

    // Validate inputs
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }
    
    if (!password) {
      Alert.alert('Error', 'Please enter your password.');
      return;
    }
    
    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn({ email: email.trim().toLowerCase(), password });
      
      if (error) {
        // Increment login attempts counter
        const newAttemptCount = loginAttempts + 1;
        setLoginAttempts(newAttemptCount);
        
        // If too many attempts, set cooldown period
        if (newAttemptCount >= 5) {
          const lockoutTime = new Date();
          lockoutTime.setMinutes(lockoutTime.getMinutes() + 15);
          setNextLoginAttemptTime(lockoutTime);
          Alert.alert(
            'Too Many Failed Attempts', 
            'Please try again after 15 minutes.'
          );
        } else {
          Alert.alert('Login Failed', error.message || 'Invalid email or password.');
        }
      } else {
        // Reset login attempts on success
        setLoginAttempts(0);
        console.log('Login successful');
      }
    } catch (err) {
      Alert.alert('Login Error', 'An unexpected error occurred. Please try again later.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Add Social Login Handlers ---
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setSocialLoading(provider); // Set loading state for the specific provider
    try {
      const { error } = await signInWithSocial(provider);
      if (error) {
        // Don't count social login errors towards email/password lockout
        Alert.alert(`Sign in with ${provider} Failed`, error.message || 'An unknown error occurred.');
      }
      // On success, the AuthContext's onAuthStateChange listener will handle navigation
    } catch (err: any) {
      Alert.alert('Sign-in Error', err.message || 'An unexpected error occurred during social sign-in.');
    } finally {
      setSocialLoading(null); // Clear loading state
    }
  };
  // --- End Social Login Handlers ---

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        testID="email-input"
        accessibilityLabel="Email address input"
        editable={!loading && !socialLoading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        testID="password-input"
        accessibilityLabel="Password input"
        editable={!loading && !socialLoading}
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <Button 
          title="Login" 
          onPress={handleLogin} 
          disabled={socialLoading !== null || loading || (loginAttempts >= 5 && !!nextLoginAttemptTime)} 
        />
      )}
      
      {/* --- Add Social Login Buttons --- */}
      <View style={styles.socialLoginContainer}>
        <Text style={styles.orText}>Or continue with</Text>
        <View style={styles.socialButtonsRow}>
          {/* Google Button */}
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={() => handleSocialLogin('google')}
            disabled={loading || socialLoading !== null}
          >
            {socialLoading === 'google' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="logo-google" size={24} color="white" />
            )}
             <Text style={styles.socialButtonText}>Google</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* --- End Social Login Buttons --- */}
      
      {loginAttempts > 0 && loginAttempts < 5 && (
        <Text style={styles.attemptsText}>
          {`Failed attempts: ${loginAttempts}/5`}
        </Text>
      )}
      
      {loginAttempts >= 5 && nextLoginAttemptTime && (
        <Text style={styles.lockoutText}>
          Account temporarily locked. Try again later.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff', // Optional: Background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 5, // Optional: Rounded corners
  },
  loader: {
    marginVertical: 16,
  },
  socialLoginContainer: {
    marginTop: 25, 
    alignItems: 'center',
  },
  orText: {
    marginBottom: 15,
    color: 'gray',
    fontSize: 14,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
    minWidth: 130, // Ensure buttons have some width
    borderWidth: 1, // Add border for definition
  },
  googleButton: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  socialButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  attemptsText: {
    marginTop: 20, // Adjusted margin
    color: 'orange',
    textAlign: 'center',
  },
  lockoutText: {
    marginTop: 16,
    color: 'red',
    textAlign: 'center',
    fontWeight: 'bold',
  },
}); 