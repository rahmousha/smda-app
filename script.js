// ===== FONCTIONS UTILITAIRES COMMUNES =====

// Générer un ID unique
function genererId(prefix = '') {
    return prefix + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Formater un nombre avec 3 décimales
function formaterNombre(nombre) {
    return parseFloat(nombre || 0).toFixed(3);
}

// Formater une date
function formaterDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
}

// Calculer l'âge d'une date
function calculerAge(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const maintenant = new Date();
    const diff = maintenant - date;
    const jours = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (jours < 1) return "Aujourd'hui";
    if (jours === 1) return "Hier";
    if (jours < 7) return `Il y a ${jours} jours`;
    if (jours < 30) return `Il y a ${Math.floor(jours/7)} semaines`;
    if (jours < 365) return `Il y a ${Math.floor(jours/30)} mois`;
    return `Il y a ${Math.floor(jours/365)} ans`;
}

// Valider un email
function validerEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Valider un téléphone
function validerTelephone(telephone) {
    const regex = /^[\d\s\-\+\(\)]{8,}$/;
    return regex.test(telephone);
}

// Sauvegarder dans localStorage avec timestamp
function sauvegarderDonnees(cle, donnees) {
    const donneesAvecTimestamp = {
        ...donnees,
        _sauvegarde: new Date().toISOString()
    };
    localStorage.setItem(cle, JSON.stringify(donneesAvecTimestamp));
}

// Charger depuis localStorage
function chargerDonnees(cle) {
    const donnees = localStorage.getItem(cle);
    if (!donnees) return null;
    return JSON.parse(donnees);
}

// Vérifier si des données sont expirées
function sontDonneesExpirees(timestamp, delaiHeures = 24) {
    const maintenant = new Date();
    const dateDonnees = new Date(timestamp);
    const differenceHeures = (maintenant - dateDonnees) / (1000 * 60 * 60);
    return differenceHeures > delaiHeures;
}

// ===== GESTION DES NOTIFICATIONS =====
class NotificationManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Créer le container de notifications s'il n'existe pas
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
    }

    show(message, type = 'info', duree = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            background: ${this.getCouleurType(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 15px;
        `;

        const icon = this.getIconeType(type);
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        this.container.appendChild(notification);

        // Supprimer après la durée spécifiée
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duree);
    }

    getCouleurType(type) {
        const couleurs = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        return couleurs[type] || couleurs.info;
    }

    getIconeType(type) {
        const icones = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icones[type] || icones.info;
    }
}

// Instance globale
const notification = new NotificationManager();

// ===== GESTION DES CONFIRMATIONS =====
function confirmer(message) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 2000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 10px;
            padding: 30px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;

        content.innerHTML = `
            <h3 style="margin-bottom: 20px; color: #2c3e50;">Confirmation</h3>
            <p style="margin-bottom: 30px;">${message}</p>
            <div style="display: flex; gap: 15px;">
                <button id="confirmNo" style="flex: 1; padding: 10px; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Non
                </button>
                <button id="confirmYes" style="flex: 1; padding: 10px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Oui
                </button>
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        document.getElementById('confirmYes').onclick = () => {
            document.body.removeChild(modal);
            resolve(true);
        };

        document.getElementById('confirmNo').onclick = () => {
            document.body.removeChild(modal);
            resolve(false);
        };

        // Fermer en cliquant à l'extérieur
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                resolve(false);
            }
        };
    });
}

// ===== GESTION DU CHARGEMENT =====
class LoaderManager {
    constructor() {
        this.loader = null;
        this.init();
    }

    init() {
        if (!document.getElementById('global-loader')) {
            this.loader = document.createElement('div');
            this.loader.id = 'global-loader';
            this.loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255,255,255,0.9);
                z-index: 9999;
                display: none;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                gap: 20px;
            `;

            const spinner = document.createElement('div');
            spinner.style.cssText = `
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
            `;

            const text = document.createElement('div');
            text.textContent = 'Chargement...';
            text.style.color = '#666';

            this.loader.appendChild(spinner);
            this.loader.appendChild(text);
            document.body.appendChild(this.loader);
        } else {
            this.loader = document.getElementById('global-loader');
        }
    }

    show(message = 'Chargement...') {
        if (this.loader) {
            this.loader.querySelector('div:nth-child(2)').textContent = message;
            this.loader.style.display = 'flex';
        }
    }

    hide() {
        if (this.loader) {
            this.loader.style.display = 'none';
        }
    }
}

// Instance globale
const loader = new LoaderManager();

// ===== GESTION DES ERREURS =====
function gererErreur(erreur, contexte = '') {
    console.error(`Erreur ${contexte}:`, erreur);
    
    let message = 'Une erreur est survenue';
    if (erreur.message) {
        message = erreur.message;
    } else if (typeof erreur === 'string') {
        message = erreur;
    }

    notification.show(message, 'error');
    
    // Enregistrer l'erreur pour débogage
    const erreurs = JSON.parse(localStorage.getItem('erreurs') || '[]');
    erreurs.push({
        date: new Date().toISOString(),
        message: erreur.toString(),
        contexte: contexte,
        stack: erreur.stack
    });
    localStorage.setItem('erreurs', JSON.stringify(erreurs));
}

// ===== UTILITAIRES DE FORMATAGE =====
function formaterMontant(montant, devise = 'TND') {
    const formatter = new Intl.NumberFormat('fr-TN', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    });
    return `${formatter.format(montant)} ${devise}`;
}

function formaterPourcentage(valeur) {
    const formatter = new Intl.NumberFormat('fr-FR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
    return formatter.format(valeur / 100);
}

function formaterTelephone(numero) {
    if (!numero) return '';
    // Format tunisien : 12 345 678
    const cleaned = numero.replace(/\D/g, '');
    if (cleaned.length === 8) {
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return numero;
}

// ===== GESTION DES DONNÉES DE L'APPLICATION =====
class DataManager {
    constructor() {
        this.donnees = {
            clients: [],
            stock: [],
            historique: [],
            configuration: {}
        };
    }

    async chargerToutesLesDonnees() {
        try {
            loader.show('Chargement des données...');
            
            this.donnees.clients = JSON.parse(localStorage.getItem('clients') || '[]');
            this.donnees.stock = JSON.parse(localStorage.getItem('stock') || '[]');
            this.donnees.historique = JSON.parse(localStorage.getItem('historique_global') || '[]');
            this.donnees.configuration = {
                dernierNumeroFacture: localStorage.getItem('dernierNumeroFacture') || '0',
                dernierNumeroDevis: localStorage.getItem('dernierNumeroDevis') || '0',
                dernierNumeroBon: localStorage.getItem('dernierNumeroBon') || '0'
            };

            // Vérifier l'intégrité des données
            this.verifierIntegriteDonnees();
            
            loader.hide();
            return this.donnees;
        } catch (erreur) {
            loader.hide();
            gererErreur(erreur, 'chargement des données');
            throw erreur;
        }
    }

    verifierIntegriteDonnees() {
        // Vérifier que toutes les données nécessaires existent
        if (!localStorage.getItem('clients')) {
            localStorage.setItem('clients', '[]');
        }
        if (!localStorage.getItem('stock')) {
            localStorage.setItem('stock', '[]');
        }
        if (!localStorage.getItem('historique_global')) {
            localStorage.setItem('historique_global', '[]');
        }
    }

    async sauvegarderDonnees() {
        try {
            loader.show('Sauvegarde en cours...');
            
            localStorage.setItem('clients', JSON.stringify(this.donnees.clients));
            localStorage.setItem('stock', JSON.stringify(this.donnees.stock));
            localStorage.setItem('historique_global', JSON.stringify(this.donnees.historique));
            
            // Sauvegarder la configuration
            localStorage.setItem('dernierNumeroFacture', this.donnees.configuration.dernierNumeroFacture);
            localStorage.setItem('dernierNumeroDevis', this.donnees.configuration.dernierNumeroDevis);
            localStorage.setItem('dernierNumeroBon', this.donnees.configuration.dernierNumeroBon);
            
            loader.hide();
            notification.show('Données sauvegardées avec succès !', 'success');
        } catch (erreur) {
            loader.hide();
            gererErreur(erreur, 'sauvegarde des données');
            throw erreur;
        }
    }

    async exporterDonnees(format = 'json') {
        try {
            await this.chargerToutesLesDonnees();
            
            const donneesExport = {
                exportDate: new Date().toISOString(),
                version: '1.0',
                societe: 'S.M.D.A',
                ...this.donnees
            };
            
            let contenu, nomFichier, typeMIME;
            
            if (format === 'json') {
                contenu = JSON.stringify(donneesExport, null, 2);
                nomFichier = `export_smda_${new Date().toISOString().split('T')[0]}.json`;
                typeMIME = 'application/json';
            } else if (format === 'csv') {
                // Pour les clients
                let csvContenu = 'Type,ID,Nom,Adresse,Téléphone,Email,Total Achat\n';
                this.donnees.clients.forEach(client => {
                    csvContenu += `Client,${client.id},${client.nom},${client.adresse},${client.telephone},${client.email},${client.totalAchat || 0}\n`;
                });
                
                contenu = csvContenu;
                nomFichier = `export_clients_smda_${new Date().toISOString().split('T')[0]}.csv`;
                typeMIME = 'text/csv';
            }
            
            const blob = new Blob([contenu], { type: typeMIME });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = nomFichier;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            notification.show(`Données exportées en ${format.toUpperCase()} !`, 'success');
        } catch (erreur) {
            gererErreur(erreur, 'export des données');
        }
    }
}

// Instance globale
const dataManager = new DataManager();

// ===== INITIALISATION DE L'APPLICATION =====
function initialiserApplication() {
    // Vérifier si c'est la première visite
    if (!localStorage.getItem('premiereVisite')) {
        // Créer des données de démonstration
        initialiserDonneesDemo();
        localStorage.setItem('premiereVisite', new Date().toISOString());
    }
    
    // Configurer les tooltips
    configurerTooltips();
    
    // Configurer les raccourcis clavier
    configurerRaccourcis();
    
    // Vérifier les mises à jour
    verifierMisesAJour();
}

function initialiserDonneesDemo() {
    const stockDemo = [
        {
            id: 'PROD-001',
            code: 'LST-001',
            designation: 'Lustre Artisanal Grand Modèle',
            categorie: 'Lustres',
            quantite: 15,
            prixAchat: 120.000,
            prixVente: 250.000,
            seuilAlerte: 5,
            emplacement: 'Rayon A'
        },
        {
            id: 'PROD-002',
            code: 'LMP-001',
            designation: 'Lampe Traditionnelle Murale',
            categorie: 'Lampes',
            quantite: 8,
            prixAchat: 85.000,
            prixVente: 180.000,
            seuilAlerte: 3,
            emplacement: 'Rayon B'
        }
    ];
    
    const clientsDemo = [
        {
            id: 'CLI-001',
            nom: 'Hôtel Tunis Palace',
            type: 'Hôtel/Restaurant',
            adresse: 'Avenue Habib Bourguiba, Tunis',
            telephone: '71 234 567',
            email: 'contact@tunispalace.com',
            mf: '12345678A',
            dateInscription: new Date().toISOString(),
            totalAchat: 3049.500,
            nombreCommandes: 2
        }
    ];
    
    localStorage.setItem('stock', JSON.stringify(stockDemo));
    localStorage.setItem('clients', JSON.stringify(clientsDemo));
    localStorage.setItem('donnees_initialisees', 'true');
}

function configurerTooltips() {
    // Ajouter des tooltips aux éléments avec l'attribut data-tooltip
    document.addEventListener('mouseover', function(e) {
        const element = e.target;
        const tooltipText = element.getAttribute('data-tooltip');
        if (tooltipText) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;
            tooltip.style.cssText = `
                position: absolute;
                background: #333;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000;
                white-space: nowrap;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = element.getBoundingClientRect();
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
            tooltip.style.left = (rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)) + 'px';
            
            element._tooltip = tooltip;
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        const element = e.target;
        if (element._tooltip) {
            document.body.removeChild(element._tooltip);
            delete element._tooltip;
        }
    });
}

function configurerRaccourcis() {
    document.addEventListener('keydown', function(e) {
        // Ctrl + S : Sauvegarder
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            dataManager.sauvegarderDonnees();
        }
        
        // Ctrl + E : Exporter
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            dataManager.exporterDonnees('json');
        }
        
        // Ctrl + H : Accueil
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            window.location.href = 'index.html';
        }
        
        // Ctrl + F : Facture
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            window.location.href = 'facture.html';
        }
        
        // Ctrl + D : Dashboard
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            window.location.href = 'dashboard.html';
        }
    });
}

function verifierMisesAJour() {
    // Vérifier si une mise à jour est nécessaire
    const versionApp = '1.0';
    const versionStockee = localStorage.getItem('version_app');
    
    if (!versionStockee || versionStockee !== versionApp) {
        notification.show(
            `Application mise à jour vers la version ${versionApp}`,
            'info',
            5000
        );
        localStorage.setItem('version_app', versionApp);
    }
}

// Initialiser l'application au chargement
document.addEventListener('DOMContentLoaded', initialiserApplication);