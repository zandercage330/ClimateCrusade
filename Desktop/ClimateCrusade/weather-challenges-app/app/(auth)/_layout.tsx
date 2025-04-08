import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();

  // Secure redirection - don't allow authenticated users to see login screens
  useEffect(() => {
    if (loading) return; // Wait until auth state is determined
    
    if (session) {
      console.log('User already authenticated, redirecting to app');
      // Add a small delay to ensure navigation works properly
      setTimeout(() => {
        router.replace('/(app)');
      }, 100);
    }
  }, [session, loading, router]);

  // Show loading indicator while checking auth
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10 }}>Checking authentication...</Text>
      </View>
    );
  }

  // Don't render login UI if already authenticated
  if (session) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10 }}>Already logged in, redirecting...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="login" 
        options={{
          title: "Login",
          // Prevent gesture-based navigation
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
} 