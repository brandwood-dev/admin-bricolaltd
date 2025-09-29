import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { contactService, Contact } from '../../services/contactService'
import { EmailService } from '../../services/emailService'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Textarea } from '../../components/ui/textarea'
import { DateRangePicker } from '../../components/ui/date-range-picker'
import { DateRange } from 'react-day-picker'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Label } from '../../components/ui/label'

import {
  Mail,
  Phone,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  UserCheck,
  Flag,
  Eye,
  Search,
  Filter,
  HelpCircle,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Trash2,
} from 'lucide-react'

const Contacts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedContact, setSelectedContact] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [dateRange, setDateRange] = useState(undefined)
  const { isAuthenticated, user } = useAuth()

  const itemsPerPage = 10

  // Fonction pour formater les dates au format jj-mm-aaaa hh:mm
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}-${month}-${year} ${hours}:${minutes}`
  }
  // ENUM('technical', 'payment', 'account', 'dispute', 'suggestion', 'other'
  const categories = [
    { value: 'support', label: 'Support' },
    { value: 'payment', label: 'Payment' },
    { value: 'account', label: 'Compte' },
    { value: 'dispute', label: 'Contestation' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'other', label: 'Autre' },
  ]

  const loadContacts = async () => {
    console.log('🔍 [DEBUG] loadContacts - Début de la fonction')
    console.log('🔍 [DEBUG] loadContacts - user:', user)
    console.log('🔍 [DEBUG] loadContacts - isAuthenticated:', isAuthenticated)

    if (!user) {
      console.log('❌ [DEBUG] loadContacts - Utilisateur non authentifié')
      setError('Utilisateur non authentifié')
      return
    }

    try {
      console.log('🚀 [DEBUG] loadContacts - Appel API en cours...')
      setError(null)
      const response = await contactService.getContacts()

      console.log('✅ [DEBUG] loadContacts - Réponse API reçue:', response)
      console.log('📊 [DEBUG] loadContacts - response.data:', response.data)
      console.log(
        '📋 [DEBUG] loadContacts - response.data.data:',
        response.data.data
      )
      console.log(
        '🔢 [DEBUG] loadContacts - Nombre de contacts:',
        response.data.data?.length || 0
      )

      const contactsData = response.data || []
      console.log(
        '💾 [DEBUG] loadContacts - Données à sauvegarder:',
        contactsData
      )

      setContacts(contactsData)
      console.log(
        '✅ [DEBUG] loadContacts - setContacts appelé avec:',
        contactsData
      )
    } catch (err) {
      console.error(
        '❌ [DEBUG] loadContacts - Erreur lors du chargement des contacts:',
        err
      )
      console.error('❌ [DEBUG] loadContacts - err.response:', err.response)
      console.error(
        '❌ [DEBUG] loadContacts - err.response?.data:',
        err.response?.data
      )
      setError(
        err.response?.data?.message || 'Erreur lors du chargement des contacts'
      )
    } finally {
      console.log(
        '🏁 [DEBUG] loadContacts - Fin de la fonction, setLoading(false)'
      )
      setLoading(false)
    }
  }

  // Charger les contacts au montage du composant
  useEffect(() => {
    console.log('🎯 [DEBUG] useEffect - Montage du composant Contacts')
    console.log('🎯 [DEBUG] useEffect - user au montage:', user)
    console.log(
      '🎯 [DEBUG] useEffect - isAuthenticated au montage:',
      isAuthenticated
    )
    loadContacts()
  }, [])

  // Debug des changements d'état
  useEffect(() => {
    console.log('📊 [DEBUG] contacts state changed:', contacts)
    console.log('📊 [DEBUG] contacts length:', contacts.length)
  }, [contacts])

  useEffect(() => {
    console.log('⏳ [DEBUG] loading state changed:', loading)
  }, [loading])

  useEffect(() => {
    console.log('❌ [DEBUG] error state changed:', error)
  }, [error])

  useEffect(() => {
    console.log('👤 [DEBUG] user state changed:', user)
  }, [user])

  useEffect(() => {
    console.log('🔐 [DEBUG] isAuthenticated state changed:', isAuthenticated)
  }, [isAuthenticated])

  // Fonctions utilitaires
  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { label: 'Nouveau', variant: 'destructive' },
      in_progress: { label: 'En cours', variant: 'default' },
      waiting: { label: 'En attente', variant: 'secondary' },
      closed: { label: 'Fermé', variant: 'outline' },
    }
    const config = statusConfig[status] || statusConfig.new
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { label: 'Faible', variant: 'outline' },
      medium: { label: 'Moyenne', variant: 'default' },
      high: { label: 'Élevée', variant: 'destructive' },
      urgent: { label: 'Urgente', variant: 'destructive' },
    }
    const config = priorityConfig[priority] || priorityConfig.medium
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getCategoryLabel = (category) => {
    const categoryObj = categories.find((cat) => cat.value === category)
    return categoryObj ? categoryObj.label : category
  }

  const handleDeleteContact = async (contactId: string, contactName: string) => {
    try {
      await contactService.deleteContact(contactId)
      toast.success(`Contact ${contactName} supprimé avec succès`)
      loadContacts() // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la suppression du contact:', error)
      toast.error('Erreur lors de la suppression du contact')
    }
  }

  const handleRespond = async (contactId, response) => {
    try {
      await contactService.respondToContact(contactId, response)
      await loadContacts()
    } catch (err) {
      console.error("Erreur lors de l'envoi de la réponse:", err)
    }
  }

  const handleClose = async (contactId) => {
    try {
      await contactService.updateContactStatus(contactId, 'closed')
      await loadContacts()
    } catch (err) {
      console.error('Erreur lors de la fermeture du ticket:', err)
    }
  }

  const handleAssign = async (contactId, assignedTo) => {
    try {
      await contactService.assignContact(contactId, assignedTo)
      await loadContacts()
    } catch (err) {
      console.error("Erreur lors de l'assignation:", err)
    }
  }

  const handlePriorityChange = async (contactId, priority) => {
    try {
      await contactService.updateContactPriority(contactId, priority)
      await loadContacts()
    } catch (err) {
      console.error('Erreur lors du changement de priorité:', err)
    }
  }

  // Fonction pour obtenir le label d'assignation
  const getAssignmentLabel = (value) => {
    const assignmentLabels = {
      'unassigned': 'Non assigné',
      'admin1': 'Admin Support',
      'admin2': 'Tech Support', 
      'admin3': 'Manager'
    }
    return assignmentLabels[value] || 'Non assigné'
  }

  const ContactDetailsModal: React.FC<{ contact: any; isOpen: boolean; onClose: () => void }> = ({ contact, isOpen, onClose }) => {
    const [response, setResponse] = useState('')
    const [assignedTo, setAssignedTo] = useState(contact?.assignedTo || 'unassigned')
    const [priority, setPriority] = useState(contact?.priority || 'medium')

    const handleSendResponse = async () => {
      if (!response.trim()) {
        toast.error('Veuillez saisir une réponse avant d\'envoyer');
        return;
      }

      const loadingToast = toast.loading('Envoi de la réponse en cours...');
      
      try {
        // 1. Envoyer l'email au client
        console.log('[ContactDetailsModal] Envoi de l\'email à:', contact.email);
        const emailSent = await EmailService.sendContactResponse(
          contact.email,
          `${contact.firstName} ${contact.lastName}`,
          contact.subject,
          response
        );

        if (!emailSent) {
          throw new Error('Échec de l\'envoi de l\'email');
        }

        // 2. Sauvegarder la réponse en base de données
        console.log('[ContactDetailsModal] Sauvegarde de la réponse en base');
        await contactService.sendResponse(contact.id, response);

        // 3. Changer le statut à 'in_progress'
        console.log('[ContactDetailsModal] Changement du statut à in_progress');
        await contactService.updateContactStatus(contact.id, 'in_progress');

        // 4. Recharger les contacts pour mettre à jour l'interface
        await loadContacts();

        // 5. Afficher le toast de succès
        toast.dismiss(loadingToast);
        toast.success('Réponse envoyée avec succès ! Email envoyé et statut mis à jour.');
        
        // 6. Réinitialiser et fermer
        setResponse('');
        onClose();
        
      } catch (error) {
        console.error('[ContactDetailsModal] Erreur lors de l\'envoi de la réponse:', error);
        toast.dismiss(loadingToast);
        
        // Gestion d'erreurs spécifiques
        let errorMessage = 'Erreur lors de l\'envoi de la réponse';
        
        if (error.message?.includes('email')) {
          errorMessage = 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.';
        } else if (error.response?.status === 404) {
          errorMessage = 'Contact introuvable. Veuillez actualiser la page.';
        } else if (error.response?.status === 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        toast.error(errorMessage);
      }
    }

    const handleCloseTicket = async () => {
      await handleClose(contact.id)
      onClose()
    }

    const handleAssignmentChange = async (newAssignedTo) => {
      setAssignedTo(newAssignedTo)
      await handleAssign(contact.id, newAssignedTo)
    }

    const handlePriorityUpdate = async (newPriority) => {
      setPriority(newPriority)
      await handlePriorityChange(contact.id, newPriority)
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className='max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-lg sm:text-xl'>
              Demande de contact {contact.id}
            </DialogTitle>
          </DialogHeader>

          <div className='grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6'>
            {/* Contenu principal */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Informations du contact */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <User className='h-5 w-5' />
                    Informations du contact
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Nom
                      </Label>
                      <p className='font-semibold'>{`${contact.firstName} ${contact.lastName}`}</p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Email
                      </Label>
                      <p className='text-blue-600'>{contact.email}</p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Téléphone
                      </Label>
                      <p>{contact.phone}</p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Date
                      </Label>
                      <p>{formatDate(contact.createdAt)}</p>
                    </div>
                  </div>
                  <div>
                    <Label className='text-sm font-medium text-gray-600'>
                      Sujet
                    </Label>
                    <p className='font-semibold text-lg'>{contact.subject}</p>
                  </div>
                  <div className='grid grid-cols-3 gap-4'>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Catégorie
                      </Label>
                      <div className='mt-1'>
                        <Badge variant='outline'>
                          {getCategoryLabel(contact.category)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Priorité
                      </Label>
                      <div className='mt-1'>
                        {getPriorityBadge(contact.priority)}
                      </div>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Statut
                      </Label>
                      <div className='mt-1'>
                        {getStatusBadge(contact.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Message */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <MessageSquare className='h-5 w-5' />
                    Message du client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='p-4 bg-gray-50 rounded-lg'>
                    <p className='text-gray-700 leading-relaxed'>
                      {contact.message}
                    </p>
                  </div>
                  {contact.attachments && contact.attachments.length > 0 && (
                    <div className='mt-4'>
                      <Label className='text-sm font-medium text-gray-600'>
                        Pièces jointes
                      </Label>
                      <div className='mt-2 space-y-2'>
                        {contact.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className='flex items-center gap-2 p-2 bg-blue-50 rounded'
                          >
                            <Mail className='h-4 w-4 text-blue-500' />
                            <span className='text-sm text-blue-700'>
                              {attachment}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Réponse */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Send className='h-5 w-5' />
                    Réponse
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <Label htmlFor='response'>Votre réponse</Label>
                    <Textarea
                      id='response'
                      value={contact.response || response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder='Rédigez votre réponse au client...'
                      rows={6}
                    />
                  </div>
                  {contact.response && (
                    <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                      <Label className='text-sm font-medium text-green-800'>
                        Réponse précédente
                      </Label>
                      <p className='text-green-700 mt-1'>{contact.response}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Actions */}
            <div className='space-y-6'>
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Actions</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <Button
                    onClick={handleSendResponse}
                    className='w-full'
                    disabled={!response.trim()}
                  >
                    <Send className='h-4 w-4 mr-2' />
                    Envoyer réponse
                  </Button>

                  <div>
                    <Label htmlFor='status'>Changer le statut</Label>
                    <Select
                      value={contact.status}
                      onValueChange={(newStatus) => {
                        contactService.updateContactStatus(contact.id, newStatus)
                          .then(() => {
                            loadContacts()
                            toast.success('Statut mis à jour avec succès')
                          })
                          .catch((err) => {
                            console.error('Erreur lors du changement de statut:', err)
                            toast.error('Erreur lors du changement de statut')
                          })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='new'>Nouveau</SelectItem>
                        <SelectItem value='in_progress'>En cours</SelectItem>
                        <SelectItem value='closed'>Traité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>


            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const filteredContacts = contacts.filter((contact) => {
    console.log('[DEBUG] Filtrage contact:', contact)
    const fullName = `${contact.firstName} ${contact.lastName}`
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || contact.status === statusFilter
    const matchesCategory =
      categoryFilter === 'all' || contact.category === categoryFilter
    console.log('[DEBUG] Filtrage résultat:', {
      fullName,
      matchesSearch,
      matchesStatus,
      matchesCategory,
    })
    return matchesSearch && matchesStatus && matchesCategory
  })

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedContacts = filteredContacts.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  console.log('[DEBUG] Contacts filtrés:', filteredContacts.length)
  console.log('[DEBUG] Contacts paginés:', paginatedContacts.length)
  console.log('[DEBUG] Données paginées:', paginatedContacts)

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
            Gestion des demandes de contact
          </h1>
          <p className='text-sm sm:text-base text-gray-600 mt-2'>
            Gérez et répondez aux demandes de vos utilisateurs
          </p>
        </div>
        <DateRangePicker
          date={dateRange}
          onDateChange={setDateRange}
          placeholder='Filtrer par date de création'
        />
      </div>

      {/* Stats cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Nouvelles</p>
                <p className='text-2xl font-bold text-destructive'>
                  {contacts.filter((c) => c.status === 'new').length}
                </p>
              </div>
              <Mail className='h-8 w-8 text-destructive' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>En cours</p>
                <p className='text-2xl font-bold text-warning'>
                  {contacts.filter((c) => c.status === 'in_progress').length}
                </p>
              </div>
              <Clock className='h-8 w-8 text-warning' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Fermées</p>
                <p className='text-2xl font-bold text-success'>
                  {contacts.filter((c) => c.status === 'closed').length}
                </p>
              </div>
              <CheckCircle className='h-8 w-8 text-success' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Total</p>
                <p className='text-2xl font-bold text-primary'>
                  {contacts.length}
                </p>
              </div>
              <HelpCircle className='h-8 w-8 text-primary' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                placeholder='Rechercher par nom, email ou sujet...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className='h-4 w-4 mr-2' />
                <SelectValue placeholder='Statut' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous les statuts</SelectItem>
                <SelectItem value='new'>Nouveau</SelectItem>
                <SelectItem value='in_progress'>En cours</SelectItem>
                <SelectItem value='waiting'>En attente</SelectItem>
                <SelectItem value='closed'>Fermé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Catégorie' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Toutes les catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes de contact ({filteredContacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='w-8 h-8 animate-spin' />
              <span className='ml-2'>Chargement des contacts...</span>
            </div>
          ) : error ? (
            <div className='flex items-center justify-center py-8 text-red-500'>
              <AlertTriangle className='w-8 h-8 mr-2' />
              <span>{error}</span>
              <Button
                variant='outline'
                size='sm'
                className='ml-4'
                onClick={loadContacts}
              >
                Réessayer
              </Button>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead className='hidden md:table-cell'>
                      Sujet
                    </TableHead>
                    <TableHead className='hidden lg:table-cell'>
                      Catégorie
                    </TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div>
                          <div className='font-medium'>{`${contact.firstName} ${contact.lastName}`}</div>
                          <div className='text-sm text-gray-500'>
                            {contact.email}
                          </div>
                          <div className='text-sm text-gray-400 flex items-center gap-1 mt-1'>
                            <Calendar className='h-3 w-3' />
                            {formatDate(contact.createdAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='hidden md:table-cell'>
                        <div className='max-w-xs'>
                          <div className='font-medium line-clamp-1'>
                            {contact.subject}
                          </div>
                          <div className='text-sm text-gray-500 line-clamp-2'>
                            {contact.message}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='hidden lg:table-cell'>
                        <Badge variant='outline'>
                          {getCategoryLabel(contact.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(contact.status)}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              setSelectedContact(contact)
                              setIsModalOpen(true)
                            }}
                          >
                            <Eye className='h-4 w-4 mr-1' />
                            Voir
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant='destructive'
                                size='sm'
                              >
                                <Trash2 className='h-4 w-4 mr-1' />
                                Supprimer
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer le contact de {contact.firstName} {contact.lastName} ?
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteContact(contact.id, `${contact.firstName} ${contact.lastName}`)}
                                  className='bg-red-600 hover:bg-red-700'
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className='flex items-center justify-between mt-6'>
            <div className='text-sm text-gray-500'>
              Affichage de {startIndex + 1} à{' '}
              {Math.min(startIndex + itemsPerPage, filteredContacts.length)} sur{' '}
              {filteredContacts.length} demandes
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <span className='text-sm'>
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Details Modal */}
      {selectedContact && (
        <ContactDetailsModal
          contact={selectedContact}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedContact(null)
          }}
        />
      )}
    </div>
  )
}

export default Contacts
