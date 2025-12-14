import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommunicationService } from 'src/app/core/services/communication.service';
import { ScheduleService } from 'src/app/core/services/schedule.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { UserService } from 'src/app/core/services/user.service';
import { AddressModalComponent } from 'src/app/core/component/address-modal/address-modal.component';
import { ProchesModalComponent } from 'src/app/core/component/proches-modal/proches-modal.component';
import { environment } from 'src/environments/environment';
import { AdminService } from 'src/app/core/services/admin.service';
import { BookingService } from 'src/app/core/services/booking.service';
import { loadStripe } from '@stripe/stripe-js';
import { FinancialService } from 'src/app/core/services/financial.service';
import { StripeService } from 'src/app/core/services/stripe.service';
import { AuthenticationService } from 'src/app/core/services/authentication.service';
import { SubscriptionService } from 'src/app/core/services/subscription.service';
import { SessionService } from 'src/app/core/services/session.service';

// ✅ Ajouts pour le système d'erreurizyGlam
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-payement',
  templateUrl: './payement.component.html',
  styleUrls: ['./payement.component.scss'],
})
export class PayementComponent implements OnInit {
  // -----------------------------
  // Champs du formulaire / état UI
  // -----------------------------
  cardNumber: string = '';
  cardHolderName: string = '';
  expiryDate: string = '';
  cvv: string = '';
  errorMessage: string | null = null;

  step = 1; // Étapes du process (UI)
  loading = false; // Loader global du composant

  paymentMode: 'card' | 'employee_credit' = 'card';
  employeeCreditAmount: number = 0; // à alimenter depuis ton backend


  // -----------------------------
  // Données métier
  // -----------------------------
  shop: any;
  startSlot: any | null;
  endSlot: any | null;
  dateSlot: any | null;

  itemToBuy: any | null;
  bill: any | null = {};
  orderDate: string | null = '';
  date: string | null = '';
  imgStorageUrl: string = environment.APIimgStorageUrl;
  me: any = {};

  // ⚠️ Prix manipulés en number (plus en string)
  price: number = 0;       // Prix "produit" (gains shop avant commission/TVA)
  finalPrice: number = 0;  // Total TTC à payer

  itemToBuy2: any | null;
  adminSettings: any = {};
  meSex: string = 'Mme.';
  adressePrincipale: any = {};

  stripeCustomerID: string | undefined;
  private stripePromise: Promise<any> | undefined; // Stripe SDK
  userId: string | undefined;

  defaultCard: any = null;
  prestationDateForBill: string | undefined;
  cards: any[] = []; // Liste des cartes Stripe

  selectedCardId: string | null = null;
  showAddCardForm = false;
  defaultCardId = '';

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private shopService: ShopService,
    private userService: UserService,
    public dialog: MatDialog,
    private adminService: AdminService,
    private bookingService: BookingService,
    private sessionService: SessionService,
    private stripeService: StripeService,
    private subscriptionService: SubscriptionService,

    // ✅ Injections ajoutées pour les toasts + i18n
    private toastr: ToastrService,
    private translate: TranslateService
  ) { }

  // ---------------------------------------------------------
  // ⏱️ ngOnInit : charge paramètres, shop, user, cartes Stripe
  // ---------------------------------------------------------
  ngOnInit(): void {
    this.adminService.getAdminSettings().subscribe({
      next: (data: any) => {
        // 1) Paramètres admin (commission, TVA, etc.)
        this.adminSettings = data;

        // 2) Récupération du "panier" local (slot + produit)
        try {
          this.itemToBuy = JSON.parse(localStorage.getItem('selectItemFromShop') || 'null');
          if (!this.itemToBuy) {
            throw new Error('selectItemFromShop manquant ou invalide');
          }

          this.startSlot = this.itemToBuy.slot.start;
          this.endSlot = this.itemToBuy.slot.end;
          this.dateSlot = this.itemToBuy.date;

          this.itemToBuy2 = JSON.parse(localStorage.getItem('productToBuy') || 'null');

          // Init prix produit (gains shop "brut produit")
          this.price = Number(this.itemToBuy2?.price ?? 0);

          if (this.itemToBuy2 && this.itemToBuy2.price != null) {
            // Calcule le prix final avec commission + TVA (normalisés)
            const commissionRate = this.toRate(this.adminSettings?.commissionRate);
            const serviceFee = Number(this.adminSettings?.serviceFee ?? 0);
            const taxRate = this.toRate(this.adminSettings?.taxRate);

            this.finalPrice = this.calculateFinalPrice(
              Number(this.itemToBuy2.price),
              commissionRate,
              serviceFee,
              taxRate
            );
          }
        } catch (err) {
          console.error('Erreur de parsing localStorage (panier) :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
          return; // inutile d’aller plus loin si le panier est HS
        }

        // 3) Récupération du shop
        this.shopService.getById(this.itemToBuy.shopId).subscribe({
          next: (shop: any) => {
            this.shop = shop;

            // 4) Récupération de l’utilisateur + init Stripe + cartes
            this.userService.getMe().subscribe({
              next: async (user: any) => {
                try {
                  this.me = user;
                  if (user.sex === 'male') this.meSex = 'M.';
                  this.stripeCustomerID = user.customerId;
                  this.userId = user._id;
                  this.me.initials = user.firstname.charAt(0) + user.lastname.charAt(0);

                  // Prépare le bill si vide
                  if (!this.bill) this.bill = {};
                  this.bill.image = this.itemToBuy2?.image;
                  this.bill.client = this.me._id;

                  // Adresse principale (main === true) ou fallback première adresse
                  const addressTemp = this.me.address?.find((x: any) => x.main === true);
                  this.bill.address = addressTemp ? addressTemp._id : this.me.address?.[0]?._id;
                  this.adressePrincipale = addressTemp || this.me.address?.[0];

                  // Charge Stripe SDK
                  this.stripePromise = loadStripe(environment.stripePublicKey);
                  if (!this.stripePromise) {
                    throw new Error('Clé publique Stripe manquante ou invalide.');
                  }

                  // Doit exister pour récupérer cartes
                  if (!this.userId) {
                    throw new Error('Aucun userId trouvé. Veuillez vous connecter.');
                  }

                  // Charge les cartes si on a un customerId Stripe
                  if (!this.stripeCustomerID) {
                    console.warn('Aucun customerId : chargement des cartes impossible.');
                  } else {
                    await this.loadCards(); // Gestion d’erreur faite dans loadCards()
                  }

                  // Stocke la date brute pour la facture (utilisée par convertToISO)
                  let dateBrut: any = localStorage.getItem('selectItemFromShop');
                  if (dateBrut) {
                    dateBrut = JSON.parse(dateBrut);
                    this.prestationDateForBill = dateBrut?.slot?.dateBrut;
                  }
                } catch (err) {
                  console.error('Erreur lors de l’initialisation utilisateur/Stripe :', err);
                  this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                }
              },
              error: (err) => {
                console.error('Erreur lors de la récupération utilisateur :', err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
              }
            });
          },
          error: (err) => {
            console.error('Erreur lors du chargement du shop :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
          }
        });
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des paramètres admin :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  selectEmployeeCredit(): void {
    this.paymentMode = 'employee_credit';
    this.selectedCardId = null as any; // ou undefined, selon ton type
  }


  // -------------------------------------------------------------
  // 💶 Calcule le prix final (commission + TVA) arrondi à 2 déc.
  // -------------------------------------------------------------
  calculateFinalPrice(productPrice: number, commissionRate: number, serviceFee: number, taxRate: number): number {
    const priceWithCommission = productPrice + (productPrice * commissionRate) + serviceFee;
    const finalPrice = priceWithCommission + (priceWithCommission * taxRate);
    return parseFloat(finalPrice.toFixed(2));
  }

  // -------------------------------------------------------------
  // Normalise un taux venant de la DB (15 -> 0.15 ; 0.15 -> 0.15)
  // -------------------------------------------------------------
  private toRate(v: any): number {
    const n = Number(v ?? 0);
    return n > 1 ? n / 100 : n;
  }

  // -------------------------------------------------------------
  // 👥 Ouvre la modal "Proches" (sélection d’un bénéficiaire)
  // -------------------------------------------------------------
  openProchesModal() {
    this.dialog.open(ProchesModalComponent, {
      width: '400px',
      data: { user: this.me },
    });
  }

  // -------------------------------------------------------------
  // 🂡 Sélectionne une carte Stripe par ID
  // -------------------------------------------------------------
  selectCard(cardId: string) {

    this.paymentMode = 'card';
    this.selectedCardId = cardId;
  }

  // -------------------------------------------------------------
  // 🏦 Sélection UI d’une carte (radio/selection)
  // -------------------------------------------------------------
  isCardSelected(card: any): boolean {
    return card.id === this.selectedCardId;
  }

  // -------------------------------------------------------------
  // ➕ Callback quand une nouvelle carte a été ajoutée (UI)
  // -------------------------------------------------------------
  onCardAdded(_event: any) {
    this.showAddCardForm = false;
    this.loadCards(); // recharge les cartes (gestion d’erreur à l’intérieur)
  }

  // -------------------------------------------------------------
  // 📇 Charge la liste des cartes Stripe depuis ton backend
  // -------------------------------------------------------------
  async loadCards(): Promise<void> {
    try {
      const response = await fetch(`${environment.apiUrl}stripe/get-cards?customerId=${this.stripeCustomerID}`);
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Échec du chargement des cartes : ${errorMessage}`);
      }

      const data = await response.json();
      this.cards = data.cards || [];

      // Détermine la carte par défaut
      this.defaultCard = this.cards.find((card: any) => card.isDefault === true) || null;

      // Initialise la carte sélectionnée par défaut
      this.selectedCardId = this.defaultCard?.id || (this.cards.length > 0 ? this.cards[0].id : null);

      // Fallback si aucune carte "par défaut"
      if (!this.defaultCard && this.cards.length > 0) {
        this.defaultCard = this.cards[0];
      }
    } catch (err) {
      console.error('Erreur lors du chargement des cartes :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // -------------------------------------------------------------
  // 🏠 Modal d’adresse (adresse de facturation / prestation)
  // -------------------------------------------------------------
  openAddressModal() {
    this.dialog.open(AddressModalComponent, {
      width: '400px',
      data: { user: this.me },
    });
  }

  // -------------------------------------------------------------
  // 🗑️ Supprimer une adresse du profil
  // -------------------------------------------------------------
  removeAddress(index: number) {
    this.me.address.splice(index, 1);
    this.userService.update(this.me).subscribe({
      next: (result: any) => {
        console.log('Adresse supprimée, user mis à jour :', result);
      },
      error: (err: any) => {
        console.error('Erreur lors de la suppression d’adresse :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // -------------------------------------------------------------
  // 📅 Formatage date (FR)
  // -------------------------------------------------------------
  formatDate(dateString: string): string | null {
    const date = new Date(dateString);
    return this.datePipe.transform(date, 'EEEE d MMMM y', 'fr-FR');
  }

  // -------------------------------------------------------------
  // 🔼/🔽 Navigation d’étapes (UI)
  // -------------------------------------------------------------
  addStep() {
    this.step += 1;
    console.log('Step ->', this.step);
  }
  removeStep() {
    this.step -= 1;
    console.log('Step ->', this.step);
  }

  // -------------------------------------------------------------
  // ⭐ Gérer carte par défaut (placeholder conservés)
  // -------------------------------------------------------------
  setDefaultCard(_id: string) { /* TODO: implémentation future */ }
  removeCard(_id: string) { /* TODO: implémentation future */ }

  // -------------------------------------------------------------
  // ⚙️ Chargement dynamique Stripe.js (non utilisé ici, on garde)
  // -------------------------------------------------------------
  private loadStripe(publicKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => resolve((window as any).Stripe(publicKey));
      script.onerror = () => reject('Erreur lors du chargement de Stripe.js');
      document.body.appendChild(script);
    });
  }

  // -------------------------------------------------------------
  // 🔁 Lance une souscription Stripe (si ton produit le nécessite)
  // -------------------------------------------------------------
  createSubscription(): void {
    const payload = {
      userId: this.userId!,
      paymentMethodId: this.selectedCardId!,
      subscriptionId: this.itemToBuy2?.subscriptionId, // ⚠️ Doit être présent dans productToBuy
    };

    this.subscriptionService.startSubscription(payload).subscribe({
      next: (response) => {
        console.log('Souscription Stripe créée :', response);
        // Stocke l’id de souscription dans le bill si besoin
        this.bill!.stripeSubscriptionId = response.subscription.id;
        this.saveBill(); // enchaîne le flux habituel
      },
      error: (err) => {
        console.error('Erreur lors de la souscription :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  // -------------------------------------------------------------
  // ✅ Valide le paiement via Stripe (PaymentIntent)
  // -------------------------------------------------------------
  async validate(): Promise<void> {
    this.loading = true;
    const amount = Math.round(this.finalPrice * 100); // en centimes
    const currency = 'eur';

    this.stripeService.createPaymentIntent(amount, currency, this.stripeCustomerID!).subscribe({
      next: async (response: any) => {
        try {
          const { clientSecret } = response;

          // Vérifie qu'une carte a bien été sélectionnée
          if (!this.selectedCardId) {
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            this.loading = false;
            return;
          }

          // Confirme le paiement côté Stripe
          const stripe = await loadStripe(environment.stripePublicKey);
          const { error, paymentIntent } = await stripe!.confirmCardPayment(clientSecret, {
            payment_method: this.selectedCardId,
          });

          if (error) {
            console.error('Erreur de paiement :', error.message);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            this.loading = false;
          } else if (paymentIntent.status === 'succeeded') {
            // Paiement OK → on poursuit le flux (création booking, etc.)
            this.bill!.paymentIntentId = paymentIntent.id;
            this.saveBill();
          } else {
            // Statut inattendu → safe toast
            console.warn('Statut PaymentIntent inattendu :', paymentIntent.status);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            this.loading = false;
          }
        } catch (err) {
          console.error('Erreur interne lors de la confirmation du paiement :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Erreur lors de la création du PaymentIntent :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        // Redirection vers la page de validation (échec)
        this.router.navigate(['paiement-validation'], {
          queryParams: { success: false, shopId: this.shop?._id, paiement: false }
        });
        this.loading = false;
      }
    });
  }

  // -------------------------------------------------------------
  // 🧾 Construit et sauvegarde la "bill" (Booking côté backend)
  // -------------------------------------------------------------
  saveBill() {
    try {
      this.bill!.clientId = this.bill!.client;

      // Remplit les infos "client" selon si c’est moi ou un proche
      if (this.bill!.client === this.me._id) {
        this.bill!.title = `${this.meSex} ${this.me.firstname} ${this.me.lastname}`;
        this.bill!.phoneNumber = this.me.phone;
      } else {
        this.me.proches?.find((x: any) => {
          if (x._id === this.bill!.client) {
            this.bill!.title = `${this.meSex} ${x.firstname} ${x.lastname}`;
            this.bill!.clientId = this.me._id;
            this.bill!.phoneNumber = x.phone;
          }
        });
      }

      // Format l’adresse (ID -> string lisible)
      this.me.address?.find((x: any) => {
        if (x._id === this.bill!.address) {
          this.bill!.address = `${x.street}, ${x.code_postal}, ${x.city}, ${x.country}`;
        }
      });

      // Dates de prestation (start/end) en ISO (locale)
      this.bill!.start = this.convertToISO(this.startSlot!);
      this.bill!.end = this.convertToISO(this.endSlot!);
      this.bill!.date = this.dateSlot;

      // --- Montants & métadonnées (calcul unique, pas de double-comptage) ---
      const productPrice = Number(this.itemToBuy2?.price ?? 0); // prix "catalogue"
      const commissionRate = this.toRate(this.adminSettings?.commissionRate);
      const taxRate = this.toRate(this.adminSettings?.taxRate);
      const serviceFee = Number(this.adminSettings?.serviceFee ?? 0);

      const commission = productPrice * commissionRate;
      const baseHT = productPrice + commission + serviceFee; // base taxable
      const tva = baseHT * taxRate;
      const totalTTC = parseFloat((baseHT + tva).toFixed(2));

      // Ce que gagne la boutique (ajuste si besoin de net-versé)
      this.bill!.shopEarnings = productPrice;

      this.bill!.price = totalTTC;                 // TOTAL TTC (une seule fois)
      this.bill!.orderDate = new Date();
      this.bill!.status = 'pending';
      this.bill!.color = this.itemToBuy2?.color;
      this.bill!.shopId = this.shop._id;
      this.bill!.establishmentName = this.shop.name;
      this.bill!.serviceId = this.itemToBuy2?._id;
      if (!this.bill!.image) this.bill!.image = "Pas d'image";

      this.bill!.productName = this.itemToBuy2?.name;
      this.bill!.userProId = this.shop.idUser;

      // Détails de coûts (pour transparence/analytics)
      this.bill!.serviceFee = serviceFee;
      this.bill!.commission = parseFloat(commission.toFixed(2));
      this.bill!.tva = parseFloat(tva.toFixed(2));
    } catch (err) {
      console.error('Erreur lors de la préparation de la facture (bill) :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      this.loading = false;
      return;
    }

    // Création du booking côté backend
    const sessionLangue = this.sessionService.getLang();
    this.bookingService.create(this.bill!, sessionLangue!).subscribe({
      next: (bookingResponse: any) => {
        console.log('Booking created:', bookingResponse);
        // Redirection validation OK
        this.router.navigate(['paiement-validation'], {
          queryParams: { success: true, shopId: this.shop._id, paiement: true }
        });
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur lors de la création de la réservation :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        // Redirection validation KO
        this.router.navigate(['paiement-validation'], {
          queryParams: { success: false, shopId: this.shop._id, paiement: true }
        });
        this.loading = false;
      }
    });
  }

  // -------------------------------------------------------------
  // 🧮 Méthode utilitaire : calcul commission (utilise taux normalisé)
  // -------------------------------------------------------------
  calculateCommission(): number {
    const commissionRate = this.toRate(this.adminSettings?.commissionRate);
    return Number(this.price) * commissionRate;
  }

  // -------------------------------------------------------------
  // ⤴️ Retour à la page principale / shop
  // -------------------------------------------------------------
  goBackToMain() {
    let shopId = localStorage.getItem('shopSelected') || undefined;
    if (shopId) {
      this.router.navigate(['shop', shopId]);
    } else {
      this.router.navigate(['main']);
    }
  }

  // -------------------------------------------------------------
  // 🇫🇷 Convertit une heure locale (string) en ISO local (sans TZ)
  // -------------------------------------------------------------
  convertToISO(timeStr: string): string {
    // Concatène la date brute de prestation + l’heure choisie
    const combined = this.prestationDateForBill + ' ' + timeStr;
    const date = new Date(combined);

    // Formate en YYYY-MM-DDTHH:mm:ss (sans fuseau ajouté)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = '00';

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  // -------------------------------------------------------------
  // ➕ Ajoute X minutes à une Date (helper)
  // -------------------------------------------------------------
  addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  // -------------------------------------------------------------
  // ✨ Toast d’erreur styliséizyGlam (centralisé)
  // -------------------------------------------------------------
  showCustomToast(message: string) {
    // Message générique : "✨ Oups… une erreur s’est glissée. Merci de réessayer ✨"
    this.toastr.error(message);
  }
}
