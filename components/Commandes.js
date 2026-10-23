import React, { useState, useEffect, useCallback } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  Modal,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";

// ======================================================
// FORMATAGE DES MONTANTS
// Exemple : 1000000 -> 1 000 000,00
// ======================================================

const formatMontant = (value) => {
  const montant = Number(value) || 0;

  return montant.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });
};

// ======================================================
// SÉLECTEUR DE MOIS COMPATIBLE ANDROID ET IOS
// ======================================================

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const MonthSelector = ({ value, onChange }) => {
  const [visible, setVisible] = useState(false);

  const selectedMonthName =
    MONTHS[value - 1] || "Choisir un mois";

  const selectMonth = (monthNumber) => {
    onChange(monthNumber);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.monthSelector}
        onPress={() => setVisible(true)}
      >
        <View style={styles.monthSelectorLeft}>
          <Text style={styles.monthIcon}>📅</Text>

          <Text style={styles.monthSelectorText}>
            {selectedMonthName}
          </Text>
        </View>

        <Text style={styles.monthArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.monthModalOverlay}>
          <View style={styles.monthModalContainer}>
            <View style={styles.monthModalHeader}>
              <Text style={styles.monthModalTitle}>
                Choisissez le mois
              </Text>

              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={styles.monthCloseButton}
              >
                <Text style={styles.monthCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.monthList}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {MONTHS.map((month, index) => {
                const monthNumber = index + 1;
                const isSelected = value === monthNumber;

                return (
                  <TouchableOpacity
                    key={monthNumber}
                    activeOpacity={0.7}
                    style={[
                      styles.monthOption,
                      isSelected && styles.monthOptionSelected,
                    ]}
                    onPress={() => selectMonth(monthNumber)}
                  >
                    <Text
                      style={[
                        styles.monthOptionText,
                        isSelected &&
                          styles.monthOptionTextSelected,
                      ]}
                    >
                      {month}
                    </Text>

                    {isSelected && (
                      <Text style={styles.monthCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.monthCancelButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.monthCancelText}>
                Fermer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ======================================================
// ÉCRAN PRINCIPAL
// ======================================================

const CommandesScreen = () => {
  const API_URL =
    "https://gestion-stock-app-production.up.railway.app/api";

  const [activeTab, setActiveTab] = useState("nouvelle");

  const [blNum, setBlNum] = useState("");
  const [clientId, setClientId] = useState(null);
  const [produitRef, setProduitRef] = useState(null);

  const [quantite, setQuantite] = useState("");
  const [rouleaux, setRouleaux] = useState("");
  const [metres, setMetres] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState("");

  const [commandesMultiple, setCommandesMultiple] = useState([]);

  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [commandesPassees, setCommandesPassees] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );

  const [selectedMonthPaiement, setSelectedMonthPaiement] =
    useState(new Date().getMonth() + 1);

  const [clientSearch, setClientSearch] = useState("");
  const [produitsSearch, setProduitsSearch] = useState("");

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProduits, setSelectedProduits] = useState(null);

  const [showClientList, setShowClientList] = useState(false);
  const [showProduitsList, setShowProduitsList] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  // Transport et paiement
  const [transportId, setTransportId] = useState(2);
  const [paiementId, setPaiementId] = useState(2);

  const clientsAvecTransport = [209, 221, 281, 215];

  const [transport, setTransport] = useState([]);
  const [paiement, setPaiements] = useState([]);

  // Situation de paiement
  const [showPaiementScreen, setShowPaiementScreen] =
    useState(false);

  const [clientPaiement, setClientPaiement] = useState(null);

  const showPaiementButton =
    clientId !== null &&
    clientsAvecTransport.includes(Number(clientId));

  const showTransport =
    clientId !== null &&
    clientsAvecTransport.includes(Number(clientId));

  const showPayement =
    clientId !== null &&
    clientsAvecTransport.includes(Number(clientId));

  // ======================================================
  // CHARGEMENT DES COMMANDES
  // ======================================================

  const fetchCommandes = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/commandes`);
      setCommandesPassees(res.data || []);
    } catch (e) {
      console.log(
        "Erreur chargement commandes:",
        e.message
      );
    }
  }, []);

  // ======================================================
  // CHARGEMENT DES DONNÉES
  // ======================================================

  useEffect(() => {
    const fetchData = async () => {
      // CLIENTS
      try {
        const res = await axios.get(`${API_URL}/clients`);

        setClients(
          (res.data || []).map((c) => ({
            label: c.nom,
            value: c.id,
          }))
        );
      } catch (e) {
        console.log("Erreur clients:", e.message);
      }

      // PRODUITS
      try {
        const res = await axios.get(`${API_URL}/produits`);

        setProduits(
          (res.data || []).map((p) => ({
            label: p.designation,
            value: p.reference,
            type: p.designation
              ?.toUpperCase()
              .includes("ROUL")
              ? "laniere"
              : "autre",
          }))
        );
      } catch (e) {
        console.log("Erreur produits:", e.message);
      }

      // TRANSPORT
      try {
        const res = await axios.get(
          `${API_URL}/statut/transport`
        );

        setTransport(
          (res.data || []).map((t) => ({
            label: t.nom,
            value: t.id,
          }))
        );
      } catch (e) {
        console.log("Erreur transport:", e.message);
      }

      // PAIEMENT
      try {
        const res = await axios.get(
          `${API_URL}/statut/paiement`
        );

        setPaiements(
          (res.data || []).map((p) => ({
            label: p.statut,
            value: p.id,
          }))
        );
      } catch (e) {
        console.log("Erreur paiement:", e.message);
      }

      // COMMANDES
      try {
        const res = await axios.get(`${API_URL}/commandes`);
        setCommandesPassees(res.data || []);
      } catch (e) {
        console.log("Erreur commandes:", e.message);
      }
    };

    fetchData();
  }, []);

  // ======================================================
  // FILTRAGE DE L'HISTORIQUE
  // ======================================================

  const commandesFiltrees = commandesPassees.filter((c) => {
    const date = c.date_commande
      ? new Date(c.date_commande)
      : null;

    const monthOk =
      date &&
      !Number.isNaN(date.getTime()) &&
      date.getMonth() + 1 === selectedMonth;

    const clientOk = selectedClient?.nom
      ? (c.nom_client || "").toLowerCase() ===
        selectedClient.nom.toLowerCase()
      : true;

    return monthOk && clientOk;
  });

  const totalMois = commandesFiltrees.reduce(
    (sum, item) =>
      sum + (parseFloat(item.montant) || 0),
    0
  );

  // ======================================================
  // PRODUIT SÉLECTIONNÉ
  // ======================================================

  const produitSelectionne = produits.find(
    (p) => p.value === produitRef
  );

  const isLaniere =
    produitSelectionne?.type === "laniere";

  // ======================================================
  // SUPPRIMER UN PRODUIT DE LA COMMANDE
  // ======================================================

  const handleRemoveItem = (index) => {
    const newList = [...commandesMultiple];
    newList.splice(index, 1);
    setCommandesMultiple(newList);
  };

  // ======================================================
  // STATUT DE PAIEMENT
  // ======================================================

  const getPaiementStatus = (item) => {
    const today = new Date();
    const echeance = item.Date_echeance
      ? new Date(item.Date_echeance)
      : null;

    if (Number(item.paiement_id) === 1) {
      return "VERT";
    }

    if (
      echeance &&
      !Number.isNaN(echeance.getTime()) &&
      echeance < today
    ) {
      return "ROUGE";
    }

    const diffDays =
      echeance && !Number.isNaN(echeance.getTime())
        ? (echeance - today) / (1000 * 60 * 60 * 24)
        : 999;

    if (diffDays <= 3) {
      return "JAUNE";
    }

    return "NORMAL";
  };

  // ======================================================
  // ACTUALISER
  // ======================================================

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await fetchCommandes();
    } catch (e) {
      console.log("Erreur actualisation:", e.message);
    } finally {
      setRefreshing(false);
    }
  };

  // ======================================================
  // AJOUTER UN PRODUIT
  // ======================================================

  const handleAddProduct = () => {
    if (
      !blNum ||
      !clientId ||
      !produitRef ||
      prixUnitaire === ""
    ) {
      return Alert.alert(
        "Erreur",
        "Veuillez remplir tous les champs"
      );
    }

    if (isLaniere && !rouleaux && !metres) {
      return Alert.alert(
        "Erreur",
        "Entrez les rouleaux ou les mètres"
      );
    }

    if (!isLaniere && !quantite) {
      return Alert.alert(
        "Erreur",
        "Entrez la quantité"
      );
    }

    const item = {
      bl_num: blNum,
      client_id: Number(clientId),
      produit_reference: produitRef,

      quantite_commande: isLaniere
        ? Number(rouleaux) || 0
        : Number(quantite) || 0,

      metres_commandees: isLaniere
        ? Number(metres) || 0
        : 0,

      prix_unitaire: Number(prixUnitaire) || 0,
    };

    console.log("Produit ajouté:", item);
    console.log("Transport ID:", transportId);
    console.log("Paiement ID:", paiementId);

    setCommandesMultiple((prev) => [
      ...prev,
      item,
    ]);

    // Réinitialiser uniquement les champs du produit
    setProduitRef(null);
    setProduitsSearch("");
    setSelectedProduits(null);
    setQuantite("");
    setRouleaux("");
    setMetres("");
    setPrixUnitaire("");
    setShowProduitsList(false);
  };

  // ======================================================
  // ENREGISTRER LA COMMANDE
  // ======================================================

  const handleSubmit = async () => {
    if (!commandesMultiple.length) {
      return Alert.alert(
        "Erreur",
        "Aucune commande"
      );
    }

    const commandesFinales = commandesMultiple.map(
      (cmd) => ({
        ...cmd,
        transport_id: transportId,
        paiement_id: paiementId,
      })
    );

    try {
      await axios.post(
        `${API_URL}/commandes/multiples`,
        {
          commandes: commandesFinales,
        }
      );

      Alert.alert(
        "Succès",
        "Commande enregistrée"
      );

      setCommandesMultiple([]);
      setBlNum("");

      await fetchCommandes();
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.response?.data?.message ||
          "Erreur serveur"
      );
    }
  };

  // ======================================================
  // ÉCRAN SITUATION DE PAIEMENT
  // ======================================================

  if (showPaiementScreen) {
    const data = commandesPassees.filter((c) => {
      const dateCommande = c.date_commande
        ? new Date(c.date_commande)
        : null;

      const clientOk = clientPaiement?.nom
        ? (c.nom_client || "").toLowerCase() ===
          clientPaiement.nom.toLowerCase()
        : false;

      const monthOk =
        dateCommande &&
        !Number.isNaN(dateCommande.getTime()) &&
        dateCommande.getMonth() + 1 ===
          selectedMonthPaiement;

      return clientOk && monthOk;
    });

    return (
      <SafeAreaView style={styles.paymentContainer}>
        <LinearGradient
          colors={["#2563eb", "#1e40af"]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>
            Situation Paiement
          </Text>

          <Text style={styles.paymentClientName}>
            {clientPaiement?.nom}
          </Text>
        </LinearGradient>

        {/* FILTRE PAR MOIS */}
        <View style={styles.paymentMonthContainer}>
          <Text style={styles.label}>
            Filtrer par mois de commande
          </Text>

          <MonthSelector
            value={selectedMonthPaiement}
            onChange={setSelectedMonthPaiement}
          />
        </View>

        {/* LISTE DES PAIEMENTS */}
        <FlatList
          data={data}
          keyExtractor={(item, index) =>
            String(item.numCmd || item.id || index)
          }
          contentContainerStyle={styles.paymentList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Aucune commande pour ce mois.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const today = new Date();

            const echeance = item.Date_echeance
              ? new Date(item.Date_echeance)
              : null;

            let status = "PAYÉ";
            let color = "#22c55e";

            if (Number(item.paiement_id) !== 1) {
              if (
                echeance &&
                !Number.isNaN(echeance.getTime()) &&
                echeance < today
              ) {
                status = "RETARD";
                color = "#ef4444";
              } else if (
                echeance &&
                !Number.isNaN(echeance.getTime()) &&
                (echeance - today) / 86400000 <= 3
              ) {
                status = "ATTENTE";
                color = "#f59e0b";
              } else {
                status = "EN COURS";
                color = "#3b82f6";
              }
            }

            return (
              <View
                style={[
                  styles.cardPro,
                  { borderLeftColor: color },
                ]}
              >
                <Text style={styles.titlePro}>
                  {item.designation_produit || "-"}
                </Text>

                <View style={styles.rowInfo}>
                  <Text style={styles.labelPro}>
                    Échéance
                  </Text>

                  <Text style={styles.valuePro}>
                    {echeance &&
                    !Number.isNaN(echeance.getTime())
                      ? `${String(
                          echeance.getFullYear()
                        )}-${String(
                          echeance.getMonth() + 1
                        ).padStart(2, "0")}-${String(
                          echeance.getDate()
                        ).padStart(2, "0")}`
                      : "-"}
                  </Text>
                </View>

                <View style={styles.rowInfo}>
                  <Text style={styles.labelPro}>
                    Montant
                  </Text>

                  <Text style={styles.valuePro}>
                    {formatMontant(item.montant)} DH
                  </Text>
                </View>

                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: color },
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusText,
                      { color },
                    ]}
                  >
                    {status}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <TouchableOpacity
          onPress={() => setShowPaiementScreen(false)}
          style={styles.btnBackPro}
        >
          <Text style={styles.btnTextPro}>
            Retour
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ======================================================
  // ÉCRAN PRINCIPAL
  // ======================================================

  return (
    <SafeAreaView style={styles.container}>
      {/* EN-TÊTE */}
      <LinearGradient
        colors={["#2563eb", "#1e40af"]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>
          🧾 Gestion Commandes
        </Text>
      </LinearGradient>

      {/* ONGLETS */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "nouvelle" &&
              styles.tabActive,
          ]}
          onPress={() => setActiveTab("nouvelle")}
        >
          <Text style={styles.tabTextActive}>
            Nouvelle
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "passees" &&
              styles.tabActive,
          ]}
          onPress={() => setActiveTab("passees")}
        >
          <Text style={styles.tabTextActive}>
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================================================== */}
      {/* ONGLET NOUVELLE COMMANDE */}
      {/* ================================================== */}

      {activeTab === "nouvelle" ? (
        <FlatList
          data={commandesMultiple}
          keyExtractor={(item, index) => String(index)}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          ListHeaderComponent={
            <View style={styles.card}>
              {/* NUMÉRO BL */}
              <Text style={styles.label}>
                Entrez le numéro de bon livraison
              </Text>

              <TextInput
                placeholder="BL"
                value={blNum}
                onChangeText={setBlNum}
                style={styles.input}
              />

              {/* CLIENT */}
              <Text style={styles.label}>
                Entrez le nom du client
              </Text>

              <TextInput
                placeholder="Client..."
                value={clientSearch}
                onChangeText={(text) => {
                  setClientSearch(text);
                  setShowClientList(true);
                  setSelectedClient(null);
                  setClientId(null);
                }}
                style={styles.input}
              />

              {showClientList &&
                clientSearch.length > 0 && (
                  <View style={styles.dropdown}>
                    {clients
                      .filter((c) =>
                        c.label
                          .toLowerCase()
                          .startsWith(
                            clientSearch.toLowerCase()
                          )
                      )
                      .slice(0, 6)
                      .map((c) => (
                        <TouchableOpacity
                          key={c.value}
                          onPress={() => {
                            setSelectedClient({
                              nom: c.label,
                            });
                            setClientId(c.value);
                            setClientSearch(c.label);
                            setShowClientList(false);
                          }}
                        >
                          <Text style={styles.dropdownItem}>
                            {c.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                )}

              {/* PRODUIT */}
              <Text style={styles.label}>
                Entrez le produit
              </Text>

              <TextInput
                placeholder="Produit..."
                value={produitsSearch}
                onChangeText={(text) => {
                  setProduitsSearch(text);
                  setShowProduitsList(true);
                  setSelectedProduits(null);
                  setProduitRef(null);
                }}
                style={styles.input}
              />

              {showProduitsList &&
                produitsSearch.length > 0 && (
                  <View style={styles.dropdown}>
                    {produits
                      .filter((p) =>
                        p.label
                          .toLowerCase()
                          .startsWith(
                            produitsSearch.toLowerCase()
                          )
                      )
                      .slice(0, 6)
                      .map((p) => (
                        <TouchableOpacity
                          key={p.value}
                          onPress={() => {
                            setSelectedProduits({
                              designation: p.label,
                            });
                            setProduitRef(p.value);
                            setProduitsSearch(p.label);
                            setShowProduitsList(false);
                          }}
                        >
                          <Text style={styles.dropdownItem}>
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                )}

              {/* QUANTITÉ */}
              <Text style={styles.label}>
                Entrez la quantité
              </Text>

              {isLaniere ? (
                <>
                  <TextInput
                    placeholder="Rouleaux"
                    value={rouleaux}
                    onChangeText={setRouleaux}
                    style={styles.input}
                    keyboardType="numeric"
                  />

                  <TextInput
                    placeholder="Mètres"
                    value={metres}
                    onChangeText={setMetres}
                    style={styles.input}
                    keyboardType="numeric"
                  />
                </>
              ) : (
                <TextInput
                  placeholder="Quantité"
                  value={quantite}
                  onChangeText={setQuantite}
                  style={styles.input}
                  keyboardType="numeric"
                />
              )}

              {/* PRIX */}
              <Text style={styles.label}>
                Entrez le prix unitaire
              </Text>

              <TextInput
                placeholder="Prix"
                value={prixUnitaire}
                onChangeText={setPrixUnitaire}
                style={styles.input}
                keyboardType="numeric"
              />

              {/* AJOUTER */}
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleAddProduct}
              >
                <Text style={styles.btnText}>
                  + Ajouter
                </Text>
              </TouchableOpacity>

              {/* TRANSPORT */}
              {showTransport && (
                <>
                  <Text style={styles.label}>
                    Choisir le transport
                  </Text>

                  <View
                    style={[
                      styles.pickerWrapper,
                      styles.pickerShadowBlue,
                    ]}
                  >
                    <Picker
                      selectedValue={transportId}
                      onValueChange={setTransportId}
                      style={styles.picker}
                      dropdownIconColor="#000"
                    >
                      {transport.map((t) => (
                        <Picker.Item
                          key={t.value}
                          label={t.label}
                          value={t.value}
                          color="#000"
                        />
                      ))}
                    </Picker>
                  </View>
                </>
              )}

              {/* PAIEMENT */}
              {showPayement && (
                <>
                  <Text style={styles.label}>
                    Statut du paiement
                  </Text>

                  <View
                    style={[
                      styles.pickerWrapper,
                      styles.pickerShadowBlue,
                    ]}
                  >
                    <Picker
                      selectedValue={paiementId}
                      onValueChange={setPaiementId}
                      style={styles.picker}
                      dropdownIconColor="#000"
                    >
                      {paiement.map((p) => (
                        <Picker.Item
                          key={p.value}
                          label={p.label}
                          value={p.value}
                          color="#000"
                        />
                      ))}
                    </Picker>
                  </View>
                </>
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.commandProduct}>
                  {item.produit_reference}
                </Text>

                <Text style={styles.commandPrice}>
                  {item.prix_unitaire} ×{" "}
                  {item.quantite_commande}
                </Text>

                <Text style={styles.commandAmount}>
                  {formatMontant(
                    Number(item.prix_unitaire || 0) *
                      Number(item.quantite_commande || 0)
                  )}{" "}
                  DH
                </Text>

                {item.metres_commandees > 0 && (
                  <Text style={styles.commandPrice}>
                    Mètres : {item.metres_commandees}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => handleRemoveItem(index)}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteBtnText}>
                  X
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            commandesMultiple.length > 0 ? (
              <TouchableOpacity
                style={styles.submit}
                onPress={handleSubmit}
              >
                <Text style={styles.btnText}>
                  Valider commande
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      ) : (
        /* ================================================== */
        /* ONGLET HISTORIQUE */
        /* ================================================== */

        <View style={styles.historyScreen}>
          <Text style={styles.label}>
            Choisissez le mois
          </Text>

          <MonthSelector
            value={selectedMonth}
            onChange={setSelectedMonth}
          />

          <Text style={styles.label}>
            Entrez le client
          </Text>

          <TextInput
            placeholder="Client..."
            value={clientSearch}
            onChangeText={(text) => {
              setClientSearch(text);
              setShowClientList(true);
              setSelectedClient(null);
              setClientId(null);
            }}
            style={styles.input}
          />

          {showClientList &&
            clientSearch.length > 0 && (
              <View style={styles.dropdown}>
                {clients
                  .filter((c) =>
                    c.label
                      .toLowerCase()
                      .startsWith(
                        clientSearch.toLowerCase()
                      )
                  )
                  .slice(0, 6)
                  .map((c) => (
                    <TouchableOpacity
                      key={c.value}
                      onPress={() => {
                        setSelectedClient({
                          nom: c.label,
                        });
                        setClientId(c.value);
                        setClientSearch(c.label);
                        setShowClientList(false);
                      }}
                    >
                      <Text style={styles.dropdownItem}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}

          {/* SITUATION DE PAIEMENT */}
          {showPaiementButton && (
            <TouchableOpacity
              onPress={() => {
                if (!selectedClient) {
                  return Alert.alert(
                    "Erreur",
                    "Choisissez un client"
                  );
                }

                setClientPaiement(selectedClient);
                setSelectedMonthPaiement(selectedMonth);
                setShowPaiementScreen(true);
              }}
              style={styles.paymentButton}
            >
              <Text style={styles.paymentButtonText}>
                Consulter situation paiement
              </Text>
            </TouchableOpacity>
          )}

          {/* TABLEAU HISTORIQUE */}
          <View style={styles.historyContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
            >
              <View style={styles.tableWrapper}>
                <View style={styles.tableHeader}>
                  {[
                    "Produit",
                    "Prix",
                    "Qté",
                    "Bon Livraison N°",
                    "Date commande",
                  ].map((title, index) => (
                    <View
                      key={index}
                      style={[
                        styles.headerCellContainer,
                        {
                          width: [
                            300,
                            100,
                            100,
                            120,
                            120,
                          ][index],
                        },
                      ]}
                    >
                      <Text style={styles.headerCell}>
                        {title}
                      </Text>
                    </View>
                  ))}
                </View>

                <ScrollView
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                    />
                  }
                >
                  {commandesFiltrees.map((item, index) => {
                    const date = item.date_commande
                      ? new Date(item.date_commande)
                      : null;

                    const dateValide =
                      date && !Number.isNaN(date.getTime());

                    return (
                      <View
                        key={String(
                          item.numCmd || item.id || index
                        )}
                        style={[
                          styles.row,
                          index % 2 === 0 &&
                            styles.rowAlt,
                        ]}
                      >
                        <View style={styles.productCell}>
                          <Text style={styles.productText}>
                            {item.designation_produit || "-"}
                          </Text>
                        </View>

                        <View style={styles.priceCell}>
                          <Text style={styles.priceText}>
                            {item.prix_unitaire ?? "-"}
                          </Text>
                        </View>

                        <View style={styles.qtyCell}>
                          <Text style={styles.qtyText}>
                            {item.quantite_commande ||
                              item.metres_commandees ||
                              "-"}
                          </Text>
                        </View>

                        <View style={styles.blCell}>
                          <Text style={styles.cell}>
                            {item.bl_num || "-"}
                          </Text>
                        </View>

                        <View style={styles.dateCell}>
                          <Text style={styles.dateText}>
                            {dateValide
                              ? `${date.getFullYear()}-${String(
                                  date.getMonth() + 1
                                ).padStart(2, "0")}-${String(
                                  date.getDate()
                                ).padStart(2, "0")}`
                              : "-"}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </ScrollView>
          </View>

          {/* CHIFFRE DU MOIS */}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>
              Chiffre du mois
            </Text>

            <Text style={styles.totalValue}>
              {formatMontant(totalMois)} DH
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CommandesScreen;

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },

  header: {
    padding: 20,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },

  paymentClientName: {
    color: "#cbd5f5",
    marginTop: 4,
    fontSize: 15,
  },

  tabs: {
    flexDirection: "row",
    margin: 10,
    backgroundColor: "#020202",
    borderRadius: 10,
    overflow: "hidden",
  },

  tab: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  tabActive: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
  },

  tabTextActive: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  card: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 12,
  },

  input: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    color: "#0f172a",
    fontSize: 15,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 7,
    marginTop: 10,
    letterSpacing: 0.2,
  },

  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },

  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  addBtn: {
    backgroundColor: "#f59e0b",
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  submit: {
    backgroundColor: "#16a34a",
    padding: 15,
    margin: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    marginHorizontal: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  commandProduct: {
    fontWeight: "bold",
    color: "#0f172a",
    fontSize: 14,
  },

  commandPrice: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 3,
  },

  commandAmount: {
    color: "#16a34a",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 3,
  },

  deleteBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
  },

  deleteBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  historyScreen: {
    flex: 1,
    padding: 10,
  },

  historyContainer: {
    flex: 1,
    marginTop: 10,
    minHeight: 100,
  },

  tableWrapper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    alignItems: "center",
  },

  headerCellContainer: {
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  headerCell: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  row: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
    minHeight: 55,
  },

  rowAlt: {
    backgroundColor: "#f8fafc",
  },

  cell: {
    paddingHorizontal: 10,
    fontSize: 13,
    color: "#0f172a",
  },

  productCell: {
    width: 300,
    justifyContent: "center",
  },

  productText: {
    paddingHorizontal: 10,
    fontSize: 13,
    color: "#0f172a",
  },

  priceCell: {
    width: 100,
    justifyContent: "center",
  },

  priceText: {
    paddingHorizontal: 10,
    fontSize: 13,
    color: "#0f172a",
  },

  qtyCell: {
    width: 100,
    justifyContent: "center",
  },

  qtyText: {
    paddingHorizontal: 10,
    fontSize: 13,
    color: "#0f172a",
  },

  blCell: {
    width: 120,
    justifyContent: "center",
    alignItems: "center",
  },

  dateCell: {
    width: 120,
    justifyContent: "center",
  },

  dateText: {
    paddingHorizontal: 10,
    fontSize: 12,
    color: "#0f172a",
  },

  totalBox: {
    backgroundColor: "#a9c8fa",
    padding: 18,
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 10,
  },

  totalLabel: {
    fontSize: 17,
    color: "#0f172a",
    marginBottom: 5,
  },

  totalValue: {
    color: "#000",
    fontSize: 23,
    fontWeight: "bold",
  },

  paymentButton: {
    backgroundColor: "#1e40af",
    padding: 14,
    marginTop: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  paymentButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },

  // SÉLECTEUR DE MOIS

  monthSelector: {
    minHeight: 54,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  monthSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  monthIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  monthSelectorText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1e293b",
  },

  monthArrow: {
    fontSize: 14,
    color: "#2563eb",
  },

  monthModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.50)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  monthModalContainer: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },

  monthModalHeader: {
    backgroundColor: "#1e40af",
    paddingHorizontal: 18,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  monthModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },

  monthCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  monthCloseText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  monthList: {
    flexShrink: 1,
  },

  monthOption: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  monthOptionSelected: {
    backgroundColor: "#eff6ff",
  },

  monthOptionText: {
    fontSize: 16,
    color: "#334155",
  },

  monthOptionTextSelected: {
    color: "#1d4ed8",
    fontWeight: "bold",
  },

  monthCheck: {
    fontSize: 20,
    color: "#2563eb",
    fontWeight: "bold",
  },

  monthCancelButton: {
    margin: 14,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: "#1e40af",
    alignItems: "center",
  },

  monthCancelText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },

  // SITUATION DE PAIEMENT

  paymentContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  paymentMonthContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },

  paymentList: {
    padding: 12,
    flexGrow: 1,
  },

  emptyContainer: {
    padding: 25,
    alignItems: "center",
  },

  emptyText: {
    color: "#64748b",
    fontSize: 15,
    textAlign: "center",
  },

  cardPro: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 5,
    elevation: 2,
  },

  titlePro: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 10,
  },

  rowInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  labelPro: {
    fontSize: 12,
    color: "#64748b",
  },

  valuePro: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },

  btnBackPro: {
    backgroundColor: "#0f172a",
    margin: 12,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  btnTextPro: {
    color: "#fff",
    fontWeight: "bold",
  },

  // PICKER TRANSPORT ET PAIEMENT

  pickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    marginBottom: 14,
    overflow: "hidden",
  },

  picker: {
    height: 55,
    color: "#0f172a",
    backgroundColor: "#fff",
  },

  pickerShadowBlue: {
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
});
