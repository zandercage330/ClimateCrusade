import { View, Text, StyleSheet, ActivityIndicator, TextInput, Button, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { useLocation } from '../../src/hooks/useLocation'; // Corrected path (was ../src)
import { getWeatherForCoords, supabase } from '../../src/lib/supabase'; // Corrected path (was ../src) and consolidated import
import WeatherDisplay from '../../src/components/WeatherDisplay'; // Corrected path (was ../src)
// Removed duplicate supabase import from supabaseClient
import { Session, AuthChangeEvent } from '@supabase/supabase-js'; // Added AuthChangeEvent
import { useAuth } from '../../src/context/AuthContext'; // Corrected path (was ../../)

// Define an interface for the expected weather data structure
interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: {
    main: string;
    description: string;
    icon: string; // OpenWeatherMap icon code
  }[];
  wind: {
    speed: number;
  };
}

export default function Home() {
  const location = useLocation();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // --- Authentication State ---
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  // --- End Authentication State ---

  const { user, signOut } = useAuth();

  useEffect(() => {
    // Fetch initial session
    // Added explicit type for session in destructuring
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
    });

    // Listen for auth changes
    // Added explicit types for _event and session
    const { data: authListener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      console.log("Auth State Change:", _event, session ? 'Session Exists' : 'No Session');
      setSession(session);
    });

    // Cleanup listener on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      if (location.latitude && location.longitude) {
        setIsLoadingWeather(true);
        setWeatherError(null);
        console.log(`Fetching weather for: ${location.latitude}, ${location.longitude}`);
        try {
          const data = await getWeatherForCoords(location.latitude, location.longitude);
          // Ensure the received data matches the expected structure
          if (data && data.main && data.weather && data.weather.length > 0) {
             setWeatherData(data as WeatherData); // Type assertion after check
             console.log("Weather data received:", data);
          } else {
            console.error("Received weather data is not in the expected format:", data);
            setWeatherError("Weather data format is incorrect.");
          }
        } catch (error: any) {
          console.error("Error fetching weather:", error);
          setWeatherError(error.message || 'Failed to fetch weather data.');
        } finally {
          setIsLoadingWeather(false);
        }
      } else if (!location.loading && location.errorMsg) {
         // If location hook finished loading but has an error, don't try fetching weather
         console.log("Skipping weather fetch due to location error:", location.errorMsg);
      } else if (!location.loading && location.permissionGranted === false) {
         console.log("Skipping weather fetch due to missing location permission.");
      }
    };

    // Only fetch weather if location is available and permission granted
    if (!location.loading && location.permissionGranted === true && location.latitude && location.longitude) {
        fetchWeather();
    }
  }, [location.latitude, location.longitude, location.loading, location.permissionGranted, location.errorMsg]); // Dependencies for the effect

  // --- Authentication Handlers ---
  // Removed unused handleLogin as login is now handled by (auth)/login.tsx
  // const handleLogin = async () => {
  //   setAuthLoading(true);
  //   const { error } = await supabase.auth.signInWithPassword({
  //     email: email,
  //     password: password,
  //   });
  //
  //   if (error) Alert.alert('Login Error', error.message);
  //   setAuthLoading(false);
  // };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      Alert.alert('Logout Failed', error.message);
    } else {
      // Navigation back to login screen is handled by the root layout
      console.log('Logout successful');
    }
  };
  // --- End Authentication Handlers ---

  const renderContent = () => {
    // 1. Handle Location Loading/Errors first
    if (location.loading) {
      return <ActivityIndicator size="large" color="#007AFF" />;
    }
    if (location.permissionGranted === false) {
        return <Text style={styles.errorText}>Location permission denied. Please enable it in settings.</Text>;
    }
    if (location.errorMsg) {
      return <Text style={styles.errorText}>Error getting location: {location.errorMsg}</Text>;
    }
    if (!location.latitude || !location.longitude) {
        // This case might occur briefly or if something unexpected happens
        return <Text style={styles.infoText}>Waiting for location data...</Text>;
    }

    // 2. Handle Weather Loading/Errors
    if (isLoadingWeather) {
      return <ActivityIndicator size="large" color="#007AFF" />;
    }
    if (weatherError) {
      return <Text style={styles.errorText}>Error fetching weather: {weatherError}</Text>;
    }

    // 3. Display Weather Data
    if (weatherData) {
      return <WeatherDisplay weatherData={weatherData} />;
    }

    // Default/Fallback case (should ideally not be reached if logic is sound)
    return <Text style={styles.infoText}>Loading weather information...</Text>;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Climate Crusade</Text>
      {/* Remove subtitle from here, moved into renderContent */}
      {/* <Text style={styles.subtitle}>Current Weather:</Text> */}
      {renderContent()}
      <StatusBar style="auto" />
      {user && <Text style={styles.email}>Logged in as: {user.email}</Text>}
      <View style={styles.buttonContainer}>
        <Button title="Logout" onPress={handleLogout} color="#dc2626" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8', // Light background color
    alignItems: 'center',
    // justifyContent: 'center', // Remove this to allow content to flow from top
    paddingTop: 60, // Add padding at the top
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28, // Larger title
    fontWeight: 'bold',
    marginBottom: 8, // Reduced margin
    color: '#1a2a3a', // Darker color
  },
  subtitle: {
    fontSize: 18, // Slightly larger subtitle
    textAlign: 'center',
    color: '#556677', // Softer color
    marginBottom: 20, // Increased margin before content
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  infoText: {
      fontSize: 16,
      color: '#556677',
      textAlign: 'center',
      marginTop: 20,
  },
  // Other styles remain the same or add new ones as needed
  // Styles for Login form
  loginContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 30,
  },
  // Removed unused loginTitle and input styles
  // loginTitle: {
  //   fontSize: 22,
  //   fontWeight: '600',
  //   marginBottom: 20,
  //   color: '#1a2a3a',
  // },
  // input: {
  //   width: '90%',
  //   height: 45,
  //   borderColor: '#cccccc',
  //   borderWidth: 1,
  //   borderRadius: 8,
  //   marginBottom: 15,
  //   paddingHorizontal: 10,
  //   backgroundColor: '#ffffff',
  // },
  buttonContainer: {
    marginTop: 30, // Adjusted margin
    width: '80%', // Adjusted width
  },
  // Container for logged-in content
  loggedInContainer: {
     width: '100%',
     alignItems: 'center',
  },
  email: {
    fontSize: 16,
    marginBottom: 20,
    color: 'gray',
  },
}); 