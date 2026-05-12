import React, { useState } from 'react';
import {
  View,
  Text,
 StyleSheet,
  FlatList,
} from 'react-native';

import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const Notifications = () => {

  const [paiementsAujourdHui, setPaiementsAujourdHui] = useState([]);

  // clients autorisés
  const clientsAvecTransport = [209, 221, 281, 215];

  // chargement automatique
  useFocusEffect(
    React.useCallback(() => {

      const fetchNotifications = async () => {

        try {

          const response = await axios.get(
            'https://gestion-stock-app-production.up.railway.app/api/commandes'
          );

          const aujourdHui = new Date()
            .toISOString()
            .slice(0, 10);

          // filtre notifications
          const filtered = response.data.filter(cmd => {

            // pas de date échéance
            if (!cmd.Date_echeance) {
              return false;
            }

            // seulement ces clients
            if (
              !clientsAvecTransport.includes(
                Number(cmd.client_id)
              )
            ) {
              return false;
            }

            // seulement NON PAYÉ
            if (Number(cmd.paiement_id) === 1) {
              return false;
            }

            const dateCmd = new Date(cmd.Date_echeance)
              .toISOString()
              .slice(0, 10);

            // échéance aujourd'hui
            return dateCmd === aujourdHui;
          });

          setPaiementsAujourdHui(filtered);

        } catch (error) {

          console.log(
            'Erreur chargement commandes',
            error
          );
        }
      };

      fetchNotifications();

    }, [])
  );

  const renderItem = ({ item }) => (

    <View style={styles.notification}>

      <Text style={styles.titleNotif}>
        💰 Aujourd'hui est le jour de paiement
      </Text>

      <Text style={styles.client}>
        Client : {item.nom_client}
      </Text>

      <Text style={styles.text}>
        Produit : {item.designation_produit}
      </Text>

      <Text style={styles.text}>
        Montant : {Number(item.montant || 0)
          .toLocaleString('fr-FR')} DH
      </Text>

      <Text style={styles.date}>
        Échéance : {new Date(item.Date_echeance)
          .toLocaleDateString('fr-FR')}
      </Text>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          NON PAYÉ
        </Text>
      </View>

    </View>
  );

  return (

    <View style={styles.container}>

      {paiementsAujourdHui.length > 0 ? (

        <>
          <Text style={styles.title}>
            🔔 Paiements d'aujourd'hui
          </Text>

          <FlatList
            data={paiementsAujourdHui}
            keyExtractor={(item, index) =>
              item.numCmd?.toString() || index.toString()
            }
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        </>

      ) : (

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            ✅ Aucun paiement aujourd'hui.
          </Text>
        </View>

      )}

    </View>
  );
};

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },

  notification: {
    backgroundColor: '#fff3cd',
    padding: 14,
    marginVertical: 6,
    borderLeftWidth: 5,
    borderLeftColor: '#ff9800',
    borderRadius: 8,
  },

  titleNotif: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#000',
  },

  text: {
    fontSize: 15,
    color: '#333',
    marginTop: 2,
  },

  client: {
    fontSize: 17,
    fontWeight: 'bold',
    marginVertical: 4,
    color: '#000',
  },

  date: {
    marginTop: 6,
    color: '#666',
    fontSize: 13,
  },

  badge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 16,
    color: '#444',
  },

});

export default Notifications;