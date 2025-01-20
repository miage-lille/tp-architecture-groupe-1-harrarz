[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QoONpvee)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=17704430&assignment_repo_type=AssignmentRepo)
# TP ARCHITECTURE

## Présentation du contexte

Vous développez une application de gestion de webinaires en suivant les concepts de l'architecture Ports / Adapters.

Un `use-case` est déjà implémenté : organiser un webinaire.

Vos collègues ont déjà préparé le terrain pour la suite, mais c'est maintenant à vous de prendre le relais pour développer une autre fonctionnalité : réserver sa place dans un webinaire.

## Présentation de l'architecture

```
📦src
 ┣ 📂core
 ┃ ┣ 📂adapters
 ┃ ┃ ┣ 📜fixed-date-generator.ts
 ┃ ┃ ┣ 📜fixed-id-generator.ts
 ┃ ┃ ┣ 📜in-memory-mailer.ts
 ┃ ┃ ┣ 📜real-date-generator.ts
 ┃ ┃ ┗ 📜real-id-generator.ts
 ┃ ┗ 📂ports
 ┃ ┃ ┣ 📜date-generator.interface.ts
 ┃ ┃ ┣ 📜id-generator.interface.ts
 ┃ ┃ ┗ 📜mailer.interface.ts
 ┣ 📂shared
 ┃ ┣ 📜entity.ts
 ┃ ┗ 📜executable.ts
 ┣ 📂users
 ┃ ┣ 📂adapters
 ┃ ┣ 📂entities
 ┃ ┃ ┗ 📜user.entity.ts
 ┃ ┗ 📂ports
 ┃ ┃ ┗ 📜user-repository.interface.ts
 ┣ 📂webinars
 ┃ ┣ 📂adapters
 ┃ ┃ ┗ 📜webinar-repository.in-memory.ts
 ┃ ┣ 📂entities
 ┃ ┃ ┗ 📜webinar.entity.ts
 ┃ ┣ 📂exceptions
 ┃ ┃ ┣ 📜webinar-dates-too-soon.ts
 ┃ ┃ ┣ 📜webinar-not-enough-seats.ts
 ┃ ┃ ┗ 📜webinar-too-many-seats.ts
 ┃ ┣ 📂ports
 ┃ ┃ ┗ 📜webinar-repository.interface.ts
 ┃ ┗ 📂use-cases
 ┃ ┃ ┣ 📜organize-webinar.test.ts
 ┃ ┃ ┗ 📜organize-webinar.ts
```

Nous retrouvons plusieurs dossier :

- `core` module pour la définition / implémentation de services techniques
- `shared` qui sont des classes utilitaires
- `users` et `webinars` qui sont nos modules business.

Chaque module va comporter obligatoirement :

- un dossier `ports` pour définir les interfaces
- un dossier `adapters` pour implémenter ces interfaces

Et éventuellement :

- un dossier `entities` qui sont nos entitées métiers avec les règles de gestion si nécessaire
- un dossier `use-cases` reprenant les fonctionnalités de notre application, ainsi que les tests unitaires assosciés
- ...

## Objectifs

Vous êtes missionés pour réaliser un use-case : **réserver sa place**.

Cette fonctionnalité comportera **2 règles métier** importantes :

- vérifier le nombre de participants restants
- vérifier que l'on ne participe pas déjà à ce webinaire

Elle aura également **1 side-effect** : envoyer un email à l'organisateur pour mentioner qu'un nouveau participant s'est inscrit.

Pour vérifier votre travail, un test unitaire du use-case devra être réalisé.

Un modèle est déjà présent pour l'organisation de webinaires...

Vos collègues vous ont préparé le terrain avec la structure du use-case attendu (`book-seat`) et quelques interfaces pour vous guider (user / participation)...

_À vous d'implémenter tout ça à l'image de ce qui a déjà été réalisé !_

## Astuces

La commande `npm run test:watch` pour lancer vos tests en watch mode.
