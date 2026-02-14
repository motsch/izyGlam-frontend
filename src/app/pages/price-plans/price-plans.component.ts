import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SeoService } from 'src/app/core/services/seo.service';
import { SubscriptionService } from 'src/app/core/services/subscription.service';

// ✅ Ajouts pour toasts + i18n (standardizyGlam)
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { SessionService } from 'src/app/core/services/session.service';
import { UserService } from 'src/app/core/services/user.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { CountryService } from 'src/app/core/services/country.service';

@Component({
  selector: 'app-price-plans',
  templateUrl: './price-plans.component.html',
  // ⚠️ Correction Angular : "styleUrl" → "styleUrls" (tableau)
  styleUrls: ['./price-plans.component.scss'],
})
export class PricePlansComponent implements OnInit {
  // Liste des abonnements (récupérés via l’API)
  subscriptions: any[] | undefined;
  proSub: string | null = null;
  premiumSub: string | null = null;
  abonnements: any;

  constructor(
    private router: Router,
    private seoService: SeoService,
    private countryService: CountryService,

    // ✅ AjoutizyGlam
    private toastr: ToastrService,
    private translate: TranslateService,
    public sessionService: SessionService
  ) { }

  // ------------------------------------------------------------------
  // ⏱️ ngOnInit : SEO + chargement de la liste des abonnements (FR)
  // ------------------------------------------------------------------
  ngOnInit() {
    // Mise à jour des balises SEO (meta, titre…). On encapsule dans un try au cas où.
    try {
      this.seoService.updateMeta('pricing');
    } catch (err) {
      console.error('Erreur lors de la mise à jour SEO :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }

    // Récupération de la liste des plans d’abonnement côté backend
    this.countryService.getMySubscriptions().subscribe({
      next: (subs) => {
        console.log(JSON.stringify(subs));
        this.proSub = (subs.proMonthlyCents / 100).toLocaleString('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });

        this.premiumSub = (subs.premiumMonthlyCents / 100).toLocaleString('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        this.abonnements = subs;

      },
      error: (err) => {
        console.error('Erreur lors du chargement des abonnements :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // ------------------------------------------------------------------
  // ▶️ Démarrer une souscription (ancienne logique : redirige vers /payement)
  // ------------------------------------------------------------------
  subscribe(plan: string) {
    console.log(`Souscription au plan : ${plan}`);
    // Ici tu peux brancher une logique d’initialisation de souscription
    // Pour l’instant : redirection vers le flux de paiement grand public
    this.router.navigate(['/payement']);
  }

  // ------------------------------------------------------------------
  // 👤 Aller au setup de profil
  // ------------------------------------------------------------------
  goToProfileSetup() {
    this.router.navigate(['/profile-setup']);
  }

  // ------------------------------------------------------------------
  // 💳 Aller au paiement Pro en passant le plan sélectionné
  // ------------------------------------------------------------------
  goToPaiement(plan: string) {
    if (!this.sessionService.isLoggedIn()) {
      this.router.navigate(['/sign-in']);
      return;
    }

    this.router.navigate(['/payement-pro', plan], {
      state: { subs: this.abonnements }
    });
  }


  // ------------------------------------------------------------------
  // 🏪 Aller à la création de shop
  // ------------------------------------------------------------------
  goToShopCreation() {
    this.router.navigate(['/creation-shop']);
  }

  // ------------------------------------------------------------------
  // ✨ Toast d’erreur styliséizyGlam (centralisé)
  // ------------------------------------------------------------------
  private showCustomToast(message: string) {
    // Exemple de message (dans fr.json) :
    // "ERROR": { "GENERIC_ERROR": "✨ Oups… une erreur s’est glissée. Merci de réessayer ✨" }
    this.toastr.error(message);
  }
}
