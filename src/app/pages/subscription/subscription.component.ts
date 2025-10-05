import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/core/services/user.service';

// ✅ AjoutsizyGlam : toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  // ⚠️ Correction : Angular attend "styleUrls" (tableau), pas "styleUrl"
  styleUrls: ['./subscription.component.scss']
})
export class SubscriptionComponent implements OnInit {
  // Données de l'utilisateur connecté
  me: any = null;
  // Détail de l'abonnement actuel
  subscription: any = null;

  constructor(
    private userService: UserService,

    // ✅ AjoutizyGlam
    private toastr: ToastrService,
    private translate: TranslateService
  ) { }

  // ------------------------------------------------------
  // ⏱️ Au chargement : on récupère l'utilisateur puis son abonnement
  // ------------------------------------------------------
  ngOnInit(): void {
    this.userService.getMe().subscribe({
      next: (user: any) => {
        this.me = user;

        // Ensuite on charge l'abonnement courant
        this.userService.getSubscription().subscribe({
          next: (sub: any) => {
            this.subscription = sub;
          },
          error: (err) => {
            console.error('Erreur lors du chargement de la souscription :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement utilisateur :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // ------------------------------------------------------
  // ▶️ Souscrire à un plan (plan + durée en mois)
  // ------------------------------------------------------
  onSubscribe(plan: string, durationInMonths: number) {
    this.userService.subscribeToPlan(plan, durationInMonths).subscribe({
      next: (response) => {
        // ✅ On remplace l'alert par un toast de succès propre
        //    (On garde showCustomToast pour les erreurs)
        this.toastr.success(response?.message || this.translate.instant('SUCCESS.SUBSCRIBE_SUCCESS'));
        // Recharge les infos de l'écran (utilisateur + abonnement)
        this.ngOnInit();
      },
      error: (err) => {
        console.error('Erreur lors de la souscription au plan :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // ------------------------------------------------------
  // ✨ Toast d’erreur styliséizyGlam (centralisé)
  // ------------------------------------------------------
  private showCustomToast(message: string) {
    // Exemple conseillé (fr.json) :
    // "ERROR": { "GENERIC_ERROR": "✨ Oups… une erreur s’est glissée. Merci de réessayer ✨" }
    this.toastr.error(message);
  }
}
