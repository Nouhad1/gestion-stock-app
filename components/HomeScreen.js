
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
  Modal,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
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

  // NOUVEAU : ouverture/fermeture du sélecteur d'année
  const [showYearPicker, setShowYearPicker] = useState(false);

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

      // CARTES GÉNÉRALES

      setCardsData({
        totalEntrees: Number(resCards.data.totalEntrees) || 0,
        valeurAchats: Number(resCards.data.valeurAchats) || 0,
        totalSorties: Number(resCards.data.totalSorties) || 0,
        valeurSorties: Number(resCards.data.valeurSorties) || 0,
      });

      // CLIENT 209 : AMINE

      setChiffreClient209(
        Number(resCards.data.chiffreClient209) || 0
      );

      // CLIENT 221 : MEHDI

      setChiffreClient221(
        Number(resCards.data.chiffreClient221) || 0
      );

      // CLIENT 281 : SALAH

      setChiffreClient281(
        Number(resCards.data.chiffreClient281) || 0
      );

      console.log('Réponse complète de /cards :', resCards.data);
      console.log('Chiffre annuel Amine :', resCards.data.chiffreClient209);
      console.log('Chiffre annuel Mehdi :', resCards.data.chiffreClient221);
      console.log('Chiffre annuel Salah :', resCards.data.chiffreClient281);

      // GRAPHIQUE MENSUEL

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

      setSelectedPoint(null);

      // TABLEAU DES PRODUITS

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

        // paiement_id = 1 signifie payé

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

        // Tri des années de la plus récente à la plus ancienne
        const sortedYears = [...years].sort(
          (a, b) => Number(b) - Number(a)
        );

        setYearList(sortedYears);

        if (sortedYears.length > 0) {
          const defaultYear = sortedYears[0];

          setSelectedYear(defaultYear);

          await fetchDashboard(defaultYear);
        }

        if (mounted) {
          await fetchNotifications();
        }
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
    if (year == null || year === '' || Number(year) === Number(selectedYear)) {
      setShowYearPicker(false);
      return;
    }

    setShowYearPicker(false);
    setSelectedYear(year);
    setSelectedPoint(null);

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
    </View>
  );

  // ==========================================================
  // SÉLECTEUR D'ANNÉE PERSONNALISÉ
  // Compatible Android et iOS
  // ==========================================================

  const renderYearSelector = () => (
    <>
      {/* Bouton compact affichant l'année sélectionnée */}

      <TouchableOpacity
        style={styles.yearSelector}
        onPress={() => setShowYearPicker(true)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`Année sélectionnée : ${selectedYear}`}
      >
        <View style={styles.yearSelectorLeft}>
          <Ionicons
            name="calendar-outline"
            size={23}
            color="#2563eb"
          />

          <View style={styles.yearSelectorTextContainer}>
            <Text style={styles.yearSelectorLabel}>
              Année du tableau de bord
            </Text>

            <Text style={styles.yearSelectorValue}>
              {selectedYear || 'Choisir une année'}
            </Text>
          </View>
        </View>

        <Ionicons
          name="chevron-down"
          size={23}
          color="#1e40af"
        />
      </TouchableOpacity>

      {/* Fenêtre de sélection des années */}

      <Modal
        visible={showYearPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          {/* Fermeture en appuyant sur le fond */}

          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowYearPicker(false)}
            accessibilityLabel="Fermer la sélection des années"
          />

          <View style={styles.yearModal}>
            <View style={styles.yearModalHeader}>
              <View>
                <Text style={styles.yearModalTitle}>
                  Choisissez l'année
                </Text>

                <Text style={styles.yearModalSubtitle}>
                  Consultez les données de l'année souhaitée
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowYearPicker(false)}
                style={styles.closeModalButton}
                accessibilityLabel="Fermer"
              >
                <Ionicons
                  name="close"
                  size={24}
                  color="#475569"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.yearList}
              contentContainerStyle={styles.yearListContent}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {yearList.map((year) => {
                const isSelected =
                  Number(year) === Number(selectedYear);

                return (
                  <TouchableOpacity
                    key={String(year)}
                    style={[
                      styles.yearOption,
                      isSelected && styles.yearOptionSelected,
                    ]}
                    onPress={() => handleYearChange(year)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.yearOptionText,
                        isSelected && styles.yearOptionTextSelected,
                      ]}
                    >
                      {String(year)}
                    </Text>

                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={23}
                        color="#2563eb"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}

              {yearList.length === 0 && (
                <Text style={styles.emptyYearText}>
                  Aucune année disponible
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelYearButton}
              onPress={() => setShowYearPicker(false)}
            >
              <Text style={styles.cancelYearButtonText}>
                Fermer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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

      {/* SÉLECTEUR D'ANNÉE PERSONNALISÉ */}

      <View style={styles.yearContainer}>
        {renderYearSelector()}
      </View>

      {/* CLIENTS AMINE ET MEHDI */}

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

      {/* CLIENT SALAH ET VALEUR DES SORTIES */}

      <View style={styles.cardRow}>
        {renderClientCard(
          'SALAH',
          chiffreClient281,
          '#3d8a26'
        )}

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
        </View>
      </View>

      {/* GRAPHIQUE */}

      <Text style={styles.sectionTitle}>
        📊 Chiffre d'affaires mensuel
      </Text>

      <View>
        <LineChart
          data={chartData}
          width={screenWidth - 20}
          height={250}
          chartConfig={{
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: () => '#2563eb',
            labelColor: () => '#000',
          }}
          bezier
          fromZero
          withDots
          onDataPointClick={({ index, value }) => {
            const chartWidth = screenWidth - 20;

            const x =
              (chartWidth / chartData.labels.length) * index;

            const max = Math.max(
              ...chartData.datasets[0].data,
              1
            );

            const y = 200 - (value / max) * 150;

            setSelectedPoint({
              value,
              x,
              y,
            });
          }}
          style={{
            borderRadius: 12,
          }}
        />

        {selectedPoint && (
          <View
            style={{
              position: 'absolute',
              left: selectedPoint.x,
              top: selectedPoint.y,
              transform: [
                { translateX: -20 },
                { translateY: -30 },
              ],
              backgroundColor: '#000',
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

  // CONTENEUR ANNÉE

  yearContainer: {
    marginHorizontal: 10,
    marginTop: 12,
    marginBottom: 4,
  },

  // BOUTON ANNÉE

  yearSelector: {
    minHeight: 76,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.10,
    shadowRadius: 5,
    elevation: 3,
  },

  yearSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  yearSelectorTextContainer: {
    marginLeft: 12,
  },

  yearSelectorLabel: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 4,
  },

  yearSelectorValue: {
    color: '#111827',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // FENÊTRE DE SÉLECTION

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 30,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  yearModal: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '75%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },

  yearModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  yearModalTitle: {
    color: '#0f172a',
    fontSize: 19,
    fontWeight: 'bold',
  },

  yearModalSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 5,
  },

  closeModalButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  yearList: {
    flexGrow: 0,
    flexShrink: 1,
  },

  yearListContent: {
    paddingVertical: 4,
  },

  yearOption: {
    minHeight: 52,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 4,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  yearOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },

  yearOptionText: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '500',
  },

  yearOptionTextSelected: {
    color: '#1d4ed8',
    fontWeight: 'bold',
  },

  emptyYearText: {
    color: '#64748b',
    textAlign: 'center',
    padding: 20,
  },

  cancelYearButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },

  cancelYearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
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
