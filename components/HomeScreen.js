
import React, { useEffect, useState, useCallback } from 'react';

import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

import {
  Ionicons,
  FontAwesome5,
} from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const monthLabels = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

const API_BASE =
  'https://gestion-stock-app-production.up.railway.app/api/dashboard';

const API_COMMANDES =
  'https://gestion-stock-app-production.up.railway.app/api/commandes';

const clientsAvecTransport = [209, 221, 281, 215];

const formatMontant = (value) => {
  return (Number(value) || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatQuantite = (value) => {
  return (Number(value) || 0).toLocaleString('fr-FR', {
    maximumFractionDigits: 2,
  });
};

const HomeScreen = () => {
  const navigation = useNavigation();

  // ==========================================================
  // ÉTATS GÉNÉRAUX
  // ==========================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [yearList, setYearList] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

  const [hasNotification, setHasNotification] = useState(false);

  const [selectedPoint, setSelectedPoint] = useState(null);

  // ==========================================================
  // CHIFFRES ANNUELS DES CLIENTS
  // ==========================================================

  const [chiffreClient209, setChiffreClient209] = useState(0);
  const [chiffreClient221, setChiffreClient221] = useState(0);
  const [chiffreClient281, setChiffreClient281] = useState(0);

  // ==========================================================
  // CARTES DU TABLEAU DE BORD
  // ==========================================================

  const [cardsData, setCardsData] = useState({
    totalEntrees: 0,
    valeurAchats: 0,
    totalSorties: 0,
    valeurSorties: 0,
  });

  // ==========================================================
  // GRAPHIQUE
  // ==========================================================

  const [chartData, setChartData] = useState({
    labels: monthLabels,
    datasets: [{ data: Array(12).fill(0) }],
  });

  // ==========================================================
  // TABLEAU DES PRODUITS
  // ==========================================================

  const [tableData, setTableData] = useState([]);

  // ==========================================================
  // CHARGEMENT DU TABLEAU DE BORD
  // ==========================================================

  const fetchDashboard = useCallback(async (year) => {
    if (!year) {
      return;
    }

    try {
      const [resCards, resChart, resTable] = await Promise.all([
        axios.get(`${API_BASE}/cards?year=${year}`),
        axios.get(`${API_BASE}/chart?year=${year}`),
        axios.get(`${API_BASE}/products?year=${year}`),
      ]);

      // --------------------------------------------------------
      // CARTES GÉNÉRALES
      // --------------------------------------------------------

      setCardsData({
        totalEntrees: Number(resCards.data.totalEntrees) || 0,
        valeurAchats: Number(resCards.data.valeurAchats) || 0,
        totalSorties: Number(resCards.data.totalSorties) || 0,
        valeurSorties: Number(resCards.data.valeurSorties) || 0,
      });

      // --------------------------------------------------------
      // CLIENT 209 : AMINE
      // --------------------------------------------------------

      setChiffreClient209(
        Number(resCards.data.chiffreClient209) || 0
      );

      // --------------------------------------------------------
      // CLIENT 221 : MEHDI
      // --------------------------------------------------------

      setChiffreClient221(
        Number(resCards.data.chiffreClient221) || 0
      );

      // --------------------------------------------------------
      // CLIENT 281 : SALAH
      // IMPORTANT : utiliser chiffreClient281
      // et non chiffreClient221
      // --------------------------------------------------------

      setChiffreClient281(
        Number(resCards.data.chiffreClient281) || 0
      );

      
console.log('Réponse complète de /cards :', resCards.data);
console.log('Clés reçues :', Object.keys(resCards.data));
console.log('Chiffre annuel Amine :', resCards.data.chiffreClient209);
console.log('Chiffre annuel Mehdi :', resCards.data.chiffreClient221);
console.log('Chiffre annuel Salah :', resCards.data.chiffreClient281);

      // --------------------------------------------------------
      // GRAPHIQUE MENSUEL
      // --------------------------------------------------------

      const chartRows = Array.isArray(resChart.data)
        ? resChart.data
        : [];

      const dataMap = monthLabels.map((label) => {
        const found = chartRows.find(
          (item) => item.month === label
        );

        return Number(found?.ca) || 0;
      });

      setChartData({
        labels: monthLabels,
        datasets: [{ data: dataMap }],
      });

      // Réinitialiser l'infobulle lors du changement d'année
      setSelectedPoint(null);

      // --------------------------------------------------------
      // TABLEAU DES PRODUITS
      // --------------------------------------------------------

      const products = Array.isArray(resTable.data)
        ? resTable.data
        : [];

      const safeTable = products.map((item) => ({
        ...item,
        totalQuantity: Number(item.totalQuantity) || 0,
        isLaniere: Boolean(item.isLaniere),
        longueurParRouleau:
          Number(item.longueurParRouleau) || 0,
      }));

      setTableData(safeTable);
    } catch (err) {
      console.error(
        'Erreur chargement dashboard :',
        err.response?.data || err.message
      );
    }
  }, []);

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const fetchNotifications = useCallback(async () => {
    try {
      const resNotif = await axios.get(API_COMMANDES);

      const commandes = Array.isArray(resNotif.data)
        ? resNotif.data
        : [];

      const maintenant = new Date();

      const notifications = commandes.filter((cmd) => {
        if (!cmd.Date_echeance) {
          return false;
        }

        if (
          !clientsAvecTransport.includes(Number(cmd.client_id))
        ) {
          return false;
        }

        // Conserver la logique de paiement existante :
        // paiement_id = 1 signifie payé.
        if (Number(cmd.paiement_id) === 1) {
          return false;
        }

        const dateEcheance = new Date(cmd.Date_echeance);

        if (Number.isNaN(dateEcheance.getTime())) {
          return false;
        }

        return (
          dateEcheance.getDate() === maintenant.getDate() &&
          dateEcheance.getMonth() === maintenant.getMonth() &&
          dateEcheance.getFullYear() === maintenant.getFullYear()
        );
      });

      setHasNotification(notifications.length > 0);
    } catch (err) {
      console.error(
        'Erreur notifications :',
        err.response?.data || err.message
      );
    }
  }, []);

  // ==========================================================
  // INITIALISATION
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const initData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/years`);

        if (!mounted) {
          return;
        }

        const years = Array.isArray(res.data)
          ? res.data
          : [];

        setYearList(years);

        if (years.length > 0) {
          const defaultYear = years[0];

          setSelectedYear(defaultYear);

          await fetchDashboard(defaultYear);
        }

        await fetchNotifications();
      } catch (err) {
        console.error(
          'Erreur initialisation :',
          err.response?.data || err.message
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initData();

    return () => {
      mounted = false;
    };
  }, [fetchDashboard, fetchNotifications]);

  // ==========================================================
  // CHANGEMENT D'ANNÉE
  // ==========================================================

  const handleYearChange = (year) => {
    if (!year || year === selectedYear) {
      return;
    }

    setSelectedYear(year);
    fetchDashboard(year);
  };

  // ==========================================================
  // ACTUALISATION
  // ==========================================================

  const onRefresh = async () => {
    if (!selectedYear) {
      return;
    }

    setRefreshing(true);

    try {
      await Promise.all([
        fetchDashboard(selectedYear),
        fetchNotifications(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>
          Chargement du tableau de bord...
        </Text>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // CARTE CLIENT
  // ==========================================================

  const renderClientCard = (name, amount, color) => (
    <View style={styles.card} key={name}>
      <Text style={styles.cardTitle}>{name}</Text>

      <Ionicons
        name="cash-outline"
        size={28}
        color={color}
      />

      <Text style={styles.cardValue}>
        {formatMontant(amount)} DH
      </Text>

      <Text style={styles.cardDescription}>
        Chiffre annuel {selectedYear || ''}
      </Text>
    </View>
  );

  // ==========================================================
  // EN-TÊTE DU TABLEAU DE BORD
  // ==========================================================

  const renderHeader = () => (
    <View>
      {/* EN-TÊTE BLEU */}

      <LinearGradient
        colors={['#2563eb', '#1e40af']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <FontAwesome5
              name="cube"
              size={28}
              color="#fff"
              style={styles.headerIcon}
            />

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                Bluestrek Dashboard
              </Text>

              <Text style={styles.headerSubtitle}>
                Suivi des ventes et commandes
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.notificationButton}
            accessibilityLabel="Ouvrir les notifications"
          >
            <Ionicons
              name="notifications-outline"
              size={28}
              color="#fff"
            />

            {hasNotification && (
              <View style={styles.notificationDot} />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* SÉLECTION DE L'ANNÉE */}

      <View style={styles.yearContainer}>
        {/* <Text style={styles.yearLabel}>
          Année du tableau de bord
        </Text> */}

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedYear}
            onValueChange={handleYearChange}
            style={styles.picker}
            dropdownIconColor="#1e40af"
          >
            {yearList.map((year) => (
              <Picker.Item
                key={String(year)}
                label={String(year)}
                value={year}
                color="#111827"
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* CLIENTS 209 ET 221 */}

      <View style={styles.cardRow}>
        {renderClientCard(
          'AMINE',
          chiffreClient209,
          '#2563eb'
        )}

        {renderClientCard(
          'MEHDI',
          chiffreClient221,
          '#dc3545'
        )}
      </View>

      {/* CLIENT 281 */}

      <View style={styles.cardRow}>
        {renderClientCard(
          'SALAH',
          chiffreClient281,
          '#3d8a26'
        )}

        {/* VALEUR DES SORTIES */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Valeur des sorties
          </Text>

          <FontAwesome5
            name="coins"
            size={28}
            color="#e0a800"
          />

          <Text style={styles.cardValue}>
            {formatMontant(cardsData.valeurSorties)} DH
          </Text>

          <Text style={styles.cardDescription}>
            Total des commandes
          </Text>
        </View>
      </View>

      {/* ====================================================
          GRAPHIQUE
          ==================================================== */}

      <Text
        style={
          styles.sectionTitle
        }
      >
        📊 Chiffre d'affaires mensuel
      </Text>

      <View>

        <LineChart

          data={
            chartData
          }

          width={
            screenWidth - 20
          }

          height={250}

          chartConfig={{

            backgroundGradientFrom:
              '#fff',

            backgroundGradientTo:
              '#fff',

            decimalPlaces: 0,

            color: () =>
              '#2563eb',

            labelColor: () =>
              '#000',

          }}

          bezier

          fromZero

          withDots

          onDataPointClick={({
            index,
            value,
          }) => {

            const chartWidth =
              screenWidth - 20;

            const x =
              (
                chartWidth /
                chartData.labels.length
              ) * index;

            const max =
              Math.max(
                ...chartData
                  .datasets[0]
                  .data,
                1
              );

            const y =
              200 -
              (
                value / max
              ) * 150;

            setSelectedPoint({
              value,
              x,
              y,
            });

          }}

          style={{
            borderRadius: 12
          }}

        />

        {selectedPoint && (

          <View
            style={{
              position: 'absolute',
              left:
                selectedPoint.x,
              top:
                selectedPoint.y,

              transform: [
                {
                  translateX: -20
                },
                {
                  translateY: -30
                },
              ],

              backgroundColor:
                '#000',

              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >

            <Text
              style={{
                color: '#fff',
                fontSize: 12,
              }}
            >
              {selectedPoint.value}
            </Text>

          </View>

        )}

      </View>
      {/* TITRE DU TABLEAU */}

      <Text style={styles.sectionTitle}>
        📦 Produits commandés
      </Text>

      {/* EN-TÊTE DU TABLEAU */}

      <View style={styles.tableHeader}>
        <Text
          style={[
            styles.tableCellHeader,
            styles.designationColumn,
          ]}
        >
          Désignation
        </Text>

        <Text
          style={[
            styles.tableCellHeader,
            styles.quantityColumn,
          ]}
        >
          Qté commandée
        </Text>
      </View>
    </View>
  );

  // ==========================================================
  // AFFICHAGE
  // ==========================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={tableData}
        keyExtractor={(item, index) =>
          item.reference != null
            ? String(item.reference)
            : `${item.designation || 'produit'}-${index}`
        }
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text
              style={[
                styles.tableCell,
                styles.designationColumn,
              ]}
            >
              {item.designation || 'Sans désignation'}
            </Text>

            <Text
              style={[
                styles.tableCell,
                styles.quantityColumn,
              ]}
            >
              {formatQuantite(item.totalQuantity)}
              {item.isLaniere ? ' Roul' : ''}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Aucune commande pour cette année
          </Text>
        }
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },

  loadingText: {
    marginTop: 12,
    color: '#374151',
    fontSize: 14,
  },

  listContent: {
    paddingBottom: 25,
  },

  // EN-TÊTE

  header: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  headerIcon: {
    marginRight: 12,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  headerSubtitle: {
    color: '#dbeafe',
    fontSize: 13,
    marginTop: 4,
  },

  notificationButton: {
    marginLeft: 10,
    padding: 5,
    position: 'relative',
  },

  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fff',
  },

  // ANNÉE

  yearContainer: {
    marginHorizontal: 10,
    marginTop: 12,
    marginBottom: 4,
  },

  yearLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
    marginLeft: 4,
  },

  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },

  picker: {
    color: '#111827',
    width: '100%',
  },

  // CARTES

  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 5,
    marginTop: 5,
    marginBottom: 3,
  },

  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#fff',
    margin: 5,
    paddingHorizontal: 8,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 9,
    textAlign: 'center',
  },

  cardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: 7,
    textAlign: 'center',
  },

  cardDescription: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 5,
    textAlign: 'center',
  },

  // SECTIONS

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginHorizontal: 12,
    marginTop: 18,
    marginBottom: 10,
    color: '#1f2937',
  },

  // GRAPHIQUE

  chartContainer: {
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },

  chart: {
    borderRadius: 12,
  },

  selectedPointContainer: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectedPointTitle: {
    color: '#1e40af',
    fontWeight: 'bold',
    fontSize: 13,
  },

  selectedPointValue: {
    flex: 1,
    textAlign: 'right',
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 13,
    marginHorizontal: 8,
  },

  closePointButton: {
    paddingLeft: 4,
  },

  // TABLEAU

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },

  designationColumn: {
    flex: 2,
    paddingRight: 8,
    textAlign: 'left',
  },

  quantityColumn: {
    flex: 1,
    textAlign: 'right',
  },

  tableCellHeader: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: 'bold',
  },

  tableCell: {
    fontSize: 13,
    color: '#374151',
  },

  emptyText: {
    textAlign: 'center',
    marginHorizontal: 10,
    padding: 20,
    color: '#6b7280',
    backgroundColor: '#fff',
  },
});

export default HomeScreen;