import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

const ProductList = () => {
  const [produits, setProduits] = useState([]);
  const [selectedDepot, setSelectedDepot] = useState('depot1');
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const fetchProduits = async () => {
      try {
        const res = await axios.get(`https://gestion-stock-app-production.up.railway.app/api/produits`);
        setProduits(res.data);
      } catch (err) {
        console.error('❌ Erreur API produits:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduits();
  }, []);

  const renderAvailability = (stockQty) => {
    return stockQty > 0 ? (
      <Text style={styles.available}>✔️ Oui</Text>
    ) : (
      <Text style={styles.notAvailable}>❌ Non</Text>
    );
  };

  const renderItem = ({ item }) => {
    // Stock selon dépôt sélectionné
    const stockAffiche =
      selectedDepot === 'depot1' ? item.quantite_stock : item.quantite_stock_2;
    const stockQty = Number(stockAffiche || 0);
    const availability = renderAvailability(stockQty);

    // Stock global
    const stockDepot1 = Number(item.quantite_stock || 0);
    const stockDepot2 = Number(item.quantite_stock_2 || 0);
    const quantiteGlobale = stockDepot1 + stockDepot2;

    return (
      <View style={styles.row}>
        <Text style={[styles.cell, { width: 100 }]}>{item.reference}</Text>
        <Text style={[styles.cell, { width: 200 }]}>{item.designation}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{quantiteGlobale}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{stockDepot1}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{stockDepot2}</Text>
        <Text style={[styles.cell, { width: 150 }]}>
          {item.prix_unitaire ? `${Number(item.prix_unitaire).toFixed(2)} MAD` : "-"}
        </Text>
        <Text style={[styles.cell, { width: 200 }]}>
          {item.prix_moyen_achat ? `${Number(item.prix_moyen_achat).toFixed(2)} MAD` : "-"}
        </Text>
        <Text style={[styles.cell, { width: 100 }]}>{availability}</Text>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />;
  }

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={selectedDepot}
        style={styles.picker}
        onValueChange={(itemValue) => setSelectedDepot(itemValue)}
      >
        <Picker.Item label="Dépôt 1" value="depot1" />
        <Picker.Item label="Dépôt 2" value="depot2" />
      </Picker>

      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, { width: 100 }]}>Référence</Text>
        <Text style={[styles.headerCell, { width: 200 }]}>Désignation</Text>
        <Text style={[styles.headerCell, { width: 100 }]}>Global</Text>
        <Text style={[styles.headerCell, { width: 100 }]}>Dépôt 1</Text>
        <Text style={[styles.headerCell, { width: 100 }]}>Dépôt 2</Text>
        <Text style={[styles.headerCell, { width: 150 }]}>Prix Unitaire</Text>
        <Text style={[styles.headerCell, { width: 200 }]}>Prix Moyen Achat</Text>
        <Text style={[styles.headerCell, { width: 100 }]}>Dispo</Text>
      </View>

      <FlatList
        data={produits}
        renderItem={renderItem}
        keyExtractor={(item) => item.reference}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  picker: { height: 50, width: 200, marginBottom: 10 },
  headerRow: { flexDirection: 'row', marginBottom: 5, backgroundColor: '#f0f0f0' },
  headerCell: { fontWeight: 'bold', padding: 5 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd', paddingVertical: 5 },
  cell: { padding: 5 },
  available: { color: 'green', fontWeight: 'bold' },
  notAvailable: { color: 'red', fontWeight: 'bold' },
});

export default ProductList;
