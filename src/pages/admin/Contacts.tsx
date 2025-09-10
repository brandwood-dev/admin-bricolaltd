import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Filter, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Mail,
  User,
  MessageSquare,
  Send,
  Phone,
  HelpCircle,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  // Mock data - À remplacer par de vraies données
  const contacts = [
    {
      id: "CONT-001",
      name: "Marie Dubois",
      email: "marie.dubois@email.com",
      phone: "+33 6 12 34 56 78",
      subject: "Problème de paiement",
      category: "payment",
      priority: "high",
      status: "new",
      message: "J'ai un problème avec le paiement de ma dernière réservation. La transaction a été refusée alors que ma carte fonctionne normalement.",
      createdAt: "2024-03-20",
      assignedTo: "",
      response: "",
      attachments: []
    },
    {
      id: "CONT-002",
      name: "Pierre Durand",
      email: "pierre.durand@email.com",
      phone: "+33 6 98 76 54 32",
      subject: "Question sur la vérification de compte",
      category: "account",
      priority: "medium",
      status: "in_progress",
      message: "Bonjour, cela fait 3 jours que j'ai envoyé mes documents pour la vérification de mon compte mais je n'ai toujours pas de retour. Pouvez-vous me dire où en est le processus ?",
      createdAt: "2024-03-18",
      assignedTo: "Admin Support",
      response: "Nous avons bien reçu vos documents et ils sont en cours de vérification. Vous devriez recevoir une réponse sous 24h.",
      attachments: ["documents.pdf"]
    },
    {
      id: "CONT-003",
      name: "Sophie Leroy",
      email: "sophie.leroy@email.com",
      phone: "+33 6 55 44 33 22",
      subject: "Suggestion d'amélioration",
      category: "suggestion",
      priority: "low",
      status: "closed",
      message: "J'aimerais suggérer d'ajouter un système de notification par SMS pour les confirmations de réservation. Ce serait très pratique !",
      createdAt: "2024-03-15",
      assignedTo: "Admin Support",
      response: "Merci pour votre suggestion ! Nous l'avons transmise à notre équipe de développement qui l'étudiera pour les prochaines mises à jour.",
      attachments: []
    },
    {
      id: "CONT-004",
      name: "Jean Martin",
      email: "jean.martin@email.com",
      phone: "+33 6 87 65 43 21",
      subject: "Outil endommagé non signalé",
      category: "dispute",
      priority: "high",
      status: "new",
      message: "Le locataire a rendu mon outil avec des dommages mais ne l'a pas signalé. Comment puis-je procéder pour faire une réclamation ?",
      createdAt: "2024-03-19",
      assignedTo: "",
      response: "",
      attachments: ["photo1.jpg", "photo2.jpg"]
    }
  ];

  const categories = [
    { value: "technical", label: "Technique" },
    { value: "payment", label: "Paiement" },
    { value: "account", label: "Compte" },
    { value: "dispute", label: "Litige" },
    { value: "suggestion", label: "Suggestion" },
    { value: "other", label: "Autre" }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="destructive">Nouveau</Badge>;
      case "in_progress":
        return <Badge className="bg-warning text-warning-foreground">En cours</Badge>;
      case "waiting":
        return <Badge variant="secondary">En attente</Badge>;
      case "closed":
        return <Badge className="bg-success text-success-foreground">Fermé</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-600 text-white">Haute</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500 text-white">Moyenne</Badge>;
      case "low":
        return <Badge className="bg-green-500 text-white">Basse</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const handleRespond = (contactId: string, response: string) => {
    if (!response.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une réponse.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Réponse envoyée",
      description: "Votre réponse a été envoyée au contact.",
    });
  };

  const handleClose = (contactId: string) => {
    toast({
      title: "Demande fermée",
      description: "La demande de contact a été marquée comme fermée.",
    });
  };

  const ContactDetailsModal = ({ contact }: { contact: any }) => {
    const [response, setResponse] = useState(contact.response || "");

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Demande de contact {contact.id}</DialogTitle>
            <DialogDescription>
              Gestion complète de la demande de contact
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Contenu principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informations du contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations du contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nom</Label>
                      <p className="font-semibold">{contact.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-blue-600">{contact.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Téléphone</Label>
                      <p>{contact.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Date</Label>
                      <p>{contact.createdAt}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Sujet</Label>
                    <p className="font-semibold text-lg">{contact.subject}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Catégorie</Label>
                      <div className="mt-1">
                        <Badge variant="outline">{getCategoryLabel(contact.category)}</Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Priorité</Label>
                      <div className="mt-1">{getPriorityBadge(contact.priority)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Statut</Label>
                      <div className="mt-1">{getStatusBadge(contact.status)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Message */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Message du client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 leading-relaxed">{contact.message}</p>
                  </div>
                  {contact.attachments.length > 0 && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-600">Pièces jointes</Label>
                      <div className="mt-2 space-y-2">
                        {contact.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                            <Mail className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-blue-700">{attachment}</span>
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Réponse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="response">Votre réponse</Label>
                    <Textarea
                      id="response"
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Rédigez votre réponse au client..."
                      rows={6}
                    />
                  </div>
                  {contact.response && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <Label className="text-sm font-medium text-green-800">Réponse précédente</Label>
                      <p className="text-green-700 mt-1">{contact.response}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Actions */}
            <div className="space-y-6">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => handleRespond(contact.id, response)}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer réponse
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Appeler le client
                  </Button>

                  {contact.status !== "closed" && (
                    <Button 
                      onClick={() => handleClose(contact.id)}
                      variant="outline" 
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marquer fermé
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Attribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="assign">Assigné à</Label>
                    <Select defaultValue={contact.assignedTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Non assigné" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin1">Admin Support</SelectItem>
                        <SelectItem value="admin2">Admin Technique</SelectItem>
                        <SelectItem value="admin3">Admin Financier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Priorité</Label>
                    <Select defaultValue={contact.priority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Historique */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Historique
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Créé le:</span>
                    <span>{contact.createdAt}</span>
                  </div>
                  {contact.assignedTo && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigné à:</span>
                      <span>{contact.assignedTo}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut:</span>
                    {getStatusBadge(contact.status)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || contact.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des demandes de contact</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Gérez et répondez aux demandes de vos utilisateurs</p>
        </div>
        <DateRangePicker
          date={dateRange}
          onDateChange={setDateRange}
          placeholder="Filtrer par date de création"
        />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nouvelles</p>
                <p className="text-2xl font-bold text-destructive">
                  {contacts.filter(c => c.status === "new").length}
                </p>
              </div>
              <Mail className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-warning">
                  {contacts.filter(c => c.status === "in_progress").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fermées</p>
                <p className="text-2xl font-bold text-success">
                  {contacts.filter(c => c.status === "closed").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-primary">{contacts.length}</p>
              </div>
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, email ou sujet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="new">Nouveau</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="waiting">En attente</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Sujet</TableHead>
                  <TableHead className="hidden lg:table-cell">Catégorie</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-gray-500">{contact.email}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {contact.createdAt}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="max-w-xs">
                        <div className="font-medium line-clamp-1">{contact.subject}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{contact.message}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline">{getCategoryLabel(contact.category)}</Badge>
                    </TableCell>
                    <TableCell>{getPriorityBadge(contact.priority)}</TableCell>
                    <TableCell>{getStatusBadge(contact.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ContactDetailsModal contact={contact} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredContacts.length)} sur {filteredContacts.length} demandes
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Contacts;