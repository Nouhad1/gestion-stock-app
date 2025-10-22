import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import DropDownPicker from "react-native-dropdown-picker";
import axios from "axios";

const CommandesScreen = () => {
  const [activeTab, setActiveTab] = useState("nouvelle");

  // Formulaire
  const [blNum, setBlNum] = useState("");
  const [clientId, setClientId] = useState(null);
  const [produitRef, setProduitRef] = useState(null);
  const [quantite, setQuantite] = useState("");
  const [rouleaux, setRouleaux] = useState("");
  const [metres, setMetres] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [commandesMultiple, setCommandesMultiple] = useState([]);

  // Données
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [commandesPassees, setCommandesPassees] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [openClient, setOpenClient] = useState(false);
  const [openProduit, setOpenProduit] = useState(false);

  const API_URL = "https://gestion-stock-app-production.up.railway.app/api";

  useEffect(() => {
    axios.get(`${API_URL}/clients`).then((res) =>
      setClients(res.data.map((c) => ({ label: c.nom, value: c.id })))
    );
    axios.get(`${API_URL}/produits`).then((res) =>
      setProduits(
        res.data.map((p) => ({
          label: p.designation,
          value: p.reference,
          quantite_stock: Number(p.quantite_stock) || 0,
          longueur_par_rouleau: Number(p.longueur_par_rouleau) || 0,
          type: p.designation.toUpperCase().includes("ROUL") ? "laniere" : "autre",
        }))
      )
    );
    fetchCommandes();
  }, []);

  const fetchCommandes = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/commandes`);
      setCommandesPassees(res.data || []);
    } catch (err) {
      console.error(err);
      setCommandesPassees([]);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCommandes().finally(() => setRefreshing(false));
  };

  const produitSelectionne = produits.find((p) => p.value === produitRef);
  const isLaniere = produitSelectionne?.type === "laniere";
  const quantiteStock = produitSelectionne?.quantite_stock || 0;
  const longueurParRouleau = produitSelectionne?.longueur_par_rouleau || 0;

  const handleAddProduct = () => {
    if (!blNum) return Alert.alert("Erreur", "Veuillez saisir le BL.");
    if (!clientId) return Alert.alert("Erreur", "Veuillez choisir un client.");
    if (!produitRef) return Alert.alert("Erreur", "Veuillez choisir un produit.");
    if (!prixUnitaire) return Alert.alert("Erreur", "Veuillez saisir le prix unitaire.");

    const body = {
      bl_num: blNum,
      client_id: clientId,
      produit_reference: produitRef,
      prix_unitaire: parseFloat(prixUnitaire),
    };

    if (isLaniere) {
      const r = parseInt(rouleaux) || 0;
      const m = parseInt(metres) || 0;
      if (r <= 0 && m <= 0) return Alert.alert("Erreur", "Renseignez rouleaux ou mètres.");
      if (r > quantiteStock) return Alert.alert("Erreur", `Stock max ${quantiteStock} rouleaux.`);
      if (m > quantiteStock * longueurParRouleau)
        return Alert.alert("Erreur", `Stock max ${quantiteStock * longueurParRouleau} m.`);
      if (r > 0) body.quantite_commande = r;
      if (m > 0) body.metres_commandees = m;
      body.montant = ((r > 0 ? r : m) * body.prix_unitaire).toFixed(2);
    } else {
      const q = parseFloat(quantite);
      if (!q || q <= 0) return Alert.alert("Erreur", "Quantité invalide.");
      if (q > quantiteStock) return Alert.alert("Erreur", `Stock max ${quantiteStock}.`);
      body.quantite_commande = q;
      body.montant = (q * body.prix_unitaire).toFixed(2);
    }

    setCommandesMultiple((prev) => [...prev, body]);
    setProduitRef(null);
    setQuantite("");
    setRouleaux("");
    setMetres("");
    setPrixUnitaire("");
  };

  const handleSubmit = async () => {
    if (commandesMultiple.length === 0) return Alert.alert("Erreur", "Aucun produit ajouté.");
    try {
      await axios.post(`${API_URL}/commandes/multiples`, { commandes: commandesMultiple });
      Alert.alert("Succès", "Commande enregistrée !");
      setCommandesMultiple([]);
      setBlNum("");
      setClientId(null);
      fetchCommandes();
    } catch (err) {
      console.error(err.response?.data || err);
      Alert.alert("Erreur", "Impossible d'enregistrer la commande.");
    }
  };

  const renderCommande = ({ item }) => {
    const client = item.nom_client || item.client_id || "-";
    const produit = item.designation_produit || item.produit_reference || "-";
    const quantite = item.quantite_commande || item.metres_commandees || "-";
    const prixUnitaire = item.prix_unitaire != null ? parseFloat(item.prix_unitaire).toFixed(2) : "-";
    const montant = item.montant != null ? parseFloat(item.montant).toFixed(2) : "-";

    return (
      <View style={styles.row}>
        <Text style={[styles.cell, { width: 100 }]}>{client}</Text>
        <Text style={[styles.cell, { width: 350 }]}>{produit}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{quantite}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{prixUnitaire}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{montant}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#2563eb", "#1e40af"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🧾 Gestion Commandes</Text>
        </View>
      </LinearGradient>

      {/* Onglets */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "nouvelle" && styles.activeTab]}
          onPress={() => setActiveTab("nouvelle")}
        >
          <Text style={[styles.tabText, activeTab === "nouvelle" && styles.activeTabText]}>
            Nouvelle commande
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "passees" && styles.activeTab]}
          onPress={() => setActiveTab("passees")}
        >
          <Text style={[styles.tabText, activeTab === "passees" && styles.activeTabText]}>
            Commandes passées
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "nouvelle" ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <FlatList
            data={commandesMultiple}
            keyExtractor={(item, i) => i.toString()}
            ListHeaderComponent={
              <View style={{ padding: 12 }}>
                <TextInput
                  placeholder="Numéro BL"
                  value={blNum}
                  onChangeText={setBlNum}
                  style={styles.input}
                />
                {/* CLIENT */}
                <View style={{ zIndex: 1000 }}>
                  <DropDownPicker
                    open={openClient}
                    value={clientId}
                    items={clients}
                    setOpen={setOpenClient}
                    setValue={setClientId}
                    placeholder="Sélectionner un client"
                    dropDownDirection="TOP"
                    listMode="MODAL"
                    searchable={true}
                    searchPlaceholder="Rechercher un client..."
                    containerStyle={{ marginBottom: 12 }}
                  />
                </View>
                {/* PRODUIT */}
                <View style={{ zIndex: 900 }}>
                  <DropDownPicker
                    open={openProduit}
                    value={produitRef}
                    items={produits}
                    setOpen={setOpenProduit}
                    setValue={setProduitRef}
                    placeholder="Sélectionner un produit"
                    listMode="MODAL"
                    searchable={true}
                    searchPlaceholder="Rechercher un produit..."
                    containerStyle={{ marginBottom: 12 }}
                  />
                </View>

                {isLaniere ? (
                  <>
                    <TextInput
                      placeholder="Rouleaux"
                      value={rouleaux}
                      onChangeText={setRouleaux}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                    <TextInput
                      placeholder="Mètres"
                      value={metres}
                      onChangeText={setMetres}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </>
                ) : (
                  <TextInput
                    placeholder="Quantité"
                    value={quantite}
                    onChangeText={setQuantite}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                )}
                <TextInput
                  placeholder="Prix unitaire"
                  value={prixUnitaire}
                  onChangeText={setPrixUnitaire}
                  keyboardType="numeric"
                  style={styles.input}
                />
                <TouchableOpacity
                  onPress={handleAddProduct}
                  style={[styles.button, { backgroundColor: "#f59e0b" }]}
                >
                  <Text style={styles.buttonText}>Ajouter un produit</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item, index }) => (
              <View style={{ padding: 10, backgroundColor: "#e0f2fe", margin: 4, borderRadius: 6 }}>
                <Text>
                  {item.produit_reference} : {item.quantite_commande || item.metres_commandees} × {item.prix_unitaire} = {item.montant}
                </Text>
              </View>
            )}
            ListFooterComponent={
              commandesMultiple.length > 0 ? (
                <TouchableOpacity onPress={handleSubmit} style={[styles.button, { margin: 12 }]}>
                  <Text style={styles.buttonText}>Envoyer la commande</Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </KeyboardAvoidingView>
      ) : (
        // Commandes passées
        <View style={{ flex: 1 }}>
          <View style={[styles.row, { backgroundColor: "#2563eb" }]}>
            <Text style={[styles.cell, { width: 100, color: "#fff", fontWeight: "bold" }]}>Client</Text>
            <Text style={[styles.cell, { width: 350, color: "#fff", fontWeight: "bold" }]}>Produit</Text>
            <Text style={[styles.cell, { width: 100, color: "#fff", fontWeight: "bold" }]}>Qté / m</Text>
            <Text style={[styles.cell, { width: 100, color: "#fff", fontWeight: "bold" }]}>PU</Text>
            <Text style={[styles.cell, { width: 100, color: "#fff", fontWeight: "bold" }]}>Montant</Text>
          </View>
          <FlatList
            data={commandesPassees}
            keyExtractor={(item, i) => i.toString()}
            renderItem={renderCommande}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb" },
  header: { padding: 16, paddingTop: 20, marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  tabContainer: { flexDirection: "row", marginTop: 10 },
  tab: { flex: 1, padding: 12, alignItems: "center", borderBottomWidth: 2, borderColor: "#ccc" },
  activeTab: { borderColor: "#2563eb" },
  tabText: { color: "#555" },
  activeTabText: { color: "#2563eb", fontWeight: "bold" },
  input: { backgroundColor: "#fff", padding: 10, borderRadius: 8, marginBottom: 10 },
  button: { backgroundColor: "#2563eb", padding: 12, borderRadius: 8 },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  row: { flexDirection: "row", backgroundColor: "#e0f2fe", padding: 8, marginVertical: 2, marginHorizontal: 0 },
  cell: { textAlign: "center" },
});

export default CommandesScreen;
