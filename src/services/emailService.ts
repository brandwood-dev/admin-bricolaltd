import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

/**
 * Obtient les headers d'authentification avec le token JWT
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
};

export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class EmailService {
  /**
   * Envoie un email via l'API backend
   */
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      console.log('[EmailService] Envoi d\'email via API:', {
        to: emailData.to,
        subject: emailData.subject
      });

      const response = await axios.post(`${API_BASE_URL}/emails/send`, emailData, {
        headers: getAuthHeaders()
      });
      
      console.log('[EmailService] Email envoyé avec succès:', response.data);
      return true;
    } catch (error) {
      console.error('[EmailService] Erreur lors de l\'envoi de l\'email:', error);
      return false;
    }
  }

  /**
   * Envoie une réponse à une demande de contact
   */
  static async sendContactResponse(
    contactEmail: string,
    contactName: string,
    subject: string,
    response: string
  ): Promise<boolean> {
    try {
      console.log('[EmailService] Envoi de réponse contact:', {
        email: contactEmail,
        name: contactName,
        subject: subject,
        responseLength: response.length
      });

      const requestData = {
        email: contactEmail,
        name: contactName,
        subject,
        response
      };

      console.log('[EmailService] Données de la requête:', requestData);

      const result = await axios.post(`${API_BASE_URL}/emails/send-contact-response`, requestData, {
        headers: getAuthHeaders()
      });
      
      console.log('[EmailService] Réponse complète de l\'API:', result);
      console.log('[EmailService] Status de la réponse:', result.status);
      console.log('[EmailService] Données de la réponse:', result.data);

      // Vérifier la structure de la réponse selon l'API
      if (result.status === 200 || result.status === 201) {
        // L'endpoint /emails/send-contact-response retourne {success: true, message: '...', data: {...}}
        if (result.data && result.data.success) {
          console.log('[EmailService] Email envoyé avec succès via l\'endpoint contact-response');
          return true;
        } else if (result.data && result.data.data) {
          console.log('[EmailService] Email envoyé avec succès (format alternatif)');
          return true;
        } else {
          console.warn('[EmailService] Réponse inattendue de l\'API:', result.data);
          return true; // Considérer comme succès si status 200/201
        }
      } else {
        console.error('[EmailService] Status HTTP inattendu:', result.status);
        return false;
      }
    } catch (error: any) {
      console.error('[EmailService] Erreur lors de l\'envoi de la réponse:', error);
      
      if (error.response) {
        // Erreur de réponse HTTP
        console.error('[EmailService] Status de l\'erreur:', error.response.status);
        console.error('[EmailService] Données de l\'erreur:', error.response.data);
        console.error('[EmailService] Headers de l\'erreur:', error.response.headers);
        
        if (error.response.status === 401) {
          console.error('[EmailService] Erreur d\'authentification');
        } else if (error.response.status === 403) {
          console.error('[EmailService] Accès interdit');
        } else if (error.response.status === 404) {
          console.error('[EmailService] Endpoint non trouvé');
        } else if (error.response.status >= 500) {
          console.error('[EmailService] Erreur serveur');
        }
      } else if (error.request) {
        // Erreur de requête (pas de réponse)
        console.error('[EmailService] Aucune réponse reçue:', error.request);
      } else {
        // Erreur de configuration
        console.error('[EmailService] Erreur de configuration:', error.message);
      }
      
      throw new Error('Échec de l\'envoi de l\'email');
    }
  }
}

export default EmailService;