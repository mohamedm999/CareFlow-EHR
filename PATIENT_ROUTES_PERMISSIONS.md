# 🔐 Patient Routes - Permissions Mapping

## Permissions Utilisées (Existantes)

Toutes les routes Patient utilisent **VOS permissions existantes** définies dans `seedRolesPermissions.js`:

### **Patient Records Category**
- ✅ `create_patient_records` - Créer des dossiers patients
- ✅ `view_all_patients` - Voir tous les patients
- ✅ `view_assigned_patients` - Voir les patients assignés
- ✅ `edit_medical_history` - Modifier l'historique médical
- ✅ `view_own_record` - Voir son propre dossier

---

## 📋 Routes et Permissions Requises

### **CRUD Operations**

| Route | Method | Permission | Rôles Autorisés |
|-------|--------|------------|-----------------|
| `/api/patients` | POST | `create_patient_records` | admin, nurse, secretary |
| `/api/patients` | GET | `view_all_patients` | admin, doctor |
| `/api/patients/:id` | GET | `view_assigned_patients` | admin, doctor, nurse, secretary |
| `/api/patients/:id` | PUT | `view_assigned_patients` | admin, doctor, nurse, secretary |
| `/api/patients/:id/allergies` | POST | `edit_medical_history` | admin, doctor, nurse |
| `/api/patients/:id/medical-history` | POST | `edit_medical_history` | admin, doctor, nurse |

### **Analytics Endpoints**

| Route | Method | Permission | Rôles Autorisés |
|-------|--------|------------|-----------------|
| `/api/patients/stats/overview` | GET | `view_all_patients` | admin, doctor |
| `/api/patients/analytics/by-blood-type` | GET | `view_all_patients` | admin, doctor |
| `/api/patients/analytics/allergies` | GET | `edit_medical_history` | admin, doctor, nurse |
| `/api/patients/analytics/conditions` | GET | `edit_medical_history` | admin, doctor, nurse |
| `/api/patients/analytics/demographics` | GET | `view_all_patients` | admin, doctor |
| `/api/patients/analytics/at-risk` | GET | `edit_medical_history` | admin, doctor, nurse |

---

## 👥 Permissions par Rôle

### **👨‍⚕️ Doctor (Médecin)**
```javascript
Permissions:
  ✅ view_assigned_patients
  ✅ view_all_patients
  ✅ edit_medical_history
  ✅ view_own_record

Peut faire:
  ✅ Voir tous les patients
  ✅ Voir les détails d'un patient
  ✅ Modifier un patient
  ✅ Ajouter allergies
  ✅ Ajouter historique médical
  ✅ Voir toutes les analytics
  
Ne peut PAS:
  ❌ Créer un nouveau dossier patient (réservé à secretary/nurse)
```

### **👩‍⚕️ Nurse (Infirmier/ère)**
```javascript
Permissions:
  ✅ create_patient_records
  ✅ view_assigned_patients
  ✅ edit_medical_history
  ✅ view_own_record

Peut faire:
  ✅ Créer un dossier patient
  ✅ Voir les patients assignés
  ✅ Modifier un patient
  ✅ Ajouter allergies
  ✅ Ajouter historique médical
  ✅ Voir analytics (allergies, conditions, at-risk)
  
Ne peut PAS:
  ❌ Voir TOUS les patients (seulement assignés)
  ❌ Voir stats globales
```

### **📋 Secretary (Secrétaire)**
```javascript
Permissions:
  ✅ create_patient_records
  ✅ view_assigned_patients
  ✅ view_own_record

Peut faire:
  ✅ Créer un dossier patient
  ✅ Voir les patients assignés
  ✅ Modifier informations de base
  
Ne peut PAS:
  ❌ Ajouter allergies
  ❌ Ajouter historique médical
  ❌ Voir analytics
```

### **👤 Patient**
```javascript
Permissions:
  ✅ view_own_record

Peut faire:
  ✅ Voir son propre dossier uniquement
  ✅ Modifier certains champs (emergency contact, consents)
  
Ne peut PAS:
  ❌ Voir autres patients
  ❌ Modifier données médicales
  ❌ Accéder aux analytics
```

### **🔧 Admin**
```javascript
Permissions:
  ✅ TOUTES les permissions

Peut faire:
  ✅ Tout
```

---

## 🧪 Tests avec Postman

### **1. En tant que Doctor**

```http
# Login
POST /api/auth/login
{
  "email": "doctor@example.com",
  "password": "Password123"
}

# Voir tous les patients ✅
GET /api/patients
Authorization: Bearer {token}

# Voir un patient ✅
GET /api/patients/{patientId}
Authorization: Bearer {token}

# Créer un patient ❌ (403 - Permission denied)
POST /api/patients
Authorization: Bearer {token}
```

### **2. En tant que Nurse**

```http
# Créer un patient ✅
POST /api/patients
Authorization: Bearer {token}
{
  "userId": "...",
  "bloodType": "O+"
}

# Ajouter allergie ✅
POST /api/patients/{id}/allergies
Authorization: Bearer {token}
{
  "allergen": "Penicillin",
  "severity": "severe"
}

# Voir stats globales ❌ (403 - Permission denied)
GET /api/patients/stats/overview
Authorization: Bearer {token}
```

### **3. En tant que Secretary**

```http
# Créer un patient ✅
POST /api/patients
Authorization: Bearer {token}

# Ajouter allergie ❌ (403 - Permission denied)
POST /api/patients/{id}/allergies
Authorization: Bearer {token}

# Voir analytics ❌ (403 - Permission denied)
GET /api/patients/analytics/allergies
Authorization: Bearer {token}
```

---

## 🔍 Différences entre `view_all_patients` et `view_assigned_patients`

### **`view_all_patients`**
- Utilisé pour: Listes complètes, statistiques globales
- Routes: `GET /api/patients`, analytics overview
- Rôles: admin, doctor

### **`view_assigned_patients`**
- Utilisé pour: Voir détails d'un patient spécifique
- Routes: `GET /api/patients/:id`, `PUT /api/patients/:id`
- Rôles: admin, doctor, nurse, secretary
- Note: Le controller vérifie aussi que le patient peut voir uniquement son propre dossier

---

## 🚨 Messages d'Erreur Communs

### **403 - Access denied - missing permission**
```json
{
  "message": "Access denied - missing permission: view_all_patients"
}
```
**Solution:** Vérifier que votre rôle a la permission requise dans `seedRolesPermissions.js`

### **403 - Not authorized**
```json
{
  "success": false,
  "message": "Not authorized"
}
```
**Solution:** Vérification additionnelle dans le controller (ex: secretary qui tente d'ajouter une allergie)

### **401 - Invalid or expired token**
```json
{
  "message": "Invalid or expired token"
}
```
**Solution:** Reconnecter avec `POST /api/auth/login`

---

## 📝 Notes Importantes

1. **Middleware Check Order:**
   ```javascript
   router.get('/:id',
     authenticateToken,           // 1. Vérifie le JWT
     checkPermission('...'),      // 2. Vérifie la permission
     controller.getPatient        // 3. Logique métier
   );
   ```

2. **Permissions vs Rôles:**
   - Les **permissions** sont granulaires (view_all_patients, edit_medical_history)
   - Les **rôles** regroupent des permissions (doctor a plusieurs permissions)
   - Le middleware `checkPermission` vérifie les permissions, pas les rôles

3. **Patient Self-Access:**
   - Les patients utilisent `view_own_record` mais le controller fait une vérification supplémentaire
   - `patient.user._id === req.user.userId` pour s'assurer qu'ils voient uniquement leur dossier

---

## ✅ Checklist de Vérification

Quand vous testez une route et recevez "Permission denied":

- [ ] Êtes-vous connecté avec le bon rôle?
- [ ] Le rôle a-t-il la permission dans `seedRolesPermissions.js`?
- [ ] La route utilise-t-elle la bonne permission dans `patient.routes.js`?
- [ ] Le serveur a-t-il été redémarré après modification des permissions?
- [ ] Le token JWT est-il valide et non expiré?

---

**Dernière mise à jour:** 23 Octobre 2025  
**Version:** 1.0.0  
**Status:** ✅ Utilise vos permissions existantes - Aucune nouvelle permission créée
