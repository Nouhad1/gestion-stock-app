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

  const [refreshing, setRefreshing] = useState(false);

  // ✅ NOUVEAU SYSTEME IDs
    const [transportId, setTransportId] = useState(2); // Messagerie
    const [paiementId, setPaiementId] = useState(2);   // Non payé
    const clientsAvecTransport = [209, 221, 281, 215];

    const [transport, setTransport] = useState([]);
    const [paiement, setPaiements] = useState([]);

  const API_URL = "https://gestion-stock-app-production.up.railway.app/api";

  useEffect(() => {
  const fetchData = async () => {
    try {
      // ✅ Charger tout en parallèle (plus rapide)
      const [
        clientsRes,
        produitsRes,
        transportRes,
        paiementRes
      ] = await Promise.all([
        axios.get(`${API_URL}/clients`),
        axios.get(`${API_URL}/produits`),
        axios.get(`${API_URL}/statut/transport`),
        axios.get(`${API_URL}/statut/paiement`)
      ]);

      // ✅ CLIENTS
      setClients(
        clientsRes.data.map((c) => ({
          label: c.nom,
          value: c.id,
        }))
      );

      // ✅ PRODUITS
      setProduits(
        produitsRes.data.map((p) => ({
          label: p.designation,
          value: p.reference,
          type: p.designation.toUpperCase().includes("ROUL")
            ? "laniere"
            : "autre",
        }))
      );

      // ✅ TRANSPORT
      console.log("🚚 transport API:", transportRes.data);
      setTransport(
        transportRes.data.map((t) => ({
          label: t.nom,
          value: t.id,
        }))
      );

      // ✅ PAIEMENT
      console.log("💰 paiement API:", paiementRes.data);
      setPaiements(
        paiementRes.data.map((p) => ({
          label: p.nom,
          value: p.id,
        }))
      );

      // ✅ COMMANDES
      await fetchCommandes();

    } catch (error) {
      console.log("❌ ERREUR useEffect:", error.message);

      // 👉 très utile pour debug API
      if (error.response) {
        console.log("❌ DATA:", error.response.data);
        console.log("❌ STATUS:", error.response.status);
      }
    }
  };

  fetchData();
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

  const showTransport =
  clientId !== null && clientsAvecTransport.includes(Number(clientId));

const showPayement =
  clientId !== null && clientsAvecTransport.includes(Number(clientId));

  const totalMois = commandesFiltrees.reduce(
    (sum, item) => sum + (parseFloat(item.montant) || 0),
    0
  );
  
  // ✅ SUPPRESSION PRODUIT
  const handleRemoveItem = (index) => {
    const newList = [...commandesMultiple];
    newList.splice(index, 1);
    setCommandesMultiple(newList);
  };

  const onRefresh = async () => {
  setRefreshing(true);
  try {
    await fetchCommandes();
  } catch (e) {
    console.log("Erreur refresh:", e);
  }
  setRefreshing(false);
};



const handleAddProduct = () => {
  if (!blNum || !clientId || !produitRef || !prixUnitaire) {
    return Alert.alert("Erreur", "Veuillez remplir tous les champs");
  }

  if (isLaniere && !rouleaux && !metres) {
    return Alert.alert("Erreur", "Entrer rouleaux ou mètres");
  }

  if (!isLaniere && !quantite) {
    return Alert.alert("Erreur", "Entrer quantité");
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

  console.log("🧪 ITEM AJOUTÉ:", item);

  console.log("🚚 transport ID:", transportId);
  console.log("💰 paiement ID:", paiementId);

  setCommandesMultiple(prev => [...prev, item]);

  // RESET PRODUIT SEULEMENT
  setProduitRef(null);
  setProduitsSearch("");
  setQuantite("");
  setRouleaux("");
  setMetres("");
  setPrixUnitaire("");
};

  /* const handleSubmit = async () => {
    if (!commandesMultiple.length)
      return Alert.alert("Erreur", "Aucune commande");

    await axios.post(`${API_URL}/commandes/multiples`, {
      commandes: commandesMultiple,
    });

    setCommandesMultiple([]);
    setBlNum("");
    fetchCommandes();
  }; */
   const handleSubmit = async () => {
  if (!commandesMultiple.length)
    return Alert.alert("Erreur", "Aucune commande");

  const commandesFinales = commandesMultiple.map((cmd) => ({
    ...cmd,

    // ✅ FORCER LES IDS ICI (sécurité backend)
    transport_id: transportId,
    paiement_id: paiementId,
  }));

  try {
    await axios.post(`${API_URL}/commandes/multiples`, {
      commandes: commandesFinales,
    });

    Alert.alert("Succès", "Commande enregistrée");

    setCommandesMultiple([]);
    setBlNum("");

    fetchCommandes();
  } catch (error) {
    Alert.alert(
      "Erreur",
      error.response?.data?.message || "Erreur serveur"
    );
  }
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
          refreshControl={
  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
}
          ListHeaderComponent={
    
            
      <View style={styles.card}>
        <View>
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
  onChangeText={(t) => {
    setClientSearch(t);
    setShowClientList(true);
    setSelectedClient(null);
  }}
  style={styles.input}
/>

{/* 🔽 LISTE CLIENTS */}
{showClientList && clientSearch.length > 0 && (
  <View style={styles.dropdown}>
    {clients
      .filter((c) =>
        c.label.toLowerCase().startsWith(clientSearch.toLowerCase())
      )
      .slice(0, 6)
      .map((c) => (
        <TouchableOpacity
          key={c.value}
          onPress={() => {
            setSelectedClient({ nom: c.label });
            setClientId(c.value);
            setClientSearch(c.label);
            setShowClientList(false);
          }}
        >
          <Text style={styles.dropdownItem}>{c.label}</Text>
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
          onChangeText={(t) => {
            setProduitsSearch(t);
            setShowProduitsList(true);
            setSelectedProduits(null);
          }}
          style={styles.input}
        />

        {showProduitsList && produitsSearch.length > 0 && (
          <View style={styles.dropdown}>
            {produits
              .filter((c) =>
                c.label
                  .toLowerCase()
                  .startsWith(produitsSearch.toLowerCase())
              )
              .slice(0, 6)
              .map((c) => (
                <TouchableOpacity
                  key={c.value}
                  onPress={() => {
                    setSelectedProduits({ designation: c.label });
                    setProduitRef(c.value);
                    setProduitsSearch(c.label);
                    setShowProduitsList(false);
                  }}
                >
                  <Text style={styles.dropdownItem}>{c.label}</Text>
                </TouchableOpacity>
              ))}
          </View>
        )}

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
            />
            <TextInput
              placeholder="Mètres"
              value={metres}
              onChangeText={setMetres}
              style={styles.input}
            />
          </>
        ) : (
          
          <TextInput
            placeholder="Quantité"
            value={quantite}
            onChangeText={setQuantite}
            style={styles.input}
          />
        )}

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

        <TouchableOpacity style={styles.addBtn} onPress={handleAddProduct}>
          <Text style={styles.btnText}>+ Ajouter</Text>
        </TouchableOpacity>

        {/* TRANSPORT */}
  {showTransport && (
  <>
    <Text style={styles.label}>Choisir le transport</Text>

    <View style={styles.dropdown}>
      <Picker
        selectedValue={transportId}
        onValueChange={(value) => setTransportId(value)} // ✅ correction
      >
        {transport.map((t) => (
          <Picker.Item key={t.value} label={t.label} value={t.value} />
        ))}
      </Picker>
    </View>
  </>
)}

{/* PAIEMENT */}
   {showPayement && (
  <>
    <Text style={styles.label}>Statut du paiement</Text>

    <View style={styles.dropdown}>
      <Picker
        selectedValue={paiementId}
        onValueChange={(value) => setPaiementId(value)}
      >
        {paiement.map((p) => (
          <Picker.Item key={p.value} label={p.label} value={p.value} />
        ))}
      </Picker>
    </View>
  </>
)}
      </View>
    </View>
  } 
  renderItem={({ item, index }) => (
  <View style={styles.itemRow}>
    <View style={{ flex: 1 }}>
      <Text style={{ fontWeight: "bold" }}>
        {item.produit_reference}
      </Text>
      <Text>
        {/* {item.quantite_commande > 0 && item.quantite_commande}
        {/* {item.quantite_commande > 0 && `${item.quantite_commande} rouleaux `} */}
        {/* {item.metres_commandees > 0 && `+ ${item.metres_commandees} m`} */} 

         <Text style={{ color: "#64748b", fontSize: 12 }}>
        {item.prix_unitaire} × {item.quantite_commande} ={" "}
        <Text style={{ fontWeight: "bold", color: "#16a34a" }}>
          {(item.prix_unitaire * item.quantite_commande).toFixed(2)} DH
        </Text>
      </Text>
      </Text>
    </View>

    {/* ❌ SUPPRIMER */}
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
            <Text style={styles.label}>Entrez le client</Text>
           <TextInput
                placeholder="Client..."
                value={clientSearch}
                onChangeText={(t) => {
                  setClientSearch(t);
                  setShowClientList(true);
                  setSelectedClient(null);
                }}
                style={styles.input}
              />

              {showClientList && clientSearch.length > 0 && (
                <View style={styles.dropdown}>
                  {clients
                    .filter((c) =>
                      c.label
                        .toLowerCase()
                        .startsWith(clientSearch.toLowerCase())
                    )
                    .slice(0, 6)
                    .map((c) => (
                      <TouchableOpacity
                        key={c.value}
                        onPress={() => {
                          setSelectedClient({ nom: c.label });
                          setClientId(c.value);
                          setClientSearch(c.label);
                          setShowClientList(false);
                        }}
                      >
                        <Text style={styles.dropdownItem}>{c.label}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}

          {/* TABLE DESIGN PRO */}
          <View style={styles.historyContainer}>
            <ScrollView horizontal  refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
              
              <View style={styles.tableWrapper}>
                <View style={styles.tableHeader}>
                  {["Produit", "Prix", "Qté", "Bon Livraison N°", "Date commande"].map((t, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.cell,
                        styles.headerCell,
                        { width: [300, 100, 100, 120, 120][i], alignItems: "center"},
                      ]}
                    >
                      {t}
                    </Text>
                  ))}
                </View>

                <ScrollView>
                  {commandesFiltrees.map((item, i) => (
                    <View
                      key={i}
                      style={[styles.row, i % 2 === 0 && styles.rowAlt]}
                    >
                      <Text style={[styles.cell, styles.productText, { width: 300, alignItems: "center" }]}>
                        {item.designation_produit || "-"}
                      </Text>

                      <Text style={[styles.cell, styles.priceText, { width: 100, alignItems: "center" }]}>
                        {item.prix_unitaire || "-"}
                      </Text>

                      <Text style={[styles.cell, styles.qtyText, { width: 100, alignItems: "center" }]}>
                        {item.quantite_commande ||
                          item.metres_commandees ||
                          "-"}
                      </Text>

                      <View style={{ width: 120,alignItems: "center" }}>            
                          <Text>
                            {item.bl_num}
                          </Text>
                      </View>

                      <Text style={[styles.cell, styles.dateText, { width: 120,alignItems: "center" }]}>
                        {item.date_commande
                          ? new Date(item.date_commande)
                              .toISOString()
                              .split("T")[0]
                          : "-"}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>
              Chiffre du mois
            </Text>
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