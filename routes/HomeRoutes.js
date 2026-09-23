import React, { useCallback, useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';

import { LineChart } from 'react-native-chart-kit';

import axios from 'axios';

import { LinearGradient } from 'expo-linear-gradient';

import Ionicons from '@expo/vector-icons/Ionicons';

import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { useNavigation } from '@react-navigation/native';


// ==========================================================
// DIMENSIONS
// ==========================================================

const screenWidth = Dimensions.get('window').width;


// ==========================================================
// MOIS
// ==========================================================

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


// ==========================================================
// API
// ==========================================================

const API_BASE =
  'https://gestion-stock-app-production.up.railway.app/api/dashboard';

const COMMANDES_API =
  'https://gestion-stock-app-production.up.railway.app/api/commandes';


// ==========================================================
// HOME SCREEN
// ==========================================================

export default function HomeScreen() {

  const navigation = useNavigation();


  // ========================================================
  // STATES
  // ========================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [yearList, setYearList] = useState([]);

  const [selectedYear, setSelectedYear] = useState(null);

  const [selectedPoint, setSelectedPoint] = useState(null);

  const [hasNotification, setHasNotification] = useState(false);


  // ========================================================
  // CLIENTS AVEC TRANSPORT / PAIEMENT
  // ========================================================

  const clientsAvecTransport = [
    209,
    221,
    281,
    215
  ];


  // ========================================================
  // CARDS DATA
  // ========================================================

  const [cardsData, setCardsData] = useState({

    totalEntrees: 0,

    valeurAchats: 0,

    totalSorties: 0,

    valeurSorties: 0,

    chiffreClient209: 0,

    chiffreClient221: 0,

  });


  // ========================================================
  // CHART DATA
  // ========================================================

  const [chartData, setChartData] = useState({

    labels: monthLabels,

    datasets: [
      {
        data: Array(12).fill(0),
      },
    ],

  });


  // ========================================================
  // TABLE DATA
  // ========================================================

  const [tableData, setTableData] = useState([]);


  // ========================================================
  // FORMATAGE DH
  // ========================================================

  const formatDH = (value) => {

    return Number(value || 0).toLocaleString('fr-FR') + ' DH';

  };


  // ========================================================
  // FETCH DASHBOARD
  // ========================================================

  const fetchDashboard = async (year) => {

    try {

      setLoading(true);


      // ====================================================
      // CARDS
      // ====================================================

      const resCards = await axios.get(
        `${API_BASE}/cards`,
        {
          params: {
            year: year,
          },
        }
      );


      setCardsData({

        totalEntrees:
          Number(resCards.data.totalEntrees) || 0,

        valeurAchats:
          Number(resCards.data.valeurAchats) || 0,

        totalSorties:
          Number(resCards.data.totalSorties) || 0,

        valeurSorties:
          Number(resCards.data.valeurSorties) || 0,

        chiffreClient209:
          Number(resCards.data.chiffreClient209) || 0,

        chiffreClient221:
          Number(resCards.data.chiffreClient221) || 0,

      });


      // ====================================================
      // CHART
      // ====================================================

      const resChart = await axios.get(
        `${API_BASE}/chart`,
        {
          params: {
            year: year,
          },
        }
      );


      const monthlyData = Array(12).fill(0);


      resChart.data.forEach(item => {

        const index = monthLabels.indexOf(item.month);

        if (index !== -1) {

          monthlyData[index] =
            Number(item.ca) || 0;

        }

      });


      setChartData({

        labels: monthLabels,

        datasets: [
          {
            data: monthlyData,
          },
        ],

      });


      // ====================================================
      // PRODUCTS
      // ====================================================

      const resProducts = await axios.get(
        `${API_BASE}/products`,
        {
          params: {
            year: year,
          },
        }
      );


      setTableData(resProducts.data || []);


    } catch (error) {

      console.error(
        'Erreur dashboard :',
        error
      );

    } finally {

      setLoading(false);

    }

  };


  // ========================================================
  // NOTIFICATIONS
  // ========================================================

  const checkNotifications = async () => {

    try {

      const response = await axios.get(
        COMMANDES_API
      );

      const commandes =
        response.data || [];


      const today =
        new Date();


      const todayString =
        today.toISOString().split('T')[0];


      const notificationExiste =
        commandes.some(commande => {

          const clientId =
            Number(commande.client_id);


          if (
            !clientsAvecTransport.includes(
              clientId
            )
          ) {
            return false;
          }


          const dateEcheance =
            commande.date_echeance
              ? String(
                  commande.date_echeance
                ).substring(0, 10)
              : null;


          const paiementId =
            Number(
              commande.paiement_id
            );


          return (
            dateEcheance ===
              todayString &&
            paiementId !== 1
          );

        });


      setHasNotification(
        notificationExiste
      );


    } catch (error) {

      console.log(
        'Erreur notifications :',
        error
      );

    }

  };


  // ========================================================
  // INITIALISATION
  // ========================================================

  useEffect(() => {

    const initDashboard = async () => {

      try {

        const response =
          await axios.get(
            `${API_BASE}/years`
          );


        const years =
          response.data || [];


        setYearList(years);


        if (years.length > 0) {

          const defaultYear =
            years[0];


          setSelectedYear(
            defaultYear
          );


          await fetchDashboard(
            defaultYear
          );

        } else {

          const currentYear =
            new Date().getFullYear();


          setSelectedYear(
            currentYear
          );


          await fetchDashboard(
            currentYear
          );

        }


        await checkNotifications();


      } catch (error) {

        console.error(
          'Erreur initialisation dashboard :',
          error
        );

        setLoading(false);

      }

    };


    initDashboard();

  }, []);


  // ========================================================
  // CHANGEMENT ANNÉE
  // ========================================================

  const handleYearChange = async (year) => {

    setSelectedYear(year);

    await fetchDashboard(year);

  };


  // ========================================================
  // REFRESH
  // ========================================================

  const onRefresh = useCallback(
    async () => {

      setRefreshing(true);

      try {

        if (selectedYear) {

          await fetchDashboard(
            selectedYear
          );

        }

        await checkNotifications();

      } finally {

        setRefreshing(false);

      }

    },
    [selectedYear]
  );


  // ========================================================
  // LOADING
  // ========================================================

  if (loading && !selectedYear) {

    return (

      <View style={styles.loadingContainer}>

        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text style={styles.loadingText}>
          Chargement du tableau de bord...
        </Text>

      </View>

    );

  }


  // ========================================================
  // AFFICHAGE
  // ========================================================

  return (

    <View style={styles.container}>


      {/* ==================================================
          HEADER
      ================================================== */}

      <LinearGradient
        colors={[
          '#2563eb',
          '#1e40af'
        ]}
        style={styles.header}
      >

        <View>

          <Text style={styles.headerTitle}>
            Tableau de bord
          </Text>

          <Text style={styles.headerSubtitle}>
            Gestion Stock Pro
          </Text>

        </View>


        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Notifications')
          }
          style={styles.notificationButton}
        >

          <Ionicons
            name="notifications-outline"
            size={28}
            color="#fff"
          />


          {hasNotification && (

            <View
              style={styles.notificationDot}
            />

          )}

        </TouchableOpacity>

      </LinearGradient>


      <ScrollView

        contentContainerStyle={
          styles.scrollContent
        }

        refreshControl={

          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />

        }

      >


        {/* ==================================================
            SÉLECTION ANNÉE
        ================================================== */}

        <View style={styles.yearContainer}>

          <Text style={styles.yearLabel}>
            Année
          </Text>


          <View style={styles.pickerContainer}>

            <Picker
              selectedValue={selectedYear}
              onValueChange={
                handleYearChange
              }
              style={styles.picker}
            >

              {yearList.map(year => (

                <Picker.Item
                  key={year}
                  label={String(year)}
                  value={year}
                />

              ))}

            </Picker>

          </View>

        </View>


        {/* ==================================================
            PREMIÈRE LIGNE
            CLIENT 209 / CLIENT 221
        ================================================== */}

        <View style={styles.cardRow}>


          {/* ================= CLIENT 209 ================= */}

          <View style={styles.card}>

            <View style={styles.cardHeader}>

              <Text style={styles.cardTitle}>
                Chiffre annuel
              </Text>

              <Ionicons
                name="person-outline"
                size={28}
                color="#007bff"
              />

            </View>


            <Text style={styles.cardValue}>

              {formatDH(
                cardsData.chiffreClient209
              )}

            </Text>


            <Text style={styles.cardSubtitle}>
              Client 209
            </Text>

          </View>


          {/* ================= CLIENT 221 ================= */}

          <View style={styles.card}>

            <View style={styles.cardHeader}>

              <Text style={styles.cardTitle}>
                Chiffre annuel
              </Text>

              <Ionicons
                name="person-outline"
                size={28}
                color="#dc3545"
              />

            </View>


            <Text style={styles.cardValue}>

              {formatDH(
                cardsData.chiffreClient221
              )}

            </Text>


            <Text style={styles.cardSubtitle}>
              Client 221
            </Text>

          </View>

        </View>


        {/* ==================================================
            DEUXIÈME LIGNE
            VALEUR ENTRÉES / VALEUR SORTIES
        ================================================== */}

        <View style={styles.cardRow}>


          {/* ================= VALEUR ENTRÉES ================= */}

          <View style={styles.card}>

            <View style={styles.cardHeader}>

              <Text style={styles.cardTitle}>
                Valeur des entrées
              </Text>

              <FontAwesome5
                name="arrow-down"
                size={24}
                color="#16a34a"
              />

            </View>


            <Text style={styles.cardValue}>

              {formatDH(
                cardsData.valeurAchats
              )}

            </Text>

          </View>


          {/* ================= VALEUR SORTIES ================= */}

          <View style={styles.card}>

            <View style={styles.cardHeader}>

              <Text style={styles.cardTitle}>
                Valeur des sorties
              </Text>

              <FontAwesome5
                name="arrow-up"
                size={24}
                color="#dc3545"
              />

            </View>


            <Text style={styles.cardValue}>

              {formatDH(
                cardsData.valeurSorties
              )}

            </Text>

          </View>

        </View>


        {/* ==================================================
            GRAPHIQUE
        ================================================== */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Chiffre d'affaires mensuel
          </Text>


          <LineChart

            data={chartData}

            width={screenWidth - 30}

            height={240}

            chartConfig={{

              backgroundGradientFrom: '#ffffff',

              backgroundGradientTo: '#ffffff',

              decimalPlaces: 0,

              color: (opacity = 1) =>
                `rgba(37, 99, 235, ${opacity})`,

              labelColor: (opacity = 1) =>
                `rgba(0, 0, 0, ${opacity})`,

              propsForDots: {
                r: '4',
                strokeWidth: '2',
              },

            }}

            bezier

            style={styles.chart}

            onDataPointClick={(data) => {

              setSelectedPoint(data);

            }}

          />


          {selectedPoint && (

            <View style={styles.selectedPoint}>

              <Text>

                {formatDH(
                  selectedPoint.value
                )}

              </Text>

            </View>

          )}

        </View>


        {/* ==================================================
            PRODUITS
        ================================================== */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Produits les plus sortis
          </Text>


          <View style={styles.table}>

            <View style={styles.tableHeader}>

              <Text
                style={[
                  styles.tableHeaderText,
                  styles.productColumn
                ]}
              >
                Produit
              </Text>


              <Text
                style={[
                  styles.tableHeaderText,
                  styles.quantityColumn
                ]}
              >
                Quantité
              </Text>

            </View>


            {tableData.map(
              (item, index) => (

                <View
                  key={`${item.designation}-${index}`}
                  style={styles.tableRow}
                >

                  <Text
                    style={[
                      styles.tableText,
                      styles.productColumn
                    ]}
                  >
                    {item.designation}
                  </Text>


                  <Text
                    style={[
                      styles.tableText,
                      styles.quantityColumn
                    ]}
                  >
                    {Number(
                      item.totalQuantity
                    ) || 0}
                  </Text>

                </View>

              )
            )}


            {tableData.length === 0 && (

              <View style={styles.emptyRow}>

                <Text style={styles.emptyText}>
                  Aucun produit pour cette année.
                </Text>

              </View>

            )}

          </View>

        </View>


      </ScrollView>

    </View>

  );

}


// ==========================================================
// STYLES
// ==========================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },


  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fb',
  },


  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#555',
  },


  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },


  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },


  headerSubtitle: {
    color: '#dbeafe',
    fontSize: 13,
    marginTop: 3,
  },


  notificationButton: {
    position: 'relative',
    padding: 5,
  },


  notificationDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },


  scrollContent: {
    padding: 15,
    paddingBottom: 40,
  },


  yearContainer: {
    marginBottom: 15,
  },


  yearLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },


  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },


  picker: {
    height: 50,
    width: '100%',
  },


  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },


  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 15,
    minHeight: 125,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },


  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },


  cardTitle: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },


  cardValue: {
    marginTop: 15,
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1f2937',
  },


  cardSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },


  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 15,
    marginTop: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },


  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },


  chart: {
    borderRadius: 12,
  },


  selectedPoint: {
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },


  table: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  },


  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },


  tableHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },


  tableRow: {
    flexDirection: 'row',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },


  tableText: {
    fontSize: 13,
    color: '#333',
  },


  productColumn: {
    flex: 1,
    paddingRight: 10,
  },


  quantityColumn: {
    width: 80,
    textAlign: 'right',
  },


  emptyRow: {
    padding: 20,
    alignItems: 'center',
  },


  emptyText: {
    color: '#777',
    fontSize: 13,
  },

});