import { registerRootComponent } from 'expo';
import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { ExpoRoot } from 'expo-router';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately

function Root() {
  return (
    <AuthProvider>
      <ExpoRoot context={require.context('./app')} />
    </AuthProvider>
  );
}

registerRootComponent(Root); // Use the wrapped component 