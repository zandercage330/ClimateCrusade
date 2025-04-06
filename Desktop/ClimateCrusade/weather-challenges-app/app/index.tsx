import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { useLocation } from '../src/hooks/useLocation'; // Corrected path
import { getWeatherForCoords } from '../src/lib/supabase'; // Corrected path
import WeatherDisplay from '../src/components/WeatherDisplay'; // Corrected path

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
      <Text style={styles.subtitle}>Current Weather:</Text>
      {renderContent()}
      <StatusBar style="auto" />
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
}); 