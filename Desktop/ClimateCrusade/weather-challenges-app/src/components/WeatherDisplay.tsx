import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

// Define the structure of the weather data prop
interface WeatherData {
  name: string; // City name
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

interface WeatherDisplayProps {
  weatherData: WeatherData;
}

// Base URL for OpenWeatherMap icons
const ICON_BASE_URL = 'https://openweathermap.org/img/wn/';

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ weatherData }) => {
  const { name, main, weather, wind } = weatherData;
  const weatherInfo = weather[0]; // Get the primary weather condition
  const iconUrl = `${ICON_BASE_URL}${weatherInfo.icon}@2x.png`; // Construct icon URL

  // Function to convert Kelvin to Celsius
  const kelvinToCelsius = (kelvin: number) => (kelvin - 273.15).toFixed(1);

  return (
    <View style={styles.container}>
      <Text style={styles.cityName}>{name}</Text>
      <View style={styles.weatherRow}>
        <Image source={{ uri: iconUrl }} style={styles.weatherIcon} />
        <Text style={styles.temperature}>{kelvinToCelsius(main.temp)}°C</Text>
      </View>
      <Text style={styles.description}>{weatherInfo.description}</Text>
      <Text style={styles.details}>Feels like: {kelvinToCelsius(main.feels_like)}°C</Text>
      <Text style={styles.details}>Humidity: {main.humidity}%</Text>
      <Text style={styles.details}>Wind Speed: {wind.speed.toFixed(1)} m/s</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff', // White background for the card
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Elevation for Android shadow
    width: '100%', // Take full width of parent
    marginTop: 10,
  },
  cityName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  weatherIcon: {
    width: 80, // Increased size
    height: 80, // Increased size
    marginRight: 10,
  },
  temperature: {
    fontSize: 48, // Larger temperature display
    fontWeight: 'bold',
    color: '#1a73e8', // Blue color for temp
  },
  description: {
    fontSize: 18,
    textTransform: 'capitalize',
    marginBottom: 15,
    color: '#555',
  },
  details: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
});

export default WeatherDisplay; 