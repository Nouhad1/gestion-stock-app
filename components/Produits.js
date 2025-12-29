import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

const API_URL = 'https://gestion-stock-app-production.up.railway.app/api/produits';

export default function ProductTable() {
  const [produits, setProduits] = useState([]);
  const [filteredProduits, setFilteredProduits] = useState([]);
  const [selectedDepot, setSelectedDepot] = useState('depot1');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProduits = async () => {
    try {
      const res = await axios.get(API_URL);
      setProduits(res.data);
      setFilteredProduits(res.data);
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

  // Filtrage recherche
  useEffect(() => {
    const text = search.toLowerCase();
    const filtered = produits.filter(
      (item) =>
        item.reference?.toLowerCase().includes(text) ||
        item.designation?.toLowerCase().includes(text)
    );
    setFilteredProduits(filtered);
  }, [search, produits]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProduits();
  };

  // Disponibilité stock
  const renderAvailability = (stockQty) => {
    let status = 'Rupture';
    let style = styles.outOfStock;

    if (stockQty > 3) {
      status = 'Dispo';
      style = styles.inStock;
    } else if (stockQty > 0) {
      status = 'Faible';
      style = styles.lowStock;
    }

    return (
      <View style={[styles.availability, style]}>
        <Text style={styles.availabilityText}>{status}</Text>
      </View>
    );
  };

  // Ligne produit
  const renderItem = ({ item, index }) => {
    const stockDepot1 = Number(item.quantite_stock || 0);
    const stockDepot2 = Number(item.quantite_stock_2 || 0);
    const stockSelected =
      selectedDepot === 'depot1' ? stockDepot1 : stockDepot2;
    const quantiteGlobale = stockDepot1 + stockDepot2;

    return (
      <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
        <Text style={[styles.cell, { width: 100 }]}>{item.reference}</Text>
        <Text style={[styles.cell, { width: 400 }]}>{item.designation}</Text>
        <Text style={[styles.cell, { width: 150 }]}>{stockSelected}</Text>
        <Text style={[styles.cell, { width: 80 }]}>{quantiteGlobale}</Text>
        <View style={[styles.cell, { width: 100 }]}>
          {renderAvailability(stockSelected)}
        </View>
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
      {/* Header */}
      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
        <Text style={styles.headerTitle}>📦 Liste des Produits</Text>
      </LinearGradient>

      {/* SegmentedControl dépôt */}
      <View style={styles.segmentContainer}>
        <SegmentedControl
          values={['Hay Mohemmadi', 'Had Soualem']}
          selectedIndex={selectedDepot === 'depot1' ? 0 : 1}
          onChange={(e) => {
            const index = e.nativeEvent.selectedSegmentIndex;
            setSelectedDepot(index === 0 ? 'depot1' : 'depot2');
          }}
          tintColor="#2563eb"
          backgroundColor="#e5e7eb"
          fontStyle={{ fontSize: 14 }}
          activeFontStyle={{ fontWeight: 'bold' }}
        />
      </View>

      {/* Recherche */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="🔍 Rechercher par référence ou désignation"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          clearButtonMode="while-editing"
        />
      </View>

      {/* En-tête tableau */}
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.headerCell, { width: 100 }]}>Référence</Text>
        <Text style={[styles.headerCell, { width: 400 }]}>Désignation</Text>
        <Text style={[styles.headerCell, { width: 150 }]}>
          {selectedDepot === 'depot1'
            ? 'Dépôt Hay Mohemmadi'
            : 'Dépôt Had Soualem'}
        </Text>
        <Text style={[styles.headerCell, { width: 80 }]}>Global</Text>
        <Text style={[styles.headerCell, { width: 100 }]}>Dispo</Text>
      </View>

      {/* Liste */}
      <FlatList
        data={filteredProduits}
        keyExtractor={(item) => item.reference}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },

  header: { padding: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },

  segmentContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
  },

  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 14,
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
  },
  headerCell: {
    paddingHorizontal: 6,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },

  availability: {
    paddingVertical: 4,
    borderRadius: 12,
  },
  inStock: { backgroundColor: '#d1fae5' },
  lowStock: { backgroundColor: '#fef3c7' },
  outOfStock: { backgroundColor: '#fee2e2' },
  availabilityText: { fontWeight: 'bold', textAlign: 'center' },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
