// synchronisation.js
class SynchronisationManager {
    constructor() {
        this.initialiser();
    }
    
    initialiser() {
        console.log('SynchronisationManager initialisé');
        
        // Écouter les changements dans localStorage
        window.addEventListener('storage', this.onStorageChange.bind(this));
        
        // Synchroniser au démarrage
        this.synchroniserToutesLesDonnees();
        
        // Synchroniser toutes les 30 secondes
        setInterval(() => this.synchroniserToutesLesDonnees(), 30000);
    }
    
    onStorageChange(event) {
        console.log('Changement détecté dans localStorage:', event.key);
        
        if (event.key === 'historique_global') {
            this.synchroniserStatistiques();
            
            // Déclencher un événement pour notifier les autres pages
            window.dispatchEvent(new CustomEvent('donneesMisesAJour', {
                detail: { type: 'historique' }
            }));
        }
    }
    
    synchroniserToutesLesDonnees() {
        this.synchroniserHistorique();
        this.synchroniserStatistiques();
        this.synchroniserClients();
    }
    
    synchroniserHistorique() {
        // Vérifier la cohérence des données
        const historique = JSON.parse(localStorage.getItem('historique_global') || '[]');
        
        // Filtrer les documents invalides
        const historiqueValide = historique.filter(doc => {
            return doc && doc.id && doc.type;
        });
        
        // Sauvegarder l'historique nettoyé
        if (historique.length !== historiqueValide.length) {
            localStorage.setItem('historique_global', JSON.stringify(historiqueValide));
            console.log('Historique nettoyé:', historique.length - historiqueValide.length, 'documents invalides supprimés');
        }
    }
    
    synchroniserStatistiques() {
        const historique = JSON.parse(localStorage.getItem('historique_global') || '[]');
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        const stock = JSON.parse(localStorage.getItem('stock') || '[]');
        
        // Calculer les statistiques
        const statistiques = {
            totalFactures: historique.filter(d => d.type === 'facture').length,
            caTotal: historique
                .filter(d => d.type === 'facture' && (d.statut === 'finalisee' || d.statut === 'payee'))
                .reduce((sum, f) => sum + (parseFloat(f.totalTTC) || 0), 0),
            totalClients: clients.length,
            stockTotal: stock.reduce((sum, article) => sum + (article.quantite || 0), 0),
            totalDevis: historique.filter(d => d.type === 'devis').length,
            totalBons: historique.filter(d => d.type === 'bon_livraison').length,
            timestamp: new Date().toISOString()
        };
        
        // Sauvegarder les statistiques
        localStorage.setItem('statistiques', JSON.stringify(statistiques));
        
        // Déclencher un événement
        window.dispatchEvent(new CustomEvent('statistiquesMisesAJour', {
            detail: statistiques
        }));
        
        return statistiques;
    }
    
    synchroniserClients() {
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        const historique = JSON.parse(localStorage.getItem('historique_global') || '[]');
        
        clients.forEach(client => {
            // Compter les commandes du client
            const facturesClient = historique.filter(doc => 
                doc.type === 'facture' && 
                doc.clientNom === client.nom
            );
            
            // Mettre à jour les statistiques client
            client.nombreCommandes = facturesClient.length;
            client.totalAchat = facturesClient.reduce((sum, f) => sum + (parseFloat(f.totalTTC) || 0), 0);
            client.dateDerniereCommande = facturesClient.length > 0 ? 
                facturesClient.reduce((latest, f) => {
                    const dateDoc = f.date ? new Date(f.date.split('/').reverse().join('-')) : new Date(f.createdAt);
                    return dateDoc > latest ? dateDoc : latest;
                }, new Date(0)).toISOString() : null;
        });
        
        // Sauvegarder les clients mis à jour
        localStorage.setItem('clients', JSON.stringify(clients));
        
        // Déclencher un événement
        window.dispatchEvent(new CustomEvent('clientsMisesAJour', {
            detail: clients
        }));
    }
    
    supprimerDocument(documentId) {
        return new Promise((resolve, reject) => {
            try {
                // Récupérer l'historique
                let historique = JSON.parse(localStorage.getItem('historique_global') || '[]');
                
                // Trouver le document à supprimer
                const documentIndex = historique.findIndex(doc => doc.id === documentId);
                
                if (documentIndex === -1) {
                    reject(new Error('Document non trouvé'));
                    return;
                }
                
                const documentASupprimer = historique[documentIndex];
                
                // Supprimer le document
                historique.splice(documentIndex, 1);
                
                // Sauvegarder l'historique mis à jour
                localStorage.setItem('historique_global', JSON.stringify(historique));
                
                // Synchroniser toutes les données
                this.synchroniserToutesLesDonnees();
                
                // Déclencher des événements
                window.dispatchEvent(new CustomEvent('documentSupprime', {
                    detail: documentASupprimer
                }));
                
                resolve({
                    success: true,
                    document: documentASupprimer,
                    message: 'Document supprimé avec succès'
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
}

// Initialiser le gestionnaire global
let synchronisationManager;

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    synchronisationManager = new SynchronisationManager();
});