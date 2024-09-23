# 🎤 Prompteur Vocal TypeScript

Prompteur vocal intelligent avec interface Apple Music, développé en **TypeScript moderne** avec **Vite** pour un workflow de développement optimal.

## ⚡ Démarrage rapide

```bash
# Installation des dépendances
npm install

# Lancement en mode développement
npm run dev

# Build pour production
npm run build

# Prévisualisation du build
npm run preview
```

## 🛠️ Stack technique

- **TypeScript 5.0+** - Typage statique et développement moderne
- **Vite 4.0+** - Build tool ultra-rapide avec HMR
- **Vanilla JS/TS** - Pas de framework, performance maximale
- **Web Speech API** - Reconnaissance vocale native du navigateur
- **CSS modernes** - Variables CSS, Grid, Flexbox
- **ESLint + Prettier** - Code quality et formatage

## 🏗️ Architecture

```
src/
├── components/
│   └── VocalPrompter.ts    # Composant principal
├── services/
│   ├── VoskService.ts      # Service de reconnaissance vocale
│   └── SpeechRecognitionService.ts
├── types/
│   └── index.ts            # Définitions TypeScript
├── utils/
│   ├── textUtils.ts        # Utilitaires texte
│   └── domUtils.ts         # Utilitaires DOM
├── style.css               # Styles globaux
└── main.ts                 # Point d'entrée
```

## ✨ Fonctionnalités

### Corrections apportées vs version HTML :

- **🔄 Défilement réactif** : Seuil réduit à 50% pour passage ligne suivante
- **⚡ Traitement plus fréquent** : 50ms au lieu de 100ms pour plus de fluidité
- **🎯 Meilleure détection** : Seuil de similarité abaissé à 60%
- **📱 Interface responsive** : Adaptée mobile et desktop
- **🔒 TypeScript strict** : Typage complet pour éviter les erreurs
- **🚀 Architecture modulaire** : Code organisé et maintenable

### Interface Apple Music :

- **🎨 Thème bleu moderne** : Design cohérent avec Apple
- **✨ Animations fluides** : Transitions et highlights
- **💫 Effets visuels** : Blur, ombres, pulsations
- **📊 Status temps réel** : Feedback visuel constant

### Reconnaissance vocale :

- **🎙️ Web Speech API** : Reconnaissance native française
- **🔄 Fallback intelligent** : Mode simulation si API indisponible
- **🎚️ Configuration avancée** : Seuils ajustables
- **⚡ Traitement temps réel** : Highlight instantané des mots

## 🎮 Utilisation

### Raccourcis clavier

- **Ctrl + Espace** : Démarrer/Arrêter reconnaissance
- **Échap** : Arrêter reconnaissance
- **Ctrl + R** : Reset du prompteur

### Workflow recommandé

1. **Saisir/coller votre texte** dans la zone de texte
2. **Cliquer "Charger le texte"**
3. **Cliquer "Démarrer"** et autoriser le microphone
4. **Parler clairement** - les mots s'illuminent en temps réel !

## 🔧 Scripts disponibles

```bash
# Développement avec hot reload
npm run dev

# Build optimisé pour production
npm run build

# Prévisualisation du build
npm run preview

# Vérification TypeScript
npm run type-check

# Linting du code
npm run lint

# Formatage automatique
npm run format
```

## 🌐 Déploiement

### Build de production

```bash
npm run build
```

Le dossier `dist/` contient les fichiers optimisés prêts pour le déploiement.

### Hébergement statique

Compatible avec tous les hébergeurs statiques :
- **Vercel** : `vercel --prod`
- **Netlify** : Deploy du dossier `dist/`
- **GitHub Pages** : Upload du contenu de `dist/`
- **Any static host** : Servir les fichiers de `dist/`

## 🔧 Configuration

### Ajustement des seuils (dans `VocalPrompter.ts`)

```typescript
private config: PrompterConfig = {
  confidenceThreshold: 0.3,    // Confiance minimum reconnaissance
  wordMatchThreshold: 0.6,     // Similarité ligne pour déclenchement
  completionThreshold: 0.5,    // % mots prononcés pour ligne suivante
  scrollBehavior: 'smooth'     // Comportement de scroll
};
```

### Personnalisation des couleurs (dans `style.css`)

```css
:root {
  --accent-primary: #007aff;     /* Bleu principal */
  --highlight-word: #5ac8fa;     /* Highlight mots */
  --bg-primary: #000000;        /* Arrière-plan */
}
```

## 🐛 Debug et développement

### Mode debug

L'instance du prompteur est exposée globalement :

```javascript
// Dans la console du navigateur
window.prompter.config.wordMatchThreshold = 0.4; // Ajuster seuils
```

### Logs utiles

```typescript
console.log('Texte reconnu:', recognizedText);
console.log('Similarité ligne:', similarity);
console.log('Completion ratio:', completionRatio);
```

## 📱 Compatibilité

| Navigateur | Support | Note |
|------------|---------|------|
| Chrome 60+ | ✅ Excellent | Recommandé |
| Edge 79+ | ✅ Bon | Web Speech API |
| Firefox | ⚠️ Limité | Reconnaissance limitée |
| Safari | ❌ Non | Pas de Web Speech API |

## 🔍 Troubleshooting

### Reconnaissance ne fonctionne pas
- Vérifier l'autorisation microphone
- Utiliser HTTPS ou localhost
- Tester dans Chrome

### Défilement trop lent/rapide
- Ajuster `completionThreshold` (0.3-0.7)
- Modifier `wordMatchThreshold` (0.4-0.8)

### Performance lente
- `npm run build` pour version optimisée
- Vérifier la console pour erreurs

---

**🎉 Développement moderne avec TypeScript + Vite pour un prompteur vocal performant !**