import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IzyphoneBookingService } from 'src/app/core/services/izyphone-booking.service';

type ServiceMode = 'SALON' | 'DOMICILE';

@Component({
  selector: 'app-izyphone-booking',
  templateUrl: './izyphone-booking.component.html',
  styleUrl: './izyphone-booking.component.scss'
})
export class IzyphoneBookingComponent implements OnInit {
  token = '';

  loading = true;
  submitting = false;

  loadError = '';
  submitError = '';
  submitSuccess = false;

  bookingSummary: any = null;
  checkoutUrl = '';
  serviceMode: ServiceMode = 'SALON';

  phoneLocked = false;

  // ✅ modèle ngModel
  model: any = {};

  // ✅ erreurs UI (par champ)
  errors: any = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private izyphoneService: IzyphoneBookingService
  ) { }

  ngOnInit(): void {
    this.token = (this.route.snapshot.paramMap.get('token') || '').trim();

    if (!this.token) {
      this.loading = false;
      this.loadError = 'Lien invalide (token manquant).';
      return;
    }

    this.loadIntake();
  }

  private loadIntake(): void {
    this.loading = true;
    this.loadError = '';

    this.izyphoneService.getIntake(this.token).subscribe({
      next: (res: any) => {
        if (!res?.ok) {
          this.loadError = this.mapError(res?.error) || 'Impossible de charger la réservation.';
          this.loading = false;
          return;
        }

        this.bookingSummary = res.booking || null;

        // serviceMode depuis API
        this.applyServiceMode(res?.serviceMode || 'SALON');

        // déjà payé => dehors
        const status = String(this.bookingSummary?.status || '').toLowerCase();
        const intakeStatus = String(this.bookingSummary?.intakeStatus || '').toUpperCase();
        const alreadyPaid =
          ['accepted', 'finished', 'paid'].includes(status) || intakeStatus === 'PAID';

        if (alreadyPaid) {
          this.router.navigateByUrl('/main');
          return;
        }

        const p = res.prefill || {};
        this.model.email = p.email || '';
        this.model.firstname = p.firstname || '';
        this.model.lastname = p.lastname || '';
        this.model.phone = p.phone || '';
        this.model.addressLine1 = p.addressLine1 || '';
        this.model.addressLine2 = p.addressLine2 || '';
        this.model.postalCode = p.postalCode || '';
        this.model.city = p.city || '';
        this.model.country = p.country || 'FR';

        this.phoneLocked = !!String(p.phone || '').trim();

        if (this.serviceMode === 'SALON') {
          this.clearAddressModel();
        }

        this.loading = false;
      },
      error: () => {
        this.loadError = 'Erreur serveur lors du chargement.';
        this.loading = false;
      }
    });
  }

  // ✅ helpers UI : quand l’utilisateur tape, on retire l’erreur du champ
  onFieldInput(field: string): void {
    if (this.errors[field]) delete this.errors[field];
    if (this.submitError) this.submitError = '';
  }

  onServiceModeChanged(mode: ServiceMode): void {
    this.applyServiceMode(mode);

    // si SALON => on vide les champs adresse + on clear leurs erreurs
    if (this.serviceMode === 'SALON') {
      this.clearAddressModel();
      ['addressLine1', 'addressLine2', 'postalCode', 'city', 'country'].forEach(k => delete this.errors[k]);
    }
  }

  // ✅ bouton (click)
  submit(): void {
    this.submitError = '';
    this.submitSuccess = false;
    this.checkoutUrl = '';
    this.errors = {};

    if (this.submitting) return;

    const ok = this.validate();
    if (!ok) {
      this.submitError = 'Merci de corriger les champs en erreur.';
      return;
    }

    this.submitting = true;

    const payload: any = {
      email: this.model.email.trim(),
      firstname: this.model.firstname.trim(),
      lastname: this.model.lastname.trim(),
      phone: this.model.phone.trim(),
    };

    if (this.serviceMode === 'DOMICILE') {
      payload.addressLine1 = this.model.addressLine1.trim();
      payload.addressLine2 = (this.model.addressLine2 || '').trim();
      payload.postalCode = this.model.postalCode.trim();
      payload.city = this.model.city.trim();
      payload.country = (this.model.country || 'FR').trim();
    }

    this.izyphoneService.submitIntake(this.token, payload).subscribe({
      next: (res: any) => {
        if (!res?.ok) {
          if (res?.error === 'BOOKING_ALREADY_PAID') {
            window.location.href = '/main';
            return;
          }

          this.submitError = this.mapError(res?.error) || 'Impossible de valider vos informations.';
          this.submitting = false;
          return;
        }

        const url = String(res?.checkoutUrl || '').trim();
        if (!url) {
          this.submitError = 'Lien de paiement indisponible. Merci de réessayer.';
          this.submitting = false;
          return;
        }

        this.checkoutUrl = url;
        this.submitSuccess = true;
        window.location.href = url;
      },
      error: (err) => {
        const code = err?.error?.error;
        if (code === 'BOOKING_ALREADY_PAID') {
          window.location.href = '/';
          return;
        }

        this.submitError = this.mapError(code) || 'Erreur serveur lors de la validation.';
        this.submitting = false;
      }
    });
  }

  private validate(): boolean {

    // email
    if (!this.model.email) {
      this.errors.email = 'Email obligatoire.';
    }
    else if (!this.isValidEmail(this.model.email)) { this.errors.email = 'Email invalide.' };

    // noms
    if (!this.model.firstname) { this.errors.firstname = 'Prénom obligatoire.' };
    if (!this.model.lastname) { this.errors.lastname = 'Nom obligatoire.' };

    // téléphone
    if (!this.model.phone) { this.errors.phone = 'Téléphone obligatoire.' };

    // adresse si DOMICILE
    if (this.serviceMode === 'DOMICILE') {
      const a1 = (this.model.addressLine1 || '').trim();
      const cp = (this.model.postalCode || '').trim();
      const city = (this.model.city || '').trim();
      const country = (this.model.country || '').trim();

      if (!a1) { this.errors.addressLine1 = 'Adresse obligatoire.' };
      if (!cp) { this.errors.postalCode = 'Code postal obligatoire.' };
      if (!city) { this.errors.city = 'Ville obligatoire.' };
      if (!country) { this.errors.country = 'Pays obligatoire.' };
    }

    // si erreurs => false
    return Object.keys(this.errors).length === 0;
  }

  private isValidEmail(email: string): boolean {
    // regex simple et suffisante pour UI
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private applyServiceMode(mode: string): void {
    const m = String(mode || 'SALON').toUpperCase();
    this.serviceMode = (m === 'DOMICILE' ? 'DOMICILE' : 'SALON');
  }

  private clearAddressModel(): void {
    this.model.addressLine1 = '';
    this.model.addressLine2 = '';
    this.model.postalCode = '';
    this.model.city = '';
    this.model.country = 'FR';
  }

  private mapError(code?: string): string {
    switch (code) {
      case 'TOKEN_REQUIRED': return 'Lien invalide.';
      case 'BOOKING_NOT_FOUND': return 'Réservation introuvable.';
      case 'TOKEN_EXPIRED': return 'Lien expiré. Merci de rappeler le salon.';

      case 'EMAIL_REQUIRED': return 'Email obligatoire.';
      case 'FIRSTNAME_REQUIRED': return 'Prénom obligatoire.';
      case 'LASTNAME_REQUIRED': return 'Nom obligatoire.';
      case 'PHONE_REQUIRED': return 'Téléphone obligatoire.';
      case 'ADDRESS_REQUIRED': return 'Adresse obligatoire.';
      case 'POSTAL_CODE_REQUIRED': return 'Code postal obligatoire.';
      case 'CITY_REQUIRED': return 'Ville obligatoire.';
      case 'COUNTRY_REQUIRED': return 'Pays obligatoire.';

      case 'INVALID_AMOUNT': return 'Montant invalide. Merci de contacter le salon.';
      case 'BOOKING_ALREADY_PAID': return 'Cette réservation est déjà réglée.';
      case 'PAYMENT_ALREADY_SENT': return 'Le lien de paiement a déjà été envoyé.';
      case 'TWILIO_FROM_MISSING': return 'Erreur technique (SMS). Merci de contacter le salon.';
      case 'SERVER_ERROR': return 'Erreur serveur. Réessayez dans quelques instants.';
      default: return '';
    }
  }
}