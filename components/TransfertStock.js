import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';

import axios from 'axios';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import DropDownPicker from 'react-native-dropdown-picker';

const API_URL =
  'https://gestion-stock-app-production.up.railway.app/api/produits';

const API_TRANSFERT =
  'https://gestion-stock-app-production.up.railway.app/api/transferts';

export default function Transferts() {

  const [loading, setLoading] = useState(true);

  const [produits, setProduits] = useState([]);

  const [selectedProduit, setSelectedProduit] = useState(null);

  const [quantite, setQuantite] = useState('');

  const [openProduit, setOpenProduit] = useState(false);

  const [openSource, setOpenSource] = useState(false);

  const [openDestination, setOpenDestination] = useState(false);

  const [depotSource, setDepotSource] =
    useState('depot1');

  const [depotDestination, setDepotDestination] =
    useState('depot2');

  const depots = [
    {
      label: 'Hay Mohammadi',
      value: 'depot1',
    },
    {
      label: 'Had Soualem',
      value: 'depot2',
    },
  ];

  /* ================= FETCH PRODUITS ================= */

  const fetchProduits = async () => {

    try {

      const res = await axios.get(API_URL);

      const formatted = res.data.map((item) => ({

        label:
          `${item.reference} - ${item.designation}`,

        value: item.reference,

        data: item,

      }));

      setProduits(formatted);

    } catch (err) {

      console.log(err.message);

      Alert.alert(
        'Erreur',
        'Impossible de charger les produits'
      );

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {

    fetchProduits();

  }, []);

  /* ================= PRODUIT SELECTIONNÉ ================= */

  const produitData = useMemo(() => {

    return produits.find(
      (p) => p.value === selectedProduit
    )?.data;

  }, [selectedProduit, produits]);

  /* ================= STOCK DISPONIBLE ================= */

  const stockDisponible = useMemo(() => {

    if (!produitData) return 0;

    return depotSource === 'depot1'
      ? Number(produitData.quantite_stock || 0)
      : Number(produitData.quantite_stock_2 || 0);

  }, [produitData, depotSource]);

  /* ================= TRANSFERT ================= */

  const handleTransfer = async () => {

    try {

      if (!selectedProduit) {

        return Alert.alert(
          'Erreur',
          'Sélectionnez un produit'
        );
      }

      if (
        !quantite ||
        Number(quantite) <= 0
      ) {

        return Alert.alert(
          'Erreur',
          'Entrez une quantité valide'
        );
      }

      if (
        depotSource === depotDestination
      ) {

        return Alert.alert(
          'Erreur',
          'Les dépôts doivent être différents'
        );
      }

      if (
        Number(quantite) > stockDisponible
      ) {

        return Alert.alert(
          'Stock insuffisant',
          `Stock disponible : ${stockDisponible}`
        );
      }

      /* ================= API ================= */

      await axios.post(
        API_TRANSFERT,
        {
          produit_reference: selectedProduit,
          depot_source: depotSource,
          depot_destination: depotDestination,
          quantite: Number(quantite),
        }
      );

      Alert.alert(
        'Succès',
        'Transfert effectué'
      );

      setQuantite('');

      setSelectedProduit(null);

      fetchProduits();

    } catch (err) {

      console.log(err);

      Alert.alert(
        'Erreur',
        'Erreur lors du transfert'
      );
    }
  };

  if (loading) {

    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />
      </View>
    );
  }

  return (

    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <LinearGradient
        colors={['#2563eb', '#1e40af']}
        style={styles.header}
      >

        <Text style={styles.headerTitle}>
          🚚 Transfert de Stock
        </Text>

      </LinearGradient>

      {/* CONTENT */}
      <View style={styles.content}>

        {/* PRODUIT */}
        <View
          style={[
            styles.section,
            { zIndex: 3000 },
          ]}
        >

          <Text style={styles.label}>
            Produit
          </Text>

          <DropDownPicker
            open={openProduit}
            value={selectedProduit}
            items={produits}
            setOpen={setOpenProduit}
            setValue={setSelectedProduit}
            setItems={setProduits}
            searchable={true}
            placeholder="Sélectionner un produit"
            style={styles.dropdown}
            dropDownContainerStyle={
              styles.dropdownContainer
            }
          />

        </View>

        {/* SOURCE */}
        <View
          style={[
            styles.section,
            { zIndex: 2000 },
          ]}
        >

          <Text style={styles.label}>
            Dépôt source
          </Text>

          <DropDownPicker
            open={openSource}
            value={depotSource}
            items={depots}
            setOpen={setOpenSource}
            setValue={setDepotSource}
            setItems={() => {}}
            style={styles.dropdown}
            dropDownContainerStyle={
              styles.dropdownContainer
            }
          />

        </View>

        {/* DESTINATION */}
        <View
          style={[
            styles.section,
            { zIndex: 1000 },
          ]}
        >

          <Text style={styles.label}>
            Dépôt destination
          </Text>

          <DropDownPicker
            open={openDestination}
            value={depotDestination}
            items={depots}
            setOpen={setOpenDestination}
            setValue={setDepotDestination}
            setItems={() => {}}
            style={styles.dropdown}
            dropDownContainerStyle={
              styles.dropdownContainer
            }
          />

        </View>

        {/* STOCK */}
        <View style={styles.stockCard}>

          <Text style={styles.stockLabel}>
            Stock disponible
          </Text>

          <Text style={styles.stockValue}>
            {stockDisponible}
          </Text>

        </View>

        {/* QUANTITE */}
        <View style={styles.section}>

          <Text style={styles.label}>
            Quantité à transférer
          </Text>

          <TextInput
            value={quantite}
            onChangeText={setQuantite}
            keyboardType="numeric"
            placeholder="0"
            style={styles.input}
          />

        </View>

        {/* BUTTON */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleTransfer}
        >

          <Text style={styles.buttonText}>
            TRANSFÉRER
          </Text>

        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  header: {
    padding: 18,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  content: {
    flex: 1,
    paddingBottom: 30,
  },

  section: {
    marginHorizontal: 15,
    marginTop: 15,
  },

  label: {
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#111',
  },

  dropdown: {
    borderColor: '#ddd',
    minHeight: 50,
  },

  dropdownContainer: {
    borderColor: '#ddd',
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
  },

  stockCard: {
    marginHorizontal: 15,
    marginTop: 20,
    backgroundColor: '#dbeafe',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },

  stockLabel: {
    color: '#1e40af',
    fontWeight: 'bold',
    marginBottom: 5,
  },

  stockValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
  },

  button: {
    marginTop: 30,
    marginHorizontal: 15,
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

});