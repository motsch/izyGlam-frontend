import { Component } from '@angular/core';
import { ChatGptService } from '../../services/chat-gpt.service';

@Component({
  selector: 'app-chat-modal',
  templateUrl: './chat-modal.component.html',
  styleUrl: './chat-modal.component.scss'
})
export class ChatModalComponent {
  messages: { role: string, content: string }[] = [];
  userMessage: string = '';

  constructor(private chatGptService: ChatGptService) {}

  sendMessage(): void {
    if (this.userMessage.trim()) {
      this.messages.push({ role: 'user', content: this.userMessage });

      this.chatGptService.sendMessage(this.userMessage).subscribe(response => {
        const botReply = response.choices[0].message.content;
        this.messages.push({ role: 'assistant', content: botReply });
      });

      this.userMessage = '';
    }
  }
}
