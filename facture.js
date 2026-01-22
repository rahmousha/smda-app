// Variables globales
let lignesArticles = [];
let compteurLignes = 0;
let factureActuelle = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initialiserFacture();
    ajouterLigneInitiale();
    chargerFactureSauvegardee();
    mettreAJourInterface();
});

// Initialiser une nouvelle facture
function initialiserFacture() {
    // Générer un ID unique pour cette session
    factureActuelle = {
        id: 'FAC-' + Date.now(),
        numero: genererNumeroFacture(),
        date: new Date().toISOString().split('T')[0],
        clientId: '',
        clientNom: '',
        clientAdresse: '',
        clientMF: '',
        articles: [],
        totalHT: 0,
        tva: 0,
        timbre: 1.000,
        totalTTC: 0,
        statut: 'brouillon',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    document.getElementById('numDoc').textContent = factureActuelle.numero;
    document.getElementById('dateDoc').value = factureActuelle.date;
}

// Générer un numéro de facture séquentiel
function genererNumeroFacture() {
    let dernierNumero = parseInt(localStorage.getItem('dernierNumeroFacture') || '397');
    let nouveauNumero = dernierNumero + 1;
    localStorage.setItem('dernierNumeroFacture', nouveauNumero);
    return nouveauNumero.toString().padStart(6, '0');
}

// Ajouter la première ligne
function ajouterLigneInitiale() {
    const tbody = document.getElementById('corpsTableau');
    tbody.innerHTML = '';
    ajouterLigne();
}

// Ajouter une nouvelle ligne d'article
function ajouterLigne() {
    const ligneId = 'ligne-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const ligne = document.createElement('tr');
    ligne.className = 'ligne-article';
    ligne.dataset.id = ligneId;
    
    ligne.innerHTML = `
        <td>
            <input type="text" class="article-input designation" 
                   placeholder="Description de l'article"
                   oninput="mettreAJourArticle('${ligneId}')">
        </td>
        <td>
            <input type="number" class="article-input qte" 
                   min="0" step="0.001" value="1"
                   oninput="mettreAJourArticle('${ligneId}')">
        </td>
        <td>
            <input type="number" class="article-input pu" 
                   min="0" step="0.001" value="0.000"
                   oninput="mettreAJourArticle('${ligneId}')">
        </td>
        <td>
            <input type="text" class="article-input total" value="0.000" readonly>
        </td>
        <td style="width: 50px;">
            <button type="button" class="btn-del" onclick="supprimerLigne('${ligneId}')">
                ✕
            </button>
        </td>
    `;
    
    document.getElementById('corpsTableau').appendChild(ligne);
    
    // Focus sur la description
    setTimeout(() => {
        ligne.querySelector('.designation').focus();
    }, 100);
    
    // Ajouter au tableau d'articles
    factureActuelle.articles.push({
        id: ligneId,
        designation: '',
        quantite: 1,
        prixUnitaire: 0,
        total: 0
    });
    
    return ligne;
}

// Mettre à jour un article
function mettreAJourArticle(ligneId) {
    const ligne = document.querySelector(`tr[data-id="${ligneId}"]`);
    if (!ligne) return;
    
    const designation = ligne.querySelector('.designation').value;
    const quantite = parseFloat(ligne.querySelector('.qte').value) || 0;
    const prix = parseFloat(ligne.querySelector('.pu').value) || 0;
    const total = quantite * prix;
    
    ligne.querySelector('.total').value = total.toFixed(3);
    
    // Mettre à jour dans factureActuelle
    const articleIndex = factureActuelle.articles.findIndex(a => a.id === ligneId);
    if (articleIndex !== -1) {
        factureActuelle.articles[articleIndex] = {
            id: ligneId,
            designation: designation,
            quantite: quantite,
            prixUnitaire: prix,
            total: total
        };
    }
    
    calculerTotaux();
    sauvegarderFacture();
}

// Supprimer une ligne
function supprimerLigne(ligneId) {
    const ligne = document.querySelector(`tr[data-id="${ligneId}"]`);
    if (!ligne) return;
    
    // Vérifier qu'il reste au moins une ligne
    if (document.querySelectorAll('.ligne-article').length <= 1) {
        afficherNotification('Au moins une ligne est requise', 'error');
        return;
    }
    
    ligne.remove();
    
    // Supprimer de factureActuelle
    factureActuelle.articles = factureActuelle.articles.filter(a => a.id !== ligneId);
    
    calculerTotaux();
    sauvegarderFacture();
}

// Calculer les totaux
function calculerTotaux() {
    let totalHT = 0;
    
    factureActuelle.articles.forEach(article => {
        totalHT += article.total || 0;
    });
    
    const tva = totalHT * 0.07;
    const totalTTC = totalHT + tva + 1.000;
    
    // Mettre à jour factureActuelle
    factureActuelle.totalHT = totalHT;
    factureActuelle.tva = tva;
    factureActuelle.totalTTC = totalTTC;
    factureActuelle.updatedAt = new Date().toISOString();
    
    // Mettre à jour l'interface
    document.getElementById('totalHT').value = totalHT.toFixed(3);
    document.getElementById('tva').value = tva.toFixed(3);
    document.getElementById('ttc').value = totalTTC.toFixed(3);
}

// Sauvegarder la facture
function sauvegarderFacture() {
    // Mettre à jour les informations client
    factureActuelle.clientNom = document.getElementById('clientName').value;
    factureActuelle.clientAdresse = document.getElementById('clientAddress').value;
    factureActuelle.clientMF = document.getElementById('clientMF').value;
    
    // Sauvegarder dans localStorage (brouillon)
    localStorage.setItem('factureBrouillon', JSON.stringify(factureActuelle));
    
    // Mettre à jour la date de sauvegarde
    document.getElementById('lastSave').textContent = 
        'Dernière sauvegarde: ' + new Date().toLocaleTimeString();
}

// Sauvegarder dans l'historique (Archive)
function sauvegarderDansHistorique() {
    // Vérifier que la facture est valide
    if (!factureActuelle.clientNom || factureActuelle.clientNom.trim() === '') {
        afficherNotification('Veuillez saisir le nom du client', 'error');
        return false;
    }
    
    if (factureActuelle.articles.length === 0 || factureActuelle.totalTTC <= 1) {
        afficherNotification('Ajoutez au moins un article', 'error');
        return false;
    }
    
    // Changer le statut
    factureActuelle.statut = 'finalisee';
    factureActuelle.dateFinalisation = new Date().toISOString();
    
    // Récupérer l'historique existant
    let historique = JSON.parse(localStorage.getItem('historiqueFactures') || '[]');
    
    // Vérifier si cette facture existe déjà (par numéro)
    const index = historique.findIndex(f => f.numero === factureActuelle.numero);
    
    if (index !== -1) {
        // Mettre à jour la facture existante
        historique[index] = factureActuelle;
    } else {
        // Ajouter la nouvelle facture
        historique.push(factureActuelle);
    }
    
    // Sauvegarder l'historique
    localStorage.setItem('historiqueFactures', JSON.stringify(historique));
    
    // Sauvegarder aussi par client
    sauvegarderParClient();
    
    // Effacer le brouillon
    localStorage.removeItem('factureBrouillon');
    
    // Générer un nouveau numéro pour la prochaine facture
    localStorage.setItem('dernierNumeroFacture', parseInt(factureActuelle.numero));
    
    afficherNotification('Facture sauvegardée dans l\'historique !', 'success');
    return true;
}

// Sauvegarder par client
function sauvegarderParClient() {
    // Récupérer ou créer le client
    let clients = JSON.parse(localStorage.getItem('clients') || '[]');
    
    // Chercher le client existant par nom ou créer un nouveau
    let clientIndex = clients.findIndex(c => 
        c.nom.toLowerCase() === factureActuelle.clientNom.toLowerCase()
    );
    
    if (clientIndex === -1) {
        // Créer un nouveau client
        const nouveauClient = {
            id: 'CLI-' + Date.now(),
            nom: factureActuelle.clientNom,
            adresse: factureActuelle.clientAdresse,
            mf: factureActuelle.clientMF,
            totalAchat: factureActuelle.totalTTC,
            nombreFactures: 1,
            datePremiereAchat: new Date().toISOString(),
            dateDerniereAchat: new Date().toISOString(),
            factures: [factureActuelle.id]
        };
        
        clients.push(nouveauClient);
    } else {
        // Mettre à jour le client existant
        clients[clientIndex].totalAchat += factureActuelle.totalTTC;
        clients[clientIndex].nombreFactures += 1;
        clients[clientIndex].dateDerniereAchat = new Date().toISOString();
        clients[clientIndex].factures.push(factureActuelle.id);
    }
    
    localStorage.setItem('clients', JSON.stringify(clients));
}

// Charger une facture sauvegardée
function chargerFactureSauvegardee() {
    const brouillon = localStorage.getItem('factureBrouillon');
    if (!brouillon) return;
    
    try {
        factureActuelle = JSON.parse(brouillon);
        
        // Mettre à jour l'interface
        document.getElementById('numDoc').textContent = factureActuelle.numero;
        document.getElementById('dateDoc').value = factureActuelle.date;
        document.getElementById('clientName').value = factureActuelle.clientNom || '';
        document.getElementById('clientAddress').value = factureActuelle.clientAdresse || '';
        document.getElementById('clientMF').value = factureActuelle.clientMF || '';
        
        // Charger les articles
        const tbody = document.getElementById('corpsTableau');
        tbody.innerHTML = '';
        
        factureActuelle.articles.forEach(article => {
            const ligne = document.createElement('tr');
            ligne.className = 'ligne-article';
            ligne.dataset.id = article.id;
            
            ligne.innerHTML = `
                <td>
                    <input type="text" class="article-input designation" 
                           value="${article.designation || ''}"
                           oninput="mettreAJourArticle('${article.id}')">
                </td>
                <td>
                    <input type="number" class="article-input qte" 
                           value="${article.quantite || 1}"
                           oninput="mettreAJourArticle('${article.id}')">
                </td>
                <td>
                    <input type="number" class="article-input pu" 
                           value="${article.prixUnitaire || 0}"
                           oninput="mettreAJourArticle('${article.id}')">
                </td>
                <td>
                    <input type="text" class="article-input total" 
                           value="${article.total ? article.total.toFixed(3) : '0.000'}" 
                           readonly>
                </td>
                <td style="width: 50px;">
                    <button type="button" class="btn-del" onclick="supprimerLigne('${article.id}')">
                        ✕
                    </button>
                </td>
            `;
            
            tbody.appendChild(ligne);
        });
        
        // Recalculer les totaux
        calculerTotaux();
        
        afficherNotification('Brouillon chargé', 'info');
    } catch (error) {
        console.error('Erreur de chargement:', error);
    }
}

// Mettre à jour l'interface
function mettreAJourInterface() {
    // Ajouter un indicateur de sauvegarde
    const toolbar = document.querySelector('.toolbar');
    if (!document.getElementById('saveIndicator')) {
        const saveIndicator = document.createElement('div');
        saveIndicator.id = 'saveIndicator';
        saveIndicator.style.cssText = `
            margin-left: auto;
            margin-right: 20px;
            font-size: 12px;
            color: #27ae60;
            display: flex;
            align-items: center;
            gap: 5px;
        `;
        saveIndicator.innerHTML = `
            <span id="lastSave">Prêt</span>
            <div class="save-dot"></div>
        `;
        
        // Ajouter au toolbar
        const toolbarRight = document.querySelector('.toolbar-right');
        toolbarRight.insertBefore(saveIndicator, toolbarRight.firstChild);
    }
}

// Fonctions pour les boutons
function sauvegarderFactureBtn() {
    if (sauvegarderDansHistorique()) {
        // Rediriger vers le tableau de bord ou rafraîchir
        afficherNotification('Facture archivée avec succès !', 'success');
        
        // Optionnel: attendre 2 secondes puis rediriger
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    }
}

function imprimerFacture() {
    if (!sauvegarderDansHistorique()) {
        return; // Ne pas imprimer si la sauvegarde a échoué
    }
    
    setTimeout(() => {
        window.print();
        afficherNotification('Facture imprimée et archivée', 'success');
    }, 500);
}

function exporterPDF() {
    if (!sauvegarderDansHistorique()) {
        return;
    }
    
    afficherLoader();
    
    const element = document.querySelector('.page');
    const options = {
        margin: [10, 10, 10, 10],
        filename: `Facture_${factureActuelle.numero}_${factureActuelle.clientNom}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(options).from(element).save().then(() => {
        cacherLoader();
        afficherNotification('PDF généré et facture archivée', 'success');
    });
}

// Fonctions utilitaires
function afficherNotification(message, type = 'info') {
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

function afficherLoader() {
    let loader = document.getElementById('loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loader';
        loader.className = 'loader active';
        loader.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loader);
    } else {
        loader.classList.add('active');
    }
}

function cacherLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.remove('active');
    }
}

// Sauvegarde automatique
setInterval(() => {
    if (factureActuelle.clientNom) {
        sauvegarderFacture();
        const saveDot = document.querySelector('.save-dot');
        if (saveDot) {
            saveDot.style.animation = 'pulse 1s';
            setTimeout(() => {
                saveDot.style.animation = '';
            }, 1000);
        }
    }
}, 30000);