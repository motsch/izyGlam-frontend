import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ShopService } from '../../services/shop.service';
import { environment } from 'src/environments/environment';

// ✅ Ajouts IzyGlam : toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-shops-management',
  templateUrl: './admin-shops-management.component.html',
  styleUrls: ['./admin-shops-management.component.scss']
})
export class AdminShopsManagementComponent implements OnInit, AfterViewInit {
  // -----------------------------
  // 🏪 Données & UI
  // -----------------------------
  shops: any[] = [];
  modalOpen = false;
  shop: any = {}; // shop en édition dans la modale

  displayedColumns: string[] = ['name', 'ville', 'note', 'averagePrice', 'promo', 'actions'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  searchTerm: string = '';

  // Upload (placeholders si tu ajoutes la fonctionnalité plus tard)
  imageUsed: string | null = null;
  imagePreview: string | null = null;

  // CDN images utile au template
  imgStorageUrl = environment.APIimgStorageUrl.replace(/\/$/, '');

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private shopService: ShopService,

    // ✅ IzyGlam
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  // ------------------------------------------------------
  // ⏱️ Chargement initial
  // ------------------------------------------------------
  ngOnInit(): void {
    localStorage.setItem('menu-param', 'admin');

    // Prépare la structure par défaut du shop édité (évite les erreurs de binding)
    this.shop.location = {};
    this.shop.hours = {};
    this.shop.hours.morning = {};
    this.shop.hours.afternoon = {};
    this.shop.location.latitude = 0;
    this.shop.location.longitude = 0;
    this.shop.promo = {};

    // Recherche globale : normalisation sur plusieurs colonnes
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const normalize = (v: any) =>
        (v ?? '')
          .toString()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();

      const f = normalize(filter);

      return [
        data.name,
        data.ville,
        data.note,          // peut être number → toString() dans normalize
        data.averagePrice   // idem
      ].some((field) => normalize(field).includes(f));
    };

    // Charge toutes les boutiques
    this.shopService.getAll().subscribe({
      next: (data: any[]) => {
        console.log('Shops:', data);
        this.shops = data;
        this.dataSource.data = this.shops;

        // Si le paginator est déjà là (rare en OnInit), on l’associe
        if (this.paginator) this.dataSource.paginator = this.paginator;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des boutiques :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // ------------------------------------------------------
  // 🔗 Branchement du paginator après rendu de vue
  // ------------------------------------------------------
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  // ------------------------------------------------------
  // 🔎 Recherche globale
  // ------------------------------------------------------
  applyGlobalSearch() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  // ------------------------------------------------------
  // 🎯 Activer / désactiver la promo d’un shop
  // (on persiste aussi côté API)
  // ------------------------------------------------------
  togglePromo(shop: any) {
    const updated = { ...shop, promo: { ...shop.promo, active: !shop.promo?.active } };

    this.shopService.update(updated).subscribe({
      next: (saved: any) => {
        console.log(`Promotion toggled for ${saved.name}: ${saved?.promo?.active}`);

        // MAJ locale
        const idx = this.shops.findIndex(s => s._id === saved._id);
        if (idx > -1) {
          this.shops[idx] = saved;
          this.dataSource.data = [...this.shops];
        }

        this.toastr.success(
          this.translate.instant('SUCCESS.SHOPUPDATED') || 'Boutique mise à jour.'
        );
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour de la promotion :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // ------------------------------------------------------
  // 💾 Sauvegarder les modifications de la modale
  // ------------------------------------------------------
  saveShop() {
    console.log(`Editing shop: ${this.shop?.name}`);

    this.shopService.update(this.shop).subscribe({
      next: (data: any) => {
        console.log('Shop updated:', data);
        this.modalOpen = false;

        // MAJ locale
        const idx = this.shops.findIndex(s => s._id === data._id);
        if (idx > -1) {
          this.shops[idx] = data;
          this.dataSource.data = [...this.shops];
        }

        this.toastr.success(
          this.translate.instant('SUCCESS.SHOPUPDATED') || 'Boutique mise à jour.'
        );
      },
      error: (error: any) => {
        console.error('Erreur lors de la sauvegarde de la boutique :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // ------------------------------------------------------
  // ✏️ Editer (ouvre la modale)
  // ------------------------------------------------------
  editShop(shop: any) {
    console.log(`Editing shop: ${shop.name}`);
    // Clone pour éviter d’éditer la référence dans le tableau tant que non sauvegardé
    this.shop = JSON.parse(JSON.stringify(shop));
    this.modalOpen = true;
  }

  // ------------------------------------------------------
  // ❌ Fermer la modale
  // ------------------------------------------------------
  closeModal(): void {
    this.modalOpen = false;
  }

  // ------------------------------------------------------
  // Placeholders conservés (aucune suppression)
  // ------------------------------------------------------
  saveService() {}
  onFileSelected(event: any): void {}

  // ------------------------------------------------------
  // ✨ Toast d’erreur stylisé IzyGlam (centralisé)
  // ------------------------------------------------------
  private showCustomToast(message: string) {
    // Standard : erreurs → toastr.error
    this.toastr.error(message);
  }
}
