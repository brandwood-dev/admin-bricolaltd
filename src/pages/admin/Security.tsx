import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield, Key, Activity, AlertTriangle, Users, Lock } from "lucide-react";
import { toast } from "sonner";

interface SecurityLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  ip: string;
  status: 'success' | 'failed' | 'warning';
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireSpecialChars: boolean;
  accountLockoutDuration: number;
}

const Security = () => {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireSpecialChars: true,
    accountLockoutDuration: 15
  });

  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([
    {
      id: "1",
      timestamp: "2024-01-15 14:30:25",
      action: "Connexion administrateur",
      user: "admin@bricola.com",
      ip: "192.168.1.100",
      status: "success"
    },
    {
      id: "2",
      timestamp: "2024-01-15 14:25:12",
      action: "Tentative de connexion échouée",
      user: "unknown@test.com",
      ip: "45.123.45.67",
      status: "failed"
    },
    {
      id: "3",
      timestamp: "2024-01-15 14:20:08",
      action: "Modification des paramètres",
      user: "admin@bricola.com",
      ip: "192.168.1.100",
      status: "success"
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Paramètres de sécurité sauvegardés avec succès");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde des paramètres");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Succès</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échec</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Attention</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Sécurité</h1>
          <p className="text-muted-foreground">Gérez les paramètres de sécurité et surveillez l'activité</p>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Journaux
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Authentification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Authentification
                </CardTitle>
                <CardDescription>
                  Configurez les paramètres d'authentification et de sécurité des comptes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="two-factor">Authentification à deux facteurs</Label>
                  <Switch
                    id="two-factor"
                    checked={securitySettings.twoFactorEnabled}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Délai d'expiration de session (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => 
                      setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-attempts">Tentatives de connexion maximales</Label>
                  <Input
                    id="max-attempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => 
                      setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Politique des mots de passe */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Politique des mots de passe
                </CardTitle>
                <CardDescription>
                  Définissez les règles de sécurité pour les mots de passe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password-length">Longueur minimale</Label>
                  <Input
                    id="password-length"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => 
                      setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="special-chars">Caractères spéciaux requis</Label>
                  <Switch
                    id="special-chars"
                    checked={securitySettings.requireSpecialChars}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, requireSpecialChars: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lockout-duration">Durée de verrouillage (minutes)</Label>
                  <Input
                    id="lockout-duration"
                    type="number"
                    value={securitySettings.accountLockoutDuration}
                    onChange={(e) => 
                      setSecuritySettings(prev => ({ ...prev, accountLockoutDuration: parseInt(e.target.value) }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isLoading}>
              {isLoading ? "Sauvegarde..." : "Sauvegarder les paramètres"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Journaux de sécurité
              </CardTitle>
              <CardDescription>
                Surveillez l'activité de sécurité et les tentatives d'accès
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityLogs.map((log, index) => (
                  <div key={log.id}>
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.action}</span>
                          {getStatusBadge(log.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span>{log.user}</span> • <span>{log.ip}</span> • <span>{log.timestamp}</span>
                        </div>
                      </div>
                      {log.status === 'failed' && (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    {index < securityLogs.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Sessions actives
              </CardTitle>
              <CardDescription>
                Gérez les sessions utilisateur actives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Cette fonctionnalité sera disponible dans une prochaine mise à jour.
                  Elle permettra de visualiser et gérer les sessions utilisateur actives.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Security;