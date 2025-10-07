import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

useEffect(() => {
  const fetchEmployes = async () => {
      try {
    axios.get(`https://gestion-stock-app-production.up.railway.app/api/employes`)
      setEmployes(res.data);
      } catch (err) {
        console.error('❌ Erreur API Employes:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployes();
  }, []);

const LoginScreen = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [remember, setRemember] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedLogin = await AsyncStorage.getItem('savedLogin');
        const savedPassword = await AsyncStorage.getItem('savedPassword');
        if (savedLogin && savedPassword) {
          setLogin(savedLogin);
          setPassword(savedPassword);
          setRemember(true);
        }
      } catch (e) {
        console.log('Erreur lors du chargement des identifiants', e);
      }
    };
    loadSavedCredentials();
  }, []);

  const startShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!login || !password) {
      setErrorMsg('Veuillez saisir votre login et votre mot de passe.');
      startShake();
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post(
        `https://gestion-stock-app-production.up.railway.app/api/login`, // <-- utilisation de l'URL centralisée
        { login, mot_de_passe: password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        if (response.data.user) {
          await AsyncStorage.setItem('userToken', JSON.stringify(response.data.user));

          if (remember) {
            await AsyncStorage.setItem('savedLogin', login);
            await AsyncStorage.setItem('savedPassword', password);
          } else {
            await AsyncStorage.removeItem('savedLogin');
            await AsyncStorage.removeItem('savedPassword');
          }

          Alert.alert('Succès', response.data.message);
          navigation.replace('Main');
        } else {
          setErrorMsg('Utilisateur non retourné par le serveur.');
          startShake();
        }
      } else {
        setErrorMsg(response.data.message || 'Échec de l’authentification.');
        startShake();
      }
    } catch (error) {
      if (error.response) {
        setErrorMsg(error.response.data.message || 'Erreur serveur.');
      } else if (error.request) {
        setErrorMsg('Le serveur est injoignable.');
      } else {
        setErrorMsg('Une erreur inconnue est survenue.');
      }
      startShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
        <View style={styles.logoContainer}>
          <FontAwesome5 name="cube" size={28} color="#2563eb" />
        </View>
        <Text style={styles.title}>Bluestrek</Text>
        <Text style={styles.subtitle}>Connexion à votre compte</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <View style={[styles.inputGroup, styles.inputFocus]}>
              <Ionicons name="person-outline" size={20} color="#63676eff" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Votre identifiant"
                value={login}
                onChangeText={setLogin}
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputGroup, styles.inputFocus]}>
              <Ionicons name="lock-closed-outline" size={20} color="#63676eff" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Votre mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secure}
              />
              <TouchableOpacity onPress={() => setSecure(!secure)}>
                <Ionicons name={secure ? 'eye-off' : 'eye'} size={20} color="#63676eff" />
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={styles.checkboxContainer} onPress={() => setRemember(!remember)}>
                <Ionicons name={remember ? 'checkbox' : 'square-outline'} size={20} color={remember ? '#2563eb' : '#6b7280'} />
                <Text style={styles.remember}>Se souvenir de moi</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.forgot}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleLogin} disabled={loading} style={{ borderRadius: 12, overflow: 'hidden' }}>
              <LinearGradient
                colors={['#2563eb', '#1e40af']}
                style={[styles.button, loading && { opacity: 0.7 }]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Se connecter</Text>
                    <FontAwesome5 name="circle-notch" size={16} color="#fff" style={{ marginLeft: 8 }} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {errorMsg ? (
              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <View style={styles.errorBox}>
                  <FontAwesome5 name="exclamation-circle" size={16} color="#b91c1c" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Bluestrek. Tous droits réservés.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { paddingVertical: 25, alignItems: 'center' },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#e0e7ff', marginTop: 2 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
  form: { width: '100%', maxWidth: 380, alignSelf: 'center' },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  inputFocus: {
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  remember: { fontSize: 14, color: '#374151', marginLeft: 6 },
  forgot: { fontSize: 14, color: '#fff', fontWeight: '500' },
  button: { paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', padding: 10, borderRadius: 8, marginTop: 12 },
  errorText: { color: '#b91c1c', fontSize: 14, marginLeft: 8 },
  footer: { borderTopWidth: 1, borderColor: '#e5e7eb', padding: 15, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#6b7280' },
});

export default LoginScreen;
