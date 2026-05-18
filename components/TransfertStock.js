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

  const [depotSource, setDepotSource] = useState('depot1');
  const [depotDestination, setDepotDestination] = useState('depot2');

  const matriculeConnecte = 'EMP001';

  const depots = [
    { label: 'Hay Mohammadi', value: 'depot1' },
    { label: 'Had Soualem', value: 'depot2' },
  ];

  /* ================= PRODUITS ================= */

  const fetchProduits = async () => {
    try {
      const res = await axios.get(API_URL);

      const formatted = res.data.map(item => ({
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

  useEffect(() => {
    fetchProduits();
  }, []);

  /* ================= STOCK ================= */

  const produitData = useMemo(() => {
    return produits.find(p => p.value === selectedProduit)?.data;
  }, [selectedProduit, produits]);

  const stockDisponible = useMemo(() => {
    if (!produitData) return 0;

    return depotSource === 'depot1'
      ? Number(produitData.quantite_stock || 0)
      : Number(produitData.quantite_stock_2 || 0);
  }, [produitData, depotSource]);

  /* ================= TRANSFERT ================= */

  const handleTransfer = async () => {

    if (!selectedProduit) return Alert.alert('Erreur', 'Produit requis');

    if (!quantite || Number(quantite) <= 0)
      return Alert.alert('Erreur', 'Quantité invalide');

    if (depotSource === depotDestination)
      return Alert.alert('Erreur', 'Dépôts identiques');

    if (Number(quantite) > stockDisponible)
      return Alert.alert('Stock insuffisant', `${stockDisponible}`);

    try {

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

    } catch (err) {
      Alert.alert('Erreur', 'Erreur transfert');
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

      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
        <Text style={styles.headerTitle}>🚚 Transfert Stock</Text>
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
        />

        {/* SOURCE */}
        <DropDownPicker
          open={openSource}
          value={depotSource}
          items={depots}
          setOpen={setOpenSource}
          setValue={setDepotSource}
        />

        {/* DESTINATION */}
        <DropDownPicker
          open={openDestination}
          value={depotDestination}
          items={depots}
          setOpen={setOpenDestination}
          setValue={setDepotDestination}
        />

        {/* STOCK */}
        <Text>Stock: {stockDisponible}</Text>

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

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  header: { padding: 18 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 15 },
  input: { borderWidth: 1, padding: 10, marginTop: 10 },
  button: { backgroundColor: '#2563eb', padding: 15, marginTop: 20 },
  buttonText: { color: '#fff', textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});