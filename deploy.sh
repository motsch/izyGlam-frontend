#!/bin/bash

# Configuration
server_ip="192.168.13.241" # Remplacez par votre adresse IP
project_name="kanban-frontend" # Remplacez par le nom de votre projet

# Fonction pour afficher un message informatif
info() {
    echo -e "\e[92m[INFO]\e[0m $1"
}

# Fonction pour afficher un message d'erreur et quitter le script
error() {
    echo -e "\e[91m[ERROR]\e[0m $1"
    exit 1
}

# Vérification de la présence de Node.js et npm
info "Vérification de Node.js et npm..."
command -v nodejs || sudo apt install -y nodejs || error "Installation de Node.js a échoué."
command -v npm || sudo apt install -y npm || error "Installation de npm a échoué."

# Installation d'Angular CLI de manière globale
info "Installation d'Angular CLI..."
npm install -g @angular/cli || error "Installation d'Angular CLI a échoué."

# Clonage du projet Angular depuis le dépôt GitLab
info "Clonage du projet depuis GitLab..."
git clone https://fmotsch:Fr@ncis2018!@gitlab.com/l4188/customers/hitachiapp/$project_name.git || error "Le clonage du projet a échoué."
https://
# Accès au dossier du projet Angular
cd $project_name || error "Le dossier du projet n'existe pas."

# Génération du projet Angular pour la production
info "Génération du projet Angular pour la production..."
ng build --configuration=production || error "La génération du projet a échoué."

# Installation de Nginx
info "Installation de Nginx..."
sudo apt install -y nginx || error "L'installation de Nginx a échoué."

# Création du fichier de configuration Nginx
info "Configuration de Nginx..."
sudo tee /etc/nginx/sites-available/angular-app > /dev/null <<EOL
server {
    listen 80;
    server_name $server_ip;

    location / {
        root \$(pwd)/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
}
EOL

# Création d'un lien symbolique pour activer le site
sudo ln -s /etc/nginx/sites-available/angular-app /etc/nginx/sites-enabled

# Test de la configuration Nginx
info "Test de la configuration Nginx..."
sudo nginx -t || error "Le test de configuration Nginx a échoué."

# Redémarrage de Nginx
info "Redémarrage de Nginx..."
sudo service nginx restart || error "Le redémarrage de Nginx a échoué."

# Installation et exécution du backend Node.js Express
cd dist || error "Le dossier dist n'existe pas."
info "Installation et exécution du backend Node.js Express..."
npm install -g http-server || error "L'installation de http-server a échoué."
http-server -p 4200 || error "L'exécution de http-server a échoué."

# Affichage de l'URL d'accès à l'application Angular
info "Accédez à votre application Angular à l'adresse http://$server_ip:4200 dans un navigateur web."
