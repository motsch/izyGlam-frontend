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

@Component({
  selector: 'app-payement',
  templateUrl: './payement.component.html',
  styleUrls: ['./payement.component.scss'],
})
export class PayementComponent implements OnInit {


  // Champs de formulaire pour la carte
  cardNumber: string = '';
  cardHolderName: string = '';
  expiryDate: string = '';
  cvv: string = '';
  errorMessage: string | null = null;
  step = 1;
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
  // allCards: any[] = []; // toutes les cartes Stripe enregistrées par l'utilisateur
  showAddCardForm = false;
  defaultCardId = "";


  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private shopService: ShopService,
    private userService: UserService,
    public dialog: MatDialog,
    private adminService: AdminService,
    private bookingService: BookingService,
    private stripeService: StripeService,
    private subscriptionService: SubscriptionService // 👈 ici
  ) { }

  ngOnInit(): void {
    this.adminService.getAdminSettings().subscribe({
      next: (data: any) => {
        console.log(data);
        this.adminSettings = data;
        console.log(this.adminSettings);
        this.itemToBuy = localStorage.getItem('selectItemFromShop');
        this.itemToBuy = JSON.parse(this.itemToBuy);
        console.log("itemToBuy");
        console.log(this.itemToBuy);
        this.startSlot = this.itemToBuy.slot.start;
        this.endSlot = this.itemToBuy.slot.end;
        this.dateSlot = this.itemToBuy.date;
        this.itemToBuy2 = localStorage.getItem('productToBuy');
        console.log(this.itemToBuy2);
        this.itemToBuy2 = JSON.parse(this.itemToBuy2);
        /*if (this.itemToBuy2 && this.itemToBuy2.price) {
          this.price = this.itemToBuy2.price;
          console.log('this.itemToBuy2 : ' + JSON.stringify(this.itemToBuy2));
          console.log('this.price : ' + this.price);
        }*/
        // Exemple d'utilisation dans ton code :
        if (this.itemToBuy2 && this.itemToBuy2.price) {
          this.price = this.itemToBuy2.price;
          const commissionRate = this.adminSettings?.commissionRate || 0;
          const taxRate = this.adminSettings?.taxRate || 0;
          this.price = this.calculateFinalPrice(this.itemToBuy2.price, commissionRate, taxRate).toString();
          console.log('commissionRate : ' + commissionRate);
          console.log('commissionRate : ' + commissionRate);
          console.log('taxRate : ' + taxRate);
          console.log('this.price (avec commission + TVA) : ' + this.price);
        }
        console.log(this.itemToBuy);
        // this.shop._id = this.itemToBuy.shopId;
        this.shopService
          .getById(this.itemToBuy.shopId)
          .subscribe((shop: any) => {
            console.log(shop);
            this.shop = shop;

            this.userService.getMe().subscribe(async (user: any) => {
              console.log(user);

              if (user.sex === 'male') {
                this.meSex = 'M.';
              }
              this.stripeCustomerID = user.customerId;
              this.userId = user._id;
              this.me = user;
              this.me.initials =
                user.firstname.charAt(0) + user.lastname.charAt(0);
              if (!this.bill) {
                this.bill = {};
              }
              this.bill.image = this.itemToBuy2.image,
                this.bill.client = this.me._id;
              let addressTemp = this.me.address.find((x: any) => {
                return x.main === true;
              });

              this.bill.address = addressTemp
                ? addressTemp._id
                : this.me.address[0]._id;


              this.adressePrincipale = addressTemp
                ? addressTemp
                : this.me.address[0];

              // Chargez Stripe dès le démarrage du composant
              this.stripePromise = loadStripe(environment.stripePublicKey);
              if (!this.stripePromise) {
                throw new Error('Clé publique Stripe manquante ou invalide.');
              }

              // Récupérez l'utilisateur courant depuis votre backend
              if (!this.userId) {
                throw new Error('Aucun userId trouvé. Veuillez vous connecter.');
              }

              if (!this.stripeCustomerID) {
                console.warn('Aucun customerId trouvé. Les cartes ne peuvent pas être chargées.');
              } else {
                // Chargez les cartes existantes avec le customerId
                await this.loadCards();
              }
            });
          });

        /** STRIPE **/
        // console.log((this.itemToBuy2));
        let dateBrut: any = localStorage.getItem("selectItemFromShop");
        if (dateBrut) {
          dateBrut = JSON.parse(dateBrut);
        }
        this.prestationDateForBill = dateBrut.slot.dateBrut;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  createSubscription(): void {
    const payload = {
      userId: this.userId!,
      paymentMethodId: this.selectedCardId!,
      subscriptionId: this.itemToBuy2.subscriptionId, // 👈 Assure-toi que `productToBuy` contient bien ce champ
    };

    this.subscriptionService.startSubscription(payload).subscribe({
      next: (response) => {
        console.log('Souscription Stripe créée :', response);
        // Tu peux stocker la souscription dans le bill si besoin
        this.bill.stripeSubscriptionId = response.subscription.id;
        this.saveBill(); // ⬅️ Continue le flux habituel ici
      },
      error: (error) => {
        console.error('Erreur lors de la souscription :', error);
        alert('Impossible de créer la souscription. Veuillez réessayer.');
      },
    });
  }

  calculateFinalPrice(productPrice: number, commissionRate: number, taxRate: number): number {
    // 1️⃣ Ajout de la commission
    const priceWithCommission = productPrice + (productPrice * commissionRate);

    // 2️⃣ Application de la TVA
    const finalPrice = priceWithCommission + (priceWithCommission * taxRate);

    // Arrondi à 2 décimales
    return parseFloat(finalPrice.toFixed(2));
  }

  openProchesModal() {
    this.dialog.open(ProchesModalComponent, {
      width: '400px',
      data: {
        user: this.me,
      },
    });
  }

  isCardSelected(card: any): boolean {
    return card.id === this.selectedCardId;
  }

  onCardAdded(event: any) {
    this.showAddCardForm = false;
    this.loadCards(); // recharge les cartes
  }


  selectCard(cardId: string) {
    this.selectedCardId = cardId;
  }

  /*
   * Charge la liste des cartes depuis le serveur.
   */
  async loadCards(): Promise<void> {
    try {
      console.log('Chargement des cartes Stripe...');

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
      if (!this.defaultCard && this.cards.length > 0) {
        this.defaultCard = this.cards[0];
      }
      console.log('Carte par défaut :', this.defaultCard);
    } catch (error) {
      console.error('Erreur lors du chargement des cartes :', error);
      alert('Une erreur est survenue lors du chargement de vos cartes bancaires.');
    }
  }

  openAddressModal() {
    this.dialog.open(AddressModalComponent, {
      width: '400px',
      data: {
        user: this.me,
      },
    });
  }

  removeAddress(index: number) {
    this.me.address.splice(index, 1);
    this.userService.update(this.me).subscribe((result: any) => {
      console.log(result);
    }, (error: any) => {
      console.log(error);
    });
  }

  formatDate(dateString: string): string | null {
    const date = new Date(dateString);
    return this.datePipe.transform(date, 'EEEE d MMMM y', 'fr-FR');
  }
  addStep() {
    this.step += 1;
    console.log(this.step);
  }

  removeStep() {
    this.step -= 1;
    console.log(this.step);
  }

  setDefaultCard(id: string) { }
  removeCard(id: string) { }


  // Charger Stripe.js dynamiquement
  private loadStripe(publicKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        resolve((window as any).Stripe(publicKey));
      };
      script.onerror = () => {
        reject('Erreur lors du chargement de Stripe.js');
      };
      document.body.appendChild(script);
    });
  }

  // Valider le paiement avec Stripe
  async validate(): Promise<void> {
    const amount = Math.round(parseFloat(this.price) * 100); // Convertit en centimes (int)
    const currency = 'eur'; // Devise

    // Créer une intention de paiement
    this.stripeService.createPaymentIntent(amount, currency, this.stripeCustomerID!).subscribe(
      async (response: any) => {
        const { clientSecret } = response;

        // Vérifier si une carte par défaut est disponible
        if (!this.selectedCardId) {
          alert('Veuillez ajouter ou sélectionner une carte pour effectuer le paiement.');
          return;
        }

        // Confirmer le paiement avec Stripe
        const stripe = await loadStripe(environment.stripePublicKey);
        const { error, paymentIntent } = await stripe!.confirmCardPayment(clientSecret, {
          payment_method: this.selectedCardId,
        });

        if (error) {
          console.error('Erreur de paiement :', error.message);
          alert('Le paiement a échoué.');
        } else if (paymentIntent.status === 'succeeded') {
          console.log('Paiement réussi !');
          this.bill.paymentIntentId = paymentIntent.id;
          // this.createSubscription();

          // Tu peux stocker la souscription dans le bill si besoin
          this.saveBill(); // ⬅️ Continue le flux habituel ici
        }
      },
      (error) => {
        console.error('Erreur lors de la création de l\'intention de paiement :', error);
      }
    );
  }

  saveBill() {
    console.log('saveBill !');
    console.log(this.bill);
    this.bill.clientId = this.bill.client;

    if (this.bill.client === this.me._id) {
      this.bill.title = this.meSex + ' ' + this.me.firstname + ' ' + this.me.lastname;
      this.bill.phoneNumber = this.me.phone;
    } else {
      this.me.proches.find((x: any) => {
        if (x._id === this.bill.client) {
          this.bill.title = this.meSex + ' ' + x.firstname + ' ' + x.lastname;
          this.bill.clientId = this.me._id;
          this.bill.phoneNumber = x.phone;
        }
      });
    }

    this.me.address.find((x: any) => {
      if (x._id === this.bill.address) {
        this.bill.address = `${x.street}, ${x.code_postal}, ${x.city}, ${x.country}`;
      }
    });

    console.log("this.dateSlot : " + this.dateSlot);
    console.log("this.startSlot : " + this.startSlot);
    this.bill.start = this.convertToISO(this.startSlot);
    console.log("START date : " + this.bill.start);
    console.log(this.date);
    console.log(this.startSlot);
    this.bill.end = this.convertToISO(this.endSlot);
    console.log("END date : " + this.bill.end);
    this.bill.date = this.dateSlot;

    // Calcul du montant de base et attribution des commissions, TVA, etc.
    this.bill.shopEarnings = this.price;
    this.bill.price =
      parseFloat(this.price) +
      parseFloat(this.price) * this.adminSettings.commissionRate +
      this.adminSettings.serviceFee;
    this.bill.orderDate = new Date();
    this.bill.status = 'pending';
    this.bill.color = this.itemToBuy2.color;
    this.bill.shopId = this.shop._id;
    this.bill.establishmentName = this.shop.name;
    this.bill.serviceId = this.itemToBuy2._id;
    if (!this.bill.image) {
      this.bill.image = "Pas d'image";
    }
    this.bill.productName = this.itemToBuy2.name;
    this.bill.userProId = this.shop.idUser;
    this.bill.commission = parseFloat(this.price) * this.adminSettings.commissionRate;
    this.bill.tva = this.bill.price * this.adminSettings.taxRate;
    this.bill.price = this.bill.price + this.bill.tva;

    console.log(JSON.stringify(this.itemToBuy2));
    console.log(JSON.stringify(this.bill));

    // Création de la réservation (booking)
    this.bookingService.create(this.bill).subscribe({
      next: (bookingResponse: any) => {
        console.log("Booking created:", bookingResponse);
        // Rediriger ou notifier l'utilisateur
        this.router.navigate(['home']);
      },
      error: (error: any) => {
        console.error("Erreur lors de la création de la réservation", error);
      }
    });
  }

  // Méthode pour calculer le montant
  calculateCommission(): number {
    const price = parseFloat(this.price);
    const commissionRate = parseFloat(this.adminSettings.commissionRate);
    return price * commissionRate;
  }

  goBackToMain() {
    let shopId;
    if (localStorage.getItem('shopSelected')) {
      shopId = localStorage.getItem('shopSelected');
    }
    if (shopId) {
      this.router.navigate(['shop', shopId]);
    } else {
      this.router.navigate(['main']);
    }
  }

  // date en france
  convertToISO(timeStr: string): string {
    // Combine date and time into a single string
    // Étape 1 : Combiner la date et l'heure
    const combined = this.prestationDateForBill + ' ' + timeStr;

    // Create a Date object from the combined string (local time)
    const date = new Date(combined);

    // Format to 'YYYY-MM-DDTHH:mm:ss' without the timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = '00'; // You can adjust this to get actual seconds if needed

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  // Fonction pour ajouter des minutes à une date
  addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000); // 60000 ms = 1 minute
  }
}
