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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";

const CommandesScreen = () => {
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

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [clientSearch, setClientSearch] = useState("");
  const [produitsSearch, setProduitsSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProduits, setSelectedProduits] = useState(null);
  const [showClientList, setShowClientList] = useState(false);
  const [showProduitsList, setShowProduitsList] = useState(false);

  // ⭐ AJOUT PAYMENT / TRANSPORT
  const [transport, setTransport] = useState("Honda");

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
          type: p.designation.toUpperCase().includes("ROUL")
            ? "laniere"
            : "autre",
        }))
      )
    );

    fetchCommandes();
  }, []);

  const fetchCommandes = useCallback(async () => {
    const res = await axios.get(`${API_URL}/commandes`);
    setCommandesPassees(res.data || []);
  }, []);

  const produitSelectionne = produits.find((p) => p.value === produitRef);
  const isLaniere = produitSelectionne?.type === "laniere";

  const commandesFiltrees = commandesPassees.filter((c) => {
    const date = c.date_commande ? new Date(c.date_commande) : null;
    const monthOk = date ? date.getMonth() + 1 === selectedMonth : false;

    const clientOk = selectedClient
      ? c.nom_client?.toLowerCase() === selectedClient.nom.toLowerCase()
      : true;

    return monthOk && clientOk;
  });

  const totalMois = commandesFiltrees.reduce(
    (sum, item) => sum + (parseFloat(item.montant) || 0),
    0
  );

  const handleRemoveItem = (index) => {
    const newList = [...commandesMultiple];
    newList.splice(index, 1);
    setCommandesMultiple(newList);
  };

  const handleAddProduct = () => {
    if (!blNum || !clientId || !produitRef || !prixUnitaire) {
      return Alert.alert("Erreur", "Veuillez remplir tous les champs");
    }

    const longueurParRouleau = 100;

    const q = isLaniere
      ? (parseFloat(rouleaux) || 0) * longueurParRouleau +
        (parseFloat(metres) || 0)
      : parseFloat(quantite);

    const item = {
      bl_num: blNum,
      client_id: clientId,
      produit_reference: produitRef,
      quantite_commande: q,
      prix_unitaire: parseFloat(prixUnitaire),
      montant: (q * prixUnitaire).toFixed(2),
    };

    setCommandesMultiple((prev) => [...prev, item]);

    setProduitRef(null);
    setProduitsSearch("");
    setQuantite("");
    setRouleaux("");
    setMetres("");
    setPrixUnitaire("");
  };

  const handleSubmit = async () => {
    if (!commandesMultiple.length)
      return Alert.alert("Erreur", "Aucune commande");

    // ⭐ AJOUT PAYMENT ICI
    await axios.post(`${API_URL}/commandes/multiples`, {
      commandes: commandesMultiple,
      transport: transport, // ⭐ AJOUT IMPORTANT
    });

    setCommandesMultiple([]);
    setBlNum("");
    fetchCommandes();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#2563eb", "#1e40af"]} style={styles.header}>
        <Text style={styles.headerTitle}>🧾 Gestion Commandes</Text>
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "nouvelle" && styles.tabActive]}
          onPress={() => setActiveTab("nouvelle")}
        >
          <Text style={styles.tabTextActive}>Nouvelle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "passees" && styles.tabActive]}
          onPress={() => setActiveTab("passees")}
        >
          <Text style={styles.tabTextActive}>Historique</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "nouvelle" ? (
        <FlatList
          data={commandesMultiple}
          keyExtractor={(i, idx) => idx.toString()}
          ListHeaderComponent={
            <View style={styles.card}>
              <Text style={styles.label}>Transport / Paiement</Text>

              {/* ⭐ AJOUT PICKER PAIEMENT */}
              <View style={styles.input}>
                <Picker
                  selectedValue={transport}
                  onValueChange={(val) => setTransport(val)}
                >
                  <Picker.Item label="Honda (7 jours)" value="Honda" />
                  <Picker.Item label="Messagerie (30 jours)" value="Messagerie" />
                </Picker>
              </View>

              <Text style={styles.label}>Entrez le numéro de bon livraison</Text>
              <TextInput
                placeholder="BL"
                value={blNum}
                onChangeText={setBlNum}
                style={styles.input}
              />

              {/* ===== reste de ton code inchangé ===== */}
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "bold" }}>
                  {item.produit_reference}
                </Text>
                <Text>
                  {item.quantite_commande} × {item.prix_unitaire}
                </Text>
                <Text style={{ color: "#16a34a" }}>
                  {item.montant} DH
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleRemoveItem(index)}
                style={styles.deleteBtn}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>X</Text>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            commandesMultiple.length > 0 && (
              <TouchableOpacity style={styles.submit} onPress={handleSubmit}>
                <Text style={styles.btnText}>Valider commande</Text>
              </TouchableOpacity>
            )
          }
        />
      ) : (
        <View style={{ flex: 1, padding: 10 }}>
          <Text style={styles.label}>Choisissez le mois</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              {[
                "Janvier","Février","Mars","Avril","Mai","Juin",
                "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
              ].map((m, i) => (
                <Picker.Item key={i} label={m} value={i + 1} />
              ))}
            </Picker>
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Chiffre du mois</Text>
            <Text style={styles.totalValue}>
              {totalMois.toFixed(2)} DH
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CommandesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  header: { padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  tabs: { flexDirection: "row", margin: 10, backgroundColor: "#020202", borderRadius: 10 },
  tab: { flex: 1, padding: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#2563eb" , borderRadius: 5 },
  tabTextActive: { color: "#fff", fontWeight: "bold" },
  card: { backgroundColor: "#fff", margin: 10, padding: 15 },
  // input: { backgroundColor: "#f1f5f9", padding: 10, borderRadius: 8, marginBottom: 10 },
  input: {
  backgroundColor: "#f1f5f9",
  padding: 10,
  borderRadius: 8,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: "#e2e8f0",  // 👈 effet propre
},
  addBtn: { backgroundColor: "#f59e0b", padding: 12, borderRadius: 8, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold" },
  item: { padding: 10, borderBottomWidth: 1, borderColor: "#eee" },
  submit: { backgroundColor: "#16a34a", padding: 15, margin: 10, borderRadius: 10, alignItems: "center" },
  historyContainer: {
    flex: 1,
    marginTop: 10,
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

  headerCell: {
    color: "#fff",
    fontWeight: "bold",
  },

  row: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },

  rowAlt: {
    backgroundColor: "#f8fafc",
  },

  cell: {
    paddingHorizontal: 10,
    fontSize: 13,
  },

  totalBox: {
    backgroundColor: "#a9c8fa",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },

  totalValue: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },

  label: {
  fontSize: 14,
  fontWeight: "600",
  color: "#1e293b",          
  marginBottom: 6,
  marginTop: 10,
  letterSpacing: 0.3,
},

itemRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: 10,
  borderBottomWidth: 1,
  borderColor: "#eee",
},

deleteBtn: {
  backgroundColor: "#ef4444",
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 6,
},
});