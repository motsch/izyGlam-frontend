import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

  form!: FormGroup;

  constructor(
    private route: ActivatedRoute,
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
      next: (res) => {
        if (!res?.ok) {
          this.loadError = this.mapError(res?.error) || 'Impossible de charger la réservation.';
          this.loading = false;
          return;
        }

        this.bookingSummary = res.booking || null;

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

    this.submitting = true;

    // ⚠️ Comme phone peut être disabled, il faut récupérer la valeur via getRawValue()
    const payload = this.form.getRawValue();

    this.izyphoneService.submitIntake(this.token, payload).subscribe({
      next: (res) => {
        if (!res?.ok) {
          this.submitError = this.mapError(res?.error) || 'Impossible de valider vos informations.';
          this.submitting = false;
          return;
        }

        this.checkoutUrl = res.checkoutUrl || '';
        this.submitSuccess = true;
        this.submitting = false;
      },
      error: () => {
        this.submitError = 'Erreur serveur lors de la validation.';
        this.submitting = false;
      }
    });
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
