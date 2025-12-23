import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

const AdminProfile = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    email: user?.email || '',
  })

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(false)
  const [isValidatingPassword, setIsValidatingPassword] = useState(false)
  const [currentPasswordError, setCurrentPasswordError] = useState('')

  const handleSave = async () => {
    try {
      const profileData = { email: formData.email }

      const response = await authService.updateProfile(profileData)
      if (response.success) {
        toast.success('Profil mis à jour avec succès')
      } else {
        toast.error(response.message || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Erreur lors de la mise à jour du profil')
    }
  }

  const handleCancel = () => {
    setFormData({ email: user?.email || '' })
  }

  // Password validation and change functions
  const validateCurrentPassword = async (password: string) => {
    if (!password.trim()) {
      setIsCurrentPasswordValid(false)
      setCurrentPasswordError('')
      return
    }

    setIsValidatingPassword(true)
    setCurrentPasswordError('')

    try {
      const response = await authService.validateCurrentPassword({
        currentPassword: password,
      })
      const valid = !!(response?.success && (response?.data as any)?.valid)

      if (valid) {
        setIsCurrentPasswordValid(true)
        setCurrentPasswordError('')
        // Don't show success toast for automatic validation, only on manual blur
      } else {
        setIsCurrentPasswordValid(false)
        setCurrentPasswordError('Mot de passe actuel incorrect')
      }
    } catch (error: any) {
      console.error('Erreur lors de la validation du mot de passe:', error)
      setIsCurrentPasswordValid(false)

      // Handle different types of errors
      if (error.response?.status === 401) {
        setCurrentPasswordError('Session expirée, veuillez vous reconnecter')
      } else if (error.response?.status === 400) {
        setCurrentPasswordError('Mot de passe actuel incorrect')
      } else {
        setCurrentPasswordError('Erreur de connexion, veuillez réessayer')
      }
    } finally {
      setIsValidatingPassword(false)
    }
  }

  const handleCurrentPasswordChange = (value: string) => {
    setPasswordData({ ...passwordData, currentPassword: value })
    // Reset validation state when password changes
    if (isCurrentPasswordValid) {
      setIsCurrentPasswordValid(false)
    }
    // Clear error message
    setCurrentPasswordError('')
    // Clear new password fields when current password changes
    if (passwordData.newPassword || passwordData.confirmPassword) {
      setPasswordData((prev) => ({
        ...prev,
        currentPassword: value,
        newPassword: '',
        confirmPassword: '',
      }))
    }
  }

  const handleCurrentPasswordBlur = async () => {
    // Validate immediately on blur if there's a password
    if (passwordData.currentPassword.trim()) {
      const previousValidState = isCurrentPasswordValid
      await validateCurrentPassword(passwordData.currentPassword)

      // Show success toast only on manual blur validation if it becomes valid
      if (!previousValidState && isCurrentPasswordValid) {
        toast.success('Mot de passe actuel vérifié')
      }
    } else {
      setIsCurrentPasswordValid(false)
      setCurrentPasswordError('')
    }
  }

  const handlePasswordChange = async () => {
    if (!isCurrentPasswordValid) {
      toast.error("Veuillez d'abord vérifier votre mot de passe actuel")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      const response = await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      if (response.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setIsCurrentPasswordValid(false)
        toast.success('Mot de passe modifié avec succès')
      } else {
        toast.error(
          response.message || 'Erreur lors du changement de mot de passe'
        )
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Erreur lors du changement de mot de passe')
    }
  }

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setIsCurrentPasswordValid(false)
  }

  if (!user) {
    return <div>Chargement...</div>
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>
          Profil Administrateur
        </h1>
        <p className='text-muted-foreground'>
          Modifiez votre email et mot de passe
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>Adresse e-mail de connexion</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div className='flex gap-2'>
            <Button onClick={handleSave}>Sauvegarder</Button>
            <Button variant='outline' onClick={handleCancel}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Lock className='h-5 w-5' />
            Changer le mot de passe
          </CardTitle>
          <CardDescription>
            Modifiez votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            {/* Current Password */}
            <div className='space-y-2'>
              <Label htmlFor='currentPassword'>Mot de passe actuel *</Label>
              <div className='relative'>
                <Input
                  id='currentPassword'
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                  onBlur={handleCurrentPasswordBlur}
                  placeholder='Entrez votre mot de passe actuel'
                  className={`pr-10 ${
                    isCurrentPasswordValid
                      ? 'border-green-500'
                      : passwordData.currentPassword && !isCurrentPasswordValid
                      ? 'border-red-500'
                      : ''
                  }`}
                  disabled={isValidatingPassword}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      current: !showPasswords.current,
                    })
                  }
                >
                  {showPasswords.current ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </Button>
              </div>
              {isValidatingPassword && (
                <div className='text-sm text-blue-600 flex items-center gap-1'>
                  <div className='animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full'></div>
                  Vérification en cours...
                </div>
              )}
              {!isValidatingPassword && isCurrentPasswordValid && (
                <div className='text-sm text-green-600 flex items-center gap-1'>
                  <span className='text-green-600'>✓</span>
                  Mot de passe vérifié
                </div>
              )}
              {!isValidatingPassword && currentPasswordError && (
                <div className='text-sm text-red-600 flex items-center gap-1'>
                  <span className='text-red-600'>✗</span>
                  {currentPasswordError}
                </div>
              )}
            </div>

            {/* New Password */}
            <div className='space-y-2'>
              <Label htmlFor='newPassword'>Nouveau mot de passe *</Label>
              <div className='relative'>
                <Input
                  id='newPassword'
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder='Entrez le nouveau mot de passe'
                  className='pr-10'
                  disabled={!isCurrentPasswordValid}
                  minLength={6}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      new: !showPasswords.new,
                    })
                  }
                  disabled={!isCurrentPasswordValid}
                >
                  {showPasswords.new ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </Button>
              </div>
              {!isCurrentPasswordValid &&
                !currentPasswordError &&
                passwordData.currentPassword && (
                  <div className='text-sm text-muted-foreground'>
                    Veuillez d'abord vérifier votre mot de passe actuel
                  </div>
                )}
              {!isCurrentPasswordValid && !passwordData.currentPassword && (
                <div className='text-sm text-muted-foreground'>
                  Saisissez votre mot de passe actuel pour continuer
                </div>
              )}
            </div>
          </div>

          {/* Confirm Password */}
          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>
              Confirmer le nouveau mot de passe *
            </Label>
            <div className='relative max-w-md'>
              <Input
                id='confirmPassword'
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder='Confirmez le nouveau mot de passe'
                className={`pr-10 ${
                  passwordData.confirmPassword &&
                  passwordData.newPassword &&
                  passwordData.confirmPassword !== passwordData.newPassword
                    ? 'border-red-500'
                    : ''
                }`}
                disabled={!isCurrentPasswordValid || !passwordData.newPassword}
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    confirm: !showPasswords.confirm,
                  })
                }
                disabled={!isCurrentPasswordValid || !passwordData.newPassword}
              >
                {showPasswords.confirm ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </Button>
            </div>
            {passwordData.confirmPassword &&
              passwordData.newPassword &&
              passwordData.confirmPassword !== passwordData.newPassword && (
                <div className='text-sm text-red-600'>
                  Les mots de passe ne correspondent pas
                </div>
              )}
          </div>

          <Separator />

          <div className='flex gap-2'>
            <Button
              onClick={handlePasswordChange}
              disabled={
                !isCurrentPasswordValid ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword ||
                passwordData.newPassword !== passwordData.confirmPassword
              }
            >
              <Lock className='h-4 w-4 mr-2' />
              Changer le mot de passe
            </Button>
            <Button variant='outline' onClick={resetPasswordForm}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminProfile
