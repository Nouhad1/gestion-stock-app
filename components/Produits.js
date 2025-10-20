import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, StyleSheet,
  ScrollView, RefreshControl, Animated
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';

const ProductList = () => {
  const [produits, setProduits] = useState([]);
  const [selectedDepot, setSelectedDepot] = useState('depot1');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = new Animated.Value(0);

  const fetchProduits = async () => {
    try {
      const res = await axios.get(`https://gestion-stock-app-production.up.railway.app/api/produits`);
      setProduits(res.data);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch (err) {
      console.error('❌ Erreur API produits:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProduits();
    setRefreshing(false);
  };

  const renderAvailability = (stockQty) => {
    return stockQty > 0 ? (
      <Text style={styles.available}>✔️ Oui</Text>
    ) : (
      <Text style={styles.notAvailable}>❌ Non</Text>
    );
  };

  const renderItem = ({ item, index }) => {
    const stockDepot1 = Number(item.quantite_stock || 0);
    const stockDepot2 = Number(item.quantite_stock_2 || 0);
    const quantiteGlobale = stockDepot1 + stockDepot2;
    const stockAffiche = selectedDepot === 'depot1' ? stockDepot1 : stockDepot2;
    const availability = renderAvailability(stockAffiche);

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
          <Text style={[styles.cell, { width: 120 }]}>{item.reference}</Text>
          <Text style={[styles.cell, { width: 250 }]}>{item.designation}</Text>
          <Text style={[styles.cell, { width: 100 }]}>{quantiteGlobale}</Text>
          <Text style={[styles.cell, { width: 100 }]}>{stockDepot1}</Text>
          <Text style={[styles.cell, { width: 100 }]}>{stockDepot2}</Text>
          <Text style={[styles.cell, { width: 150 }]}>
            {item.prix_unitaire ? `${Number(item.prix_unitaire).toFixed(2)} MAD` : "-"}
          </Text>
          <Text style={[styles.cell, { width: 180 }]}>
            {item.prix_moyen_achat ? `${Number(item.prix_moyen_achat).toFixed(2)} MAD` : "-"}
          </Text>
          <Text style={[styles.cell, { width: 100 }]}>{availability}</Text>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
        <Text style={styles.headerTitle}>📦 Liste des Produits</Text>
      </LinearGradient>

      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>Afficher le stock du :</Text>
        <Picker
          selectedValue={selectedDepot}
          style={styles.picker}
          onValueChange={(value) => setSelectedDepot(value)}
        >
          <Picker.Item label="Dépôt Hay Mohammadi" value="depot1" />
          <Picker.Item label="Dépôt Had Soualem" value="depot2" />
        </Picker>
      </View>

      <ScrollView horizontal>
        <View style={{ minWidth: 1100 }}>
          <View style={[styles.row, styles.tableHeader]}>
            <Text style={[styles.cell, { width: 120 }]}>Référence</Text>
            <Text style={[styles.cell, { width: 250 }]}>Désignation</Text>
            <Text style={[styles.cell, { width: 100 }]}>Global</Text>
            <Text style={[styles.cell, { width: 100 }]}>Dépôt 1</Text>
            <Text style={[styles.cell, { width: 100 }]}>Dépôt 2</Text>
            <Text style={[styles.cell, { width: 150 }]}>Prix Unitaire</Text>
            <Text style={[styles.cell, { width: 180 }]}>Prix Moyen Achat</Text>
            <Text style={[styles.cell, { width: 100 }]}>Dispo</Text>
          </View>

          <FlatList
            data={produits}
            renderItem={renderItem}
            keyExtractor={(item) => item.reference}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  header: { padding: 16, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginVertical: 8,
    padding: 10,
    borderRadius: 10,
    elevation: 1,
  },
  filterLabel: { fontSize: 15, fontWeight: '600', marginRight: 10, color: '#1f2937' },
  picker: { height: 50, width: 220 },
  tableHeader: { backgroundColor: '#e0e7ff', borderRadius: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8 },
  rowEven: { backgroundColor: '#fff' },
  rowOdd: { backgroundColor: '#f9fafc' },
  cell: { paddingHorizontal: 6, textAlign: 'center', color: '#1f2937' },
  available: { color: '#16a34a', fontWeight: 'bold' },
  notAvailable: { color: '#dc2626', fontWeight: 'bold' },
});

export default ProductList;
