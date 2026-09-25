import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Animated,
  RefreshControl,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    date_achat: '',
  });

  const [modalVisible, setModalVisible] = useState(false);

  const [newProduit, setNewProduit] = useState({
    reference: '',
    designation: '',
    quantite_stock: '',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // =========================================================
  // FORMATER LA DATE SANS AFFICHER L'HEURE
  // Exemple :
  // 2026-09-24T10:35:42.000Z
  // devient :
  // 24/09/2026
  // =========================================================
  const formatDate = (date) => {
    if (!date) return '';

    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleDateString('fr-FR');
  };

  // =========================================================
  // CHARGER LES ACHATS
  // =========================================================
  const fetchAchats = useCallback(() => {
    axios
      .get(`https://gestion-stock-app-production.up.railway.app/api/achats`)
      .then(res => {
        setAchats(res.data);
      })
      .catch(() => {
        Alert.alert(
          'Erreur',
          'Impossible de charger les achats'
        );
      });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    fetchAchats();
  }, [fetchAchats]);

  // =========================================================
  // REFRESH
  // =========================================================
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    await fetchAchats();

    setRefreshing(false);
  }, [fetchAchats]);

  // =========================================================
  // MODIFIER UN ACHAT
  // =========================================================
  const updateAchat = (id, field, value) => {
    setAchats(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, [field]: value }
          : a
      )
    );
  };

  // =========================================================
  // SAUVEGARDER UN ACHAT
  // =========================================================
  const saveAchat = (achat) => {
    const quantite_depot1 =
      parseFloat(achat.quantite_depot1) || 0;

    const quantite_depot2 =
      parseFloat(achat.quantite_depot2) || 0;

    const quantite_achat =
      quantite_depot1 + quantite_depot2;

    const prix_achat =
      achat.prix_achat
        ? Number(achat.prix_achat)
        : 0;

    const updatedAchat = {
      ...achat,
      quantite_depot1,
      quantite_depot2,
      quantite_achat,
      prix_achat
    };

    axios
      .put(
        `https://gestion-stock-app-production.up.railway.app/api/achats/${achat.id}`,
        updatedAchat
      )
      .then(() => {
        Alert.alert(
          'Succès',
          'Achat mis à jour'
        );

        fetchAchats();
      })
      .catch(() => {
        Alert.alert(
          'Erreur',
          'Impossible de sauvegarder'
        );
      });
  };

  // =========================================================
  // CRÉER UN ACHAT
  // =========================================================
  const createAchat = () => {
    if (!newAchat.produit_reference) {
      return Alert.alert(
        'Erreur',
        'Référence obligatoire'
      );
    }

    if (
      !newAchat.quantite_depot1 &&
      !newAchat.quantite_depot2
    ) {
      return Alert.alert(
        'Erreur',
        'Remplir au moins une quantité'
      );
    }

    const quantite_depot1 =
      parseFloat(newAchat.quantite_depot1) || 0;

    const quantite_depot2 =
      parseFloat(newAchat.quantite_depot2) || 0;

    const quantite_achat =
      quantite_depot1 + quantite_depot2;

    const prix_achat =
      newAchat.prix_achat
        ? Number(newAchat.prix_achat)
        : 0;

    axios
      .post(
        `https://gestion-stock-app-production.up.railway.app/api/achats`,
        {
          produit_reference:
            newAchat.produit_reference,

          quantite_depot1,
          quantite_depot2,
          quantite_achat,
          prix_achat
        }
      )
      .then(() => {
        setNewAchat({
          produit_reference: '',
          quantite_depot1: '',
          quantite_depot2: '',
          prix_achat: '',
          date_achat: ''
        });

        fetchAchats();
      })
      .catch(() => {
        Alert.alert(
          'Erreur',
          'Impossible de créer l’achat'
        );
      });
  };

  // =========================================================
  // CRÉER UN PRODUIT
  // =========================================================
  const saveProduit = () => {
    if (
      !newProduit.reference ||
      !newProduit.designation 
      //!newProduit.quantite_stock
    ) {
      return Alert.alert(
        'Erreur',
        'Référence, Désignation et quantite_stock obligatoires'
      );
    }

    const quantite_stock =
      //parseFloat(newProduit.quantite_stock) || 0;

    axios
      .post(
        `https://gestion-stock-app-production.up.railway.app/api/produits`,
        {
          reference: newProduit.reference,
          designation: newProduit.designation,
          quantite_stock,
          quantite_stock_2: 0
        }
      )
      .then(() => {
        Alert.alert(
          'Succès',
          'Produit créé'
        );

        setNewProduit({
          reference: '',
          designation: ''
          //quantite_stock: ''
        });

        setModalVisible(false);

        fetchAchats();
      })
      .catch(() => {
        Alert.alert(
          'Erreur',
          'Impossible de créer le produit'
        );
      });
  };

  // =========================================================
  // AFFICHER UNE LIGNE
  // =========================================================
  const renderRow = ({ item, index }) => (
    <Animated.View
      style={{
        opacity: fadeAnim
      }}
    >
      <View
        style={[
          styles.row,
          index % 2 === 0
            ? styles.rowEven
            : styles.rowOdd
        ]}
      >

        {/* RÉFÉRENCE */}
        <Text
          style={[
            styles.cell,
            { width: 120 }
          ]}
        >
          {item.reference}
        </Text>

        {/* DÉSIGNATION */}
        <Text
          style={[
            styles.cell,
            { width: 300 }
          ]}
        >
          {item.designation}
        </Text>

        {/* DEPOT 1 */}
        <TextInput
          style={[
            styles.input,
            { width: 150 }
          ]}
          keyboardType="numeric"
          value={String(
            item.quantite_depot1 || ''
          )}
          onChangeText={text =>
            updateAchat(
              item.id,
              'quantite_depot1',
              text
            )
          }
        />

        {/* DEPOT 2 */}
        <TextInput
          style={[
            styles.input,
            { width: 150 }
          ]}
          keyboardType="numeric"
          value={String(
            item.quantite_depot2 || ''
          )}
          onChangeText={text =>
            updateAchat(
              item.id,
              'quantite_depot2',
              text
            )
          }
        />

        {/* DATE ACHAT SANS HEURE */}
        <Text
          style={[
            styles.cell,
            { width: 150 }
          ]}
        >
          {formatDate(item.date_achat)}
        </Text>

        {/* TOTAL */}
        <Text
          style={[
            styles.cell,
            {
              width: 100,
              textAlign: 'center'
            }
          ]}
        >
          {item.quantite_achat || 0}
        </Text>

        {/* BOUTON SAUVEGARDER */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => saveAchat(item)}
        >
          <FontAwesome
            name="save"
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

      </View>
    </Animated.View>
  );

  // =========================================================
  // INTERFACE
  // =========================================================
  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <LinearGradient
        colors={[
          '#2563eb',
          '#1e40af'
        ]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>
          🧾 Gestion des Achats
        </Text>
      </LinearGradient>

      {/* =====================================================
          ZONE AJOUT ACHAT
      ====================================================== */}
      <View style={styles.addRow}>

        <TextInput
          placeholder="Référence"
          placeholderTextColor="#63676eff"
          style={styles.inputAdd}
          value={newAchat.produit_reference}
          minWidth="300"
          onChangeText={text =>
            setNewAchat({
              ...newAchat,
              produit_reference: text
            })
          }
        />

        <TextInput
          placeholder="Depot Hay Mohammadi"
          placeholderTextColor="#63676eff"
          style={styles.inputAdd}
          keyboardType="numeric"
          minWidth="300"
          value={newAchat.quantite_depot1}
          onChangeText={text =>
            setNewAchat({
              ...newAchat,
              quantite_depot1: text
            })
          }
        />

        <TextInput
          placeholder="Depot Had Soualem"
          placeholderTextColor="#63676eff"
          style={styles.inputAdd}
          keyboardType="numeric"
          minWidth="300"
          value={newAchat.quantite_depot2}
          onChangeText={text =>
            setNewAchat({
              ...newAchat,
              quantite_depot2: text
            })
          }
        />

        {/* DATE ACHAT DÉSACTIVÉE */}
        {/*
        <TextInput
          placeholder="Date Achat"
          placeholderTextColor="#63676eff"
          style={styles.inputAdd}
          keyboardType="date"
          minWidth="300"
          value={newAchat.date_achat}
          onChangeText={text =>
            setNewAchat({
              ...newAchat,
              date_achat: text
            })
          }
        />
        */}

        {/* AJOUT ACHAT */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={createAchat}
        >
          <FontAwesome
            name="plus"
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

        {/* NOUVEAU PRODUIT */}
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: '#1957a3ff'
            }
          ]}
          onPress={() =>
            setModalVisible(true)
          }
        >
          <Text
            style={{
              color: '#fff',
              marginLeft: 6
            }}
          >
            Nouveau produit
          </Text>
        </TouchableOpacity>

      </View>

      {/* =====================================================
          MODAL AJOUT PRODUIT
      ====================================================== */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View style={styles.modalBackground}>

          <View style={styles.modalContainer}>

            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 10
              }}
            >
              Ajouter Produit
            </Text>

            {/* RÉFÉRENCE */}
            <TextInput
              placeholder="Référence"
              placeholderTextColor="#63676eff"
              style={styles.inputAdd}
              value={newProduit.reference}
              onChangeText={text =>
                setNewProduit({
                  ...newProduit,
                  reference: text
                })
              }
            />

            {/* DÉSIGNATION */}
            <TextInput
              placeholder="Désignation"
              placeholderTextColor="#63676eff"
              style={styles.inputAdd}
              value={newProduit.designation}
              onChangeText={text =>
                setNewProduit({
                  ...newProduit,
                  designation: text
                })
              }
            />

            {/* QUANTITÉ STOCK DÉSACTIVÉE */}
            {/*
            <TextInput
              placeholder="Quantité Stock"
              placeholderTextColor="#63676eff"
              style={styles.inputAdd}
              keyboardType="numeric"
              value={newProduit.quantite_stock}
              onChangeText={text =>
                setNewProduit({
                  ...newProduit,
                  quantite_stock: text
                })
              }
            />
            */}

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 10
              }}
            >

              {/* ENREGISTRER */}
              <TouchableOpacity
                style={[
                  styles.addButton,
                  {
                    flex: 1,
                    marginRight: 5
                  }
                ]}
                onPress={saveProduit}
              >
                <Text style={{ color: '#fff' }}>
                  Enregistrer
                </Text>
              </TouchableOpacity>

              {/* ANNULER */}
              <TouchableOpacity
                style={[
                  styles.addButton,
                  {
                    flex: 1,
                    backgroundColor: '#999',
                    marginLeft: 5
                  }
                ]}
                onPress={() =>
                  setModalVisible(false)
                }
              >
                <Text style={{ color: '#fff' }}>
                  Annuler
                </Text>
              </TouchableOpacity>

            </View>

          </View>
        </View>
      </Modal>

      {/* =====================================================
          TABLEAU
      ====================================================== */}
      <ScrollView horizontal>

        <View style={{ minWidth: 1000 }}>

          {/* EN-TÊTE TABLEAU */}
          <View
            style={[
              styles.row,
              styles.tableHeader
            ]}
          >

            <Text
              style={[
                styles.cell,
                { width: 120 }
              ]}
            >
              Réf
            </Text>

            <Text
              style={[
                styles.cell,
                { width: 300 }
              ]}
            >
              Désignation
            </Text>

            <Text
              style={[
                styles.cell,
                { width: 150 }
              ]}
            >
              Depot 1
            </Text>

            <Text
              style={[
                styles.cell,
                { width: 150 }
              ]}
            >
              Depot 2
            </Text>

            <Text
              style={[
                styles.cell,
                { width: 150 }
              ]}
            >
              Date Achat
            </Text>

            <Text
              style={[
                styles.cell,
                { width: 100 }
              ]}
            >
              Total
            </Text>

            <Text
              style={[
                styles.cell,
                { width: 50 }
              ]}
            >
              Action
            </Text>

          </View>

          {/* LISTE DES ACHATS */}
          <FlatList
            data={achats}
            keyExtractor={item =>
              item.id.toString()
            }
            renderItem={renderRow}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
          />

        </View>

      </ScrollView>

    </SafeAreaView>
  );
};

// =========================================================
// STYLES
// =========================================================
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f5f7fb'
  },

  header: {
    padding: 16,
    paddingTop: 20
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8
  },

  rowEven: {
    backgroundColor: '#fff'
  },

  rowOdd: {
    backgroundColor: '#f9fafc'
  },

  tableHeader: {
    backgroundColor: '#e0e7ff',
    borderRadius: 6
  },

  cell: {
    paddingHorizontal: 6,
    textAlign: 'center',
    color: '#1f2937'
  },

  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 6,
    textAlign: 'center',
    minWidth: 120,
    backgroundColor: '#fff'
  },

  inputAdd: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 8,
    margin: 5,
    backgroundColor: '#fff'
  },

  addRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14
  },

  addButton: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5
  },

  saveButton: {
    backgroundColor: '#16a34a',
    padding: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5
  },

  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },

  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20
  }

});

export default AchatsScreen;