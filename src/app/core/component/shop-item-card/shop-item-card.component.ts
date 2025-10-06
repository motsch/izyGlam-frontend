import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { RdvModalComponent } from '../rdv-modal/rdv-modal.component';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-shop-item-card',
  templateUrl: './shop-item-card.component.html',
  styleUrls: ['./shop-item-card.component.scss'],
})
export class ShopItemCardComponent implements OnInit {
  /** Produit/Service affiché par la carte */
  @Input() item: any;

  /** Bases d’URL d’images */
  imgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');
  APIimgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');
  commissionRate: number = 0;
  serviceFee: number = 0;

  constructor(
    public dialog: MatDialog,
    private toastr: ToastrService,
    private translate: TranslateService,
    private adminService: AdminService
  ) { }

  ngOnInit(): void {
    this.adminService.getAdminSettings().subscribe({
      next: (data: any) => {
        // 1) Paramètres admin (commission, TVA, etc.)
        this.commissionRate = data?.commissionRate || 0;
        this.serviceFee = data.serviceFee || 0;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des paramètres admin :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  /**
   * Ouvre la modale de prise de RDV pour l’item courant.
   * - Stocke l’item dans le localStorage (consommé par la modale).
   * - Gestion d’erreurs robuste + logs + toasts.
   */
  openDialog(): void {
    try {
      if (!this.item) {
        console.warn('[ShopItemCard] openDialog: item is empty/null.');
        this.showCustomToast(this.t('ERROR.GENERIC_ERROR'), 'error');
        return;
      }

      // Sauvegarde l’item sélectionné pour que la modale puisse le lire
      localStorage.setItem('productToBuy', JSON.stringify(this.item));

      // Ouverture de la modale
      this.dialog.open(RdvModalComponent);

      // Toast léger d’info (optionnel)
      // this.showCustomToast(this.t('SHOP_ITEM.OPEN_SLOT_MODAL'), 'success');
    } catch (err) {
      console.error('[ShopItemCard] openDialog ERROR:', err);
      this.showCustomToast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  /**
   * Calcule un prix TTC affichable pour le client :
   *  - commission 10%
   *  - TVA 20%
   * Retourne une string formatée "12,34 € TTC".
   */
  calculateFinalPrice(basePrice: number): string {
    try {
      const numericBase = Number(basePrice);
      if (isNaN(numericBase) || numericBase < 0) {
        console.warn('[ShopItemCard] calculateFinalPrice: invalid base price =>', basePrice);
        return '0,00 € TTC';
      }

      const tvaRate = 0.20;        // 20% de TVA
      const priceWithCommission = (numericBase * (1 + this.commissionRate)) + this.serviceFee;
      const priceWithTva = priceWithCommission * (1 + tvaRate);

      // Format FR simple (2 décimales + virgule)
      return priceWithTva.toFixed(2).replace('.', ',') + ' € TTC';
    } catch (err) {
      console.error('[ShopItemCard] calculateFinalPrice ERROR:', err);
      return '0,00 € TTC';
    }
  }

  /**
   * Fallback d’image si l’URL échoue.
   */
  onImageError(event: Event): void {
    try {
      const imgElement = event.target as HTMLImageElement;
      imgElement.src = this.APIimgStorageUrl + '/uploads/images/logo.png';
    } catch (err) {
      console.error('[ShopItemCard] onImageError ERROR:', err);
    }
  }

  // -----------------------
  // Helpers i18n + Toasts
  // -----------------------

  /** Raccourci i18n avec fallback sur la clé si manquante */
  private t(key: string): string {
    try {
      const tr = this.translate.instant(key);
      return tr && tr !== key ? tr : key;
    } catch {
      return key;
    }
  }

  /** Toast centralisé, succès par défaut */
  private showCustomToast(message: string, type: 'success' | 'error' = 'success'): void {
    try {
      if (type === 'success') this.toastr.success(message);
      else this.toastr.error(message);
    } catch (err) {
      // On ne bloque pas l’UX si Toastr plante
      console.warn('[ShopItemCard] showCustomToast WARN:', err, message);
    }
  }
}
