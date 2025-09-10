import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { countriesService, Country } from "@/services/countriesService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Edit, 
  Save, 
  X 
} from "lucide-react";
import { toast } from "sonner";

const AdminProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    city: user?.city || '',
    postalCode: user?.postalCode || '',
    countryId: user?.countryId || '',
    profilePicture: user?.profilePicture || ''
  });

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const response = await countriesService.getActiveCountries();
        if (response.success) {
          setCountries(response.data);
        } else {
          toast.error("Erreur lors du chargement des pays");
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
        toast.error("Erreur lors du chargement des pays");
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const handleSave = async () => {
    try {
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        countryId: formData.countryId,
        profilePicture: formData.profilePicture
      };
      
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        setIsEditing(false);
        toast.success("Profil mis à jour avec succès");
      } else {
        toast.error(response.message || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Erreur lors de la mise à jour du profil");
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
      city: user?.city || '',
      postalCode: user?.postalCode || '',
      countryId: user?.countryId || '',
      profilePicture: user?.profilePicture || ''
    });
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'moderator': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Administrateur';
      case 'admin': return 'Administrateur';
      case 'moderator': return 'Modérateur';
      default: return role;
    }
  };

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Profil Administrateur
          </h1>
          <p className='text-muted-foreground'>
            Gérez vos informations personnelles et paramètres de compte
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className='h-4 w-4 mr-2' />
            Modifier
          </Button>
        ) : (
          <div className='flex gap-2'>
            <Button onClick={handleSave}>
              <Save className='h-4 w-4 mr-2' />
              Sauvegarder
            </Button>
            <Button variant='outline' onClick={handleCancel}>
              <X className='h-4 w-4 mr-2' />
              Annuler
            </Button>
          </div>
        )}
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        {/* Profile Overview */}
        <Card className='md:col-span-1'>
          <CardHeader className='text-center'>
            <div className='flex justify-center mb-4'>
              <Avatar className='h-24 w-24'>
                <AvatarImage src={user.profilePicture} alt={user.displayName} />
                <AvatarFallback className='text-lg'>
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>
              {user.displayName || `${user.firstName} ${user.lastName}`}
            </CardTitle>
            <CardDescription>{user.email}</CardDescription>
            <div className='flex justify-center mt-2'>
              <Badge className={getRoleColor(user.role)}>
                <Shield className='h-3 w-3 mr-1' />
                {getRoleLabel(user.role)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex items-center text-sm'>
                <Calendar className='h-4 w-4 mr-2 text-muted-foreground' />
                <span>
                  Membre depuis{' '}
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {user.lastLoginAt && (
                <div className='flex items-center text-sm'>
                  <User className='h-4 w-4 mr-2 text-muted-foreground' />
                  <span>
                    Dernière connexion:{' '}
                    {new Date(user.lastLoginAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              <div className='flex items-center text-sm'>
                <div
                  className={`h-2 w-2 rounded-full mr-2 ${
                    user.isActive ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span>{user.isActive ? 'Compte actif' : 'Compte inactif'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className='md:col-span-2'>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              Vos informations de profil et coordonnées
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>Prénom</Label>
                <Input
                  id='firstName'
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='lastName'>Nom</Label>
                <Input
                  id='lastName'
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <div className='flex items-center space-x-2'>
                <Mail className='h-4 w-4 text-muted-foreground' />
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={!isEditing}
                  className='flex-1'
                />
                {user.verifiedEmail && (
                  <Badge variant='secondary' className='text-green-600'>
                    Vérifié
                  </Badge>
                )}
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Téléphone</Label>
              <div className='flex items-center space-x-2'>
                <Phone className='h-4 w-4 text-muted-foreground' />
                <Input
                  id='phone'
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  disabled={!isEditing}
                  className='flex-1'
                />
              </div>
            </div>

            <Separator />

            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <MapPin className='h-4 w-4 text-muted-foreground' />
                <Label>Adresse</Label>
              </div>

              <div className='space-y-2'>
                <Input
                  placeholder='Adresse'
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className='grid gap-4 md:grid-cols-3'>
                <Input
                  placeholder='Ville'
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  disabled={!isEditing}
                />
                <Input
                  placeholder='Code postal'
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                  disabled={!isEditing}
                />
                <Select
                  disabled={!isEditing || loadingCountries}
                  value={formData.countryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, countryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
};

export default AdminProfile;
