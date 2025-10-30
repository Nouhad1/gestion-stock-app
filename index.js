// Tout d'abord, import nécessaire pour Reanimated (obligatoire)
import 'react-native-reanimated';
import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';
import App from './App';

// Enregistrement du composant principal
registerRootComponent(App);
