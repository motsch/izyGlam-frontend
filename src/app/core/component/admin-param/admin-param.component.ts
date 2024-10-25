import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-param',
  templateUrl: './admin-param.component.html',
  styleUrls: ['./admin-param.component.scss']
})
export class AdminParamComponent implements OnInit {
  settings:any = {};

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getAdminSettings().subscribe(
      (data :any) => {
        console.log('Paramètres de la plateforme :', JSON.stringify(data));
        this.settings = {
          ...data,
          commissionRate: data.commissionRate * 100, // Conversion en pourcentage
          taxRate: data.taxRate * 100 // Conversion en pourcentage
        };
      },
      (error:any) => {
        console.error('Erreur lors de la récupération des paramètres', error);
      }
    );
  }

  saveSettings(): void {
    const settingsToSave = {
      ...this.settings,
      commissionRate: this.settings.commissionRate / 100, // Conversion décimale pour sauvegarde
      taxRate: this.settings.taxRate / 100 // Conversion décimale pour sauvegarde
    };

    console.log('Updated settings:', settingsToSave);
    // Appeler le service pour sauvegarder les modifications
  }
}
