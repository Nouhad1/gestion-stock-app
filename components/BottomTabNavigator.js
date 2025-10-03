import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { View } from 'react-native';

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
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          height: 60,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: -3 },
          shadowRadius: 5,
          elevation: 5,
        },
        tabBarLabelStyle: { fontSize: 10, marginBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Produits"
        component={Produits}
        options={{
          tabBarLabel: 'Produits',
          tabBarIcon: ({ color, size }) => (
            <Icon name="box" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Commandes"
        component={Commandes}
        options={{
          tabBarLabel: 'Commandes',
          tabBarIcon: ({ color, size }) => (
            <Icon name="shopping-cart" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
  name="Achats"
  component={Achats}
  options={{
    tabBarLabel: 'Achats',
    tabBarIcon: ({ color, size }) => (
      <View style={{ flexDirection: 'row' }}>
        <Icon name="arrow-down" color={color} size={size} />
        <Icon name="arrow-up" color={color} size={size} style={{ marginLeft: 4 }} />
      </View>
    ),
  }}
/>

    </Tab.Navigator>
  );
}
