import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SeoService } from 'src/app/core/services/seo.service';
import { SubscriptionService } from 'src/app/core/services/subscription.service';

@Component({
  selector: 'app-price-plans',
  templateUrl: './price-plans.component.html',
  styleUrl: './price-plans.component.scss',
})
export class PricePlansComponent implements OnInit {
  subscriptions: any[] | undefined;
  constructor(private router: Router,
    private seoService: SeoService,
    private subscriptionService: SubscriptionService
  ) { }

  ngOnInit() {
    this.seoService.updateMeta('pricing');
    this.subscriptionService.getAll("FR").subscribe(subs => {
      this.subscriptions = subs;
      console.log(this.subscriptions)
    });
  }

  subscribe(plan: string) {
    console.log(`Souscription au plan : ${plan}`);
    // Ici tu peux ajouter la logique pour démarrer la souscription, par exemple avec un service HTTP
    this.router.navigate(['/payement']);
  }

  goToProfileSetup() {
    this.router.navigate(['/profile-setup']);
  }

  goToPaiement(plan: string) {
    this.router.navigate(['/payement-pro/' + plan]);
  }

  goToShopCreation() {
    this.router.navigate(['/creation-shop']);
  }
}
