import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './components/HomeScreen';
import CommandeScreen from './components/Commandes';
import Produits from './components/Produits';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Commandes" component={CommandeScreen} />
      <Tab.Screen name="Produits" component={Produits} />
    </Tab.Navigator>
  );
}
