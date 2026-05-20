import React, { useEffect, useMemo, useState } from 'react';
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

  const [loading, setLoading] = useState(true);

  const [produits, setProduits] = useState([]);
  const [selectedProduit, setSelectedProduit] = useState(null);

  const [quantite, setQuantite] = useState('');

  const [openProduit, setOpenProduit] = useState(false);
  const [openSource, setOpenSource] = useState(false);
  const [openDestination, setOpenDestination] = useState(false);

  const [depotSource, setDepotSource] = useState('depot1');
  const [depotDestination, setDepotDestination] = useState('depot2');

  const [historique, setHistorique] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const matriculeConnecte = 'EMP001';

  const employesAutorises = [
    'ADMP001',
    'EMP001',
    'EMP002',
    'EMP003',
  ];

  const depots = [
    { label: 'Hay Mohammadi', value: 'depot1' },
    { label: 'Had Soualem', value: 'depot2' },
  ];

  /* ================= PRODUITS ================= */

  const fetchProduits = async () => {
    try {
      const res = await axios.get(API_URL);

      const formatted = res.data.map((item) => ({
        label: `${item.reference} - ${item.designation}`,
        value: item.reference,
        data: item,
      }));

      setProduits(formatted);

    } catch (err) {
      Alert.alert('Erreur', 'Chargement produits impossible');
    } finally {
      setLoading(false);
    }
  };

  /* ================= HISTORIQUE ================= */

  const fetchHistorique = async () => {
    try {
      const res = await axios.get(`${API_TRANSFERT}/historique`);
      setHistorique(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchProduits();
    fetchHistorique();
  }, []);

  /* ================= PRODUIT ================= */

  const produitData = useMemo(() => {
    return produits.find(p => p.value === selectedProduit)?.data;
  }, [selectedProduit, produits]);

  /* ================= STOCK ================= */

  const stockDisponible = useMemo(() => {
    if (!produitData) return 0;

    return depotSource === 'depot1'
      ? Number(produitData.quantite_stock || 0)
      : Number(produitData.quantite_stock_2 || 0);
  }, [produitData, depotSource]);

  /* ================= TRANSFERT ================= */

  const handleTransfer = async () => {
    try {

      if (!selectedProduit)
        return Alert.alert('Erreur', 'Sélectionnez un produit');

      if (!quantite || Number(quantite) <= 0)
        return Alert.alert('Erreur', 'Quantité invalide');

      if (depotSource === depotDestination)
        return Alert.alert('Erreur', 'Dépôts identiques interdits');

      if (Number(quantite) > stockDisponible)
        return Alert.alert('Stock insuffisant', `Stock: ${stockDisponible}`);

      await axios.post(API_TRANSFERT, {
        matricule: matriculeConnecte,
        produit_reference: selectedProduit,
        depot_source: depotSource,
        depot_destination: depotDestination,
        quantite: Number(quantite),
      });

      Alert.alert('Succès', 'Transfert effectué');

      setQuantite('');
      setSelectedProduit(null);

      fetchProduits();
      fetchHistorique();

    } catch (err) {
      console.log(err);
      Alert.alert('Erreur', 'Transfert échoué');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
        <Text style={styles.headerTitle}>🚚 Transfert de Stock</Text>
      </LinearGradient>

      <View style={styles.content}>

        {/* PRODUIT */}
        <DropDownPicker
          open={openProduit}
          value={selectedProduit}
          items={produits}
          setOpen={setOpenProduit}
          setValue={setSelectedProduit}
          setItems={setProduits}
          placeholder="Produit"
        />

        {/* DEPOTS */}
        <DropDownPicker
          open={openSource}
          value={depotSource}
          items={depots}
          setOpen={setOpenSource}
          setValue={setDepotSource}
          setItems={() => {}}
          placeholder="Dépôt source"
        />

        <DropDownPicker
          open={openDestination}
          value={depotDestination}
          items={depots}
          setOpen={setOpenDestination}
          setValue={setDepotDestination}
          setItems={() => {}}
          placeholder="Dépôt destination"
        />

        {/* STOCK */}
        <Text style={styles.stock}>
          Stock: {stockDisponible}
        </Text>

        {/* QUANTITE */}
        <TextInput
          value={quantite}
          onChangeText={setQuantite}
          keyboardType="numeric"
          placeholder="Quantité"
          style={styles.input}
        />

        {/* BUTTON */}
        <TouchableOpacity style={styles.button} onPress={handleTransfer}>
          <Text style={styles.buttonText}>TRANSFÉRER</Text>
        </TouchableOpacity>

        {/* HISTORIQUE BUTTON */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#111' }]}
          onPress={() => setShowHistory(!showHistory)}
        >
          <Text style={styles.buttonText}>
            {showHistory ? 'Cacher historique' : 'Voir historique'}
          </Text>
        </TouchableOpacity>

        {/* HISTORIQUE */}
        {showHistory && (
          <FlatList
            data={historique}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <Text>{item.matricule}</Text>
                <Text>{item.produit_reference}</Text>
                <Text>{item.quantite}</Text>
                <Text>{item.depot_source} → {item.depot_destination}</Text>
              </View>
            )}
          />
        )}

      </View>
    </SafeAreaView>
  );
}

/* ================= STYLE ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },

  header: { padding: 18 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  content: { padding: 15 },

  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    marginTop: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: { color: '#fff', fontWeight: 'bold' },

  stock: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },

  historyItem: {
    backgroundColor: '#fff',
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});