import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;
const API_URL = 'https://1c78c3d8989c.ngrok-free.app/api/dashboard';

const monthLabels = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
];

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [yearList, setYearList] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [openYear, setOpenYear] = useState(false);

  const [cardsData, setCardsData] = useState({
    totalEntrees: 0,
    valeurAchats: 0,
    totalSorties: 0,
    valeurSorties: 0,
  });

  const [chartData, setChartData] = useState({
    labels: monthLabels,
    datasets: [{ data: [], color: () => 'blue' }],
  });

  const [tableData, setTableData] = useState([]);
  const navigation = useNavigation();

  const fetchDashboard = async (year) => {
    try {
      const [resCards, resChart, resTable] = await Promise.all([
        axios.get(`${API_URL}/cards?year=${year}`),
        axios.get(`${API_URL}/chart?year=${year}`),
        axios.get(`${API_URL}/products?year=${year}`)
      ]);

      setCardsData(resCards.data);

      const dataMap = monthLabels.map(label => {
        const found = resChart.data.find(d => d.month === label);
        return found ? found.ca : 0;
      });

      setChartData({
        labels: monthLabels,
        datasets: [
          {
            data: dataMap,
            color: (opacity = 1) => `rgba(0,123,255,${opacity})`,
            strokeWidth: 2
          }
        ],
      });

      setTableData(resTable.data);
    } catch (err) {
      console.error('Erreur fetch dashboard:', err);
    }
  };

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await axios.get(`${API_URL}/years`);
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

  // --- HEADER + Graphiques + Cartes
  const renderHeader = () => (
    <View>
      {/* HEADER */}
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

      {/* Sélection année */}
      <View style={{ margin: 10, zIndex: 1000 }}>
        <DropDownPicker
          open={openYear}
          value={selectedYear}
          items={yearList.map(y => ({ label: y.toString(), value: y }))}
          setOpen={setOpenYear}
          setValue={setSelectedYear}
          onChangeValue={(value) => fetchDashboard(value)}
          containerStyle={{ height: 40 }}
        />
      </View>

      {/* Cartes */}
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text>Total des entrées</Text>
          <Ionicons name="arrow-down-circle-outline" size={28} color="#007bff" style={{ marginBottom: 5 }} />
          <Text style={styles.cardValue}>{cardsData.totalEntrees}</Text>
        </View>
        <View style={styles.card}>
          <Text>Valeur des entrées</Text>
          <FontAwesome5 name="shopping-cart" size={28} color="#28a745" style={{ marginBottom: 5 }} />
          <Text style={styles.cardValue}>{cardsData.valeurAchats} DH</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text>Total des sorties</Text>
          <Ionicons name="arrow-up-circle-outline" size={28} color="#dc3545" style={{ marginBottom: 5 }} />
          <Text style={styles.cardValue}>{cardsData.totalSorties}</Text>
        </View>
        <View style={styles.card}>
          <Text>Valeur des sorties</Text>
          <FontAwesome5 name="coins" size={28} color="#ffc107" style={{ marginBottom: 5 }} />
          <Text style={styles.cardValue}>{cardsData.valeurSorties} DH</Text>
        </View>
      </View>

      {/* Graphique */}
      <Text style={styles.sectionTitle}>📊 Chiffre d'affaires mensuel</Text>
      <LineChart
        data={chartData}
        width={screenWidth - 20}
        height={250}
        chartConfig={{
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#007bff"
          },
        }}
        bezier
        style={{ marginVertical: 10, borderRadius: 12 }}
        fromZero
      />

      {/* Tableau produits */}
      <Text style={styles.sectionTitle}>📦 Produits commandés</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCellHeader, { flex: 2 }]}>Désignation</Text>
        <Text style={[styles.tableCellHeader, { flex: -2 }]}>Qté Commandée</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <FlatList
        data={tableData}
        keyExtractor={(item) => item.id?.toString() || item.designation}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{item.designation}</Text>
            <Text style={[styles.tableCell, { flex: -2 }]}>{item.totalQuantity || 0}</Text>
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
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', margin: 10 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 5,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  cardValue: { fontSize: 16, fontWeight: 'bold', color: '#007bff' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', margin: 10, color: '#333' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#ecded1ff', padding: 10 },
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
  tableCell: { fontSize: 14, color: '#333' },
  header: { padding: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#d1d5db', fontSize: 14, marginTop: 2 },
  tableCellHeader: { fontSize: 14, color: '#000000ff', fontWeight: 'bold', alignItems: 'center' },
});

export default HomeScreen;
