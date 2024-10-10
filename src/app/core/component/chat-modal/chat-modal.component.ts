import { Component } from '@angular/core';
import { ChatGptService } from '../../services/chat-gpt.service';
import { Pipe, PipeTransform } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-chat-modal',
    templateUrl: './chat-modal.component.html',
    styleUrl: './chat-modal.component.scss',
})
export class ChatModalComponent {
    userMessage: string = '';
    messages: { role: string; content: string }[] = [];
    isThinking: boolean = false;
    isTyping: boolean = false;
    canSendMessage: boolean = true; // Variable pour contrôler si l'utilisateur peut envoyer un message
    variableCopyMessage: string = '';
    constructor(private chatService: ChatGptService, private router: Router) {}

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

    adjustTextArea(event: any): void {
        const textarea = event.target;
        textarea.style.height = 'auto'; // Réinitialise la hauteur pour calculer correctement
        textarea.style.height = `${textarea.scrollHeight}px`; // Ajuste la hauteur en fonction du contenu
    }

    onEnter(event: any): void {
        // Utilisation de 'any' pour contourner le problème de typage
        const keyboardEvent = event as KeyboardEvent; // Cast explicite en tant que KeyboardEvent
        keyboardEvent.preventDefault(); // Empêche le saut de ligne

        if (this.canSendMessage) {
            this.sendMessage(); // Envoie le message
        }
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
