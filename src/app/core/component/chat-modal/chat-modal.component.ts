import { Component, OnInit } from '@angular/core';
import { ChatGptService } from '../../services/chat-gpt.service';
import { Pipe, PipeTransform } from '@angular/core';
import { Router } from '@angular/router';

// ✅izyGlam: traductions & toasts
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-chat-modal',
  templateUrl: './chat-modal.component.html',
  styleUrl: './chat-modal.component.scss',
})
export class ChatModalComponent implements OnInit {
  // 🧑‍💬 Message en cours de saisie
  userMessage: string = '';

  // 🗂️ Historique des messages affichés dans la modale
  messages: { role: string; content: string }[] = [];

  // 🧠/⌨️ États UI simulant la réflexion et la frappe de l’assistant
  isThinking: boolean = false;
  isTyping: boolean = false;

  // 🚦 Bloque l’envoi pendant traitement pour éviter le spam
  canSendMessage: boolean = true;

  // 🔁 Copie du dernier message envoyé (utilisé pour l’appel API)
  variableCopyMessage: string = '';

  constructor(
    private chatService: ChatGptService,
    private router: Router,

    // ✅izyGlam
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  // -----------------------------------------------------------
  // ♻️ Init composant : message de bienvenue simulé
  // -----------------------------------------------------------
  ngOnInit(): void {
    this.showWelcomeMessage();
  }

  // -----------------------------------------------------------
  // 🙋‍♀️ Message de bienvenue avec délai de “réflexion” + “frappe”
  // -----------------------------------------------------------
  showWelcomeMessage() {
    this.canSendMessage = false; // On désactive l’envoi durant l’animation
    const thinkingTime = Math.random() * (3 - 1) + 1; // 1 à 3 sec

    this.isThinking = true;
    setTimeout(() => {
      this.isThinking = false;
      this.isTyping = true;

      setTimeout(() => {
        this.isTyping = false;

        const welcomeMessage =
          "Je suis Lizy, votre conseillére sur izyGlam. Comment puis-je vous aider aujourd'hui ? 😊";
        this.messages.push({ role: 'assistant', content: welcomeMessage });

        this.canSendMessage = true; // Réactivation
      }, 2000); // 2s de frappes simulées
    }, thinkingTime * 1000);
  }

  // -----------------------------------------------------------
  // 📤 Envoi d’un message utilisateur + appel API
  // -----------------------------------------------------------
  sendMessage() {
    // Ne rien faire si le champ est vide
    if (!this.userMessage.trim()) return;

    // Conserver une copie (évite race conditions si userMessage change)
    this.variableCopyMessage = this.userMessage;

    // Ajout du message utilisateur dans l’historique
    this.messages.push({ role: 'user', content: this.userMessage });
    this.userMessage = '';

    // Empêche l’envoi tant que la réponse n’est pas reçue
    this.canSendMessage = false;

    // Phase de réflexion (UI)
    this.isThinking = true;

    // 🧹 Si l’historique devient trop long, on le purge partiellement
    if (this.messages.length > 20) {
      this.messages = this.cleanUpHistory(this.messages);
    }

    // Délai aléatoire de réflexion (5 à 10 sec)
    const thinkingTime = Math.random() * (10 - 5) + 5;

    setTimeout(() => {
      // Passage en mode “frappe”
      this.isThinking = false;
      this.isTyping = true;

      // 📡 Appel API: on envoie le message + l’historique
      this.chatService
        .sendMessage(this.variableCopyMessage, this.messages)
        .subscribe({
          next: (response) => {
            try {
              // Tente d’extraire des instructions de navigation JSON en fin de message
              const navigateTo = this.extractNavigateTo(response.message);
              if (navigateTo) {
                this.navigateTo(navigateTo);
              }

              // Nettoie le message de tout JSON éventuel collé à la fin
              const cleanMessage = response.message.replace(/\{.*\}$/, '');

              // Ajoute la réponse de l’assistant dans l’historique
              this.messages.push({ role: 'assistant', content: cleanMessage });
            } catch (err) {
              console.error('Erreur de post-traitement de la réponse:', err);
              this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            } finally {
              // Quoi qu’il arrive, on réactive l’envoi et on coupe l’animation de frappe
              this.isTyping = false;
              this.canSendMessage = true;
              this.userMessage = '';
            }
          },
          error: (error) => {
            console.error('Erreur lors de la communication avec OpenAI', error);
            // ✅ Toast d’erreurizyGlam générique
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));

            // Fin d’état de frappe / réactivation de l’envoi
            this.isTyping = false;
            this.canSendMessage = true;
          },
        });
    }, thinkingTime * 1000);
  }

  // -----------------------------------------------------------
  // 🧹 Réduction de l’historique pour éviter la surcharge mémoire
  // -----------------------------------------------------------
  cleanUpHistory(
    messages: { role: string; content: string }[]
  ): { role: string; content: string }[] {
    if (messages.length < 10) return messages;
    const numberToDelete = Math.floor(messages.length * 0.53);
    const cleanedMessages = messages.slice(numberToDelete);
    return cleanedMessages;
  }

  // -----------------------------------------------------------
  // ⏎ Envoi via Enter (comportement UX)
  // -----------------------------------------------------------
  onEnter(event: any): void {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault(); // Empêche le retour à la ligne

    if (this.canSendMessage && this.userMessage.trim()) {
      this.sendMessage();
      this.resetTextArea();
      this.userMessage = '';
    }
  }

  // -----------------------------------------------------------
  // 🧼 Reset visuel du textarea après envoi
  // -----------------------------------------------------------
  resetTextArea(): void {
    const textArea = document.querySelector('.chat-input') as HTMLTextAreaElement;
    if (textArea) {
      textArea.style.height = '40px';
    }
  }

  // -----------------------------------------------------------
  // ↕️ Ajuste dynamiquement la hauteur du textarea
  // -----------------------------------------------------------
  adjustTextArea(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  }

  // -----------------------------------------------------------
  // 🔎 Extrait un JSON final { "navigateTo": ... } si présent
  // -----------------------------------------------------------
  extractNavigateTo(response: string): any {
    try {
      // Cherche l’index du premier '{' à partir de la fin du message
      const jsonStartIndex = response.indexOf('{');
      if (jsonStartIndex === -1) return null;

      const jsonString = response.substring(jsonStartIndex);
      const jsonObject = JSON.parse(jsonString);
      return jsonObject.navigateTo || null;
    } catch (e) {
      console.error("Erreur lors de l'analyse du JSON", e);
      return null;
    }
  }

  // -----------------------------------------------------------
  // 🧭 Navigation pilotée par la réponse modèle
  // -----------------------------------------------------------
  navigateTo(navigateTo: any) {
    try {
      if (navigateTo === 'createBoutique') {
        this.router.navigate(['creation-shop']);
      }
      // 👇 Tu pourras ajouter d’autres routes ici (ex: 'prices', 'profile-setup', etc.)
    } catch (err) {
      console.error('Erreur de navigation :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // -----------------------------------------------------------
  // ✨ Toast d’erreur/notification styliséizyGlam
  // -----------------------------------------------------------
  private showCustomToast(message: string) {
    // ℹ️ Convention: pour erreurs → error(); pour messages neutres → success() si besoin.
    this.toastr.error(message);
  }
}
