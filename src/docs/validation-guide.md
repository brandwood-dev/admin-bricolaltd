# Guide de Validation des Formulaires

Ce guide explique comment utiliser le système de validation intégré dans l'interface d'administration.

## Vue d'ensemble

Le système de validation utilise :
- **Zod** pour la définition des schémas de validation
- **Hook personnalisé** `useFormValidation` pour la gestion des erreurs
- **Composants FormField** pour l'affichage automatique des erreurs

## Structure des fichiers

```
src/
├── utils/validation.ts          # Schémas de validation Zod
├── hooks/useFormValidation.ts   # Hook de validation personnalisé
├── components/ui/form-field.tsx # Composants de formulaire avec validation
└── components/examples/         # Exemples d'utilisation
```

## Utilisation de base

### 1. Importer les dépendances

```tsx
import { useFormValidation } from '@/hooks/useFormValidation';
import { userSchema } from '@/utils/validation';
import { InputField, FormErrorSummary } from '@/components/ui/form-field';
```

### 2. Initialiser la validation

```tsx
const {
  errors,
  validateForm,
  validateField,
  clearErrors
} = useFormValidation(userSchema);
```

### 3. Utiliser les composants FormField

```tsx
<InputField
  label="Email"
  name="email"
  type="email"
  value={formData.email}
  onChange={(value) => {
    setFormData(prev => ({ ...prev, email: value }));
    validateField('email', value);
  }}
  error={errors.email}
  required
/>
```

### 4. Valider avant soumission

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const isValid = validateForm(formData);
  if (!isValid) {
    toast({
      title: "Erreurs de validation",
      description: "Veuillez corriger les erreurs.",
      variant: "destructive"
    });
    return;
  }
  
  // Procéder à la soumission
};
```

## Composants disponibles

### InputField

Pour les champs de saisie texte, email, nombre, etc.

```tsx
<InputField
  label="Nom d'utilisateur"
  name="username"
  value={username}
  onChange={setUsername}
  error={errors.username}
  placeholder="Entrez votre nom"
  required
/>
```

### TextareaField

Pour les champs de texte multi-lignes.

```tsx
<TextareaField
  label="Description"
  name="description"
  value={description}
  onChange={setDescription}
  error={errors.description}
  rows={4}
  placeholder="Décrivez..."
/>
```

### SelectField

Pour les listes déroulantes.

```tsx
<SelectField
  label="Rôle"
  name="role"
  value={role}
  onChange={setRole}
  options={[
    { value: 'user', label: 'Utilisateur' },
    { value: 'admin', label: 'Administrateur' }
  ]}
  error={errors.role}
  required
/>
```

### SwitchField

Pour les boutons on/off.

```tsx
<SwitchField
  label="Compte actif"
  name="isActive"
  checked={isActive}
  onChange={setIsActive}
  error={errors.isActive}
  description="Active ou désactive le compte"
/>
```

### FormSection

Pour organiser les champs en sections.

```tsx
<FormSection
  title="Informations personnelles"
  description="Données de base de l'utilisateur"
>
  {/* Champs du formulaire */}
</FormSection>
```

### FormErrorSummary

Pour afficher un résumé des erreurs en haut du formulaire.

```tsx
<FormErrorSummary errors={errors} />
```

## Schémas de validation disponibles

### Utilisateurs
```tsx
import { userSchema } from '@/utils/validation';
```

### Réservations
```tsx
import { bookingSchema } from '@/utils/validation';
```

### Transactions
```tsx
import { transactionSchema } from '@/utils/validation';
```

### Paramètres
```tsx
import { 
  platformSettingsSchema,
  paymentSettingsSchema,
  emailSettingsSchema,
  securitySettingsSchema,
  notificationSettingsSchema
} from '@/utils/validation';
```

## Création de nouveaux schémas

### 1. Définir le schéma dans validation.ts

```tsx
export const monNouveauSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  age: z.number().min(18, 'Doit être majeur')
});
```

### 2. Exporter le type

```tsx
export type MonNouveauFormData = z.infer<typeof monNouveauSchema>;
```

### 3. Utiliser dans un composant

```tsx
const { errors, validateForm } = useFormValidation(monNouveauSchema);
```

## Validation en temps réel

Pour valider les champs pendant la saisie :

```tsx
const handleFieldChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  validateField(field, value); // Validation immédiate
};
```

## Gestion des erreurs personnalisées

Pour ajouter des erreurs manuellement :

```tsx
const { setFieldError, clearFieldError } = useFormValidation(schema);

// Ajouter une erreur
setFieldError('email', 'Cet email existe déjà');

// Supprimer une erreur
clearFieldError('email');
```

## Bonnes pratiques

1. **Validation en temps réel** : Validez les champs pendant la saisie pour une meilleure UX
2. **Messages clairs** : Utilisez des messages d'erreur explicites et en français
3. **Groupement** : Organisez les champs avec `FormSection`
4. **Résumé d'erreurs** : Affichez `FormErrorSummary` en haut des formulaires complexes
5. **Réinitialisation** : N'oubliez pas de `clearErrors()` après soumission réussie

## Exemple complet

Voir `src/components/examples/ValidationExample.tsx` pour un exemple complet d'utilisation.

## Dépannage

### Erreur : "Schema not found"
- Vérifiez que le schéma est bien exporté depuis `validation.ts`
- Vérifiez l'import du schéma

### Erreur : "Field validation not working"
- Assurez-vous d'appeler `validateField` dans `onChange`
- Vérifiez que le nom du champ correspond au schéma

### Erreur : "Validation messages in English"
- Vérifiez que les messages sont définis en français dans le schéma Zod
- Utilisez `.min()`, `.max()`, `.email()` avec des messages personnalisés