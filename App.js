import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Écrans
import LoginScreen from './components/LoginScreen';
import ProductDetailScreen from './components/ProductDetailScreen';
import BottomTabNavigator from './components/BottomTabNavigator';
import NotificationsScreen from './components/Notifications';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        
        {/* Écran de connexion - pas de header */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        {/* Navigation principale en onglets */}
        <Stack.Screen
          name="Main"
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />

        {/* Détail produit - header affiché */}
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{
            title: 'Détails du produit',
            headerShown: true,
          }}
         />

          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}
