import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { GestureHandlerRootView, PinchGestureHandler } from 'react-native-gesture-handler';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const ProductList = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDepot, setSelectedDepot] = useState('depot1'); // dépôt sélectionné
  const scaleAnims = useRef({}).current;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pinchHandler = (event) => {
    scale.value = event.nativeEvent.scale;
  };
  const pinchEnd = () => {
    scale.value = withTiming(1, { duration: 200 });
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('https://1c78c3d8989c.ngrok-free.app/api/produits');
      setProducts(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement produits :', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.reference.toLowerCase().includes(searchText.toLowerCase()) ||
      p.designation.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderAvailability = (qty) => {
    if (qty === 0) return { text: 'Épuisé', style: styles.outOfStock, icon: 'close-circle' };
    if (qty <= 5) return { text: 'Stock bas', style: styles.lowStock, icon: 'alert-circle' };
    return { text: 'Disponible', style: styles.available, icon: 'checkmark-circle' };
  };

  const renderHeader = () => (
    <View style={[styles.row, styles.tableHeader]}>
      <Text style={[styles.cell, styles.headerText, { width: 200 }]}>Réf</Text>
      <Text style={[styles.cell, styles.headerText, { width: 400 }]}>Désignation</Text>
      <Text style={[styles.cell, styles.headerText, { width: 150 }]}>Prix Unitaire</Text>
      <Text style={[styles.cell, styles.headerText, { width: 200 }]}>Prix Moyen</Text>
      <Text style={[styles.cell, styles.headerText, { width: 150 }]}>Stock</Text>
      <Text style={[styles.cell, styles.headerText, { width: 150 }]}>Qté Globale</Text>
      <Text style={[styles.cell, styles.headerText, { width: 200 }]}>Disponibilité</Text>
    </View>
  );

  const renderItem = ({ item, index }) => {
  if (!scaleAnims[item.reference]) scaleAnims[item.reference] = new Animated.Value(1);
  const scaleAnim = scaleAnims[item.reference];

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  // ✅ Choix du stock selon le dépôt
  const stockAffiche =
    selectedDepot === 'depot1' ? item.stockAfficheDepot1 : item.stockAfficheDepot2;
  const stockQty = Number(stockAffiche.split(',')[0]); // Partie entière pour disponibilité
  const availability = renderAvailability(stockQty);

  // ✅ Calcul de la quantité globale (dépôt1 + dépôt2)
  const stockDepot1 = Number(item.quantite_stock || 0);
  const stockDepot2 = Number(item.quantite_stock_2 || 0);
  const quantiteGlobale = stockDepot1 + stockDepot2;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ProductDetail', { reference: item.reference })}
      >
        <Text style={[styles.cell, { width: 200 }]}>{item.reference}</Text>
        <Text style={[styles.cell, { width: 400 }]}>{item.designation}</Text>
        <Text style={[styles.cell, { width: 150 }]}>{Number(item.prix_unitaire).toFixed(2)} MAD</Text>
        <Text style={[styles.cell, { width: 200 }]}>{Number(item.prix_moyen_achat).toFixed(2)} MAD</Text>
        <Text style={[styles.cell, { width: 150, textAlign: 'center' }]}>{stockAffiche}</Text>
        <Text style={[styles.cell, { width: 150, textAlign: 'center' }]}>{quantiteGlobale}</Text>
        <View style={[styles.cell, { flexDirection: 'row', justifyContent: 'center', width: 200 }]}>
          <Ionicons name={availability.icon} size={18} style={{ marginRight: 6, ...availability.style }} />
          <Text style={availability.style}>{availability.text}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* HEADER */}
        <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome5 name="boxes" size={24} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.headerTitle}>Gestion des Produits</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
              <Ionicons name="search" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Recherche */}
        {showSearch && (
          <View style={styles.searchInputWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Rechercher produit..."
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchText('');
              }}
            >
              <Ionicons name="close-circle" size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Choix dépôt */}
        <View style={{ flexDirection: 'row', margin: 12, alignItems: 'center' }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}
            onPress={() => setSelectedDepot('depot1')}
          >
            <Ionicons
              name={selectedDepot === 'depot1' ? 'checkbox' : 'square-outline'}
              size={20}
              color="#2563eb"
              style={{ marginRight: 6 }}
            />
            <Text>Dépôt Hay Mohammadi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => setSelectedDepot('depot2')}
          >
            <Ionicons
              name={selectedDepot === 'depot2' ? 'checkbox' : 'square-outline'}
              size={20}
              color="#2563eb"
              style={{ marginRight: 6 }}
            />
            <Text>Dépôt Had Soualem</Text>
          </TouchableOpacity>
        </View>

        {/* Liste produits */}
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color="#1D4ED8" />
            <Text style={styles.loadingText}>Chargement des produits...</Text>
          </View>
        ) : (
          <PinchGestureHandler onGestureEvent={pinchHandler} onEnded={pinchEnd}>
            <AnimatedReanimated.View style={[{ flex: 1 }, animatedStyle]}>
              <ScrollView horizontal contentContainerStyle={styles.scrollContent}>
                <View style={styles.tableContainer}>
                  {renderHeader()}
                  <FlatList
                    data={filteredProducts}
                    keyExtractor={(item) => item.reference}
                    renderItem={renderItem}
                    ListEmptyComponent={
                      <Text style={styles.empty}>
                        Aucun produit trouvé{searchText ? ` pour « ${searchText} »` : ''}
                      </Text>
                    }
                  />
                </View>
              </ScrollView>
            </AnimatedReanimated.View>
          </PinchGestureHandler>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  header: { padding: 16, paddingTop: 40 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 16,
    margin: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#1f2937' },
  scrollContent: { paddingHorizontal: 12, paddingBottom: 40, paddingTop: 16 },
  tableContainer: { minWidth: 900, borderRadius: 8 },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  rowEven: { backgroundColor: '#fff' },
  rowOdd: { backgroundColor: '#f9fafc' },
  tableHeader: { backgroundColor: '#1e3a8a', borderRadius: 8, paddingVertical: 12 },
  cell: { fontSize: 14, color: '#374151', textAlign: 'center' },
  headerText: { color: '#fff', fontWeight: '700' },
  available: { color: '#166534' },
  lowStock: { color: '#ca8a04' },
  outOfStock: { color: '#b91c1c' },
  empty: { textAlign: 'center', marginTop: 20, color: '#6b7280', fontSize: 16 },
  loadingWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  loadingText: { marginTop: 8, color: '#6b7280', fontSize: 16 },
});

export default ProductList;
