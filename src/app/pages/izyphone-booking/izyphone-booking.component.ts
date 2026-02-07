import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { IzyphoneBookingService } from 'src/app/core/services/izyphone-booking.service';

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
  serviceMode: 'SALON' | 'DOMICILE' = 'SALON';

  form!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private izyphoneService: IzyphoneBookingService
  ) { }

  ngOnInit(): void {
    this.token = (this.route.snapshot.paramMap.get('token') || '').trim();

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstname: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      phone: ['', [Validators.required]],

      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      postalCode: ['', [Validators.required]],
      city: ['', [Validators.required]],
      country: ['FR', [Validators.required]],
    });

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
      next: (res :any) => {
        if (!res?.ok) {
          this.loadError = this.mapError(res?.error) || 'Impossible de charger la réservation.';
          this.loading = false;
          return;
        }

        this.bookingSummary = res.booking || null;
        // ✅ NEW: serviceMode depuis l’API
        this.applyServiceModeValidators(res?.serviceMode || 'SALON');

        // ✅ Si déjà payé / confirmé => page inaccessible
        const status = String(this.bookingSummary?.status || '').toLowerCase();
        const intakeStatus = String(this.bookingSummary?.intakeStatus || '').toUpperCase();

        const alreadyPaid =
          ['accepted', 'finished', 'paid'].includes(status) || intakeStatus === 'PAID';

        if (alreadyPaid) {
          this.router.navigateByUrl('/main');
          return;
        }

        const p = res.prefill || {};
        this.form.patchValue({
          email: p.email || '',
          firstname: p.firstname || '',
          lastname: p.lastname || '',
          phone: p.phone || '',
          addressLine1: p.addressLine1 || '',
          addressLine2: p.addressLine2 || '',
          postalCode: p.postalCode || '',
          city: p.city || '',
          country: p.country || 'FR',
        });

        // ✅ Logique simple pour “désactiver ce qui ne doit pas changer”
        // Ici : si téléphone déjà connu -> on le lock (car c’est l’identifiant du flow Twilio).
        const phoneVal = (p.phone || '').trim();
        if (phoneVal) {
          this.form.get('phone')?.disable({ emitEvent: false });
        }

        this.loading = false;
      },
      error: () => {
        this.loadError = 'Erreur serveur lors du chargement.';
        this.loading = false;
      }
    });
  }

  submit(): void {
    this.submitError = '';
    this.submitSuccess = false;
    this.checkoutUrl = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submitError = 'Merci de compléter tous les champs obligatoires.';
      return;
    }

    if (this.submitting) return; // anti double-submit
    this.submitting = true;

    const payload = this.form.getRawValue();

    this.izyphoneService.submitIntake(this.token, payload).subscribe({
      next: (res: any) => {
        // Cas : backend répond ok:false + error
        if (!res?.ok) {
          // Si déjà payé => on dégage
          if (res?.error === 'BOOKING_ALREADY_PAID') {
            window.location.href = '/main';
            return;
          }

          this.submitError = this.mapError(res?.error) || 'Impossible de valider vos informations.';
          this.submitting = false;
          return;
        }

        // Cas : ok:true mais pas de checkoutUrl => bug / incohérence
        const url = String(res?.checkoutUrl || '').trim();
        if (!url) {
          this.submitError = 'Lien de paiement indisponible. Merci de réessayer.';
          this.submitting = false;
          return;
        }

        // (optionnel) UI si tu veux afficher un état 0.5s avant redirect
        this.checkoutUrl = url;
        this.submitSuccess = true;

        // ✅ Flow PRO : redirection immédiate vers Stripe
        window.location.href = url;
      },
      error: (err) => {
        // Si ton backend renvoie directement un 409/410 etc.
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

  private applyServiceModeValidators(mode: string): void {
    const m = String(mode || 'SALON').toUpperCase();
    this.serviceMode = (m === 'DOMICILE' ? 'DOMICILE' : 'SALON');

    const addressLine1 = this.form.get('addressLine1');
    const postalCode = this.form.get('postalCode');
    const city = this.form.get('city');
    const country = this.form.get('country');

    if (this.serviceMode === 'DOMICILE') {
      // ✅ Adresse client requise
      addressLine1?.setValidators([Validators.required]);
      postalCode?.setValidators([Validators.required]);
      city?.setValidators([Validators.required]);
      country?.setValidators([Validators.required]);

      // on garde enabled (le client doit saisir)
      addressLine1?.enable({ emitEvent: false });
      postalCode?.enable({ emitEvent: false });
      city?.enable({ emitEvent: false });
      country?.enable({ emitEvent: false });
    } else {
      // ✅ SALON : adresse client NON requise
      addressLine1?.clearValidators();
      postalCode?.clearValidators();
      city?.clearValidators();
      country?.clearValidators();

      // Option A (recommandé UX) : on désactive + on vide
      addressLine1?.setValue('', { emitEvent: false });
      this.form.get('addressLine2')?.setValue('', { emitEvent: false });
      postalCode?.setValue('', { emitEvent: false });
      city?.setValue('', { emitEvent: false });
      country?.setValue('FR', { emitEvent: false });

      addressLine1?.disable({ emitEvent: false });
      this.form.get('addressLine2')?.disable({ emitEvent: false });
      postalCode?.disable({ emitEvent: false });
      city?.disable({ emitEvent: false });
      country?.disable({ emitEvent: false });
    }

    // Important : recalcul de l’état du form
    addressLine1?.updateValueAndValidity({ emitEvent: false });
    postalCode?.updateValueAndValidity({ emitEvent: false });
    city?.updateValueAndValidity({ emitEvent: false });
    country?.updateValueAndValidity({ emitEvent: false });
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

      default:
        return '';
    }
  }
}
