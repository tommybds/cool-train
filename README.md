# Train Simulator 🚂

Un simulateur de train en 3D créé avec React, Three.js et React Three Fiber.

## 🌟 Fonctionnalités

- Train 3D interactif avec vue détaillée
- Contrôles intuitifs du train
- Changement de vue caméra (cockpit/troisième personne)
- Environnement 3D avec rails, traverses, ciel et terrain
- Effets visuels (ombres, brouillard)

## 🛠️ Technologies utilisées

- React
- TypeScript
- Three.js
- React Three Fiber
- React Three Drei
- Vite

## 🚀 Installation

1. Clonez le repository
```bash
git clone https://github.com/tommybds/train-simulator.git
```

2. Installez les dépendances
```bash
cd train-simulator
npm install
```

3. Lancez l'application en mode développement
```bash
npm run dev
```

## 🎮 Contrôles

- **W** ou **↑** : Avancer
- **S** ou **↓** : Reculer
- **C** : Changer de vue (cockpit/troisième personne)
- **Souris** : 
  - Déplacer pour faire pivoter la caméra
  - Molette pour zoomer/dézoomer

## 📁 Structure du projet

```
src/
  ├── components/        # Composants React
  │   ├── Train.tsx     # Modèle du train
  │   └── Track.tsx     # Rails et terrain
  ├── hooks/            # Hooks personnalisés
  └── types/            # Définitions TypeScript
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📝 License

MIT License - voir le fichier [LICENSE.md](LICENSE.md) pour plus de détails.

## 🙋‍♂️ Auteur

Tommy Bordas - [tommy-bordas.fr](https://tommy-bordas.fr)
