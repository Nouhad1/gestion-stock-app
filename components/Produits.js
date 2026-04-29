import React, { useState, useEffect } from 'react';
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

/* ================= LOGIQUE STOCK INTELLIGENT ================= */
const getStockThreshold = (designation = '') => {
  const name = designation.toLowerCase();

  if (name.includes('rouleau laniere 200/2/50 positif')) return 50;
  if (name.includes('positif') || name.includes('negatif')) return 20;

  if (
    name.includes('orange') ||
    name.includes('bleu') ||
    name.includes('vert') ||
    name.includes('rouge') ||
    name.includes('noir')
  ) return 10;

  if (name.includes('petrin')) return 5;
  if (name.includes('four')) return 8;
  if (name.includes('porte')) return 20;
  if (name.includes('support 1m')) return 120;
  if (name.includes('support')) return 60;
  if (name.includes('crochet')) return 200;

  return 5;
};

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

  const renderAvailability = (stock, designation) => {
    const threshold = getStockThreshold(designation);

    let label = 'Dispo';
    let style = styles.inStock;

    if (stock <= 0) {
      label = 'Rupture';
      style = styles.outOfStock;
    } else if (stock < threshold) {
      label = 'Faible';
      style = styles.lowStock;
    }

    return (
      <View style={[styles.availability, style]}>
        <Text style={styles.availabilityText}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    const depot1 = Number(item.quantite_stock || 0);
    const depot2 = Number(item.quantite_stock_2 || 0);

    const stockSelected =
      selectedDepot === 'depot1' ? depot1 : depot2;

    const global = depot1 + depot2;

    const prixUnitaire =
      item.prix_unitaire && !isNaN(item.prix_unitaire)
        ? Number(item.prix_unitaire)
        : null;

    const prixUnitaireStr =
      prixUnitaire !== null ? prixUnitaire.toFixed(2) : '-';

    const prixTotal =
      prixUnitaire !== null
        ? (prixUnitaire * global).toFixed(2)
        : '-';

    const prixMoyen =
      item.prix_moyen_achat && !isNaN(item.prix_moyen_achat)
        ? Number(item.prix_moyen_achat).toFixed(2)
        : '-';

    return (
      <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
        <Text style={[styles.cell, { width: 100 }]}>{item.reference}</Text>
        <Text style={[styles.cell, { width: 400 }]}>{item.designation}</Text>
        <Text style={[styles.cell, { width: 150 }]}>{stockSelected}</Text>
        <Text style={[styles.cell, { width: 80 }]}>{global}</Text>

        <Text style={[styles.cell, { width: 120 }]}>{prixUnitaireStr} MAD</Text>
        <Text style={[styles.cell, { width: 120 }]}>{prixTotal} MAD</Text>
        <Text style={[styles.cell, { width: 120 }]}>{prixMoyen} MAD</Text>

        <View style={{ width: 100 }}>
          {renderAvailability(global, item.designation)}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
        <Text style={styles.headerTitle}>📦 Liste des Produits</Text>
      </LinearGradient>

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
          tintColor ='#1252dcff'
          backgroundColor='#000000'
        />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="🔍 Rechercher par référence ou désignation..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>
      

      <ScrollView horizontal>
        <View>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.headerCell, { width: 100 }]}>Ref</Text>
            <Text style={[styles.headerCell, { width: 400 }]}>Désignation</Text>
            <Text style={[styles.headerCell, { width: 150 }]}>Stock</Text>
            <Text style={[styles.headerCell, { width: 80 }]}>Global</Text>
            <Text style={[styles.headerCell, { width: 120 }]}>Prix U</Text>
            <Text style={[styles.headerCell, { width: 120 }]}>Prix Total</Text>
            <Text style={[styles.headerCell, { width: 120 }]}>Moyen</Text>
            <Text style={[styles.headerCell, { width: 100 }]}>État</Text>
          </View>

          <FlatList
            data={filteredProduits}
            keyExtractor={(item) => item.reference}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLE ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  header: { padding: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  segmentContainer: { margin: 10 },

  searchContainer: { marginHorizontal: 10, marginVertical:10 },
  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    minHeight: 40,
    alignItems: 'center',
  },

  rowEven: { backgroundColor: '#fff' },
  rowOdd: { backgroundColor: '#f9f9f9' },

  headerRow: { backgroundColor: '#2563eb' },

  cell: { textAlign: 'center', paddingHorizontal: 5 },
  headerCell: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  availability: {
    padding: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  inStock: { backgroundColor: '#d1fae5' },
  lowStock: { backgroundColor: '#fef3c7' },
  outOfStock: { backgroundColor: '#fee2e2' },

  availabilityText: { fontWeight: 'bold' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});