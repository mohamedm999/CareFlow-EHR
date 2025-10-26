# 📊 Quick Reference - Patient Analytics API

## 🚀 Nouvelles Routes Ajoutées

### 1️⃣ Statistiques Globales
```http
GET /api/patients/stats/overview
Authorization: Bearer {token}
```
**Retourne:** Total patients, allergies communes, conditions fréquentes, stats assurance

---

### 2️⃣ Groupement par Groupe Sanguin
```http
GET /api/patients/analytics/by-blood-type
Authorization: Bearer {token}
```
**Retourne:** Patients groupés par O+, A+, B+, AB+, O-, A-, B-, AB-

---

### 3️⃣ Analyse des Allergies
```http
GET /api/patients/analytics/allergies
Authorization: Bearer {token}
```
**Retourne:** Allergies par sévérité (mild, moderate, severe)

---

### 4️⃣ Tendances Médicales
```http
GET /api/patients/analytics/conditions?status=active
Authorization: Bearer {token}
```
**Query Params:**
- `status`: `active` | `chronic` | `resolved`

**Retourne:** Top 20 des conditions médicales avec durée moyenne

---

### 5️⃣ Démographie
```http
GET /api/patients/analytics/demographics
Authorization: Bearer {token}
```
**Retourne:** Tranches d'âge, distribution par genre, couverture assurance

---

### 6️⃣ Patients à Risque
```http
GET /api/patients/analytics/at-risk
Authorization: Bearer {token}
```
**Retourne:** Patients avec score de risque élevé (allergies sévères + conditions chroniques)

---

## 🔑 Permissions Requises

| Endpoint | Permission | Rôles |
|----------|------------|-------|
| `/stats/overview` | `view_patients` | admin, secretary, doctor, nurse |
| `/analytics/by-blood-type` | `view_patients` | admin, secretary, doctor, nurse |
| `/analytics/allergies` | `manage_medical_records` | admin, doctor |
| `/analytics/conditions` | `manage_medical_records` | admin, doctor |
| `/analytics/demographics` | `view_patients` | admin, secretary |
| `/analytics/at-risk` | `manage_medical_records` | admin, doctor |

---

## 📝 Exemples de Réponse

### Stats Overview
```json
{
  "success": true,
  "stats": {
    "totalPatients": 150,
    "byBloodType": [{"_id": "O+", "count": 45}],
    "patientsWithAllergies": 67,
    "commonAllergies": [
      {"_id": "Penicillin", "count": 15, "severeCases": 3}
    ]
  }
}
```

### Patients at Risk
```json
{
  "success": true,
  "atRiskPatients": [
    {
      "name": "John Doe",
      "riskScore": 13,
      "severeAllergiesCount": 2,
      "chronicConditionsCount": 3
    }
  ],
  "totalAtRisk": 8
}
```

---

## 🎨 Calcul du Risk Score

```
riskScore = (severeAllergies × 3) + (chronicConditions × 2) + activeConditions
```

**Exemple:**
- 2 allergies sévères = 6 points
- 3 conditions chroniques = 6 points
- 1 condition active = 1 point
- **Total = 13 points** ⚠️ HAUT RISQUE

---

## 🧪 Tester avec Postman

1. **Importer** `CareFlow-EHR-Complete.postman_collection.json`
2. **Login** en tant que Doctor/Admin
3. **Naviguer** vers "📊 Patients - Analytics & Statistics"
4. **Exécuter** les 6 requêtes
5. **Vérifier** les tests automatiques ✅

---

## ⚡ Quick Commands

### Démarrer le serveur
```bash
npm start
```

### Tester une route
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/patients/stats/overview
```

### Voir les logs
```bash
tail -f logs/app.log
```

---

## 🐛 Troubleshooting

**403 Forbidden?**
- Vérifiez que votre token est valide
- Vérifiez que votre rôle a les permissions requises

**Empty results?**
- Assurez-vous d'avoir créé des patients avec données
- Vérifiez que les allergies/conditions sont ajoutées

**500 Error?**
- Vérifiez les logs: `logs/app.log`
- Vérifiez la connexion MongoDB

---

## 📚 Documentation Complète

- 📄 **Guide détaillé:** `PATIENT_ANALYTICS_FEATURES.md`
- 📝 **Changelog:** `CHANGELOG_PATIENT_ANALYTICS.md`
- 🧪 **Collection Postman:** `src/postman/CareFlow-EHR-Complete.postman_collection.json`

---

**Version:** 1.1.0 | **Date:** 23 Oct 2025 | **Status:** ✅ Production Ready
