import React, { createContext, useContext, useState, useEffect } from 'react';

// Définition des thèmes clair et sombre avec toutes les couleurs nécessaires pour React Navigation
const themes = {
  light: {
    mode: 'light',
    background: '#ffffff',
    text: '#000000',
    card: '#f9f9f9',
    header: '#1d4ed8',
    border: '#cccccc',
  },
  dark: {
    mode: 'dark',
    background: '#121212',
    text: '#ffffff',
    card: '#1e1e1e',
    header: '#bb86fc',
    border: '#333333',
  },
};

// Création du contexte
const ThemeContext = createContext({
  theme: themes.light,
  toggleTheme: () => {},
});

// Fournisseur du contexte
export const ThemeProvider = ({ children }) => {
  // On initialise avec le thème clair par défaut
  const [theme, setTheme] = useState(themes.light);

  // Fonction pour basculer entre clair et sombre
  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme.mode === 'light' ? themes.dark : themes.light));
  };

  // Optionnel : on peut ajouter ici un useEffect pour stocker la préférence dans AsyncStorage
  // ou détecter le thème système via Appearance API (react-native)

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personnalisé pour utiliser le thème dans les composants
export const useTheme = () => useContext(ThemeContext);
