import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ScrollView, Alert, StyleSheet, Animated, RefreshControl,
  SafeAreaView, Modal
} from 'react-native';
import axios from 'axios';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const AchatsScreen = () => {
  const [achats, setAchats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [newAchat, setNewAchat] = useState({
    produit_reference: '',
    quantite_depot1: '',
    quantite_depot2: '',
    prix_achat: '',
  });
  const [modalVisible, setModalVisible] = useState(false); 
  const [newProduit, setNewProduit] = useState({
    reference: '',
    designation: '',
    quantite_stock: '',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchAchats = useCallback(() => {
    axios.get(`https://gestion-stock-app-production.up.railway.app/api/achats`)
      .then(res => setAchats(res.data))
      .catch(() => Alert.alert('Erreur', 'Impossible de charger les achats'));
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => { fetchAchats(); }, [fetchAchats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAchats();
    setRefreshing(false);
  }, [fetchAchats]);

  const updateAchat = (id, field, value) => {
    setAchats(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const saveAchat = (achat) => {
    const quantite_depot1 = parseFloat(achat.quantite_depot1) || 0;
    const quantite_depot2 = parseFloat(achat.quantite_depot2) || 0;
    const quantite_achat = quantite_depot1 + quantite_depot2;
    const prix_achat = achat.prix_achat ? Number(achat.prix_achat) : 0;

    const updatedAchat = { ...achat, quantite_depot1, quantite_depot2, quantite_achat, prix_achat };

    axios.put(`https://gestion-stock-app-production.up.railway.app/api/achats/${achat.id}`, updatedAchat)
      .then(() => { Alert.alert('Succès', 'Achat mis à jour'); fetchAchats(); })
      .catch(() => Alert.alert('Erreur', 'Impossible de sauvegarder'));
  };

  const createAchat = () => {
    if (!newAchat.produit_reference) return Alert.alert('Erreur', 'Référence obligatoire');
    if (!newAchat.quantite_depot1 && !newAchat.quantite_depot2) return Alert.alert('Erreur', 'Remplir au moins une quantité');

    const quantite_depot1 = parseFloat(newAchat.quantite_depot1) || 0;
    const quantite_depot2 = parseFloat(newAchat.quantite_depot2) || 0;
    const quantite_achat = quantite_depot1 + quantite_depot2;
    const prix_achat = newAchat.prix_achat ? Number(newAchat.prix_achat) : 0;

    axios.post(`https://gestion-stock-app-production.up.railway.app/api/achats`, {
      produit_reference: newAchat.produit_reference,
      quantite_depot1,
      quantite_depot2,
      quantite_achat,
      prix_achat
    })
    .then(() => { 
      setNewAchat({ produit_reference: '', quantite_depot1: '', quantite_depot2: '', prix_achat: '' });
      fetchAchats();
    })
    .catch(() => Alert.alert('Erreur', 'Impossible de créer l’achat'));
  };

  const saveProduit = () => { 
    if (!newProduit.reference || !newProduit.designation || !newProduit.quantite_stock) {
      return Alert.alert('Erreur', 'Référence, Désignation et quantite_stock obligatoires');
    }

    const quantite_stock = parseFloat(newProduit.quantite_stock) || 0;

    axios.post(`https://gestion-stock-app-production.up.railway.app/api/produits`, {
      reference: newProduit.reference,
      designation: newProduit.designation,
      quantite_stock,
      quantite_stock_2: 0
    })
    .then(() => {
      Alert.alert('Succès', 'Produit créé');
      setNewProduit({ reference: '', designation: '', quantite_stock: '' });
      setModalVisible(false);
      fetchAchats();
    })
    .catch(() => Alert.alert('Erreur', 'Impossible de créer le produit'));
  };

  const renderRow = ({ item, index }) => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
        <Text style={[styles.cell, { width: 120 }]}>{item.reference}</Text>
        <Text style={[styles.cell, { width: 300 }]}>{item.designation}</Text>
        <TextInput
          style={[styles.input, { width: 150 }]}
          keyboardType="numeric"
          value={String(item.quantite_depot1 || '')}
          onChangeText={text => updateAchat(item.id, 'quantite_depot1', text)}
        />
        <TextInput
          style={[styles.input, { width: 150 }]}
          keyboardType="numeric"
          value={String(item.quantite_depot2 || '')}
          onChangeText={text => updateAchat(item.id, 'quantite_depot2', text)}
        />
        <TextInput
          style={[styles.input, { width: 150 }]}
          keyboardType="numeric"
          value={String(item.prix_achat || '')}
          onChangeText={text => updateAchat(item.id, 'prix_achat', text)}
        />
        <Text style={[styles.cell, { width: 100, textAlign: 'center' }]}>{item.quantite_achat || 0}</Text>
        <TouchableOpacity style={styles.saveButton} onPress={() => saveAchat(item)}>
          <FontAwesome name="save" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#2563eb','#1e40af']} style={styles.header}>
        <Text style={styles.headerTitle}>🧾 Gestion des Achats</Text>
      </LinearGradient>

      <View style={styles.addRow}>
        <TextInput placeholder="Référence" placeholderTextColor="#63676eff" style={styles.inputAdd} value={newAchat.produit_reference} minWidth="300"
          onChangeText={text => setNewAchat({ ...newAchat, produit_reference: text })} />
        <TextInput placeholder="Depot Hay Mohammadi" placeholderTextColor="#63676eff" style={styles.inputAdd} keyboardType="numeric" minWidth="300"
          value={newAchat.quantite_depot1} onChangeText={text => setNewAchat({ ...newAchat, quantite_depot1: text })} />
        <TextInput placeholder="Depot Had Soualem" placeholderTextColor="#63676eff" style={styles.inputAdd} keyboardType="numeric" minWidth="300"
          value={newAchat.quantite_depot2} onChangeText={text => setNewAchat({ ...newAchat, quantite_depot2: text })} />
        <TextInput placeholder="Prix Achat" placeholderTextColor="#63676eff" style={styles.inputAdd} keyboardType="numeric" minWidth="300"
          value={newAchat.prix_achat} onChangeText={text => setNewAchat({ ...newAchat, prix_achat: text })} />
        <TouchableOpacity style={styles.addButton} onPress={createAchat}>
          <FontAwesome name="plus" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: '#1957a3ff' }]} onPress={() => setModalVisible(true)}>
          <Text style={{ color: '#fff', marginLeft: 6 }}>Nouveau produit</Text>
        </TouchableOpacity>
      </View>

      {/* Modal pour ajouter produit */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={{ fontSize:18, fontWeight:'bold', marginBottom:10 }}>Ajouter Produit</Text>
            <TextInput placeholder="Référence" placeholderTextColor="#63676eff" style={styles.inputAdd} value={newProduit.reference} 
              onChangeText={text => setNewProduit({ ...newProduit, reference: text })} />
            <TextInput placeholder="Désignation" placeholderTextColor="#63676eff" style={styles.inputAdd} value={newProduit.designation}
              onChangeText={text => setNewProduit({ ...newProduit, designation: text })} />
            <TextInput placeholder="Quantité Stock" placeholderTextColor="#63676eff" style={styles.inputAdd} keyboardType="numeric"
              value={newProduit.quantite_stock} onChangeText={text => setNewProduit({ ...newProduit, quantite_stock: text })} />
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:10 }}>
              <TouchableOpacity style={[styles.addButton,{flex:1, marginRight:5}]} onPress={saveProduit}>
                <Text style={{ color:'#fff' }}>Enregistrer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addButton,{flex:1, backgroundColor:'#999', marginLeft:5}]} onPress={() => setModalVisible(false)}>
                <Text style={{ color:'#fff' }}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView horizontal>
        <View style={{ minWidth: 1000 }}>
          <View style={[styles.row, styles.tableHeader]}>
            <Text style={[styles.cell, { width: 120 }]}>Réf</Text>
            <Text style={[styles.cell, { width: 300 }]}>Désignation</Text>
            <Text style={[styles.cell, { width: 150 }]}>Depot1</Text>
            <Text style={[styles.cell, { width: 150 }]}>Depot2</Text>
            <Text style={[styles.cell, { width: 150 }]}>Prix Achat</Text>
            <Text style={[styles.cell, { width: 100 }]}>Total</Text>
            <Text style={[styles.cell, { width: 50 }]}>Action</Text>
          </View>

          <FlatList
            data={achats}
            keyExtractor={item => item.id.toString()}
            renderItem={renderRow}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f5f7fb' },
  header:{ padding:16, paddingTop:40 },
  headerTitle:{ fontSize:24, fontWeight:'bold', color:'#fff' },
  row:{ flexDirection:'row', alignItems:'center', paddingVertical:10, paddingHorizontal:8 },
  rowEven:{ backgroundColor:'#fff' },
  rowOdd:{ backgroundColor:'#f9fafc' },
  tableHeader:{ backgroundColor:'#e0e7ff', borderRadius:6 },
  
  cell:{ paddingHorizontal:6, textAlign:'center', color:'#1f2937' },
  input:{ borderWidth:1, borderColor:'#cbd5e1', borderRadius:6, padding:6, textAlign:'center', minWidth:120, backgroundColor:'#fff' },
  inputAdd:{ borderWidth:1, borderColor:'#cbd5e1', borderRadius:8, padding:8, margin:5, backgroundColor:'#fff' },
  addRow:{ flexDirection:'row', flexWrap:'wrap', alignItems:'center', backgroundColor:'#fff', padding:12, borderRadius:12, marginBottom:14 },
  addButton:{ backgroundColor:'#2563eb', padding:10, borderRadius:8, justifyContent:'center', alignItems:'center', margin:5 },
  saveButton:{ backgroundColor:'#16a34a', padding:6, borderRadius:8, justifyContent:'center', alignItems:'center', marginLeft:5 },
  modalBackground:{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.5)' },
  modalContainer:{ width:'90%', backgroundColor:'#fff', borderRadius:12, padding:20 }
});

export default AchatsScreen;
