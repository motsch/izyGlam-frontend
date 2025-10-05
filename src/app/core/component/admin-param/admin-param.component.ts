import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { UserService } from '../../services/user.service';

// ✅ Ajouts IzyGlam : toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-param',
  templateUrl: './admin-param.component.html',
  styleUrls: ['./admin-param.component.scss']
})
export class AdminParamComponent implements OnInit {
  // Objet des paramètres de plateforme affichés dans le formulaire
  // (les taux sont manipulés en POURCENT dans l’UI, et convertis en décimal à l’envoi)
  settings: any = {};

  constructor(
    private adminService: AdminService,

    // ✅ IzyGlam
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  // ------------------------------------------------------
  // ⏱️ Chargement initial : lecture des paramètres
  // ------------------------------------------------------
  ngOnInit(): void {
    // On fixe l’onglet du menu latéral côté UI
    localStorage.setItem('menu-param', 'admin');

    // Récupération des paramètres plateforme
    this.adminService.getAdminSettings().subscribe({
      next: (data: any) => {
        console.log('Paramètres de la plateforme :', JSON.stringify(data));
        // Conversion en pourcentage pour l’UI
        this.settings = {
          ...data,
          commissionRate: data.commissionRate * 100,
          taxRate: data.taxRate * 100
        };
      },
      error: (error: any) => {
        console.error('Erreur lors de la récupération des paramètres :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // ------------------------------------------------------
  // 💾 Sauvegarde des paramètres
  // ------------------------------------------------------
  saveSettings(): void {
    console.log('pubActivated:', this.settings.pubActivated);

    // Conversion en décimal pour l’API (ex: 15% -> 0.15)
    const settingsToSave = {
      ...this.settings,
      commissionRate: this.settings.commissionRate / 100,
      taxRate: this.settings.taxRate / 100
    };

    console.log('Updated settings (payload API) :', settingsToSave);

    this.adminService.updateAdminSettings(settingsToSave).subscribe({
      next: (data: any) => {
        console.log('Paramètres mis à jour côté serveur :', data);

        // Réinjecte les valeurs en POURCENT dans l’UI après la réponse
        this.settings = {
          ...data,
          commissionRate: data.commissionRate * 100,
          taxRate: data.taxRate * 100
        };

        // ✅ Toast de succès IzyGlam
        this.toastr.success(
          this.translate.instant('SUCCESS.SETTINGS_UPDATED') || 'Paramètres mis à jour.'
        );
      },
      error: (error: any) => {
        console.error('Erreur lors de la sauvegarde des paramètres :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // ------------------------------------------------------
  // ✨ Toast d’erreur stylisé IzyGlam (centralisé)
  // ------------------------------------------------------
  private showCustomToast(message: string) {
    // Standard IzyGlam : erreurs → toastr.error
    // Clé i18n recommandée : ERROR.GENERIC_ERROR
    this.toastr.error(message);
  }
}
