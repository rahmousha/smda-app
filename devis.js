// Gestion des devis
class GestionDevis {
    constructor() {
        this.devisActuel = null;
        this.lignesArticles = [];
        this.compteurLignes = 0;
    }

    initialiser() {
        this.creerNouveauDevis();
        this.ajouterLigneInitiale();
        this.chargerBrouillon();
        this.configurerEcouteurs();
        this.calculerValidite();
    }

    creerNouveauDevis() {
        // Générer numéro
        let dernierNumero = parseInt(localStorage.getItem('dernierNumeroDevis') || '0');
        let nouveauNumero = dernierNumero + 1;
        
        this.devisActuel = {
            id: 'DEV-' + Date.now(),
            numero: 'DEV-' + nouveauNumero.toString().padStart(6, '0'),
            date: new Date().toISOString().split('T')[0],
            clientNom: '',
            clientAdresse: '',
            clientPhone: '',
            clientEmail: '',
            reference: '',
            validiteJours: 30,
            totalHT: 0,
            tva: 0,
            totalTTC: 0,
            acompte: 0,
            solde: 0,
            articles: [],
            statut: 'brouillon',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Mettre à jour l'interface
        document.getElementById('numDevis').textContent = this.devisActuel.numero;
        document.getElementById('dateDevis').value = this.devisActuel.date;
        document.getElementById('validiteJours').value = this.devisActuel.validiteJours;
    }

    ajouterLigneInitiale() {
        const tbody = document.getElementById('corpsTableau');
        tbody.innerHTML = '';
        this.ajouterLigne();
    }

    ajouterLigne() {
        this.compteurLignes++;
        const ligneId = `ligne-${this.compteurLignes}`;

        const ligne = document.createElement('tr');
        ligne.className = 'ligne-article';
        ligne.dataset.id = ligneId;

        ligne.innerHTML = `
            <td>
                <input type="text" class="article-input designation" 
                       placeholder="Description du produit/service"
                       oninput="gestionDevis.mettreAJourLigne('${ligneId}')">
            </td>
            <td>
                <input type="number" class="article-input qte" 
                       min="0" step="0.001" value="1"
                       oninput="gestionDevis.mettreAJourLigne('${ligneId}')">
            </td>
            <td>
                <input type="number" class="article-input pu" 
                       min="0" step="0.001" value="0.000"
                       oninput="gestionDevis.mettreAJourLigne('${ligneId}')">
            </td>
            <td>
                <select class="article-input tva-select" oninput="gestionDevis.mettreAJourLigne('${ligneId}')">
                    <option value="0.07">7%</option>
                    <option value="0.19">19%</option>
                    <option value="0">0%</option>
                </select>
            </td>
            <td>
                <input type="text" class="article-input total" value="0.000" readonly>
            </td>
            <td style="width: 50px;">
                <button type="button" class="btn-del" onclick="gestionDevis.supprimerLigne('${ligneId}')">
                    ✕
                </button>
            </td>
        `;

        document.getElementById('corpsTableau').appendChild(ligne);

        // Ajouter au tableau interne
        this.lignesArticles.push({
            id: ligneId,
            element: ligne
        });

        this.devisActuel.articles.push({
            id: ligneId,
            designation: '',
            quantite: 1,
            prixUnitaire: 0,
            tauxTVA: 0.07,
            totalHT: 0
        });

        // Focus
        setTimeout(() => {
            ligne.querySelector('.designation').focus();
        }, 100);

        this.calculerTotaux();
    }

    mettreAJourLigne(ligneId) {
        const ligne = document.querySelector(`tr[data-id="${ligneId}"]`);
        if (!ligne) return;

        const designation = ligne.querySelector('.designation').value;
        const quantite = parseFloat(ligne.querySelector('.qte').value) || 0;
        const prixUnitaire = parseFloat(ligne.querySelector('.pu').value) || 0;
        const tauxTVA = parseFloat(ligne.querySelector('.tva-select').value) || 0.07;
        const totalHT = quantite * prixUnitaire;

        ligne.querySelector('.total').value = totalHT.toFixed(3);

        // Mettre à jour dans devisActuel
        const articleIndex = this.devisActuel.articles.findIndex(a => a.id === ligneId);
        if (articleIndex !== -1) {
            this.devisActuel.articles[articleIndex] = {
                id: ligneId,
                designation: designation,
                quantite: quantite,
                prixUnitaire: prixUnitaire,
                tauxTVA: tauxTVA,
                totalHT: totalHT
            };
        }

        this.calculerTotaux();
        this.sauvegarderBrouillon();
    }

    supprimerLigne(ligneId) {
        const ligne = document.querySelector(`tr[data-id="${ligneId}"]`);
        if (!ligne) return;

        if (document.querySelectorAll('.ligne-article').length <= 1) {
            this.afficherNotification('Au moins une ligne est requise', 'error');
            return;
        }

        ligne.remove();

        // Supprimer des tableaux internes
        this.lignesArticles = this.lignesArticles.filter(l => l.id !== ligneId);
        this.devisActuel.articles = this.devisActuel.articles.filter(a => a.id !== ligneId);

        this.calculerTotaux();
        this.sauvegarderBrouillon();
    }

    calculerTotaux() {
        let totalHT = 0;
        let totalTVA = 0;

        this.devisActuel.articles.forEach(article => {
            const tvaArticle = article.totalHT * article.tauxTVA;
            totalHT += article.totalHT || 0;
            totalTVA += tvaArticle;
        });

        const totalTTC = totalHT + totalTVA;
        const acompte = totalTTC * 0.5;
        const solde = totalTTC * 0.5;

        // Mettre à jour devisActuel
        this.devisActuel.totalHT = totalHT;
        this.devisActuel.tva = totalTVA;
        this.devisActuel.totalTTC = totalTTC;
        this.devisActuel.acompte = acompte;
        this.devisActuel.solde = solde;
        this.devisActuel.updatedAt = new Date().toISOString();

        // Mettre à jour l'interface
        document.getElementById('totalHT').value = totalHT.toFixed(3);
        document.getElementById('tva').value = totalTVA.toFixed(3);
        document.getElementById('ttc').value = totalTTC.toFixed(3);
        document.getElementById('acompte').value = acompte.toFixed(3);
        document.getElementById('solde').value = solde.toFixed(3);
    }

    calculerValidite() {
        const jours = parseInt(document.getElementById('validiteJours').value) || 30;
        const dateDevis = new Date(document.getElementById('dateDevis').value);
        dateDevis.setDate(dateDevis.getDate() + jours);

        const jour = dateDevis.getDate().toString().padStart(2, '0');
        const mois = (dateDevis.getMonth() + 1).toString().padStart(2, '0');
        const annee = dateDevis.getFullYear();

        document.getElementById('dateValidite').textContent = `${jour}/${mois}/${annee}`;
        this.devisActuel.validiteJours = jours;
    }

    sauvegarderBrouillon() {
        // Mettre à jour les informations client
        this.devisActuel.clientNom = document.getElementById('clientName').value;
        this.devisActuel.clientAdresse = document.getElementById('clientAddress').value;
        this.devisActuel.clientPhone = document.getElementById('clientPhone').value;
        this.devisActuel.clientEmail = document.getElementById('clientEmail').value;
        this.devisActuel.reference = document.getElementById('referenceDevis').value;
        this.devisActuel.validiteJours = parseInt(document.getElementById('validiteJours').value) || 30;

        localStorage.setItem('devisBrouillon', JSON.stringify(this.devisActuel));
    }

    chargerBrouillon() {
        const brouillon = localStorage.getItem('devisBrouillon');
        if (!brouillon) return;

        try {
            this.devisActuel = JSON.parse(brouillon);

            // Mettre à jour l'interface
            document.getElementById('numDevis').textContent = this.devisActuel.numero;
            document.getElementById('dateDevis').value = this.devisActuel.date;
            document.getElementById('clientName').value = this.devisActuel.clientNom || '';
            document.getElementById('clientAddress').value = this.devisActuel.clientAdresse || '';
            document.getElementById('clientPhone').value = this.devisActuel.clientPhone || '';
            document.getElementById('clientEmail').value = this.devisActuel.clientEmail || '';
            document.getElementById('referenceDevis').value = this.devisActuel.reference || '';
            document.getElementById('validiteJours').value = this.devisActuel.validiteJours || 30;

            // Calculer date de validité
            this.calculerValidite();

            // Charger les articles
            const tbody = document.getElementById('corpsTableau');
            tbody.innerHTML = '';
            this.lignesArticles = [];
            this.compteurLignes = 0;

            this.devisActuel.articles.forEach(article => {
                this.compteurLignes++;
                const ligne = document.createElement('tr');
                ligne.className = 'ligne-article';
                ligne.dataset.id = article.id;

                ligne.innerHTML = `
                    <td>
                        <input type="text" class="article-input designation" 
                               value="${article.designation || ''}"
                               oninput="gestionDevis.mettreAJourLigne('${article.id}')">
                    </td>
                    <td>
                        <input type="number" class="article-input qte" 
                               value="${article.quantite || 1}"
                               oninput="gestionDevis.mettreAJourLigne('${article.id}')">
                    </td>
                    <td>
                        <input type="number" class="article-input pu" 
                               value="${article.prixUnitaire || 0}"
                               oninput="gestionDevis.mettreAJourLigne('${article.id}')">
                    </td>
                    <td>
                        <select class="article-input tva-select" oninput="gestionDevis.mettreAJourLigne('${article.id}')">
                            <option value="0.07" ${article.tauxTVA === 0.07 ? 'selected' : ''}>7%</option>
                            <option value="0.19" ${article.tauxTVA === 0.19 ? 'selected' : ''}>19%</option>
                            <option value="0" ${article.tauxTVA === 0 ? 'selected' : ''}>0%</option>
                        </select>
                    </td>
                    <td>
                        <input type="text" class="article-input total" 
                               value="${article.totalHT ? article.totalHT.toFixed(3) : '0.000'}" 
                               readonly>
                    </td>
                    <td style="width: 50px;">
                        <button type="button" class="btn-del" onclick="gestionDevis.supprimerLigne('${article.id}')">
                            ✕
                        </button>
                    </td>
                `;

                tbody.appendChild(ligne);
                this.lignesArticles.push({
                    id: article.id,
                    element: ligne
                });
            });

            this.calculerTotaux();
            this.afficherNotification('Brouillon chargé', 'info');
        } catch (error) {
            console.error('Erreur de chargement:', error);
        }
    }

    sauvegarderDevis() {
        // Validation
        if (!this.devisActuel.clientNom || this.devisActuel.clientNom.trim() === '') {
            this.afficherNotification('Veuillez saisir le nom du client', 'error');
            return false;
        }

        if (this.devisActuel.articles.length === 0 || this.devisActuel.totalTTC <= 0) {
            this.afficherNotification('Ajoutez au moins un article valide', 'error');
            return false;
        }

        // Changer le statut
        this.devisActuel.statut = 'en_attente';
        this.devisActuel.dateSauvegarde = new Date().toISOString();

        // Sauvegarder dans l'historique
        let historique = JSON.parse(localStorage.getItem('historiqueDevis') || '[]');
        
        // Vérifier si existe déjà
        const index = historique.findIndex(d => d.numero === this.devisActuel.numero);
        if (index !== -1) {
            historique[index] = this.devisActuel;
        } else {
            historique.push(this.devisActuel);
        }

        localStorage.setItem('historiqueDevis', JSON.stringify(historique));

        // Mettre à jour le numéro
        const numeroActuel = parseInt(this.devisActuel.numero.replace('DEV-', ''));
        localStorage.setItem('dernierNumeroDevis', numeroActuel);

        // Effacer le brouillon
        localStorage.removeItem('devisBrouillon');

        this.afficherNotification('Devis sauvegardé avec succès !', 'success');
        return true;
    }

    configurerEcouteurs() {
        // Validité du devis
        document.getElementById('validiteJours').addEventListener('input', () => {
            this.calculerValidite();
            this.sauvegarderBrouillon();
        });

        // Date du devis
        document.getElementById('dateDevis').addEventListener('change', () => {
            this.calculerValidite();
            this.sauvegarderBrouillon();
        });

        // Champs client
        document.querySelectorAll('.client-input').forEach(input => {
            input.addEventListener('input', () => {
                this.sauvegarderBrouillon();
            });
        });

        // Sauvegarde automatique
        setInterval(() => {
            if (this.devisActuel.clientNom) {
                this.sauvegarderBrouillon();
            }
        }, 30000);
    }

    afficherNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialiser l'application
const gestionDevis = new GestionDevis();

// Fonctions globales pour les boutons
function ajouterLigne() {
    gestionDevis.ajouterLigne();
}

function calculerDevis() {
    gestionDevis.calculerTotaux();
}

function sauvegarderDevis() {
    if (gestionDevis.sauvegarderDevis()) {
        // Optionnel: rediriger après sauvegarde
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

function imprimerDevis() {
    if (gestionDevis.sauvegarderDevis()) {
        setTimeout(() => {
            window.print();
        }, 500);
    }
}

// Démarrer l'application
document.addEventListener('DOMContentLoaded', function() {
    gestionDevis.initialiser();
});