import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-messagerie',
  templateUrl: './admin-messagerie.component.html',
  styleUrls: ['./admin-messagerie.component.scss']
})
export class AdminMessagerieComponent {
  userMessage: string = '';
  selectedConversation: any = null;

  conversations = [
    { 
      title: 'Jean Dupont', 
      lastMessage: 'À plus tard !', 
      messages: [
        { role: 'user', content: 'Bonjour !' }, 
        { role: 'contact', content: 'Salut !' }
      ] 
    },
    { 
      title: 'Marie Curie', 
      lastMessage: 'D\'accord, merci !', 
      messages: [
        { role: 'user', content: 'Comment ça va ?' }, 
        { role: 'contact', content: 'Très bien, merci !' }
      ] 
    }
  ];

  ngOnInit(): void {
    localStorage.setItem("menu-param", 'admin');
    this.selectedConversation = this.conversations[0];
  }

  selectConversation(conversation: any) {
    this.selectedConversation = conversation;
  }

  sendMessage(event: any) {
    event.preventDefault();
    if (this.userMessage.trim()) {
      // Ajouter le message utilisateur dans la conversation
      this.selectedConversation.messages.push({ role: 'user', content: this.userMessage });
      this.selectedConversation.lastMessage = this.userMessage;
      this.userMessage = '';

      // Simuler une réponse automatique après 1,5 secondes
      setTimeout(() => {
        const response = 'Réponse automatique de ' + this.selectedConversation.title;
        this.selectedConversation.messages.push({ role: 'contact', content: response });
        this.selectedConversation.lastMessage = response;
      }, 1500);
    }
  }
}
