import { Component, OnInit } from '@angular/core';
import { ChatGptService } from '../../services/chat-gpt.service';
import { Pipe, PipeTransform } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-chat-modal',
    templateUrl: './chat-modal.component.html',
    styleUrl: './chat-modal.component.scss',
})
export class ChatModalComponent implements OnInit {
    userMessage: string = '';
    messages: { role: string; content: string }[] = [];
    isThinking: boolean = false;
    isTyping: boolean = false;
    canSendMessage: boolean = true; // Variable pour contrôler si l'utilisateur peut envoyer un message
    variableCopyMessage: string = '';
    constructor(private chatService: ChatGptService, private router: Router) {}

    ngOnInit(): void {
        // Définir la taille de la zone de texte en fonction de la hauteur de la fenêtre
        this.showWelcomeMessage();
    }

    // Afficher le message de bienvenue avec une simulation de réflexion et de frappe
    showWelcomeMessage() {
        this.canSendMessage = false; // Désactiver l'envoi de message pendant le message de bienvenue

        // Temps de réflexion avant que Lizy commence à taper (entre 1 et 3 secondes, modifiable)
        const thinkingTime = Math.random() * (3 - 1) + 1;

        this.isThinking = true; // Lizy commence à réfléchir

        setTimeout(() => {
            this.isThinking = false; // Arrêter la réflexion
            this.isTyping = true; // Lizy commence à taper

            // Temps de frappe simulé avant l'affichage du message de bienvenue
            setTimeout(() => {
                this.isTyping = false; // Arrêter la frappe

                // Ajouter le message de Lizy dans l'historique
                const welcomeMessage = "Je suis Lizy, votre conseillére sur izyGlam. Comment puis-je vous aider aujourd'hui ? 😊";
                this.messages.push({ role: 'assistant', content: welcomeMessage });

                this.canSendMessage = true; // Réactiver l'envoi de messages après le message de bienvenue
            }, 2000); // Simule un temps de frappe de 2 secondes (modifiable)
        }, thinkingTime * 1000); // Temps de réflexion proportionnel avant de taper (min 1s, max 3s)
    }

    sendMessage() {
        if (!this.userMessage.trim()) return; // Ne pas envoyer de message vide
        this.variableCopyMessage = this.userMessage;

        // Ajouter le message utilisateur dans l'historique
        this.messages.push({ role: 'user', content: this.userMessage });
        this.userMessage = '';

        // Désactiver l'envoi de nouveaux messages tant que la réponse n'est pas reçue
        this.canSendMessage = false;

        // Commencer la phase de réflexion
        this.isThinking = true;


        // Nettoyer l'historique pour éviter qu'il ne devienne trop long
        // Ajouter une condition pour ne faire le clean-up que si l'historique dépasse 20 messages
        if (this.messages.length > 20) {
          this.messages = this.cleanUpHistory(this.messages);
        }
        // Ajouter un délai avant que Lizy commence à "réfléchir" (aléatoire entre 5 et 10 secondes)
        const thinkingTime = Math.random() * (10 - 5) + 5; // Min 5s, max 10s

        setTimeout(() => {
            // Passer de la réflexion à la frappe
            this.isThinking = false;
            this.isTyping = true;

            // Appel à l'API avec le message et l'historique complet des messages
            this.chatService
                .sendMessage(this.variableCopyMessage, this.messages)
                .subscribe(
                    (response) => {
                        // Extraire le paramètre 'navigateTo' du message
                        const navigateTo = this.extractNavigateTo(
                            response.message
                        );

                        // Si un 'navigateTo' est détecté, effectuer la navigation
                        if (navigateTo) {
                            this.navigateTo(navigateTo);
                        }

                        // Ajouter la réponse d'OpenAI dans l'historique (en retirant le JSON si présent)
                        const cleanMessage = response.message.replace(
                            /\{.*\}$/,
                            ''
                        ); // Supprimer le JSON s'il est à la fin
                        this.messages.push({
                            role: 'assistant',
                            content: cleanMessage,
                        });

                        // Réactiver l'envoi de messages et masquer l'animation
                        this.isTyping = false;
                        this.canSendMessage = true;

                        // Vider le champ de message utilisateur
                        this.userMessage = '';
                    },
                    (error) => {
                        console.error(
                            'Erreur lors de la communication avec OpenAI',
                            error
                        );
                        this.isTyping = false;
                        this.canSendMessage = true;
                    }
                );
        }, thinkingTime * 1000); // Temps de réflexion proportionnel avant de taper
    }



cleanUpHistory(messages: { role: string, content: string }[]): { role: string, content: string }[] {
  if (messages.length < 10) return messages;
  const numberToDelete = Math.floor(messages.length * 0.53);
  const cleanedMessages = messages.slice(numberToDelete);
  return cleanedMessages;
}

    onEnter(event: any): void {
      // Utilisation de 'any' pour contourner le problème de typage
      const keyboardEvent = event as KeyboardEvent; // Cast explicite en tant que KeyboardEvent
      keyboardEvent.preventDefault(); // Empêche le saut de ligne
    
      if (this.canSendMessage && this.userMessage.trim()) {
        this.sendMessage(); // Envoie le message
        this.resetTextArea(); // Réinitialise la taille du textarea
        this.userMessage = ''; // Efface le champ de texte après l'envoi
      }
    }
    
    resetTextArea(): void {
      const textArea = document.querySelector('.chat-input') as HTMLTextAreaElement;
      if (textArea) {
        textArea.style.height = '40px'; // Retour à la taille initiale (ou ajuste la valeur selon la taille souhaitée)
      }
    }
    
    adjustTextArea(event: Event): void {
      const target = event.target as HTMLTextAreaElement;
      target.style.height = 'auto'; // Réinitialise la hauteur pour permettre le redimensionnement
      target.style.height = `${target.scrollHeight}px`; // Ajuste la taille en fonction du contenu
    }

    // Fonction pour extraire le paramètre 'navigateTo' du message
    extractNavigateTo(response: string): any {
        console.log('Extracting navigateTo from response');
        console.log(response);

        // Trouver l'index de début de l'objet JSON
        const jsonStartIndex = response.indexOf('{');
        console.log(jsonStartIndex);

        // Vérifier si un objet JSON existe à la fin du message
        if (jsonStartIndex !== -1) {
            const jsonString = response.substring(jsonStartIndex);
            try {
                const jsonObject = JSON.parse(jsonString);
                return jsonObject.navigateTo; // Retourner la valeur de 'navigateTo'
            } catch (e) {
                console.error("Erreur lors de l'analyse du JSON", e);
            }
        }

        return null; // Retourner null si aucun JSON valide n'est trouvé
    }

    // Fonction pour naviguer vers une autre page
    navigateTo(navigateTo: any) {
        console.log('Navigating to:', navigateTo);
        if (navigateTo === 'createBoutique') {
            this.router.navigate(['creation-shop']);
        }
    }
}
