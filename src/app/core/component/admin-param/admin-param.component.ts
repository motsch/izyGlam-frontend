import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-admin-param',
  templateUrl: './admin-param.component.html',
  styleUrls: ['./admin-param.component.scss']
})
export class AdminParamComponent implements OnInit {
  settingsForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Initialisation du formulaire avec les paramètres de la plateforme
    this.settingsForm = this.fb.group({
      commissionRate: [15, [Validators.required, Validators.min(0), Validators.max(100)]],
      serviceFee: [2.9, [Validators.required, Validators.min(0)]],
      bookingWindowWeeks: [6, [Validators.required, Validators.min(1)]],
      cancellationPolicy24h: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      cancellationPolicy48h: [0, [Validators.required, Validators.min(0)]],
      minimumBookingNotice: [24, [Validators.required, Validators.min(1)]],
      taxRate: [20, [Validators.required, Validators.min(0), Validators.max(100)]],
    });
  }

  saveSettings(): void {
    if (this.settingsForm.valid) {
      const updatedSettings = this.settingsForm.value;
      // Logique pour sauvegarder les paramètres dans la base de données
      console.log('Updated settings:', updatedSettings);
      // Appeler un service pour enregistrer les modifications
    } else {
      console.log('Formulaire invalide');
    }
  }
}
