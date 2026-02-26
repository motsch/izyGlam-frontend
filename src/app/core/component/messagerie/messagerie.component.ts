import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  HostListener
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MqttService } from '../../services/mqtt.service';
import { ConversationService } from '../../services/conversation.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-messagerie',
  templateUrl: './messagerie.component.html',
  styleUrls: ['./messagerie.component.scss']
})
export class MessagerieComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  /** Conteneur DOM du flux de messages pour gérer l’auto-scroll bottom */
  @ViewChild('chatMessages', { static: false }) chatMessages!: ElementRef<HTMLDivElement>;
  /** Utilisateur courant injecté par le parent */
  @Input() me: any;

  /** Abonnement global MQTT (on garde 1 seule sub et on la nettoie au destroy) */
  private mqttSub!: Subscription;

  /** UI state : panneau des conversations (mobile/étroit) */
  isConversationListOpen = true;

  /** Contexte utilisateur / langue */
  currentUserId: string = '';
  currentLang: string = (localStorage.getItem('langue') || 'fr').replace(/"/g, '');

  /** Nouveau message saisi + adresse email pour créer une conversation */
  newMessage = '';
  newConversationEmail = '';

  /** Liste de conversations et conversation sélectionnée */
  conversations: any[] = [];
  selectedConversation: any;

  /** Flag pour désactiver le bouton “envoyer” pendant un POST */
  isSending = false;

  /** Bandeau “Support” (aperçu + horodatage + badge non lus) */
  supportUnreadCount = 0;
  supportPreview = '';
  supportPreviewTime = '';

  /** Anti-doublons (optimistic UI) – indexation par clientId */
  private optimisticIndex: Record<string, { convId: string; createdAt: number; content: string }> = {};

  constructor(
    private conversationService: ConversationService,
    private mqttService: MqttService,
    private cdRef: ChangeDetectorRef,
    private toastr: ToastrService,
    private userService: UserService,
    private translate: TranslateService
  ) { }

  // =========================
  // Helpers d’identification
  // =========================

  /** Optimise *ngFor sur conversations */
  trackByConvId = (_: number, c: any) => c?._id;

  /** Optimise *ngFor sur messages */
  trackByMessage = (_: number, m: any) => m?.clientId || m?._id || m?.createdAt || _;

  /** Détecte la conversation “Support” (convention côté backend) */
  private isSupport = (conv: any) => !!conv && (conv.name || '').toLowerCase() === 'support';

  /** Génère un identifiant client pour déduper un message optimiste vs. réponse serveur */
  private makeClientId(): string {
    try {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return (crypto as any).randomUUID();
      }
    } catch { /* pas critique, on fallback */ }
    return 'cid_' + Date.now() + '_' + Math.random().toString(16).slice(2);
  }

  /** Heuristique “même message” (pour éviter doublons via MQTT & REST) */
  private isSameMessage(a: any, b: any): boolean {
    if (!a || !b) return false;
    if (a.sender !== b.sender) return false;
    if ((a.content || '').trim() !== (b.content || '').trim()) return false;
    const ta = new Date(a.createdAt || Date.now()).getTime();
    const tb = new Date(b.createdAt || Date.now()).getTime();
    return Math.abs(ta - tb) <= 5000; // ±5s tolérance
  }

  /** Upsert d’un message (par clientId ou heuristique) dans une conversation */
  private upsertIncomingMessage(conv: any, incoming: any) {
    if (!conv) return;
    conv.messages ??= [];

    // 1) Clé client → remplacement
    if (incoming.clientId) {
      const byClientId = conv.messages.findIndex((m: any) => m.clientId && m.clientId === incoming.clientId);
      if (byClientId !== -1) {
        conv.messages[byClientId] = { ...conv.messages[byClientId], ...incoming };
        return;
      }
    }

    // 2) Heuristique “même message”
    const idxSimilar = conv.messages.findIndex((m: any) => this.isSameMessage(m, incoming));
    if (idxSimilar !== -1) {
      conv.messages[idxSimilar] = { ...conv.messages[idxSimilar], ...incoming };
      return;
    }

    // 3) Ajout
    conv.messages.push(incoming);
  }

  // ============== Lifecycle ==============

  ngOnInit() {
    try {
      if (!this.me) {
        this.userService.getMe().subscribe({
          next: (user: any) => {
            try {
              this.me = user;
              this.currentUserId = user;
            } catch (e) {
              console.error('[loadConversations] Traitement des données :', e);
              this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
            }
          },
          error: (err: any) => {
            console.error('[loadConversations] Erreur HTTP :', err);
            this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
          }
        })
      }
      // Récupère l’id utilisateur dès que possible (si “me” est déjà injecté à l’init)
      this.currentUserId = this.me?._id || '';

      // Charge la liste des conversations
      this.loadConversations();

      // Abonnement global MQTT : réception des nouveaux messages
      this.mqttSub = this.mqttService.subscribe().subscribe((payloaded: any) => {
        try {

          // 1) Parse robuste (string → objet). Gère même le double encodage éventuel.
          let payload: any = payloaded;
          if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch { /* on laisse tel quel */ }
          }
          // Parfois certains back envoient { topic, message: "..." } (stringifiée à l’intérieur)
          if (payload && typeof payload.message === 'string') {
            try { payload.message = JSON.parse(payload.message); } catch { /* noop */ }
          }

          // 2) Extraction défensive
          const topic2: string | undefined = payload?.topic;
          const message2: any = payload?.message;

          // 3) Logs utiles
          console.log('[WS] brut:', payloaded);
          console.log('[WS] payload objet:', payload);
          console.log('[WS] topic:', topic2);
          const { topic, message } = payload || {};
          const toto = payload.message.content;
          console.log("message : " + JSON.stringify(toto));
          if (!topic?.startsWith('conversation/')) return;
          const convId = topic.split('/')[1];

          // 1) Si la conv ouverte reçoit un message : upsert + scroll si proche du bas
          if (this.selectedConversation?._id === convId) {
            this.selectedConversation.messages ??= [];
            this.upsertIncomingMessage(this.selectedConversation, message);
            if (this.isUserNearBottom()) this.scrollToBottom();
          }

          // 2) Met à jour la conv correspondante dans la liste et remonte-la en tête
          const idx = this.conversations.findIndex(c => c._id === convId);
          if (idx !== -1) {
            const updated = { ...this.conversations[idx] };
            updated.messages ??= [];
            this.upsertIncomingMessage(updated, message);

            // Remonter en haut
            this.conversations.splice(idx, 1);
            this.conversations = [updated, ...this.conversations];

            // Badge si conv non ouverte
            if (!this.selectedConversation || this.selectedConversation._id !== convId) {
              updated.unreadCount = (updated.unreadCount || 0) + 1;
            }

            // Bandeau support
            if (this.isSupport(updated)) {
              this.updateSupportPreviewFromConv(updated);
              if (!this.selectedConversation || this.selectedConversation._id !== convId) {
                this.supportUnreadCount = (this.supportUnreadCount || 0) + 1;
              }
            }
          }

          this.cdRef.detectChanges();
        } catch (err) {
          console.error('[MQTT] Erreur lors du traitement du payload :', err, payloaded);
        }
      });
    } catch (e) {
      console.error('[Init] Erreur inattendue :', e);
      this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
    }
  }

  /** Si l’@Input me change après l’init (parent async), on resynchronise l’id */
  ngOnChanges(changes: SimpleChanges): void {
    try {
      if (changes['me'] && changes['me'].currentValue) {
        this.currentUserId = this.me?._id || '';
        // Si on n’a pas encore chargé de conversations (ex: init très tôt)
        if (!this.conversations || this.conversations.length === 0) {
          this.loadConversations();
        }
      }
    } catch (e) {
      console.error('[OnChanges] Erreur :', e);
    }
  }

  ngAfterViewInit() {
    // Petit délai pour laisser Angular finir le rendu
    this.scrollToBottom();
  }

  ngOnDestroy() {
    try {
      if (this.mqttSub) this.mqttSub.unsubscribe();
    } catch (e) {
      console.warn('[Destroy] Problème lors de l’unsubscribe MQTT :', e);
    }
  }

  private resolveConversationTypeByRole(role: string | undefined | null): 'user' | 'pro' {
    // user | professionnel | admin | boss => user
    // entreprise => pro
    if (role === 'entreprise') return 'pro';
    return 'user';
  }

  // =========================
  // Chargement des données
  // =========================

  /** Charge toutes les conversations du user (et s’abonne en WS à chacune d’elles) */
  loadConversations() {
    try {
      // ✅ Récupère l’utilisateur courant (à adapter à ton app)
      const currentUser = this.me;

      const userId: string | undefined = currentUser?._id || currentUser?.id;
      const role: string | undefined = currentUser?.role;

      if (!userId) {
        console.warn('[loadConversations] userId introuvable');
        this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
        return;
      }

      const type = this.resolveConversationTypeByRole(role);

      this.conversationService.getConversationsByType(type, userId).subscribe({
        next: (data: any) => {
          try {
            this.conversations = (data || []).map((c: any) => ({
              ...c,
              messages: Array.isArray(c.messages) ? c.messages : [],
              unreadCount: 0
            }));

            // Abonnement WS sur chaque conv
            this.conversations.forEach(c => {
              try {
                if (c?._id) this.mqttService.subscribeToConversation(c._id);
              } catch (e) {
                console.warn('[MQTT] Abonnement conversation échoué :', c?._id, e);
              }
            });

            // Bandeau Support
            const sc = this.conversations.find(this.isSupport);
            if (sc) {
              this.updateSupportPreviewFromConv(sc);
            } else {
              this.supportPreview = this.translateSupportDefault();
              this.supportPreviewTime = '';
              this.supportUnreadCount = 0;
            }

            // Sélection auto
            if (!this.selectedConversation && this.conversations.length > 0) {
              this.selectConversation(this.conversations[0]);
            }

            setTimeout(() => this.scrollToBottom(), 50);
          } catch (e) {
            console.error('[loadConversations] Traitement des données :', e);
            this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
          }
        },
        error: (err: any) => {
          console.error('[loadConversations] Erreur HTTP :', err);
          this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
        }
      });
    } catch (e) {
      console.error('[loadConversations] Erreur inattendue :', e);
      this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
    }
  }


  /** Détermine si l’utilisateur est “proche” du bas (pour autoscroll smart) */
  private isUserNearBottom(): boolean {
    if (!this.chatMessages) return false;
    const el = this.chatMessages.nativeElement;
    const threshold = 60; // px de tolérance
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }

  /** Récupère (ou crée) la conversation avec le support, l’ouvre et reset les badges */
  getOrCreateSupportConversation() {
    try {
      this.conversationService.getOrCreateSupportConversation(this.currentLang, this.currentUserId).subscribe({
        next: (conv: any) => {
          try {
            // Injecte/actualise dans la liste
            const idx = this.conversations.findIndex(c => c._id === conv._id);
            if (idx === -1) {
              this.conversations = [{ ...conv, messages: conv.messages || [], unreadCount: 0 }, ...this.conversations];
            } else {
              const merged = { ...this.conversations[idx], ...conv, messages: conv.messages || [] };
              this.conversations.splice(idx, 1);
              this.conversations = [merged, ...this.conversations];
            }

            // Abonnement WS dédié
            if (conv?._id) this.mqttService.subscribeToConversation(conv._id);

            // Ouvrir la conv Support
            this.selectConversation(conv);

            // Reset bandeau Support
            this.supportUnreadCount = 0;
            const sc = this.conversations.find(c => c._id === conv._id);
            if (sc) this.updateSupportPreviewFromConv(sc);

            this.showCustomToast(this.translate.instant('SUCCESS.SUBSCRIBE_SUCCESS') || 'Opération réussie.', 'success');
          } catch (e) {
            console.error('[getOrCreateSupportConversation] Traitement :', e);
            this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
          }
        },
        error: (err: any) => {
          console.error('[Support] get/create error :', err);
          this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
        }
      });
    } catch (e) {
      console.error('[getOrCreateSupportConversation] Erreur inattendue :', e);
      this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
    }
  }

  /** Ouvre une conversation, récupère ses messages frais en base et reset les non-lus */
  selectConversation(conversation: any) {
    try {
      if (!conversation?._id) return;

      this.selectedConversation = conversation;
      this.isConversationListOpen = false;

      // S’abonner WS pour cette conv (au cas où)
      this.mqttService.subscribeToConversation(conversation._id);

      // Récupérer la conv “fraîche” depuis l’API
      this.conversationService.getConversationById(conversation._id).subscribe({
        next: (conv: any) => {
          try {
            this.selectedConversation = { ...conv, messages: conv.messages || [] };

            // Reset badge non-lus côté liste
            const found = this.conversations.find(c => c._id === conversation._id);
            if (found) found.unreadCount = 0;

            // Update bandeau support si besoin
            if (this.isSupport(this.selectedConversation)) {
              this.supportUnreadCount = 0;
              this.updateSupportPreviewFromConv(this.selectedConversation);
            }

            setTimeout(() => this.scrollToBottom(), 50);
          } catch (e) {
            console.error('[selectConversation] Traitement :', e);
            this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
          }
        },
        error: (err: any) => {
          console.error('[selectConversation] Erreur HTTP :', err);
          this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
        }
      });
    } catch (e) {
      console.error('[selectConversation] Erreur inattendue :', e);
      this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
    }
  }

  /** Crée (ou récupère) une conversation par email de destinataire */
  createConversationByEmail() {
    try {
      const email = (this.newConversationEmail || '').trim();
      if (!email) return;

      // Validation email simple (évite des 400 évidents)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.showCustomToast('ERROR.GENERIC_ERROR', 'error'); // remplace par une clé dédiée si tu en as une
        return;
      }

      if (!this.me || !this.me.email) {
        console.warn('[createConversationByEmail] Utilisateur non chargé.');
        this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
        return;
      }

      this.conversationService.getByEmail(email, this.me.email).subscribe({
        next: (conversation: any) => {
          try {
            // Injecte en tête si absente
            if (!this.conversations.find((c) => c._id === conversation._id)) {
              this.conversations = [{ ...conversation, unreadCount: 0, messages: conversation.messages || [] }, ...this.conversations];
              if (conversation?._id) this.mqttService.subscribeToConversation(conversation._id);
            }
            this.selectConversation(conversation);
            this.newConversationEmail = '';
            this.showCustomToast(this.translate.instant('SUCCESS.SUBSCRIBE_SUCCESS') || 'Conversation prête.', 'success');
          } catch (e) {
            console.error('[createConversationByEmail] Traitement :', e);
            this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
          }
        },
        error: (err: any) => {
          console.error('[createConversationByEmail] Erreur HTTP :', err);
          this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
        }
      });
    } catch (e) {
      console.error('[createConversationByEmail] Erreur inattendue :', e);
      this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
    }
  }

  /** Bascule la liste (mobile) */
  toggleConversationList() {
    this.isConversationListOpen = !this.isConversationListOpen;
  }

  /** Pull-to-refresh (mobile) */
  refreshPage(event: any) {
    this.loadConversations();
    setTimeout(() => event?.target?.complete?.(), 300);
  }

  // =========================
  // Envoi de messages
  // =========================

  /** Envoie un message avec “UI optimiste” + dédup via clientId */
  sendMessage() {
    try {
      const trimmed = (this.newMessage || '').trim();
      if (!trimmed || !this.selectedConversation?._id) return;
      this.isSending = true;

      // 1) Prépare un message optimiste
      const clientId = this.makeClientId();
      const optimistic = {
        clientId,
        _id: undefined,
        sender: this.currentUserId,
        content: trimmed,
        messageType: 'text',
        createdAt: new Date().toISOString(),
        __optimistic: true
      };

      // 2) Affiche immédiatement (optimiste)
      this.selectedConversation.messages ??= [];
      this.selectedConversation.messages.push(optimistic);
      this.scrollToBottom();

      // Callback succès
      const onOk = (saved: any) => {
        try {
          // Remplace le message optimiste par la version “serveur”
          const msgs = this.selectedConversation.messages || [];
          const idx = msgs.findIndex((m: any) => m.clientId === clientId);
          if (idx !== -1) {
            this.selectedConversation.messages[idx] = { ...msgs[idx], ...saved, clientId };
          }

          // Nettoyage UI + textarea
          this.newMessage = '';
          this.isSending = false;
          const el = (this.chatMessages?.nativeElement?.parentElement?.querySelector('.message-input .input')) as HTMLTextAreaElement | null;
          if (el) this.resetTextarea(el);

          // Met à jour la conversation dans la liste et remonte-la
          const listIdx = this.conversations.findIndex(c => c._id === this.selectedConversation._id);
          if (listIdx !== -1) {
            const cpy = { ...this.conversations[listIdx] };
            cpy.messages ??= [];
            this.upsertIncomingMessage(cpy, saved);
            this.conversations.splice(listIdx, 1);
            this.conversations = [cpy, ...this.conversations];

            if (this.isSupport(cpy)) this.updateSupportPreviewFromConv(cpy);
          }

          this.showCustomToast(this.translate.instant('SUCCESS.MESSAGE_SENT') || 'Message envoyé.', 'success');
          setTimeout(() => this.scrollToBottom(), 0);
        } catch (e) {
          console.error('[sendMessage:onOk] Traitement :', e);
          this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
        }
      };

      // Callback erreur
      const onErr = (err: any) => {
        console.error('[sendMessage] Erreur HTTP :', err);
        const msgs = this.selectedConversation.messages || [];
        const idx = msgs.findIndex((m: any) => m.clientId === clientId);
        if (idx !== -1) this.selectedConversation.messages[idx].__failed = true;
        this.isSending = false;
        this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
      };

      this.conversationService
        .addMessage(this.selectedConversation._id, {
          sender: this.currentUserId,
          content: trimmed,
          messageType: 'text',
          clientId
        })
        .subscribe({ next: onOk, error: onErr });

      this.newMessage = '';
    } catch (e) {
      console.error('[sendMessage] Erreur inattendue :', e);
      this.isSending = false;
      this.showCustomToast('ERROR.GENERIC_ERROR', 'error');
    }
  }

  /** Entrée pour envoyer ; Shift+Entrée pour nouvelle ligne */
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /** Auto-resize du textarea, limite hauteur max */
  autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    const max = 160; // ~5-6 lignes max
    const h = Math.min(el.scrollHeight, max);
    el.style.height = h + 'px';
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }

  /** Reset du textarea après envoi */
  private resetTextarea(el: HTMLTextAreaElement) {
    el.value = '';
    el.style.height = 'auto';
    el.style.overflowY = 'hidden';
  }

  // =========================
  // Affichage / Scroll
  // =========================

  /** Scroll bottom avec petit délai (laisse le DOM se peindre) */
  scrollToBottom() {
    try {
      if (!this.chatMessages) return;
      const el = this.chatMessages.nativeElement;
      setTimeout(() => { el.scrollTop = el.scrollHeight; }, 0);
    } catch (e) {
      // Pas bloquant
    }
  }

  // =========================
  // Helpers visuels / labels
  // =========================

  getConversationName(conversation: any): string {
    if (!conversation) return '';
    if (this.isSupport(conversation)) return 'Support';

    // ✅ Si un name existe, on le "nettoie" (supprime "• date")
    if (conversation.name) {
      const cleaned = this.stripNameAfterBullet(conversation.name);
      if (cleaned) return cleaned;
    }

    // Group conversation
    if (conversation.name && conversation.participants?.length > 2) {
      return this.stripNameAfterBullet(conversation.name);
    }

    // 1-to-1 conversation
    if (conversation.participants && conversation.participants.length === 2) {
      const other = conversation.participants.find((p: any) => p._id !== this.currentUserId);
      if (other) {
        const fullName = [other.firstname, other.lastname].filter(Boolean).join(' ');
        return fullName.trim() || other.email || 'Conversation';
      }
    }

    return this.stripNameAfterBullet(conversation.name || 'Conversation');
  }

  private stripNameAfterBullet(name: string): string {
    if (!name) return '';
    // Supprime tout à partir de "•" (inclus) + trim
    const idx = name.indexOf('•');
    return (idx === -1 ? name : name.slice(0, idx)).trim();
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

  /** Met à jour l’aperçu “Support” (texte + heure) */
  private updateSupportPreviewFromConv(conv: any) {
    if (!conv?.messages?.length) {
      this.supportPreview = this.translateSupportDefault();
      this.supportPreviewTime = '';
      return;
    }
    const last = conv.messages[conv.messages.length - 1];
    this.supportPreview = last?.content || this.translateSupportDefault();
    this.supportPreviewTime = new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /** Message par défaut pour le bandeau support */
  translateSupportDefault() {
    return 'Votre service client à portée de main';
  }

  openSettings() {
    console.log('⚙️ Ouverture des paramètres...');
  }

  // =========================
  // Booking-centric UI helpers
  // =========================

  // ✅ Choisis ton fuseau d’affichage
  // Si tu veux UTC partout -> 'UTC'
  // Si tu veux France -> 'Europe/Paris'
  private readonly DISPLAY_TIMEZONE = 'Europe/Paris';

  private asDate(value: any): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  private formatDateTime(date: Date, opts: Intl.DateTimeFormatOptions): string {
    try {
      return new Intl.DateTimeFormat(this.currentLang || 'fr', {
        timeZone: this.DISPLAY_TIMEZONE,
        ...opts,
      }).format(date);
    } catch {
      return date.toLocaleString();
    }
  }

  private getBookingStart(conv: any): Date | null {
    const start = this.asDate(conv?.bookingRef?.start);
    if (start) return start;

    const dateOnly = this.asDate(conv?.bookingRef?.date);
    return dateOnly;
  }

  /** ✅ Titre principal à gauche (prestations / booking) */
  getConversationTitle(conversation: any): string {
    if (!conversation) return '';
    if (this.isSupport(conversation)) return 'Support';

    const b = conversation.bookingRef;
    if (b?.title) return b.title;
    if (b?.productName) return b.productName;
    if (b?.establishmentName) return b.establishmentName;

    return this.getConversationName(conversation);
  }

  /** ✅ Sous-titre à gauche (salon + statut) */
  getConversationSubtitle(conversation: any): string {
    if (!conversation) return '';
    if (this.isSupport(conversation)) return this.supportPreview || this.translateSupportDefault();

    const b = conversation.bookingRef;
    const parts: string[] = [];

    if (b?.establishmentName) parts.push(b.establishmentName);
    if (b?.status) parts.push(b.status);

    if (parts.length > 0) return parts.join(' • ');
    return this.getLastMessage(conversation);
  }

  /** ✅ Méta time à droite dans la liste (priorité date booking) */
  getConversationMetaTime(conversation: any): string {
    if (!conversation) return '-';
    if (this.isSupport(conversation)) return this.supportPreviewTime || '';

    const bookingStart = this.getBookingStart(conversation);
    if (bookingStart) {
      return this.formatDateTime(bookingStart, { hour: '2-digit', minute: '2-digit' });
    }

    return this.getLastMessageTime(conversation);
  }

  /** ✅ Date dans le header (format clean, sans GMT+0000) */
  getConversationHeaderDate(conversation: any): string {
    if (!conversation) return '';
    if (this.isSupport(conversation)) return '';

    const bookingStart = this.getBookingStart(conversation);
    if (!bookingStart) return '';

    return this.formatDateTime(bookingStart, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // =========================
  // Toasts centralisés
  // =========================

  private showCustomToast(keyOrMessage: string, type: 'success' | 'error' = 'success') {
    try {
      const translated = this.translate.instant(keyOrMessage);
      const message = translated && translated !== keyOrMessage ? translated : keyOrMessage;

      if (type === 'success') {
        this.toastr.success(message);
      } else {
        this.toastr.error(message);
      }
    } catch (e) {
      if (type === 'success') this.toastr.success(keyOrMessage);
      else this.toastr.error(keyOrMessage);
    }
  }

  // ============== Accessibilité (optionnel mais cool) ==============
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isConversationListOpen) this.isConversationListOpen = false;
  }
}