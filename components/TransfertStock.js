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

  const employesAutorises = [
    'ADMP001',
    'EMP001',
    'EMP002',
    'EMP003',
  ];

  const peutVoirHistorique =
    employesAutorises.includes(
      matriculeConnecte
    );

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

  /* ================= FETCH HISTORIQUE ================= */

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

    if (peutVoirHistorique) {
      fetchHistorique();
    }

  }, []);

  /* ================= PRODUIT ================= */

  const produitData = useMemo(() => {

    return produits.find(
      (p) => p.value === selectedProduit
    )?.data;

  }, [selectedProduit, produits]);

  /* ================= STOCK ================= */

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

      if (peutVoirHistorique) {
        fetchHistorique();
      }

    } catch (err) {

      console.log(err.response?.data || err);

      Alert.alert(
        'Erreur',
        'Erreur lors du transfert'
      );
    }
  };

  /* ================= LOADING ================= */

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
          showHistory &&
          peutVoirHistorique
            ? historique
            : []
        }

        keyExtractor={(item) =>
          item.id.toString()
        }

        showsVerticalScrollIndicator={false}

        ListHeaderComponent={

          <>

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

                  setValue={(callback) =>
                    setSelectedProduit(
                      callback(selectedProduit)
                    )
                  }

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

                  setValue={(callback) =>
                    setDepotSource(
                      callback(depotSource)
                    )
                  }

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
                  setOpen={
                    setOpenDestination
                  }

                  setValue={(callback) =>
                    setDepotDestination(
                      callback(
                        depotDestination
                      )
                    )
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

              {peutVoirHistorique && (

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

              )}

            </View>

          </>
        }

        renderItem={({ item }) => (

          <View style={styles.historyItem}>

            <Text>
              Produit :
              {' '}
              {item.produit_reference}
            </Text>

            <Text>
              Quantité :
              {' '}
              {item.quantite}
            </Text>

            <Text>
              {item.depot_source}
              {' → '}
              {item.depot_destination}
            </Text>

            <Text>
              {new Date(
                item.date_transfert
              ).toLocaleString()}
            </Text>

          </View>
        )}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },

  header: {
    padding: 20,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },

  content: {
    padding: 15,
  },

  section: {
    marginBottom: 18,
  },

  label: {
    marginBottom: 8,
    fontWeight: 'bold',
  },

  dropdown: {
    borderColor: '#d1d5db',
    minHeight: 52,
  },

  dropdownContainer: {
    borderColor: '#d1d5db',
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 14,
    borderRadius: 10,
  },

  stockBox: {
    backgroundColor: '#dbeafe',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 10,
  },

  stockLabel: {
    fontWeight: 'bold',
  },

  stockValue: {
    fontSize: 30,
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
    fontWeight: 'bold',
  },

  historyItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 10,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

});