import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './components/LoginScreen';
import ProductDetailScreen from './components/ProductDetailScreen';
import NotificationsScreen from './components/Notifications';
import BottomTabNavigator from './components/BottomTabNavigator';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ title: 'Détails du produit', headerShown: true }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
