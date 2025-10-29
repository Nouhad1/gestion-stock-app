import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
//import { Picker } from '@react-native-picker/picker';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'https://gestion-stock-app-production.up.railway.app/api/produits';

export default function ProductTable() {
  const [produits, setProduits] = useState([]);
  const [selectedDepot, setSelectedDepot] = useState('depot1');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProduits = async () => {
    try {
      const res = await axios.get(API_URL);
      setProduits(res.data);
    } catch (err) {
      console.error('Erreur API produits:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProduits();
  };

  // Fonction pour afficher l'état du stock
  const renderAvailability = (stockQty) => {
    let status = '';
    let style = {};

    if (stockQty > 3) {
      status = 'Dispo';
      style = styles.inStock;
    } else if (stockQty > 0 && stockQty <= 3) {
      status = 'Faible';
      style = styles.lowStock;
    } else {
      status = 'Rupture';
      style = styles.outOfStock;
    }

    return (
      <View style={[styles.availability, style]}>
        <Text style={styles.availabilityText}>{status}</Text>
      </View>
    );
  };

  // Ligne du tableau
  const renderItem = ({ item, index }) => {
    const stockDepot1 = Number(item.quantite_stock || 0);
    const stockDepot2 = Number(item.quantite_stock_2 || 0);
    const quantiteGlobale = stockDepot1 + stockDepot2;
    const stockSelected = selectedDepot === 'depot1' ? stockDepot1 : stockDepot2;

    const prixUnitaire =
      item.prix_unitaire != null && !isNaN(item.prix_unitaire)
        ? Number(item.prix_unitaire).toFixed(2)
        : '-';
    const prixMoyen =
      item.prix_moyen_achat != null && !isNaN(item.prix_moyen_achat)
        ? Number(item.prix_moyen_achat).toFixed(2)
        : '-';

    return (
      <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
        <Text style={[styles.cell, { width: 100 }]}>{item.reference}</Text>
        <Text
          style={[
            styles.cell,
            {
              width: 400,
              textAlign: 'center',
              textAlignVertical: 'center',
              flexWrap: 'wrap',
            },
          ]}
        >
          {item.designation}
        </Text>
        <Text style={[styles.cell, { width: 150 }]}>{stockSelected}</Text>
        <Text style={[styles.cell, { width: 80 }]}>{quantiteGlobale}</Text>
        <Text style={[styles.cell, { width: 120 }]}>
          {prixUnitaire !== '-' ? `${prixUnitaire} MAD` : '-'}
        </Text>
        <Text style={[styles.cell, { width: 120 }]}>
          {prixMoyen !== '-' ? `${prixMoyen} MAD` : '-'}
        </Text>
        <View style={[styles.cell, { width: 100 }]}>{renderAvailability(stockSelected)}</View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Chargement des produits...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Titre */}
      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
        <Text style={styles.headerTitle}>📦 Liste des Produits</Text>
      </LinearGradient>

      {/* Sélecteur de dépôt */}
      <Picker
        selectedValue={selectedDepot}
        style={styles.picker}
        onValueChange={(itemValue) => setSelectedDepot(itemValue)}
      >
        <Picker.Item label="Dépôt Hay Mohemmadi" value="depot1" />
        <Picker.Item label="Dépôt Had Soualem" value="depot2" />
      </Picker>

      {/* Scroll horizontal */}
      <ScrollView horizontal>
        <View>
          {/* Header */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.headerCell, { width: 100 }]}>Référence</Text>
            <Text style={[styles.headerCell, { width: 400 }]}>Désignation</Text>
            <Text style={[styles.headerCell, { width: 150 }]}>
              {selectedDepot === 'depot1' ? 'Dépôt Hay Mohemmadi' : 'Dépôt Had Soualem'}
            </Text>
            <Text style={[styles.headerCell, { width: 80 }]}>Global</Text>
            <Text style={[styles.headerCell, { width: 120 }]}>Prix Unitaire</Text>
            <Text style={[styles.headerCell, { width: 120 }]}>Prix Moyen Achat</Text>
            <Text style={[styles.headerCell, { width: 100 }]}>Dispo</Text>
          </View>

          <FlatList
            data={produits}
            keyExtractor={(item) => item.reference}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  header: { padding: 16, paddingTop: 20, marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff'},
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 10,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    alignItems: 'center',
  },
  rowEven: { backgroundColor: '#fff' },
  rowOdd: { backgroundColor: '#f9f9f9' },
  headerRow: { backgroundColor: '#2563eb' },
  cell: {
    paddingHorizontal: 6,
    color: '#111',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerCell: { paddingHorizontal: 6, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  availability: { paddingVertical: 4, paddingHorizontal: 6, borderRadius: 12 },
  inStock: { backgroundColor: '#d1fae5' },
  lowStock: { backgroundColor: '#fef3c7' },
  outOfStock: { backgroundColor: '#fee2e2' },
  availabilityText: { fontWeight: 'bold', textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
