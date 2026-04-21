import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { AIModelProvider } from './src/context/AIModelContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AIModelProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AIModelProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
