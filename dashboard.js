window.onload = () => {
    // Récupère l'historique enregistré par facture.js
    let historique = JSON.parse(localStorage.getItem("historique_factures") || "[]");
    
    // Calcule la somme
    let total = historique.reduce((sum, item) => sum + item.montant, 0);
    
    // Met à jour l'affichage
    document.getElementById("nbFactures").innerText = historique.length;
    document.getElementById("ca").innerText = total.toFixed(3) + " TND";
};