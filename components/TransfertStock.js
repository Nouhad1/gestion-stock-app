import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
 ActivityIndicator,
  FlatList,
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

  const [loading, setLoading] =
    useState(true);

  const [produits, setProduits] =
    useState([]);

  const [selectedProduit, setSelectedProduit] =
    useState(null);

  const [quantite, setQuantite] =
    useState('');

  const [openProduit, setOpenProduit] =
    useState(false);

  const [openSource, setOpenSource] =
    useState(false);

  const [openDestination, setOpenDestination] =
    useState(false);

  const [depotSource, setDepotSource] =
    useState('depot1');

  const [depotDestination, setDepotDestination] =
    useState('depot2');

  const [historique, setHistorique] =
    useState([]);

  const [showHistory, setShowHistory] =
    useState(false);

  const matriculeConnecte = 'EMP001';

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

  /* =========================
     FETCH PRODUITS
  ========================= */

  const fetchProduits = async () => {

    try {

      const res =
        await axios.get(API_URL);

      const formatted =
        res.data.map((item) => ({
          label:
            `${item.reference} - ${item.designation}`,
          value: item.reference,
          data: item,
        }));

      setProduits(formatted);

    } catch (err) {

      console.log(err);

      Alert.alert(
        'Erreur',
        'Impossible de charger les produits'
      );

    } finally {

      setLoading(false);
    }
  };

  /* =========================
     FETCH HISTORIQUE
  ========================= */

  const fetchHistorique = async () => {

    try {

      const res =
        await axios.get(
          `${API_TRANSFERT}/historique`
        );

      setHistorique(res.data);

    } catch (err) {

      console.log(err);
    }
  };

  useEffect(() => {

    fetchProduits();

    fetchHistorique();

  }, []);

  /* =========================
     PRODUIT
  ========================= */

  const produitData = useMemo(() => {

    return produits.find(
      (p) => p.value === selectedProduit
    )?.data;

  }, [selectedProduit, produits]);

  /* =========================
     STOCK
  ========================= */

  const stockDisponible = useMemo(() => {

    if (!produitData) return 0;

    return depotSource === 'depot1'
      ? Number(
          produitData.quantite_stock || 0
        )
      : Number(
          produitData.quantite_stock_2 || 0
        );

  }, [produitData, depotSource]);

  /* =========================
     TRANSFERT
  ========================= */

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

      await axios.post(
        API_TRANSFERT,
        {
          matricule:
            matriculeConnecte,

          produit_reference:
            selectedProduit,

          depot_source:
            depotSource,

          depot_destination:
            depotDestination,

          quantite:
            Number(quantite),
        }
      );

      Alert.alert(
        'Succès',
        'Transfert effectué'
      );

      setQuantite('');

      setSelectedProduit(null);

      fetchProduits();

      fetchHistorique();

    } catch (err) {

      console.log(err);

      Alert.alert(
        'Erreur',
        'Erreur lors du transfert'
      );
    }
  };

  /* =========================
     LOADING
  ========================= */

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

      <FlatList
        data={
          showHistory
            ? historique
            : []
        }

        keyExtractor={(item) =>
          item.id.toString()
        }

        showsVerticalScrollIndicator={false}

        ListHeaderComponent={

          <>

            {/* HEADER */}
            <LinearGradient
              colors={[
                '#2563eb',
                '#1e40af',
              ]}
              style={styles.header}
            >

              <Text style={styles.headerTitle}>
                🚚 Transfert de Stock
              </Text>

              <Text style={styles.headerSubtitle}>
                Gestion des transferts entre dépôts
              </Text>

            </LinearGradient>

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

              {/* DEPOT SOURCE */}
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

              {/* DEPOT DESTINATION */}
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
                  setOpen={
                    setOpenDestination
                  }
                  setValue={
                    setDepotDestination
                  }
                  setItems={() => {}}
                  style={styles.dropdown}
                  dropDownContainerStyle={
                    styles.dropdownContainer
                  }
                />

              </View>

              {/* STOCK */}
              <View style={styles.stockBox}>

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
                  Quantité
                </Text>

                <TextInput
                  value={quantite}
                  onChangeText={
                    setQuantite
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                  style={styles.input}
                />

              </View>

              {/* BUTTON */}
              <TouchableOpacity
                style={styles.button}
                onPress={
                  handleTransfer
                }
              >

                <Text style={styles.buttonText}>
                  TRANSFÉRER
                </Text>

              </TouchableOpacity>

              {/* HISTORIQUE BUTTON */}
              <TouchableOpacity
                style={
                  styles.historyButton
                }
                onPress={() =>
                  setShowHistory(
                    !showHistory
                  )
                }
              >

                <Text style={styles.buttonText}>
                  {showHistory
                    ? 'Masquer historique'
                    : 'Afficher historique'}
                </Text>

              </TouchableOpacity>

              {/* TITRE HISTORIQUE */}
              {showHistory && (

                <Text
                  style={
                    styles.historyTitle
                  }
                >
                  Historique des transferts
                </Text>
              )}

            </View>

          </>
        }

        renderItem={({ item }) => (

          <View style={styles.historyItem}>

            <View style={styles.row}>
              <Text style={styles.left}>
                Produit
              </Text>

              <Text style={styles.right}>
                {
                  item.produit_reference
                }
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.left}>
                Quantité
              </Text>

              <Text style={styles.right}>
                {item.quantite}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.left}>
                Dépôts
              </Text>

              <Text style={styles.right}>
                {item.depot_source} →{' '}
                {
                  item.depot_destination
                }
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.left}>
                Date
              </Text>

              <Text style={styles.right}>
                {new Date(
                  item.date_transfert
                ).toLocaleString()}
              </Text>
            </View>

          </View>
        )}
      />

    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },

  header: {
    paddingTop: 18,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },

  headerSubtitle: {
    color: '#dbeafe',
    marginTop: 5,
    fontSize: 14,
  },

  content: {
    padding: 15,
    paddingBottom: 20,
  },

  section: {
    marginBottom: 18,
  },

  label: {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },

  dropdown: {
    borderColor: '#d1d5db',
    minHeight: 52,
    borderRadius: 10,
  },

  dropdownContainer: {
    borderColor: '#d1d5db',
    borderRadius: 10,
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#111',
  },

  stockBox: {
    backgroundColor: '#dbeafe',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },

  stockLabel: {
    color: '#1e3a8a',
    fontWeight: 'bold',
    marginBottom: 5,
  },

  stockValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
  },

  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },

  historyButton: {
    backgroundColor: '#111827',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },

  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 25,
    marginBottom: 10,
  },

  historyItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  left: {
    fontWeight: 'bold',
    color: '#374151',
  },

  right: {
    color: '#111827',
    maxWidth: '60%',
    textAlign: 'right',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

});