import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

const API_URL =
  'https://gestion-stock-app-production.up.railway.app/api/produits';

export default function ProductTable() {
  const [produits, setProduits] = useState([]);
  const [filteredProduits, setFilteredProduits] = useState([]);
  const [selectedDepot, setSelectedDepot] = useState('depot1');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= FETCH ================= */
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

  /* ================= SEARCH ================= */
  useEffect(() => {
    const text = search.toLowerCase();
    setFilteredProduits(
      produits.filter(
        (item) =>
          item.reference?.toLowerCase().includes(text) ||
          item.designation?.toLowerCase().includes(text)
      )
    );
  }, [search, produits]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProduits();
  };

  /* ================= AVAILABILITY ================= */
  const renderAvailability = (qty) => {
    let label = 'Rupture';
    let style = styles.outOfStock;

    if (qty > 3) {
      label = 'Dispo';
      style = styles.inStock;
    } else if (qty > 0) {
      label = 'Faible';
      style = styles.lowStock;
    }

    return (
      <View style={[styles.availability, style]}>
        <Text style={styles.availabilityText}>{label}</Text>
      </View>
    );
  };

  /* ================= ROW ================= */
  const renderItem = ({ item, index }) => {
    const depot1 = Number(item.quantite_stock || 0);
    const depot2 = Number(item.quantite_stock_2 || 0);
    const stockSelected = selectedDepot === 'depot1' ? depot1 : depot2;
    const global = depot1 + depot2;

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
        <Text style={[styles.cell, { width: 400 }]}>{item.designation}</Text>
        <Text style={[styles.cell, { width: 150 }]}>{stockSelected}</Text>
        <Text style={[styles.cell, { width: 80 }]}>{global}</Text>
        <Text style={[styles.cell, { width: 120 }]}>
          {prixUnitaire !== '-' ? `${prixUnitaire} MAD` : '-'}
        </Text>
        <Text style={[styles.cell, { width: 120 }]}>
          {prixMoyen !== '-' ? `${prixMoyen} MAD` : '-'}
        </Text>
        <View style={[styles.cell, { width: 100 }]}>
          {renderAvailability(stockSelected)}
        </View>
      </View>
    );
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Chargement des produits...</Text>
      </View>
    );
  }

  /* ================= UI ================= */
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
        <Text style={styles.headerTitle}>📦 Liste des Produits</Text>
      </LinearGradient>

      {/* DEPOT */}
      <View style={styles.segmentContainer}>
        <SegmentedControl
          values={['Hay Mohemmadi', 'Had Soualem']}
          selectedIndex={selectedDepot === 'depot1' ? 0 : 1}
          onChange={(e) =>
            setSelectedDepot(
              e.nativeEvent.selectedSegmentIndex === 0
                ? 'depot1'
                : 'depot2'
            )
          }
          tintColor="#2563eb"
        />
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="🔍 Rechercher par référence ou désignation"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* TABLE */}
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          {/* HEADER ROW */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.headerCell, { width: 100 }]}>Référence</Text>
            <Text style={[styles.headerCell, { width: 400 }]}>Désignation</Text>
            <Text style={[styles.headerCell, { width: 150 }]}>
              {selectedDepot === 'depot1'
                ? 'Hay Mohemmadi'
                : 'Had Soualem'}
            </Text>
            <Text style={[styles.headerCell, { width: 80 }]}>Global</Text>
            <Text style={[styles.headerCell, { width: 120 }]}>Prix U</Text>
            <Text style={[styles.headerCell, { width: 120 }]}>Prix Moyen</Text>
            <Text style={[styles.headerCell, { width: 100 }]}>Dispo</Text>
          </View>

          {/* BODY */}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },

  header: { padding: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },

  segmentContainer: { margin: 16 },

  searchContainer: { marginHorizontal: 16, marginBottom: 8 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    minHeight: 44,
    alignItems: 'center',
  },

  rowEven: { backgroundColor: '#fff' },
  rowOdd: { backgroundColor: '#f9f9f9' },
  headerRow: { backgroundColor: '#2563eb' },

  cell: {
    textAlign: 'center',
    paddingHorizontal: 6,
    color: '#111',
  },

  headerCell: {
    textAlign: 'center',
    paddingHorizontal: 6,
    fontWeight: 'bold',
    color: '#fff',
  },

  availability: {
    paddingVertical: 4,
    borderRadius: 12,
  },
  inStock: { backgroundColor: '#d1fae5' },
  lowStock: { backgroundColor: '#fef3c7' },
  outOfStock: { backgroundColor: '#fee2e2' },
  availabilityText: { fontWeight: 'bold', textAlign: 'center' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
