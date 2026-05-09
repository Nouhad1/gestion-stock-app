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

  const [selectedMonthPaiement, setSelectedMonthPaiement] = useState(
  new Date().getMonth() + 1
);

  // ✅ NOUVEAU SYSTEME IDs
    const [transportId, setTransportId] = useState(2); // Messagerie
    const [paiementId, setPaiementId] = useState(2);   // Non payé
    const clientsAvecTransport = [209, 221, 281, 215];

    const [transport, setTransport] = useState([]);
    const [paiement, setPaiements] = useState([]);

    const [showPaiementScreen, setShowPaiementScreen] = useState(false);
    const [clientPaiement, setClientPaiement] = useState(null);

    const showPaiementButton =
  clientId !== null && clientsAvecTransport.includes(Number(clientId));

  const API_URL = "https://gestion-stock-app-production.up.railway.app/api";

  useEffect(() => {
  const fetchData = async () => {

    // ✅ CLIENTS
    try {
      const res = await axios.get(`${API_URL}/clients`);
      setClients(
        (res.data || []).map((c) => ({
          label: c.nom,
          value: c.id,
        }))
      );
    } catch (e) {
      console.log("❌ clients error:", e.message);
    }

    // ✅ PRODUITS
    try {
      const res = await axios.get(`${API_URL}/produits`);
      setProduits(
        (res.data || []).map((p) => ({
          label: p.designation,
          value: p.reference,
          type: p.designation?.toUpperCase().includes("ROUL")
            ? "laniere"
            : "autre",
        }))
      );
    } catch (e) {
      console.log("❌ produits error:", e.message);
    }

    // ✅ TRANSPORT
    try {
      const res = await axios.get(`${API_URL}/statut/transport`);
      setTransport(
        (res.data || []).map((t) => ({
          label: t.nom,
          value: t.id,
        }))
      );
    } catch (e) {
      console.log("❌ transport error:", e.message);
    }

    // ✅ PAIEMENT (FIX IMPORTANT)
    try {
      const res = await axios.get(`${API_URL}/statut/paiement`);
      setPaiements(
        (res.data || []).map((p) => ({
          label: p.statut, // ✅ FIX
          value: p.id,
        }))
      );
    } catch (e) {
      console.log("❌ paiement error:", e.message);
    }

    // ✅ COMMANDES
    try {
      const res = await axios.get(`${API_URL}/commandes`);
      setCommandesPassees(res.data || []);
    } catch (e) {
      console.log("❌ commandes error:", e.message);
    }

  };

  fetchData();
}, []);

  const fetchCommandes = useCallback(async () => {
  try {
    const res = await axios.get(`${API_URL}/commandes`);
    setCommandesPassees(res.data || []);
  } catch (e) {
    console.log("❌ fetchCommandes error:", e.message);
  }
}, []);

  const produitSelectionne = produits.find((p) => p.value === produitRef);
  const isLaniere = produitSelectionne?.type === "laniere";

 const commandesFiltrees = commandesPassees.filter((c) => {
  const date = c.date_commande ? new Date(c.date_commande) : null;

  const monthOk =
    date && date.getMonth() + 1 === selectedMonth;

  const clientOk =
    selectedClient?.nom
      ? (c.nom_client || "").toLowerCase() === selectedClient.nom.toLowerCase()
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

  const getPaiementStatus = (item) => {
  const today = new Date();
  const echeance = new Date(item.Date_echeance);

  if (item.paiement_id == 1) {
    return "VERT"; // PAYÉ
  }

  if (echeance < today) {
    return "ROUGE"; // EN RETARD
  }

  const diffDays =
  echeance && today
    ? (echeance - today) / (1000 * 60 * 60 * 24)
    : 999;

  if (diffDays <= 3) {
    return "JAUNE"; // ATTENTE
  }

  return "NORMAL";
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


// ================= PAYMENT SCREEN (FIX IMPORTANT) =================
  if (showPaiementScreen) {

  // 🔥 STATE MOIS (utilise celui déjà déclaré en haut du composant)
  const data = commandesPassees.filter((c) => {
    const dateCommande = c.date_commande
      ? new Date(c.date_commande)
      : null;

    const clientOk = clientPaiement?.nom
      ? (c.nom_client || "").toLowerCase() === clientPaiement.nom.toLowerCase()
      : false;

    const monthOk =
      dateCommande &&
      dateCommande.getMonth() + 1 === selectedMonthPaiement;

    return clientOk && monthOk;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      
      {/* HEADER */}
      <LinearGradient colors={["#2563eb", "#1e40af"]} style={styles.header}>
        <Text style={styles.headerTitle}>
          Situation Paiement
        </Text>
        <Text style={{ color: "#cbd5f5", marginTop: 4 }}>
          {clientPaiement?.nom}
        </Text>
      </LinearGradient>

      {/* 🔥 FILTRE MOIS */}
      <View style={{ padding: 10 }}>
        <Text style={{ fontWeight: "600", marginBottom: 5 }}>
          Filtrer par mois de commande
        </Text>

        <View style={{ backgroundColor: "#fff", borderRadius: 8 }}>
          <Picker
  selectedValue={selectedMonthPaiement}
  onValueChange={(value) => setSelectedMonthPaiement(value)}
  style={{
    color: "#000",
    backgroundColor: "#fff",
  }}
  dropdownIconColor="#000"
>
  {[
    "Janvier","Février","Mars","Avril","Mai","Juin",
    "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
  ].map((m, i) => (
    <Picker.Item
      key={i}
      label={m}
      value={i + 1}
      color="#000"
    />
  ))}
</Picker>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(i, index) => index.toString()}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => {
          const today = new Date();
          const echeance = new Date(item.Date_echeance);

          let status = "PAYÉ";
          let color = "#22c55e";

          if (item.paiement_id != 1) {
            if (echeance < today) {
              status = "RETARD";
              color = "#ef4444";
            } else if ((echeance - today) / 86400000 <= 3) {
              status = "ATTENTE";
              color = "#f59e0b";
            } else {
              status = "EN COURS";
              color = "#3b82f6";
            }
          }

          return (
            <View style={[styles.cardPro, { borderLeftColor: color }]}>
              
              {/* TITRE */}
              <Text style={styles.titlePro}>
                {item.designation_produit}
              </Text>

              {/* DATE ÉCHÉANCE */}
              <View style={styles.rowInfo}>
                <Text style={styles.labelPro}>Échéance</Text>
                <Text style={styles.valuePro}>
                  {item.Date_echeance
                    ? new Date(item.Date_echeance).toISOString().split("T")[0]
                    : "-"}
                </Text>
              </View>

              {/* MONTANT */}
              <View style={styles.rowInfo}>
                <Text style={styles.labelPro}>💰 Montant</Text>
                <Text style={styles.valuePro}>
                  {item.montant || 0} DH
                </Text>
              </View>

              {/* STATUS */}
              <View style={styles.statusRow}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={[styles.statusText, { color }]}>
                  {status}
                </Text>
              </View>

            </View>
          );
        }}
      />

      {/* BUTTON RETOUR */}
      <TouchableOpacity
        onPress={() => setShowPaiementScreen(false)}
        style={styles.btnBackPro}
      >
        <Text style={styles.btnTextPro}>Retour</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

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
  style={{
    color: "#000",
    backgroundColor: "#fff",
  }}
  dropdownIconColor="#000"
>
  {[
    "Janvier","Février","Mars","Avril","Mai","Juin",
    "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
  ].map((m, i) => (
    <Picker.Item
      key={i}
      label={m}
      value={i + 1}
      color="#000"
    />
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

              {showPaiementButton && (
  <TouchableOpacity
    onPress={() => {
      if (!selectedClient) {
        return Alert.alert("Erreur", "Choisissez un client");
      }

      setClientPaiement(selectedClient);
      setShowPaiementScreen(true);
    }}
    style={{
      backgroundColor: "#1e40af",
      padding: 10,
      marginTop: 10,
      borderRadius: 6,
    }}
  >
    <Text style={{ color: "#fff", textAlign: "center" }}>
      Consulter situation paiement
    </Text>
  </TouchableOpacity>
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

  {/* MODAL 
      <Modal visible={showPaiementModal} animationType="slide">
        <View style={{ flex: 1, padding: 20 }}>

          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            Situation Paiement
          </Text>

          <FlatList
            data={commandesFiltrees}
            keyExtractor={(i) => i.numCmd?.toString()}
            renderItem={({ item }) => (
              <View
                style={{
                  borderLeftWidth: 5,
                  borderLeftColor: getStatusColor(item),
                  padding: 10,
                  marginVertical: 5,
                  backgroundColor: "#fff",
                }}
              >
                <Text>{item.designation_produit}</Text>
                <Text>Date échéance: {item.Date_echeance}</Text>
              </View>
            )}
          />

          <TouchableOpacity
            onPress={() => setShowPaiementModal(false)}
            style={{ marginTop: 20 }}
          >
            <Text style={{ color: "red", textAlign: "center" }}>
              Fermer
            </Text>
          </TouchableOpacity>

        </View>
      </Modal> */}


      
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
});