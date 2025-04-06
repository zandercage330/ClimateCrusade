import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  errorMsg: string | null;
  loading: boolean;
  permissionGranted: boolean | null; // null initially, true/false after request
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    errorMsg: null,
    loading: true,
    permissionGranted: null,
  });

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const getLocation = async () => {
      setLocation(prev => ({ ...prev, loading: true, errorMsg: null }));

      console.log('Requesting location permissions...');
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission denied.');
          if (isMounted) {
            setLocation(prev => ({
              ...prev,
              errorMsg: 'Permission to access location was denied',
              loading: false,
              permissionGranted: false,
            }));
          }
          return;
        }

        if (isMounted) {
          setLocation(prev => ({ ...prev, permissionGranted: true }));
        }
        console.log('Location permission granted.');

        console.log('Fetching current position...');
        let currentPosition = await Location.getCurrentPositionAsync({});
        console.log('Current position fetched:', currentPosition);

        if (isMounted) {
          setLocation(prev => ({
            ...prev,
            latitude: currentPosition.coords.latitude,
            longitude: currentPosition.coords.longitude,
            loading: false,
            errorMsg: null,
          }));
        }
      } catch (error: any) {
        console.error('Error getting location:', error);
        if (isMounted) {
          setLocation(prev => ({
            ...prev,
            errorMsg: error.message || 'Failed to get location',
            loading: false,
            permissionGranted: location.permissionGranted // Keep previous permission status if known
          }));
        }
      }
    };

    getLocation();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
      console.log('useLocation hook unmounted.');
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return location;
} 