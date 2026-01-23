import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { loadStripe } from '@stripe/stripe-js';

// ✅ Ajouts pour toasts + i18n (standardizyGlam)
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { StripeService } from 'src/app/core/services/stripe.service';

@Component({
  selector: 'app-payement-pro',
  templateUrl: './payement-pro.component.html',
  styleUrls: ['./payement-pro.component.scss']
})
export class PayementProComponent implements OnInit {
  // -----------------------------
  // 🔹 Paramètre d’URL (type d’abonnement)
  // -----------------------------
  abonnement!: string; // 'elue' | 'reine' | 'deesse' (ou string libre selon ton besoin)

  // -----------------------------
  // 🔹 Données métier (gardées telles quelles)
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
  price: string = '';
  itemToBuy2: any | null;
  adminSettings: any = {};
  meSex: string = 'Mme.';
  adressePrincipale: any = {};
  stripeCustomerID: string | undefined;
  private stripePromise: Promise<any> | undefined;
  userId: string | undefined;
  defaultCard: any = null;
  prestationDateForBill: string | undefined;
  cards: any[] = []; // Liste des cartes de l'utilisateur
  selectedCardId: string | null = null;
  // allCards: any[] = []; // toutes les cartes Stripe enregistrées par l'utilisateur (commenté d’origine)
  showAddCardForm = false;

  // -----------------------------
  // 🔹 Injection des services
  // -----------------------------
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,

    // ✅ AjoutizyGlam
    private toastr: ToastrService,
    private translate: TranslateService,
    private stripeService: StripeService
  ) { }

  // ---------------------------------------------------------
  // ⏱️ ngOnInit : lit l’abonnement, vérifie / charge l’utilisateur & Stripe
  // ---------------------------------------------------------
  ngOnInit(): void {
    // 1) Récupérer le paramètre d'URL
    this.abonnement = this.route.snapshot.paramMap.get('abonnement')!;
    if (this.abonnement !== 'premium') {
      // Si abonnement invalide : retour à l’accueil
      this.router.navigate(['/main']);
      return;
    }
    console.log('Abonnement choisi :', this.abonnement);

    // 2) Récupérer l’utilisateur courant, initialiser Stripe + cartes
    this.userService.getMe().subscribe({
      next: async (user: any) => {
        try {
          console.log('Utilisateur chargé :', user);

          // Définition du civilité pour l’affichage
          if (user.sex === 'male') {
            this.meSex = 'M.';
          }

          // Stocke l’utilisateur
          this.stripeCustomerID = user.customerId;
          this.userId = user._id;
          this.me = user;
          this.me.initials = user.firstname.charAt(0) + user.lastname.charAt(0);

          // Sécurise l'obj. bill
          if (!this.bill) {
            this.bill = {};
          }

          // Optionnel : image depuis itemToBuy2 (si existant)
          this.bill.image = this.itemToBuy2?.image;
          this.bill.client = this.me._id;

          // Adresse principale (main === true) ou fallback première
          const addressTemp = this.me.address?.find((x: any) => x.main === true);
          this.bill.address = addressTemp ? addressTemp._id : this.me.address?.[0]?._id;
          this.adressePrincipale = addressTemp || this.me.address?.[0];

          // Charge Stripe (SDK)
          this.stripePromise = loadStripe(environment.stripePublicKey);
          if (!this.stripePromise) {
            throw new Error('Clé publique Stripe manquante ou invalide.');
          }

          // Validations rapides
          if (!this.userId) {
            throw new Error('Aucun userId trouvé. Veuillez vous connecter.');
          }

          // Charge les cartes enregistrées si on a un customerId Stripe
          if (!this.stripeCustomerID) {
            console.warn('Aucun customerId trouvé. Les cartes ne peuvent pas être chargées.');
          } else {
            await this.loadCards(); // gestion d’erreur à l’intérieur
          }
        } catch (err) {
          console.error('Erreur lors de l’initialisation PayementPro :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de l’utilisateur :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // -------------------------------------------------------------
  // 🂡 Sélectionner une carte Stripe (UI)
  // -------------------------------------------------------------
  selectCard(cardId: string) {
    this.selectedCardId = cardId;
  }

  // -------------------------------------------------------------
  // 📇 Charge la liste des cartes Stripe depuis ton backend
  // -------------------------------------------------------------
  async loadCards(): Promise<void> {
    try {
      console.log('Chargement des cartes Stripe…');

      const response = await fetch(`${environment.apiUrl}stripe/get-cards?customerId=${this.stripeCustomerID}`);
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Échec du chargement des cartes : ${errorMessage}`);
      }

      const data = await response.json();

      // On remplit la liste complète
      this.cards = data.cards || [];

      // On cherche la carte par défaut (flag isDefault depuis ton backend)
      this.defaultCard = this.cards.find((card: any) => card.isDefault === true) || null;

      // On initialise la carte sélectionnée par défaut
      this.selectedCardId = this.defaultCard?.id || (this.cards.length > 0 ? this.cards[0].id : null);

      console.log('Cartes chargées :', this.cards);
      console.log('Carte par défaut :', this.defaultCard);
    } catch (err) {
      console.error('Erreur lors du chargement des cartes :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // -------------------------------------------------------------
  // 💳 Aller à la page d’abonnement (navigation)
  // -------------------------------------------------------------
  goToAbonnement() {
    this.router.navigate(['/prices']);
  }

  // -------------------------------------------------------------
  // ➕ Callback quand une nouvelle carte a été ajoutée (UI)
  // -------------------------------------------------------------
  onCardAdded(_event: any) {
    this.showAddCardForm = false;
    // Recharge les cartes (gestion d’erreur dans loadCards)
    this.loadCards();
  }

  // -------------------------------------------------------------
  // ✨ Toast d’erreur styliséizyGlam (centralisé)
  // -------------------------------------------------------------
  showCustomToast(message: string) {
    // Ex : "✨ Oups… une erreur s’est glissée. Merci de réessayer ✨"
    this.toastr.error(message);
  }

  finalizePurchase() {
    this.stripeService.createPremiumCheckoutSession(this.me._id).subscribe({
      next: (res: any) => {
        window.location.href = res.url; // ✅ redirection Stripe Checkout
      },
      error: (err) => console.error(err),
    });
  }


}
