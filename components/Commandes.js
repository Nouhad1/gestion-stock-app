import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, ScrollView, RefreshControl, Alert, Animated, SafeAreaView
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { API_URL } from '../config/config';

const CommandesScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const [tab, setTab] = useState('form');
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [openClient, setOpenClient] = useState(false);
  const [openProduit, setOpenProduit] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [produitRef, setProduitRef] = useState(null);
  const [quantite, setQuantite] = useState('');
  const [rouleaux, setRouleaux] = useState('');
  const [metres, setMetres] = useState('');
  const [blNum, setBlNum] = useState('');
  const [montant, setMontant] = useState('');
  const [quantiteStock, setQuantiteStock] = useState(0);
  const [longueurParRouleau, setLongueurParRouleau] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    axios.get(`https://gestion-stock-app-production.up.railway.app/api/clients`)
      .then(res => setClients(res.data.map(c => ({ label: c.nom, value: c.id }))))
      .catch(console.error);

    axios.get(`https://gestion-stock-app-production.up.railway.app/api/produits`)
      .then(res => setProduits(res.data.map(p => ({
        label: p.designation,
        value: p.reference,
        longueur_par_rouleau: Number(p.longueur_par_rouleau) || 0,
        quantite_stock: Number(p.quantite_stock) || 0,
        type: p.designation.toUpperCase().includes('ROUL') ? 'laniere' : 'autre'
      }))))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const p = produits.find(prod => prod.value === produitRef);
    if (p) {
      setQuantiteStock(p.quantite_stock);
      setLongueurParRouleau(p.longueur_par_rouleau);
    } else {
      setQuantiteStock(0);
      setLongueurParRouleau(0);
    }
    setQuantite(''); setRouleaux(''); setMetres('');
  }, [produitRef, produits]);

  const fetchCommandes = useCallback(async () => {
    try {
      const res = await axios.get(`https://gestion-stock-app-production.up.railway.app/api/commandes`);
      setCommandes(res.data || []);
    } catch (err) {
      console.error(err);
      setCommandes([]);
    }
  }, []);
  useEffect(() => { fetchCommandes(); }, [fetchCommandes]);
  const onRefresh = () => { setRefreshing(true); fetchCommandes().finally(() => setRefreshing(false)); };

  const produitSelectionne = produits.find(p => p.value === produitRef);
  const islaniere = produitSelectionne?.type === 'laniere';

  const handleMetresChange = text => { setMetres(text.replace(/[^0-9]/g, '')); if(text) setRouleaux(''); };
  const handleRouleauxChange = text => { setRouleaux(text.replace(/[^0-9]/g, '')); if(text) setMetres(''); };
  const resetForm = () => { setClientId(null); setProduitRef(null); setQuantite(''); setRouleaux(''); setMetres(''); setBlNum(''); setMontant(''); };

  const handleSubmit = async () => {
    if (!clientId) return Alert.alert('Erreur', 'Sélectionner un client.');
    if (!produitRef) return Alert.alert('Erreur', 'Sélectionner un produit.');

    try {
      const body = { client_id: clientId, produit_reference: produitRef, bl_num: blNum || null, montant: montant ? parseFloat(montant) : null };
      if (islaniere) {
        const r = parseInt(rouleaux) || 0;
        const m = parseInt(metres) || 0;
        if (r <= 0 && m <= 0) return Alert.alert('Erreur', 'Renseigner au moins rouleaux ou mètres.');
        if (r > quantiteStock) return Alert.alert('Erreur', `Stock insuffisant. Max ${quantiteStock} rouleaux.`);
        if (m > quantiteStock * longueurParRouleau) return Alert.alert('Erreur', `Stock insuffisant. Max ${quantiteStock * longueurParRouleau} m.`);
        if (r > 0) body.quantite_commande = r;
        if (m > 0) body.metres_commandees = m;
      } else {
        const qte = parseFloat(quantite);
        if (!qte || qte <= 0) return Alert.alert('Erreur', 'Veuillez entrer une quantité valide.');
        if (qte > quantiteStock) return Alert.alert('Erreur', `Stock insuffisant. Stock disponible: ${quantiteStock}`);
        body.quantite_commande = qte;
      }
      await axios.post(`https://gestion-stock-app-production.up.railway.app/api/commandes`,body);
      Alert.alert('Succès', 'Commande enregistrée.');
      resetForm();
      fetchCommandes();
    } catch (err) {
      console.error(err.response?.data || err);
      Alert.alert('Erreur', "L'enregistrement a échoué.");
    }
  };

  const renderItem = ({ item, index }) => {
    let displayQuantite = item.quantite_commande > 0 ? `${item.quantite_commande}` : item.metres_commandees > 0 ? `${item.metres_commandees} m` : '-';
    return (
      <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
        <Text style={[styles.cell, { width: 180, textAlign: 'left' }]}>{item.nom_client}</Text>
        <Text style={[styles.cell, { width: 220, textAlign: 'center' }]}>{item.designation_produit}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{displayQuantite}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{item.date_commande}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{item.bl_num || '-'}</Text>
        <Text style={[styles.cell, { width: 120 }]}>{item.montant || '-'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="receipt-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.headerTitle}>Gestion des Commandes</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, tab === 'form' && styles.activeTab]} onPress={() => setTab('form')}>
          <Icon name="add-circle-outline" size={18} color={tab === 'form' ? 'white' : '#2563eb'} />
          <Text style={[styles.tabText, tab === 'form' && styles.activeTabText]}> Nouvelle commande</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, tab === 'list' && styles.activeTab]} onPress={() => setTab('list')}>
          <Icon name="list-alt" size={18} color={tab === 'list' ? 'white' : '#2563eb'} />
          <Text style={[styles.tabText, tab === 'list' && styles.activeTabText]}> Commandes passées</Text>
        </TouchableOpacity>
      </View>

      {tab === 'form' ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <Text style={styles.label}>BL N° :</Text>
            <TextInput placeholder="Ex: BL001" placeholderTextColor="#63676eff" value={blNum} onChangeText={setBlNum} style={styles.input}/>

            <Text style={styles.label}>Client :</Text>
            <DropDownPicker open={openClient} value={clientId} items={clients}
              setOpen={setOpenClient} setValue={setClientId} setItems={setClients}
              searchable placeholder="Sélectionner un client"
              style={styles.dropdown} dropDownContainerStyle={styles.dropdownContainer} listMode="MODAL"
            />

            <Text style={styles.label}>Produit :</Text>
            <DropDownPicker open={openProduit} value={produitRef} items={produits}
              setOpen={setOpenProduit} setValue={setProduitRef} setItems={setProduits}
              searchable placeholder="Sélectionner un produit"
              style={styles.dropdown} dropDownContainerStyle={styles.dropdownContainer} listMode="MODAL"
            />

            {produitSelectionne && (
              <View style={styles.stockBox}>
                <Text style={styles.stockText}>Stock disponible : {quantiteStock}</Text>
                {islaniere && longueurParRouleau > 0 && <Text style={styles.stockText}>Longueur par rouleau : {longueurParRouleau} m</Text>}
              </View>
            )}

            {islaniere ? (
              <>
                <Text style={styles.label}>Nombre de rouleaux :</Text>
                <TextInput placeholder="Ex: 2" placeholderTextColor="#63676eff" value={rouleaux} onChangeText={handleRouleauxChange} keyboardType="numeric" style={styles.input}/>
                <Text style={styles.label}>Mètres :</Text>
                <TextInput placeholder="Ex: 10" placeholderTextColor="#63676eff" value={metres} onChangeText={handleMetresChange} keyboardType="numeric" style={styles.input}/>
              </>
            ) : (
              <>
                <Text style={styles.label}>Quantité :</Text>
                <TextInput placeholder="Ex: 5" placeholderTextColor="#63676eff" value={quantite} onChangeText={text => setQuantite(text.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input}/>
              </>
            )}

            <Text style={styles.label}>Montant :</Text>
            <TextInput placeholder="Ex: 2000" placeholderTextColor="#63676eff" value={montant} onChangeText={setMontant} keyboardType="numeric" style={styles.input}/>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
              <Icon name="save" size={20} color="white" />
              <Text style={styles.submitText}> Enregistrer la commande</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      ) : (
        <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.tableContainer}>
            <View style={[styles.row, styles.tableHeader]}>
              <Text style={[styles.cell, styles.headerText, { width: 180 , textAlign: 'left' }]}>Client</Text>
              <Text style={[styles.cell, styles.headerText, { width: 220 }]}>Produit</Text>
              <Text style={[styles.cell, styles.headerText, { width: 100 }]}>Quantité</Text>
              <Text style={[styles.cell, styles.headerText, { width: 100 }]}>Date</Text>
              <Text style={[styles.cell, styles.headerText, { width: 100 }]}>BL N°</Text>
              <Text style={[styles.cell, styles.headerText, { width: 120 }]}>Montant</Text>
            </View>
            <FlatList
              data={commandes}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderItem}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#1e40af', fontSize: 16 }}>Aucune commande pour le moment.</Text>
                </View>
              }
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  header: { padding: 16 , paddingTop: 40 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  tabContainer: { flexDirection: 'row', margin: 12 },
  tabButton: { flexDirection: 'row', flex: 1, backgroundColor: '#e0e7ff', padding: 12, alignItems: 'center', justifyContent: 'center', marginRight: 6, borderRadius: 30 },
  activeTab: { backgroundColor: '#2563eb' },
  tabText: { color: '#2563eb', fontWeight: 'bold' },
  activeTabText: { color: 'white' },

  card: { backgroundColor: '#ffffff', padding: 18, borderRadius: 18, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity:0.08, shadowRadius:12, margin: 12 },
  label: { fontWeight: '600', marginBottom: 6, color: '#1e3a8a', fontSize: 15 },
  dropdown: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', borderRadius: 14, marginBottom: 14, paddingHorizontal: 10 },
  dropdownContainer: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', borderRadius: 14 },
  stockBox: { marginVertical: 12, backgroundColor: '#e0f2fe', padding: 14, borderRadius: 14 },
  stockText: { fontSize: 14, color: '#1e40af' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 14, padding: 14, marginBottom: 14, backgroundColor: '#f8fafc', fontSize: 15 },
  submitButton: { flexDirection: 'row', backgroundColor: '#1e40af', padding: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 30 },
  submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  tableContainer: { minWidth: 820, borderRadius: 8, margin: 12 },
  row: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  rowEven: { backgroundColor: '#fff' },
  rowOdd: { backgroundColor: '#f9fafc' },
  tableHeader: { backgroundColor: '#1e3a8a', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  cell: { fontSize: 14, color: '#374151', textAlign: 'center' },
  headerText: { color: '#fff', fontWeight: '700' },
});

export default CommandesScreen;
