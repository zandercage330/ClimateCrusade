import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Image, TouchableOpacity, Alert, Platform, TextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { session, user } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [challengesCompleted, setChallengesCompleted] = useState<number>(0);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState<string>("");

  // Request permission and fetch profile data on component mount
  useEffect(() => {
    (async () => {
      if (user?.id) {
        await fetchProfile();
      }
    })();
  }, [user]);

  // Fetch profile data (including avatar URL)
  async function fetchProfile() {
    try {
      setLoading(true);
      if (!user?.id) return;

      // Fetch user profile data from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username, points, challenges_completed')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user profile:', userError.message);
      } else if (userData) {
        setUsername(userData.username);
        setPoints(userData.points || 0);
        setChallengesCompleted(userData.challenges_completed || 0);
        setNewUsername(userData.username || ""); // Initialize edit field
      }

      // Get the public URL for the avatar
      const { data: avatarData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${user.id}`);
      
      if (avatarData?.publicUrl) {
        const publicUrlWithCacheBust = `${avatarData.publicUrl}?t=${new Date().getTime()}`;
        setAvatar(publicUrlWithCacheBust);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Select image from device library
  async function pickImage() {
    try {
      // Request permission first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'You need to grant access to your photo library to upload an avatar.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  }

  // Upload avatar to Supabase storage
  async function uploadAvatar(uri: string) {
    try {
      setLoading(true);
      if (!user?.id) return;

      // Convert image URI to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(`${user.id}`, blob, {
          contentType: 'image/jpeg',
          upsert: true // Override if exists
        });

      if (error) {
        console.error('Error uploading avatar:', error.message);
        Alert.alert('Upload failed', 'Failed to upload avatar. Please try again.');
        setLoading(false);
        return;
      }

      // Refresh profile data to get new avatar URL
      await fetchProfile(); 
      Alert.alert('Success', 'Avatar updated successfully!');
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload avatar. Please try again.');
    } finally {
      // setLoading is handled within fetchProfile
    }
  }

  // Update username in Supabase
  async function handleUpdateUsername() {
    if (!user?.id || !newUsername.trim()) {
      Alert.alert('Invalid input', 'Username cannot be empty.');
      return;
    }
    
    if (newUsername.trim() === username) {
        setEditingUsername(false); // Just close if no change
        return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('users')
        .update({ username: newUsername.trim() })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating username:', error.message);
        Alert.alert('Update failed', error.message || 'Failed to update username.');
      } else {
        setUsername(newUsername.trim());
        setEditingUsername(false);
        Alert.alert('Success', 'Username updated successfully!');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } 
    // AuthContext listener will handle navigation back to AuthScreen
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>

      <View style={styles.profileHeader}>
        <TouchableOpacity 
          style={styles.avatarContainer} 
          onPress={pickImage}
          disabled={loading}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {session?.user?.email?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.avatarOverlay}>
            <Text style={styles.avatarOverlayText}>Edit</Text>
          </View>
        </TouchableOpacity>
        
        {!editingUsername ? (
          <View style={styles.usernameContainer}>
            <Text style={styles.username}>{username || 'Set Username'}</Text>
            <Button title="Edit" onPress={() => setEditingUsername(true)} disabled={loading} />
          </View>
        ) : (
          <View style={styles.usernameEditContainer}>
            <TextInput
              style={styles.usernameInput}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Enter username (3-20 chars)"
              autoCapitalize="none"
              maxLength={20} 
            />
            <Button title="Save" onPress={handleUpdateUsername} disabled={loading} />
            <Button title="Cancel" onPress={() => { setEditingUsername(false); setNewUsername(username || ""); }} disabled={loading} color="#888" />
          </View>
        )}
      </View>

      {session?.user?.email && (
        <View style={styles.profileInfo}>
          <Text style={styles.email}>Email: {session.user.email}</Text>
          <Text style={styles.id}>User ID: {session.user.id}</Text>
          <Text style={styles.userSince}>
            User since: {new Date(user?.created_at || Date.now()).toLocaleDateString()}
          </Text>
        </View>
      )}
      
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <Text style={styles.statsText}>Challenges Completed: {challengesCompleted}</Text>
        <Text style={styles.statsText}>Points Earned: {points}</Text>
      </View>
      
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 5,
    alignItems: 'center',
  },
  avatarOverlayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
  },
  usernameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    width: '90%', // Adjust width as needed
  },
  usernameInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginRight: 10,
    fontSize: 16,
  },
  profileInfo: {
    width: '100%',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignSelf: 'center', // Center the info box
  },
  email: {
    fontSize: 16,
    marginBottom: 8,
  },
  id: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userSince: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignSelf: 'center', // Center the stats box
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  statsText: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
}); 