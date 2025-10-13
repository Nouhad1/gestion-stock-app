import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './HomeScreen';
import CommandeScreen from './CommandeScreen';
import Produits from './Produits';

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
