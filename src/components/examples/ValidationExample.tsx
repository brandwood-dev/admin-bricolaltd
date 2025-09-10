import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputField, TextareaField, SelectField, SwitchField, FormSection, FormErrorSummary } from '@/components/ui/form-field';
import { useFormValidation } from '@/hooks/useFormValidation';
import { userSchema } from '@/utils/validation';
import { useToast } from '@/hooks/use-toast';
import { Save, RefreshCw } from 'lucide-react';

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  city: string;
  bio: string;
  role: string;
  isActive: boolean;
  emailNotifications: boolean;
}

const ValidationExample: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    city: '',
    bio: '',
    role: 'USER',
    isActive: true,
    emailNotifications: true
  });
  
  // Form validation
  const {
    errors,
    validateForm,
    validateField,
    clearErrors
  } = useFormValidation(userSchema);
  
  // Handle field changes with validation
  const handleFieldChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = validateForm(formData);
    if (!isValid) {
      toast({
        title: "Erreurs de validation",
        description: "Veuillez corriger les erreurs dans le formulaire.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès!",
        variant: "default"
      });
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        city: '',
        bio: '',
        role: 'USER',
        isActive: true,
        emailNotifications: true
      });
      clearErrors();
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle form reset
  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      city: '',
      bio: '',
      role: 'USER',
      isActive: true,
      emailNotifications: true
    });
    clearErrors();
  };
  
  const roleOptions = [
    { value: 'USER', label: 'Utilisateur' },
    { value: 'PROVIDER', label: 'Prestataire' },
    { value: 'ADMIN', label: 'Administrateur' }
  ];
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Exemple de Validation de Formulaire
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Summary */}
          <FormErrorSummary errors={errors} />
          
          {/* Personal Information Section */}
          <FormSection 
            title="Informations personnelles"
            description="Informations de base de l'utilisateur"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Prénom"
                name="firstName"
                value={formData.firstName}
                onChange={(value) => handleFieldChange('firstName', value)}
                placeholder="Entrez le prénom"
                error={errors.firstName}
                required
              />
              
              <InputField
                label="Nom"
                name="lastName"
                value={formData.lastName}
                onChange={(value) => handleFieldChange('lastName', value)}
                placeholder="Entrez le nom"
                error={errors.lastName}
                required
              />
            </div>
            
            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(value) => handleFieldChange('email', value)}
              placeholder="exemple@email.com"
              error={errors.email}
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Téléphone"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(value) => handleFieldChange('phoneNumber', value)}
                placeholder="+33 1 23 45 67 89"
                error={errors.phoneNumber}
              />
              
              <InputField
                label="Ville"
                name="city"
                value={formData.city}
                onChange={(value) => handleFieldChange('city', value)}
                placeholder="Paris"
                error={errors.city}
              />
            </div>
            
            <TextareaField
              label="Biographie"
              name="bio"
              value={formData.bio}
              onChange={(value) => handleFieldChange('bio', value)}
              placeholder="Décrivez-vous en quelques mots..."
              rows={4}
              error={errors.bio}
              description="Une courte description de l'utilisateur (optionnel)"
            />
          </FormSection>
          
          {/* Account Settings Section */}
          <FormSection 
            title="Paramètres du compte"
            description="Configuration du rôle et des préférences"
          >
            <SelectField
              label="Rôle"
              name="role"
              value={formData.role}
              onChange={(value) => handleFieldChange('role', value)}
              options={roleOptions}
              error={errors.role}
              required
              description="Le rôle détermine les permissions de l'utilisateur"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SwitchField
                label="Compte actif"
                name="isActive"
                checked={formData.isActive}
                onChange={(checked) => handleFieldChange('isActive', checked)}
                error={errors.isActive}
                description="Détermine si l'utilisateur peut se connecter"
              />
              
              <SwitchField
                label="Notifications email"
                name="emailNotifications"
                checked={formData.emailNotifications}
                onChange={(checked) => handleFieldChange('emailNotifications', checked)}
                error={errors.emailNotifications}
                description="Recevoir les notifications par email"
              />
            </div>
          </FormSection>
          
          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer l'utilisateur
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ValidationExample;