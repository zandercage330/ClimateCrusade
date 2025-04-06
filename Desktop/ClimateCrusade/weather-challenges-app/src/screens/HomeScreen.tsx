import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { useLocation } from '../hooks/useLocation'; // Import the custom hook
import { getWeatherForCoords } from '../lib/supabase'; // Import the Supabase function caller

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: {
    main: string;
    description: string;
    icon: string;
  }[];
  name: string; // City name
}

export default function HomeScreen() {
  const { latitude, longitude, errorMsg: locationError, loading: locationLoading, permissionGranted } = useLocation();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Fetch weather data when latitude and longitude are available
  useEffect(() => {
    const fetchWeather = async () => {
      if (latitude && longitude) {
        setWeatherLoading(true);
        setWeatherError(null);
        console.log('Have location, attempting to fetch weather...');
        try {
          const data = await getWeatherForCoords(latitude, longitude);
          setWeatherData(data);
        } catch (error: any) {
          console.error('Error fetching weather in HomeScreen:', error);
          setWeatherError(error.message || 'Could not fetch weather');
        } finally {
          setWeatherLoading(false);
        }
      }
    };

    if (permissionGranted === true) {
      fetchWeather();
    } else if (permissionGranted === false) {
       // Handle case where permission was explicitly denied
       console.log('Skipping weather fetch due to denied location permission.');
    }

    // We depend on latitude and longitude, so re-run if they change (or permission status changes)
  }, [latitude, longitude, permissionGranted]);

  // Helper to render content based on state
  const renderContent = () => {
    if (locationLoading) {
      return <ActivityIndicator size="large" color="#0000ff" />;
    }

    if (locationError) {
      return (
        <View>
          <Text style={styles.errorText}>Location Error: {locationError}</Text>
          {/* Optionally add a button to retry or guide user to settings */}
        </View>
      );
    }

    if (!latitude || !longitude) {
      // This case might happen briefly or if permission is denied initially
      return <Text>Waiting for location data...</Text>;
    }

    // Location is available, now check weather state
    if (weatherLoading) {
      return <ActivityIndicator size="large" color="#00ff00" />;
    }

    if (weatherError) {
      return <Text style={styles.errorText}>Weather Error: {weatherError}</Text>;
    }

    if (weatherData) {
      return (
        <View>
          <Text style={styles.locationText}>Location: {weatherData.name}</Text>
          <Text style={styles.weatherText}>Temperature: {weatherData.main.temp}°C</Text>
          <Text style={styles.weatherText}>Feels like: {weatherData.main.feels_like}°C</Text>
          <Text style={styles.weatherText}>Condition: {weatherData.weather[0]?.description}</Text>
          <Text style={styles.weatherText}>Humidity: {weatherData.main.humidity}%</Text>
          {/* Add more weather details or challenges here later */}
        </View>
      );
    }

    // Default state if none of the above match (should be rare)
    return <Text>Loading weather...</Text>;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather Challenges</Text>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  weatherText: {
    fontSize: 16,
    marginBottom: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
}); 