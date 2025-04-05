import { registerRootComponent } from 'expo';
import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately

function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

registerRootComponent(Root); // Use the wrapped component 