import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { loadStripe } from '@stripe/stripe-js';

@Component({
  selector: 'app-payement-pro',
  templateUrl: './payement-pro.component.html',
  styleUrls: ['./payement-pro.component.scss']
})
export class PayementProComponent implements OnInit {
  abonnement!: string; // ou number selon ton besoin



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


  constructor(private route: ActivatedRoute, private router: Router, private userService: UserService) { }

  ngOnInit(): void {
    // Récupérer le paramètre d'URL
    this.abonnement = this.route.snapshot.paramMap.get('abonnement')!;
    if (this.abonnement !== 'elue' && this.abonnement !== 'reine' && this.abonnement !== 'deesse') {
      this.router.navigate(['/main']);
    }
    // Si tu veux vérifier ce que tu as récupéré :
    console.log('Abonnement choisi :', this.abonnement);



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
      console.log('Carte par défaut :', this.defaultCard);
    } catch (error) {
      console.error('Erreur lors du chargement des cartes :', error);
      alert('Une erreur est survenue lors du chargement de vos cartes bancaires.');
    }
  }

  goToAbonnement() {
    this.router.navigate(['/prices']);
  }


  onCardAdded(event: any) {
    this.showAddCardForm = false;
    this.loadCards(); // recharge les cartes
  }
}
