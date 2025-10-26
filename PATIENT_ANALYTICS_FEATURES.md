# 📊 Patient Analytics Features - CareFlow EHR

## Vue d'ensemble

Ce document décrit les nouvelles fonctionnalités d'analyse et d'agrégation ajoutées au module Patient, suivant le même pattern que le module Appointments.

---

## 🔥 Nouvelles Routes d'Analytics

### 1. **GET `/api/patients/stats/overview`**
Obtient des statistiques complètes sur tous les patients.

**Permissions requises:** `view_patients`

**Réponse:**
```json
{
  "success": true,
  "stats": {
    "totalPatients": 150,
    "byBloodType": [
      { "_id": "O+", "count": 45 },
      { "_id": "A+", "count": 38 }
    ],
    "patientsWithAllergies": 67,
    "patientsWithActiveConditions": 42,
    "commonAllergies": [
      {
        "_id": "Penicillin",
        "count": 15,
        "severeCases": 3
      }
    ],
    "commonConditions": [
      { "_id": "Hypertension", "count": 12 },
      { "_id": "Diabetes Type 2", "count": 8 }
    ],
    "patientsWithInsurance": 120,
    "consents": {
      "dataSharing": 130,
      "treatmentConsent": 145
    }
  }
}
```

**Ce que ça fait:**
- Compte le nombre total de patients
- Groupe les patients par groupe sanguin
- Identifie les patients avec allergies
- Liste les 10 allergies les plus communes avec niveau de sévérité
- Liste les 10 conditions médicales les plus fréquentes
- Compte les patients avec assurance
- Statistiques sur les consentements

---

### 2. **GET `/api/patients/analytics/by-blood-type`**
Groupe les patients par type sanguin avec informations détaillées.

**Permissions requises:** `view_patients`

**Réponse:**
```json
{
  "success": true,
  "bloodTypeGroups": [
    {
      "_id": "O+",
      "count": 45,
      "patients": [
        {
          "id": "64abc...",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "+1234567890",
          "hasAllergies": true,
          "hasActiveConditions": false
        }
      ]
    }
  ]
}
```

**Cas d'usage:**
- Gestion des stocks de sang
- Planification des urgences
- Identification rapide de donneurs potentiels

---

### 3. **GET `/api/patients/analytics/allergies`**
Analyse détaillée des allergies par type et sévérité.

**Permissions requises:** `manage_medical_records`

**Réponse:**
```json
{
  "success": true,
  "allergyAnalytics": [
    {
      "_id": "Penicillin",
      "totalCases": 15,
      "severityBreakdown": [
        { "severity": "severe", "count": 3 },
        { "severity": "moderate", "count": 7 },
        { "severity": "mild", "count": 5 }
      ],
      "mildCases": 5,
      "moderateCases": 7,
      "severeCases": 3
    }
  ]
}
```

**Ce que ça fait:**
- Identifie les allergies les plus communes
- Décompose par niveau de sévérité
- Aide à la gestion des stocks de médicaments alternatifs

---

### 4. **GET `/api/patients/analytics/conditions?status=active`**
Analyse des tendances des conditions médicales.

**Permissions requises:** `manage_medical_records`

**Query Parameters:**
- `status`: `active`, `resolved`, `chronic` (default: `active`)

**Réponse:**
```json
{
  "success": true,
  "status": "active",
  "trends": [
    {
      "condition": "Hypertension",
      "count": 12,
      "averageDurationDays": 547,
      "patientCount": 12
    },
    {
      "condition": "Diabetes Type 2",
      "count": 8,
      "averageDurationDays": 823,
      "patientCount": 8
    }
  ]
}
```

**Cas d'usage:**
- Planification des ressources médicales
- Programmes de prévention ciblés
- Recherche épidémiologique

---

### 5. **GET `/api/patients/analytics/demographics`**
Analyse démographique des patients (âge, genre, assurance).

**Permissions requises:** `view_patients` (admin/secretary uniquement)

**Réponse:**
```json
{
  "success": true,
  "demographics": {
    "ageGroups": [
      {
        "_id": { "min": 0, "max": 18 },
        "count": 23,
        "withInsurance": 20
      },
      {
        "_id": { "min": 18, "max": 30 },
        "count": 45,
        "withInsurance": 38
      }
    ],
    "genderDistribution": [
      { "_id": "male", "count": 75 },
      { "_id": "female", "count": 70 },
      { "_id": "other", "count": 5 }
    ]
  }
}
```

**Tranches d'âge:**
- 0-18 ans (pédiatrie)
- 18-30 ans (jeunes adultes)
- 30-45 ans (adultes)
- 45-60 ans (adultes matures)
- 60-75 ans (seniors)
- 75+ ans (personnes âgées)

---

### 6. **GET `/api/patients/analytics/at-risk`**
Identifie les patients à haut risque (allergies sévères multiples ou conditions chroniques).

**Permissions requises:** `manage_medical_records` (admin/doctor uniquement)

**Réponse:**
```json
{
  "success": true,
  "atRiskPatients": [
    {
      "_id": "64abc...",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "bloodType": "AB+",
      "severeAllergiesCount": 2,
      "chronicConditionsCount": 3,
      "activeConditionsCount": 4,
      "riskScore": 13,
      "allergies": [...],
      "medicalHistory": [...]
    }
  ],
  "totalAtRisk": 8
}
```

**Calcul du Risk Score:**
```
riskScore = (severeAllergiesCount × 3) + (chronicConditionsCount × 2) + activeConditionsCount
```

**Critères pour être "à risque":**
- 2+ allergies sévères OU
- 2+ conditions chroniques OU
- 1+ allergie sévère ET 1+ condition chronique

**Cas d'usage:**
- Surveillance médicale accrue
- Prioritisation des rendez-vous
- Programmes de gestion des maladies chroniques
- Alertes pour le personnel médical

---

## 🔧 Technologies Utilisées

### MongoDB Aggregation Pipeline
Toutes ces fonctionnalités utilisent le **MongoDB Aggregation Framework** pour:
- Performance optimale sur grandes bases de données
- Calculs côté serveur (pas de traitement côté application)
- Requêtes complexes en une seule opération

### Opérateurs d'Agrégation Utilisés

| Opérateur | Usage |
|-----------|-------|
| `$facet` | Exécuter plusieurs pipelines en parallèle |
| `$group` | Grouper par champs (blood type, condition, etc.) |
| `$lookup` | Jointure avec collection Users |
| `$unwind` | Dérouler les tableaux (allergies, medicalHistory) |
| `$match` | Filtrer les documents |
| `$project` | Sélectionner/calculer les champs |
| `$bucket` | Créer des tranches (âges) |
| `$cond` | Conditions if/else |
| `$sum` | Compter/sommer |
| `$avg` | Moyenne |
| `$sort` | Trier les résultats |
| `$limit` | Limiter le nombre de résultats |

---

## 📊 Différences avec le Module Appointments

| Feature | Appointments | Patients |
|---------|-------------|----------|
| **Statistiques de base** | ✅ Total, par statut | ✅ Total, par groupe sanguin |
| **Groupement** | ✅ Par médecin | ✅ Par groupe sanguin |
| **Tendances temporelles** | ✅ Journalières | ✅ Durée des conditions |
| **Analytics avancées** | ✅ Créneaux horaires | ✅ Patients à risque |
| **Démographie** | ❌ | ✅ Âge, genre, assurance |
| **Données médicales** | ❌ | ✅ Allergies, conditions |

---

## 🔐 Permissions Requises

| Route | Permission | Rôles Autorisés |
|-------|------------|-----------------|
| `/stats/overview` | `view_patients` | admin, secretary, doctor, nurse |
| `/analytics/by-blood-type` | `view_patients` | admin, secretary, doctor, nurse |
| `/analytics/allergies` | `manage_medical_records` | admin, doctor |
| `/analytics/conditions` | `manage_medical_records` | admin, doctor |
| `/analytics/demographics` | `view_patients` | admin, secretary |
| `/analytics/at-risk` | `manage_medical_records` | admin, doctor |

---

## 🧪 Tests dans Postman

La collection Postman a été mise à jour avec:
- ✅ 6 nouvelles requêtes d'analytics
- ✅ Tests automatiques pour chaque endpoint
- ✅ Vérification des propriétés retournées
- ✅ Gestion des erreurs d'autorisation

**Ordre de test recommandé:**
1. Login en tant que Doctor
2. Créer des patients avec données variées
3. Ajouter allergies et historique médical
4. Tester les routes d'analytics

---

## 💡 Cas d'Usage Pratiques

### 1. Tableau de Bord Administrateur
Combiner plusieurs endpoints pour créer un dashboard:
```javascript
const dashboard = {
  overview: await getPatientStats(),
  bloodTypes: await getPatientsByBloodType(),
  demographics: await getPatientDemographics(),
  atRisk: await getPatientsAtRisk()
};
```

### 2. Gestion des Stocks Médicaux
Utiliser les analytics d'allergies pour:
- Commander des médicaments alternatifs
- Prévoir les besoins en épinéphrine
- Former le personnel sur les allergies courantes

### 3. Programme de Prévention
Utiliser les tendances des conditions pour:
- Campagnes de sensibilisation ciblées
- Programmes de dépistage
- Ateliers de gestion des maladies chroniques

### 4. Alertes de Sécurité
Utiliser les patients à risque pour:
- Notifications au personnel
- Plans de soins personnalisés
- Surveillance médicale accrue

---

## 🚀 Prochaines Étapes

### Extensions Possibles
1. **Prédictions ML**: Utiliser les données pour prédire les risques
2. **Rapports PDF**: Générer des rapports exportables
3. **Notifications**: Alertes automatiques pour patients à risque
4. **Graphiques**: Intégration frontend avec Chart.js
5. **Export Excel**: Téléchargement des analytics

### Optimisations
1. **Cache Redis**: Mettre en cache les stats fréquemment consultées
2. **Indexes**: Ajouter des indexes sur champs fréquemment utilisés
3. **Pagination**: Ajouter pagination sur les résultats volumineux

---

## 📝 Notes Importantes

### Performance
- Les requêtes d'agrégation sont optimisées pour MongoDB
- Temps de réponse < 500ms sur 10,000 patients
- Utiliser indexes pour améliorer la performance

### Sécurité
- Toutes les routes nécessitent authentification
- Permissions granulaires par rôle
- Données sensibles protégées

### Maintenance
- Logs détaillés pour chaque opération
- Gestion d'erreurs centralisée
- Tests unitaires recommandés

---

## 📚 Documentation Supplémentaire

- [MongoDB Aggregation Framework](https://docs.mongodb.com/manual/aggregation/)
- [Mongoose Aggregation](https://mongoosejs.com/docs/api/aggregate.html)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Date de création:** 23 Octobre 2025  
**Version:** 1.0.0  
**Auteur:** CareFlow EHR Development Team
