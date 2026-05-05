import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const monthLabels = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
];

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [yearList, setYearList] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

  const [selectedPoint, setSelectedPoint] = useState(null);

  const [cardsData, setCardsData] = useState({
    totalEntrees: 0,
    valeurAchats: 0,
    totalSorties: 0,
    valeurSorties: 0,
  });

  const [chartData, setChartData] = useState({
    labels: monthLabels,
    datasets: [{ data: [] }],
  });

  const [tableData, setTableData] = useState([]);
  const navigation = useNavigation();
  const API_BASE = "https://gestion-stock-app-production.up.railway.app/api/dashboard";

  const fetchDashboard = async (year) => {
    try {
      const [resCards, resChart, resTable] = await Promise.all([
        axios.get(`${API_BASE}/cards?year=${year}`),
        axios.get(`${API_BASE}/chart?year=${year}`),
        axios.get(`${API_BASE}/products?year=${year}`)
      ]);

      setCardsData({
        totalEntrees: Number(resCards.data.totalEntrees) || 0,
        valeurAchats: Number(resCards.data.valeurAchats) || 0,
        totalSorties: Number(resCards.data.totalSorties) || 0,
        valeurSorties: Number(resCards.data.valeurSorties) || 0,
      });

      const dataMap = monthLabels.map(label => {
        const found = resChart.data.find(d => d.month === label);
        const ca = parseFloat(found?.ca);
        return isNaN(ca) ? 0 : ca;
      });

      setChartData({
        labels: monthLabels,
        datasets: [{ data: dataMap }],
      });

      const safeTable = resTable.data.map(item => ({
        ...item,
        totalQuantity: parseFloat(item.totalQuantity) || 0
      }));

      setTableData(safeTable);

    } catch (err) {
      console.error('Erreur fetch dashboard:', err);
    }
  };

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await axios.get(`${API_BASE}/years`);
        setYearList(res.data);

        if (res.data.length > 0) {
          const defaultYear = res.data[0];
          setSelectedYear(defaultYear);
          await fetchDashboard(defaultYear);
        }
      } catch (err) {
        console.error('Erreur fetch years:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchYears();
  }, []);

  const onRefresh = async () => {
    if (!selectedYear) return;
    setRefreshing(true);
    await fetchDashboard(selectedYear);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <FontAwesome5 name="cube" size={28} color="#fff" style={{ marginRight: 10 }} />
            <View>
              <Text style={styles.headerTitle}>Bluestrek Dashboard</Text>
              <Text style={styles.headerSubtitle}>Suivi des ventes et commandes</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={{ margin: 10 }}>
        <Picker
  selectedValue={selectedYear}
  onValueChange={(value) => {
    setSelectedYear(value);
    fetchDashboard(value);
  }}
  style={{
    backgroundColor: '#fff',
    color: '#000', // important
  }}
  dropdownIconColor="#000"
>
  {yearList.map((year) => (
    <Picker.Item
      key={year}
      label={year.toString()}
      value={year}
      color="#000" // important aussi
    />
  ))}
</Picker>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text>Total des entrées</Text>
          <Ionicons name="arrow-down-circle-outline" size={28} color="#007bff" />
          <Text style={styles.cardValue}>{cardsData.totalEntrees}</Text>
        </View>
        <View style={styles.card}>
          <Text>Valeur des entrées</Text>
          <FontAwesome5 name="shopping-cart" size={28} color="#28a745" />
          <Text style={styles.cardValue}>
            {cardsData.valeurAchats.toLocaleString('fr-FR')} DH
          </Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text>Total des sorties</Text>
          <Ionicons name="arrow-up-circle-outline" size={28} color="#dc3545" />
          <Text style={styles.cardValue}>{cardsData.totalSorties}</Text>
        </View>
        <View style={styles.card}>
          <Text>Valeur des sorties</Text>
          <FontAwesome5 name="coins" size={28} color="#ffc107" />
          <Text style={styles.cardValue}>
            {cardsData.valeurSorties.toLocaleString('fr-FR')} DH
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>📊 Chiffre d'affaires mensuel</Text>
      <View>
  <LineChart
    data={chartData}
    width={screenWidth - 20}
    height={250}
    chartConfig={{
      backgroundGradientFrom: "#fff",
      backgroundGradientTo: "#fff",
      decimalPlaces: 0,
      color: () => "#2563eb",
      labelColor: () => "#000",
    }}
    bezier
    fromZero
    withDots
    onDataPointClick={({ index, value }) => {
      const chartWidth = screenWidth - 20;

      // recalcul propre X
      const x =
        (chartWidth / chartData.labels.length) * index;

      // recalcul Y (proportionnel)
      const max = Math.max(...chartData.datasets[0].data, 1);
      const y = 200 - (value / max) * 150;

      setSelectedPoint({ value, x, y });
    }}
    style={{ borderRadius: 12 }}
  />

  {/* TOOLTIP FIX */}
  {selectedPoint && (
    <View
      style={{
        position: "absolute",
        left: selectedPoint.x,
        top: selectedPoint.y,
        transform: [{ translateX: -20 }, { translateY: -30 }],
        backgroundColor: "#000",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 12 }}>
        {selectedPoint.value}
      </Text>
    </View>
  )}
</View>

      <Text style={styles.sectionTitle}>📦 Produits commandés</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCellHeader, { flex: 2 }]}>Désignation</Text>
        <Text style={[styles.tableCellHeader, { flex: -2 }]}>Qté Commandée</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9f9ff' }}>
      <FlatList
        data={tableData}
        keyExtractor={(item) => item.id?.toString() || item.designation}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{item.designation}</Text>
            <Text style={[styles.tableCell, { flex: -2 }]}>{item.totalQuantity.toLocaleString('fr-FR')}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', margin: 10 }}>
            Aucune commande pour cette année
          </Text>
        }
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', margin: 10 },
  card: { flex: 1, backgroundColor: '#fff', margin: 5, padding: 20, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  cardValue: { fontSize: 16, fontWeight: 'bold', color: '#007bff' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', margin: 10, color: '#333' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#ecded1ff', padding: 10 },
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
  tableCell: { fontSize: 14, color: '#333' },
  header: { padding: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#d1d5db', fontSize: 14, marginTop: 2 },
  tableCellHeader: { fontSize: 14, color: '#000', fontWeight: 'bold' },
});

export default HomeScreen;