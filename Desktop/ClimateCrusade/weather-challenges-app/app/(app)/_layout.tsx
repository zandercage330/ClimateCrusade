import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, Text, Alert, BackHandler } from 'react-native';

export default function AppLayout() {
  const { user, session, loading, refreshSession } = useAuth();
  const router = useRouter();
  
  // Initial authentication check
  useEffect(() => {
    if (!loading && !session) {
      console.log('No active session, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [session, loading, router]);

  // Session expiration check
  useEffect(() => {
    if (!session) return;
    
    // Check if token has expired
    const now = Math.floor(Date.now() / 1000); // current time in seconds
    const expiresAt = session.expires_at;
    
    if (expiresAt && now >= expiresAt) {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please log in again.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  }, [session, router]);

  // Handle back button to prevent navigating back to auth screens
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const currentRoute = router.canGoBack();
      
      // If trying to go back and we're authenticated, prevent going back to login
      if (session && currentRoute) {
        // Allow normal back behavior within the app
        return false;
      }
      
      // Prevent going back to login by consuming the event
      return true;
    });
    
    return () => backHandler.remove();
  }, [session, router]);

  // Show loading indicator while checking auth
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10 }}>Verifying your session...</Text>
      </View>
    );
  }

  // Don't render tabs if not authenticated
  if (!session) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f5f5f5',
          },
          headerTintColor: '#333',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#64748b',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="challenges"
          options={{
            title: 'Challenges',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="trophy-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
} 