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

const API_URL = 'https://gestion-stock-app-production.up.railway.app/api/produits';

export default function ProductTableExcel() {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= FETCH ================= */
  const fetchProduits = async () => {
    try {
      const res = await axios.get(API_URL);

      const data = res.data.map((item) => ({
        ...item,
        prix_unitaire_edit: item.prix_unitaire
          ? String(item.prix_unitaire)
          : '',
      }));

      setProduits(data);
    } catch (err) {
      console.error(err.message);
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

  /* ================= UPDATE CELL ================= */
  const handleChange = (value, index, field) => {
    const newData = [...produits];
    newData[index][field] = value;
    setProduits(newData);
  };

  /* ================= SAVE ================= */
  const saveRow = async (item) => {
    try {
      await axios.put(`${API_URL}/${item.reference}`, {
        prix_unitaire: Number(item.prix_unitaire_edit),
      });

      console.log('✅ Enregistré');
    } catch (err) {
      console.error(err.message);
    }
  };

  /* ================= AVAILABILITY (COMMENTED) ================= */
  /*
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
  */

  /* ================= ROW ================= */
  const renderItem = ({ item, index }) => {
    const depot1 = Number(item.quantite_stock || 0);
    const depot2 = Number(item.quantite_stock_2 || 0);
    const global = depot1 + depot2;

    const prix = Number(item.prix_unitaire_edit || 0);
    const total = prix * global;

    /* const prixMoyen =
      item.prix_moyen_achat != null && !isNaN(item.prix_moyen_achat)
        ? Number(item.prix_moyen_achat).toFixed(2)
        : '-'; */

    return (
      <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
        <Text style={[styles.cell, { width: 100 }]}>{item.reference}</Text>

        <Text style={[styles.cell, { width: 250 }]}>{item.designation}</Text>

        <Text style={[styles.cell, { width: 80 }]}>{global}</Text>

        {/* PRIX UNITAIRE EDITABLE */}
        <TextInput
          style={[styles.input, { width: 100 }]}
          keyboardType="numeric"
          value={item.prix_unitaire_edit}
          onChangeText={(text) =>
            handleChange(text, index, 'prix_unitaire_edit')
          }
          onEndEditing={() => saveRow(item)}
        />

        {/* PRIX TOTAL AUTO */}
        <Text style={[styles.cell, { width: 120 }]}>
          {total ? `${total.toFixed(2)} MAD` : '0 MAD'}
        </Text>

        {/* PRIX MOYEN (COMMENTED) */}
        {/*
        <Text style={[styles.cell, { width: 120 }]}>
          {prixMoyen !== '-' ? `${prixMoyen} MAD` : '-'}
        </Text>
        */}

        {/* DISPONIBILITE (COMMENTED) */}
        {/*
        <View style={[styles.cell, { width: 100 }]}>
          {renderAvailability(global)}
        </View>
        */}
      </View>
    );
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Chargement...</Text>
      </View>
    );
  }

  /* ================= UI ================= */
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>📊 Tableau Produits (Style Excel)</Text>

      <ScrollView horizontal>
        <View>
          {/* HEADER */}
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.headerCell, { width: 100 }]}>Réf</Text>
            <Text style={[styles.headerCell, { width: 250 }]}>Désignation</Text>
            <Text style={[styles.headerCell, { width: 80 }]}>Stock</Text>
            <Text style={[styles.headerCell, { width: 100 }]}>Prix U</Text>
            <Text style={[styles.headerCell, { width: 120 }]}>Total</Text>

            {/* <Text style={[styles.headerCell, { width: 120 }]}>Prix Moyen</Text>
            <Text style={[styles.headerCell, { width: 100 }]}>Dispo</Text> */}
          </View>

          {/* BODY */}
          <FlatList
            data={produits}
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

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb', padding: 10 },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    minHeight: 45,
  },

  rowEven: { backgroundColor: '#fff' },
  rowOdd: { backgroundColor: '#f9f9f9' },

  header: { backgroundColor: '#2563eb' },

  cell: {
    textAlign: 'center',
    padding: 6,
  },

  headerCell: {
    textAlign: 'center',
    padding: 6,
    fontWeight: 'bold',
    color: '#fff',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    margin: 4,
    padding: 6,
    textAlign: 'center',
    borderRadius: 6,
    backgroundColor: '#fff',
  },

  /* DISPONIBILITE (PRET POUR ACTIVATION) */
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