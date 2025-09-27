import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, AfterViewInit, Output, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MqttService } from '../../services/mqtt.service';
import { ConversationService } from '../../services/conversation.service';

@Component({
  selector: 'app-messagerie',
  templateUrl: './messagerie.component.html',
  styleUrls: ['./messagerie.component.scss']
})
export class MessagerieComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chatMessages', { static: false }) chatMessages!: ElementRef<HTMLDivElement>;
  @Output() me: any;

  private backButtonSub!: Subscription;
  private mqttSub!: Subscription;

  isConversationListOpen = true;
  currentUserId: string = '';
  currentLang: string = (localStorage.getItem('langue') || 'fr').replace(/"/g, '');

  newMessage = '';
  newConversationEmail = '';

  conversations: any[] = [];
  selectedConversation: any;

  isSending = false;

  // Bandeau Support (aperçu + heure + badge)
  supportUnreadCount = 0;
  supportPreview = '';
  supportPreviewTime = '';

  // anti-doublons optimistes
  private optimisticIndex: Record<string, { convId: string; createdAt: number; content: string }> = {};

  constructor(
    private conversationService: ConversationService,
    private mqttService: MqttService,
    private cdRef: ChangeDetectorRef
  ) { }

  // ===== Utils =====
  trackByConvId = (_: number, c: any) => c?._id;

  // TrackBy messages : clientId > _id > createdAt
  trackByMessage = (_: number, m: any) => m?.clientId || m?._id || m?.createdAt || _;

  private isSupport = (conv: any) => !!conv && (conv.name || '').toLowerCase() === 'support';

  private makeClientId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return (crypto as any).randomUUID();
    }
    return 'cid_' + Date.now() + '_' + Math.random().toString(16).slice(2);
  }

  private isSameMessage(a: any, b: any): boolean {
    if (!a || !b) return false;
    if (a.sender !== b.sender) return false;
    if ((a.content || '').trim() !== (b.content || '').trim()) return false;
    const ta = new Date(a.createdAt || Date.now()).getTime();
    const tb = new Date(b.createdAt || Date.now()).getTime();
    return Math.abs(ta - tb) <= 5000;
  }

  private upsertIncomingMessage(conv: any, incoming: any) {
    if (!conv) return;
    conv.messages ??= [];

    if (incoming.clientId) {
      const byClientId = conv.messages.findIndex((m: any) => m.clientId && m.clientId === incoming.clientId);
      if (byClientId !== -1) {
        conv.messages[byClientId] = { ...conv.messages[byClientId], ...incoming };
        return;
      }
    }
    const idxSimilar = conv.messages.findIndex((m: any) => this.isSameMessage(m, incoming));
    if (idxSimilar !== -1) {
      conv.messages[idxSimilar] = { ...conv.messages[idxSimilar], ...incoming };
      return;
    }
    conv.messages.push(incoming);
  }

  // ===== Lifecycle =====
  ngOnInit() {
    this.currentUserId = this.me?._id || '';
    this.loadConversations();

    // 🔌 WS global → MAJ live
    this.mqttSub = this.mqttService.subscribe().subscribe((payload: any) => {
      try {
        const { topic, message } = payload;
        if (!topic?.startsWith('conversation/')) return;

        const convId = topic.split('/')[1];

        // 1) chat ouvert
        if (this.selectedConversation?._id === convId) {
          this.selectedConversation.messages ??= [];
          this.upsertIncomingMessage(this.selectedConversation, message);
          this.scrollToBottom();
        }

        // 2) liste : upsert + remonter en haut + badge
        const idx = this.conversations.findIndex(c => c._id === convId);
        if (idx !== -1) {
          const updated = this.conversations[idx];
          updated.messages ??= [];
          this.upsertIncomingMessage(updated, message);

          // remonter en haut
          this.conversations.splice(idx, 1);
          this.conversations = [updated, ...this.conversations];

          // badge si pas la conv ouverte
          if (!this.selectedConversation || this.selectedConversation._id !== convId) {
            updated.unreadCount = (updated.unreadCount || 0) + 1;
          }

          // si c'est la conv support → MAJ du bandeau
          if (this.isSupport(updated)) {
            this.updateSupportPreviewFromConv(updated);
            if (!this.selectedConversation || this.selectedConversation._id !== convId) {
              this.supportUnreadCount = (this.supportUnreadCount || 0) + 1;
            }
          }
        }
        if (this.isUserNearBottom()) {
          this.scrollToBottom();
        }

        this.cdRef.detectChanges();
      } catch (err) {
        console.error('Erreur parsing WS:', err, payload);
      }
    });
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    if (this.backButtonSub) this.backButtonSub.unsubscribe();
    if (this.mqttSub) this.mqttSub.unsubscribe();
  }

  // ===== Data =====
  loadConversations() {
    this.conversationService.getAllConversations().subscribe({
      next: (data: any) => {
        this.conversations = (data || []).map((c: any) => ({
          ...c,
          messages: Array.isArray(c.messages) ? c.messages : [],
          unreadCount: 0
        }));

        // Abonner WS sur toutes celles qu'on a
        this.conversations.forEach(c => this.mqttService.subscribeToConversation(c._id));

        // Préparer le bandeau support si déjà là
        const sc = this.conversations.find(this.isSupport);
        if (sc) {
          this.updateSupportPreviewFromConv(sc);
        } else {
          this.supportPreview = this.translateSupportDefault();
          this.supportPreviewTime = '';
          this.supportUnreadCount = 0;
        }

        // Sélection automatique si rien n'est ouvert
        if (!this.selectedConversation && this.conversations.length > 0) {
          this.selectConversation(this.conversations[0]);
        }

        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: (err: any) => console.error(err),
    });
  }
  private isUserNearBottom(): boolean {
    if (!this.chatMessages) return false;
    const el = this.chatMessages.nativeElement;
    const threshold = 60; // px de tolérance
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }

  getOrCreateSupportConversation() {
    this.conversationService.getOrCreateSupportConversation(this.currentLang, this.currentUserId).subscribe({
      next: (conv: any) => {
        // injecter/actualiser dans la liste
        const idx = this.conversations.findIndex(c => c._id === conv._id);
        if (idx === -1) {
          this.conversations = [{ ...conv, messages: conv.messages || [], unreadCount: 0 }, ...this.conversations];
        } else {
          const merged = { ...this.conversations[idx], ...conv, messages: conv.messages || [] };
          this.conversations.splice(idx, 1);
          this.conversations = [merged, ...this.conversations];
        }

        // WS sub
        this.mqttService.subscribeToConversation(conv._id);

        // ouvrir
        this.selectConversation(conv);

        // reset badge bandeau
        this.supportUnreadCount = 0;
        const sc = this.conversations.find(c => c._id === conv._id);
        if (sc) this.updateSupportPreviewFromConv(sc);
      },
      error: (err: any) => console.error('[Support] get/create error:', err),
    });
  }

  selectConversation(conversation: any) {
    this.selectedConversation = conversation;
    this.isConversationListOpen = false;

    this.mqttService.subscribeToConversation(conversation._id);

    this.conversationService.getConversationById(conversation._id).subscribe({
      next: (conv: any) => {
        this.selectedConversation = { ...conv, messages: conv.messages || [] };

        // reset non lus
        const found = this.conversations.find(c => c._id === conversation._id);
        if (found) found.unreadCount = 0;

        // si support → reset bandeau + aperçu
        if (this.isSupport(this.selectedConversation)) {
          this.supportUnreadCount = 0;
          this.updateSupportPreviewFromConv(this.selectedConversation);
        }

        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: (err: any) => console.error(err),
    });
  }

  createConversationByEmail() {
    const email = this.newConversationEmail.trim();
    if (!email) return;

    if (!this.me || !this.me.email) {
      console.warn('Utilisateur non chargé.');
      return;
    }

    this.conversationService.getByEmail(email, this.me.email).subscribe({
      next: (conversation: any) => {
        if (!this.conversations.find((c) => c._id === conversation._id)) {
          this.conversations = [{ ...conversation, unreadCount: 0, messages: conversation.messages || [] }, ...this.conversations];
          this.mqttService.subscribeToConversation(conversation._id);
        }
        this.selectConversation(conversation);
        this.newConversationEmail = '';
      },
      error: (err: any) => {
        console.error(err);
        alert('Erreur lors de la création/récupération de la conversation');
      },
    });
  }

  toggleConversationList() {
    this.isConversationListOpen = !this.isConversationListOpen;
  }

  refreshPage(event: any) {
    this.loadConversations();
    setTimeout(() => event?.target?.complete?.(), 300);
  }

  // ===== Chat =====

  sendMessage() {
    const trimmed = (this.newMessage || '').trim();
    if (!trimmed || !this.selectedConversation?._id) return;

    this.isSending = true;

    // clientId pour dédup
    const clientId = this.makeClientId();

    // optimiste
    const optimistic = {
      clientId,
      _id: undefined,
      sender: this.currentUserId,
      content: trimmed,
      messageType: 'text',
      createdAt: new Date().toISOString(),
      __optimistic: true
    };

    this.selectedConversation.messages ??= [];
    this.selectedConversation.messages.push(optimistic);
    this.scrollToBottom();

    const isSupportConv = this.isSupport(this.selectedConversation);

    const onOk = (saved: any) => {
      // remplace optimiste si présent
      const msgs = this.selectedConversation.messages || [];
      const idx = msgs.findIndex((m: any) => m.clientId === clientId);
      if (idx !== -1) {
        this.selectedConversation.messages[idx] = { ...msgs[idx], ...saved, clientId };
      }

      this.newMessage = '';
      this.isSending = false;

      // réduit textarea
      const el = (this.chatMessages?.nativeElement?.parentElement?.querySelector('.message-input .input')) as HTMLTextAreaElement | null;
      if (el) this.resetTextarea(el);

      // MAJ liste + remonter en haut
      const listIdx = this.conversations.findIndex(c => c._id === this.selectedConversation._id);
      if (listIdx !== -1) {
        const cpy = this.conversations[listIdx];
        cpy.messages ??= [];
        this.upsertIncomingMessage(cpy, saved);
        this.conversations.splice(listIdx, 1);
        this.conversations = [cpy, ...this.conversations];

        if (this.isSupport(cpy)) {
          this.updateSupportPreviewFromConv(cpy);
        }
      }

      setTimeout(() => this.scrollToBottom(), 0);
    };

    const onErr = (err: any) => {
      console.error(err);
      const msgs = this.selectedConversation.messages || [];
      const idx = msgs.findIndex((m: any) => m.clientId === clientId);
      if (idx !== -1) this.selectedConversation.messages[idx].__failed = true;
      this.isSending = false;
    };

    if (isSupportConv) {
      this.conversationService.sendMessageToSupport({
        conversationId: this.selectedConversation._id,
        content: trimmed,
        messageType: 'text',
        clientId,
        language: this.currentLang
      }).subscribe({ next: onOk, error: onErr });
    } else {
      this.conversationService.addMessage(this.selectedConversation._id, {
        sender: this.currentUserId,
        content: trimmed,
        messageType: 'text',
        clientId
      }).subscribe({ next: onOk, error: onErr });
    }

    this.newMessage = '';
  }

  // Enter pour envoyer, Shift+Enter pour nouvelle ligne
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Auto-resize du textarea à l’input
  autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    const max = 160; // ~5-6 lignes max
    const h = Math.min(el.scrollHeight, max);
    el.style.height = h + 'px';
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }
  private resetTextarea(el: HTMLTextAreaElement) {
    el.value = '';
    el.style.height = 'auto';
    el.style.overflowY = 'hidden';
  }

  scrollToBottom() {
    try {
      if (!this.chatMessages) return;
      const el = this.chatMessages.nativeElement;
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 0); // ✅ petit délai pour laisser Angular finir le render
    } catch { }
  }

  // ===== Helpers affichage =====

  getConversationName(conversation: any): string {
    if (!conversation) return '';
    if (this.isSupport(conversation)) return 'Support';

    if (conversation.name && conversation.participants?.length > 2) {
      return conversation.name;
    }

    if (conversation.participants && conversation.participants.length === 2) {
      const other = conversation.participants.find((p: any) => p._id !== this.currentUserId);
      if (other) {
        const fullName = [other.firstname, other.lastname].filter(Boolean).join(' ');
        return fullName.trim() || other.email || 'Conversation';
      }
    }

    return conversation.name || 'Conversation';
  }

  getLastMessage(conversation: any): string {
    if (!conversation?.messages?.length) return 'Aucun message';
    const last = conversation.messages[conversation.messages.length - 1];
    return last?.content || '…';
  }

  getLastMessageTime(conversation: any): string {
    if (!conversation?.messages?.length) return '-';
    const lastMessageDate = new Date(conversation.messages[conversation.messages.length - 1].createdAt);
    return lastMessageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getProfileImage(conversation: any): string {
    const other = conversation.participants?.find((p: any) => p._id !== this.currentUserId);
    return other?.profileImage || 'assets/images/default.jpeg';
  }

  // Bandeau support
  private updateSupportPreviewFromConv(conv: any) {
    if (!conv?.messages?.length) {
      this.supportPreview = this.translateSupportDefault();
      this.supportPreviewTime = '';
      return;
    }
    const last = conv.messages[conv.messages.length - 1];
    this.supportPreview = last?.content || this.translateSupportDefault();
    this.supportPreviewTime = new Date(last.createdAt)
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  translateSupportDefault() {
    return 'Votre service client à portée de main';
  }

  openSettings() {
    console.log('⚙️ Ouverture des paramètres...');
  }
}
