import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Platform } from 'react-native';

import HomeScreen from './HomeScreen';
import Achats from './EditableAchatList';
import Commandes from './Commandes';
import Produits from './Produits';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2280B0',
        tabBarInactiveTintColor: '#999',
        tabBarLabelPosition: 'below-icon',
        tabBarAllowFontScaling: false, // 🔒 Empêche zoom iPad
        tabBarStyle: {
          backgroundColor: '#ffffff',
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: Platform.OS === 'ios' ? 2 : 0,
        },
      }}
    >
      {/* Accueil */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="home"
              color={color}
              size={focused ? 20 : 18}
            />
          ),
        }}
      />

      {/* Produits */}
      <Tab.Screen
        name="Produits"
        component={Produits}
        options={{
          tabBarLabel: 'Produits',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="box"
              color={color}
              size={focused ? 20 : 18}
            />
          ),
        }}
      />

      {/* Commandes */}
      <Tab.Screen
        name="Commandes"
        component={Commandes}
        options={{
          tabBarLabel: 'Commandes',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="shopping-cart"
              color={color}
              size={focused ? 20 : 18}
            />
          ),
        }}
      />

      {/* ✅ Achats — CORRIGÉ */}
      <Tab.Screen
        name="Achats"
        component={Achats}
        options={{
          tabBarLabel: 'Achats',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="exchange-alt"   // ✅ icône unique Apple-friendly
              color={color}
              size={focused ? 20 : 18}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
