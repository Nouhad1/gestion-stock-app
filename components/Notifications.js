import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../config/config'; 

const Notifications = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // Mise à jour automatique à chaque fois que la page est affichée
  useFocusEffect(
    React.useCallback(() => {
      axios.get(`https://gestion-stock-app-production.up.railway.app/api/produits`)
        .then(response => {
          const filtered = response.data.filter(p => p.quantite_stock < 5);
          setLowStockProducts(filtered);
        })
        .catch(error => {
          console.error('Erreur chargement des produits', error);
        });
    }, [])
  );

  const renderItem = ({ item }) => (
    <View style={styles.notification}>
      <Text style={styles.text}>
        ⚠️ {item.designation} — stock faible ({item.quantite_stock} unités)
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {lowStockProducts.length > 0 ? (
        <>
          <Text style={styles.title}>🛎️ Produits presque en rupture :</Text>
          <FlatList
            data={lowStockProducts}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
          />
        </>
      ) : (
        <Text style={styles.text}>✅ Aucun produit en rupture de stock.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  notification: {
    backgroundColor: '#ffdddd',
    padding: 10,
    marginVertical: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#ff4444',
    borderRadius: 4,
  },
  text: {
    fontSize: 16,
  },
});

export default Notifications;
