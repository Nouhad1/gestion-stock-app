import React, { useState } from 'react'; 
import {
  View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import axios from 'axios';

const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const stockInitial = product.quantite_stock ?? 0;

  const [designation, setDesignation] = useState(product.designation || '');
  const [prixUnitaire, setPrixUnitaire] = useState(product.prix_unitaire?.toString() || '0');
  const [quantiteCommandee, setQuantiteCommandee] = useState('0');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleQuantiteChange = (value) => {
    const qte = parseInt(value) || 0;
    if (qte > stockInitial) {
      Alert.alert("Erreur", "La quantité commandée dépasse le stock disponible.");
      setQuantiteCommandee(stockInitial.toString());
    } else {
      setQuantiteCommandee(value);
    }
  };

  const stockRestant = stockInitial - parseInt(quantiteCommandee || '0');
  const finalStockForUpdate = stockRestant < 0 ? 0 : stockRestant;

  const handleUpdate = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await axios.put(`https://gestion-stock-app-production.up.railway.app/api/produits/${product.reference}`, {
        designation,
        prix_unitaire: parseFloat(prixUnitaire),
        quantite_stock: finalStockForUpdate,
      });

      setSuccessMessage('Produit mis à jour avec succès');

      setTimeout(() => {
        if (finalStockForUpdate < 5) {
          navigation.navigate('Notifications');
        } else {
          navigation.goBack();
        }
      }, 1500);

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour :', error);
      const message = error.response?.data?.message || error.message || 'Erreur inattendue';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Référence : {product.reference}</Text>

      <Text style={styles.label}>Désignation :</Text>
      <TextInput
        style={styles.input}
        value={designation}
        onChangeText={setDesignation}
      />

      <Text style={styles.label}>Prix unitaire :</Text>
      <TextInput
        style={styles.input}
        value={prixUnitaire}
        onChangeText={setPrixUnitaire}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Quantité commandée :</Text>
      <TextInput
        style={styles.input}
        value={quantiteCommandee}
        onChangeText={handleQuantiteChange}
        keyboardType="numeric"
      />

      <Text style={styles.result}>Stock restant après commande : {finalStockForUpdate}</Text>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      <View style={styles.buttonContainer}>
        <Button
          title={isLoading ? 'Mise à jour...' : 'Modifier le produit'}
          onPress={handleUpdate}
          color="#4CAF50"
          disabled={isLoading}
        />
        {isLoading && <ActivityIndicator size="small" color="#0000ff" />}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontWeight: 'bold', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginTop: 5 },
  result: { marginTop: 10, fontSize: 16, color: '#555' },
  buttonContainer: { marginTop: 20 },
  errorText: { color: '#d32f2f', marginTop: 10, textAlign: 'center' },
  successText: { color: '#388e3c', marginTop: 10, textAlign: 'center' },
});

export default ProductDetailScreen;
