import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, AuthChangeEvent, User, AuthError, SignInWithPasswordCredentials, Provider } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Make sure expo-web-browser is dismissible
WebBrowser.maybeCompleteAuthSession();

// Constants for refresh handling
const MIN_REFRESH_INTERVAL = 60 * 1000; // Minimum 60 seconds between refreshes
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes between scheduled refreshes

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (credentials: SignInWithPasswordCredentials) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
  signInWithSocial: (provider: Provider) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextProps>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  refreshSession: async () => {},
  signInWithSocial: async () => ({ error: null }),
});

export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Track when the session was last refreshed
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  // Flag to track refresh in progress
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Handle Deep Link for OAuth Redirect ---
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      // Check if the URL contains the access_token and refresh_token from Supabase OAuth
      if (url.includes('#access_token=') && url.includes('&refresh_token=')) {
        const params = url.split('#')[1];
        const accessToken = params.split('&').find(param => param.startsWith('access_token='))?.split('=')[1];
        const refreshToken = params.split('&').find(param => param.startsWith('refresh_token='))?.split('=')[1];

        if (accessToken && refreshToken) {
          supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
            .then(({ error }) => {
              if (error) {
                console.error("Error setting session from deep link:", error);
                Alert.alert('Authentication Error', 'Failed to set session from social login.');
              } else {
                 console.log("Session successfully set from deep link.");
                 // The onAuthStateChange listener should handle the rest
              }
            });
        } else {
            console.warn("Could not extract tokens from deep link URL:", url);
        }
      }
    };

    // Add listener for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check initial URL in case the app was opened via deep link
    Linking.getInitialURL().then(url => {
        if (url) {
            handleDeepLink({ url });
        }
    });

    return () => {
      // Remove listener on cleanup
      subscription.remove();
    };
  }, []);
  // --- End Handle Deep Link ---

  // Function to refresh the session with rate limiting
  const refreshSession = async () => {
    try {
      const now = Date.now();
      
      // Don't refresh if another refresh is in progress
      if (isRefreshing) {
        console.log('Refresh already in progress, skipping.');
        return;
      }
      
      // Check if we've refreshed too recently
      if (now - lastRefresh < MIN_REFRESH_INTERVAL) {
        console.log(`Refresh attempt too soon. Last refresh was ${(now - lastRefresh)/1000}s ago.`);
        return;
      }
      
      setIsRefreshing(true);
      console.log('Refreshing session...');
      
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }
      
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLastRefresh(now);
    } catch (error) {
      console.error('Failed to refresh session:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLastRefresh(Date.now());
      } catch (error) {
        console.error('Unexpected error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setLastRefresh(Date.now());
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Periodic session refresh - SINGLE SOURCE OF TRUTH for periodic refreshes
  useEffect(() => {
    // Don't set up refresh timer if there's no session
    if (!session) return;
    
    console.log('Setting up session refresh timer');
    
    // Refresh token periodically to prevent expiration
    const timer = setInterval(() => {
      refreshSession();
    }, REFRESH_INTERVAL); // 15 minutes

    return () => clearInterval(timer);
  }, [session]);

  // Check for session expiration - only do the check, don't refresh here
  useEffect(() => {
    if (!session) return;
    
    // Check if session might be expiring soon (within 5 minutes)
    const checkSessionInterval = 60 * 1000; // every minute
    
    const timer = setInterval(() => {
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const expiresAtMs = expiresAt * 1000; // convert to milliseconds
        const now = Date.now();
        const fiveMinutesFromNow = now + (5 * 60 * 1000);
        
        // If session expires within 5 minutes, flag for refresh
        // But let the main refresh function handle the actual refresh with rate limiting
        if (expiresAtMs < fiveMinutesFromNow) {
          console.log('Session expiring soon, requesting refresh...');
          refreshSession();
        }
      }
    }, checkSessionInterval);
    
    return () => clearInterval(timer);
  }, [session]);

  const signIn = async (credentials: SignInWithPasswordCredentials) => {
    setLoading(true);
    try {
      // We know we're using email/password signin
      const { error } = await supabase.auth.signInWithPassword({
        email: ('email' in credentials ? credentials.email : '').trim().toLowerCase(),
        password: credentials.password
      });
      
      if (error) {
        console.error('Error signing in:', error);
        return { error };
      }
      
      setLastRefresh(Date.now());
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // --- Add signInWithSocial function ---
  const signInWithSocial = async (provider: Provider) => {
    setLoading(true);
    try {
      // Create a URL for deep linking back to the app
      // Use the scheme registered in app.json (or expo-constants if available)
      // For development in Expo Go, we'll use a special URL format
      let redirectUrl;
      
      if (Platform.OS === 'web') {
        // For web, use the current origin
        redirectUrl = window.location.origin + '/auth/callback';
      } else {
        // For native, use expo-linking with the proper scheme
        redirectUrl = Linking.createURL('auth/callback');
        
        // If you need to support Expo Go, uncomment and customize the following:
        // if (redirectUrl.startsWith('exp://')) {
        //   console.log('Using Expo Go URL format for OAuth redirect');
        //   redirectUrl = 'https://auth.expo.io/@your-expo-username/climate-crusade';
        // }
        
        // For development and testing purposes, we can also use this universal solution:
        if (!redirectUrl.startsWith('climatecrusade://')) {
          console.log('Using development redirect URL');
          redirectUrl = 'https://auth.expo.io/@your-expo-username/ClimateCrusade/auth/callback';
        }
      }

      console.log(`Attempting social sign-in with ${provider}, redirecting to: ${redirectUrl}`);

      // Initiate OAuth flow with Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // Important for manual handling
        },
      });

      if (error) {
        console.error(`Error initiating ${provider} sign-in:`, error);
        Alert.alert('Authentication Error', `Failed to start ${provider} sign-in: ${error.message}`);
        return { error };
      }

      if (data.url) {
        // Important: Use preferEphemeralSession on iOS to avoid CORS issues
        const browserOptions = Platform.OS === 'ios' 
          ? { preferEphemeralSession: true }  // Use ephemeral session on iOS
          : {};
          
        // Open the auth URL in a browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url, 
          redirectUrl,
          browserOptions
        );

        if (result.type === 'success') {
          // Get the URL parameters from the redirect
          const url = result.url;
          console.log(`OAuth flow successful, processing redirect URL: ${url}`);
          
          // Check if the URL has a code parameter (for OAuth code flow)
          if (url.includes('?code=') || url.includes('&code=')) {
            // Exchange the code for a session
            const params = new URL(url).searchParams;
            const code = params.get('code');
            
            if (code) {
              console.log('Exchanging authorization code for session');
              const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
              if (sessionError) {
                console.error('Error exchanging code for session:', sessionError);
                Alert.alert('Authentication Error', 'Failed to complete sign-in process.');
                return { error: sessionError };
              }
              // Auth state change listener will handle the rest
            }
          } else if (url.includes('#access_token=')) {
            // The deep link handler should take care of this case
            console.log('Access token found in URL, deep link handler will process');
          } else {
            console.warn('No authentication tokens found in redirect URL');
          }
        } else if (result.type !== 'cancel' && result.type !== 'dismiss') {
          console.warn(`WebBrowser result type: ${result.type}`);
          Alert.alert('Authentication Issue', `The ${provider} sign-in process was not completed.`);
        } else {
          console.log(`${provider} OAuth flow was cancelled or dismissed by the user.`);
        }
      } else {
        console.error(`No URL returned from signInWithOAuth for ${provider}`);
        Alert.alert('Authentication Error', `Could not get authentication URL for ${provider}.`);
        return { error: new AuthError(`No URL returned for ${provider} OAuth.`) };
      }

      return { error: null }; // Indicate initiation was successful (or handled)

    } catch (err: any) {
      console.error(`Unexpected error during ${provider} sign-in:`, err);
      Alert.alert('Authentication Error', `An unexpected error occurred during ${provider} sign-in.`);

      // Check if the caught error is already an AuthError
      if (err instanceof AuthError) {
        return { error: err };
      }

      // Otherwise, return a generic error object structure
      const errorResponse: { error: AuthError | null } = {
         error: {
             name: 'GenericSocialSignInError',
             message: err.message || 'An unknown error occurred during social sign-in.',
             status: undefined,
         } as AuthError 
      };

      return errorResponse;

    } finally {
      setLoading(false);
    }
  };
  // --- End signInWithSocial function ---

  const signOut = async () => {
    setLoading(true);
    try {
      // Clear any sensitive data in memory
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        return { error };
      }
      
      // Additional cleanup
      setSession(null);
      setUser(null);
      
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signOut,
    refreshSession,
    signInWithSocial,
  };

  if (loading && session === undefined) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 