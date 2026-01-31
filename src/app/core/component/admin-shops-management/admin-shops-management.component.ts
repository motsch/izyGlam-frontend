import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { ShopService } from '../../services/shop.service';
import { environment } from 'src/environments/environment';
import { ProductService } from '../../services/product.service';
// ✅ Toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-shops-management',
  templateUrl: './admin-shops-management.component.html',
  styleUrls: ['./admin-shops-management.component.scss'],
})

export class AdminShopsManagementComponent implements OnInit, AfterViewInit {
  // -----------------------------
  // 🏪 Données & UI
  // -----------------------------
  shops: any[] = [];
  modalOpen = false;
  shop: any = {}; // shop en édition dans la modale

  displayedColumns: string[] = [
    'image',
    'name',
    'ville',
    'note',
    'status',
    'verification',
    'actions',
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  searchTerm: string = '';

  // Upload
  imageUsed: string | null = null;
  imagePreview: string | null = null;

  // CDN images utile au template (on enlève un éventuel trailing slash)
  imgStorageUrl = environment.APIimgStorageUrl.replace(/\/$/, '') + '/';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Pour certaines validations / compatibilité avec ton autre composant
  days: string[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];
  selectedFile: File | null = null; // Fichier sélectionné
  shopCopyData: any | null = null; // (utilisé dans validateForm ci-dessous)
  formModified = false;
  formValid = false;

  loading = false;

  // 🔍 Preview des documents (modal dédiée)
  previewOpen = false;
  previewUrl: string | null = null;
  previewType: 'image' | 'pdf' | 'other' = 'image';
  // ------------------------------------------------------
  // ✅ EXPAND ROWS (prestations par boutique)
  // ------------------------------------------------------
  expandedShopId: string | null = null;

  /** cache: shopId -> services[] */
  servicesByShopId: Record<string, any[]> = {};

  /** loading: shopId -> boolean */
  servicesLoadingByShopId: Record<string, boolean> = {};

  /** error: shopId -> string */
  servicesErrorByShopId: Record<string, string | null> = {};
  constructor(
    private shopService: ShopService,
    private toastr: ToastrService,
    private productService: ProductService, // ✅ AJOUT
    private translate: TranslateService
  ) { }

  // ✅ Pour éviter le re-render inutile
  trackByShopId = (_: number, shop: any) => shop?._id;
  trackByServiceId = (_: number, s: any) => s?._id;

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
        data.note,
        data.averagePrice,
        data?.verification?.globalStatus,
      ].some((field) => normalize(field).includes(f));
    };

    // Charge la liste
    this.loadShops();
  }

  /** Recharge toute la liste des shops (utilisé au init + après IA) */
  private loadShops(): void {
    this.shopService.getAllAdmin().subscribe({
      next: (data: any[]) => {
        console.log('Shops:', data);
        this.shops = data;
        this.shops = (data || []).sort((a, b) => {
          const fa = this.isShopFlagged(a) ? 1 : 0;
          const fb = this.isShopFlagged(b) ? 1 : 0;
          // flaggués d'abord
          if (fa !== fb) return fb - fa;
          // sinon tri secondaire (ex: nom)
          return (a?.name || '').localeCompare(b?.name || '');
        });
        this.dataSource.data = this.shops;

        if (this.paginator) this.dataSource.paginator = this.paginator;
        if (this.sort) this.dataSource.sort = this.sort;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des boutiques :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  // ------------------------------------------------------
  // 🔗 Branchement du paginator / sort après rendu de vue
  // ------------------------------------------------------
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // ------------------------------------------------------
  // 🔎 Recherche globale
  // ------------------------------------------------------
  applyGlobalSearch() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  // ------------------------------------------------------
  // 🎯 Activer / désactiver la promo d’un shop (gardé pour la modale)
  // ------------------------------------------------------
  togglePromo(shop: any) {
    const updated = {
      ...shop,
      promo: { ...shop.promo, active: !shop.promo?.active },
    };

    this.shopService.update(updated).subscribe({
      next: (saved: any) => {
        console.log(
          `Promotion toggled for ${saved.name}: ${saved?.promo?.active}`
        );

        const idx = this.shops.findIndex((s) => s._id === saved._id);
        if (idx > -1) {
          this.shops[idx] = saved;
          this.dataSource.data = [...this.shops];
        }

        this.toastr.success(
          this.translate.instant('SUCCESS.SHOPUPDATED') ||
          'Boutique mise à jour.'
        );
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour de la promotion :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  private ensureAdminShopDefaults(): void {
    // Valeur par défaut si absent (anciens shops)
    if (!this.shop.serviceMode) {
      this.shop.serviceMode = 'SALON';
    }

    // placeAddress doit exister si SALON (sinon ngModel plante)
    if (!this.shop.placeAddress) {
      this.shop.placeAddress = {
        label: '',
        addressLine1: '',
        addressLine2: '',
        postalCode: '',
        city: '',
        country: 'FR',
      };
    }

    // country par défaut si vide
    if (!this.shop.placeAddress.country) {
      this.shop.placeAddress.country = 'FR';
    }
  }

  onServiceModeChange(mode: 'SALON' | 'DOMICILE'): void {
    // Si on passe en SALON : garantir placeAddress
    if (mode === 'SALON') {
      if (!this.shop.placeAddress) {
        this.shop.placeAddress = {
          label: '',
          addressLine1: '',
          addressLine2: '',
          postalCode: '',
          city: '',
          country: 'FR',
        };
      }
      if (!this.shop.placeAddress.country) {
        this.shop.placeAddress.country = 'FR';
      }
    }

    // Si on passe en DOMICILE : optionnel -> on peut garder l’adresse
    // MAIS si tu préfères éviter d’afficher une adresse incohérente pour un shop DOMICILE,
    // tu peux choisir de la vider côté admin :
    //
    // if (mode === 'DOMICILE') {
    //   this.shop.placeAddress = undefined as any;
    // }
  }

  isPlaceAddressFilled(): boolean {
    const a = this.shop?.placeAddress;
    if (!a) return false;
    return !!(a.addressLine1 && a.postalCode && a.city);
  }


  // ------------------------------------------------------
  // 🚫 Bloquer / Débloquer un shop (utilisé par la chip Statut)
  // ------------------------------------------------------
  toggleBlockUser(shop: any) {
    const updated = { ...shop, active: !shop.active };

    this.shopService.update(updated).subscribe({
      next: (data: any) => {
        const idx = this.shops.findIndex((u) => u._id === updated._id);
        if (idx > -1) {
          this.shops[idx] = data;
          this.dataSource.data = [...this.shops];
        }

        this.toastr.success(
          this.translate.instant('SUCCESS.USERUPDATED') ||
          'Shops mis à jour.'
        );
      },
      error: (err) => {
        console.error('Erreur lors du blocage/déblocage shop :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  // ------------------------------------------------------
  // 🔗 Helpers documents de vérification (liste + modale)
  // ------------------------------------------------------
  buildDocUrl(path: string | undefined | null): string {
    if (!path) return '';
    // On enlève les / en trop au début pour éviter //uploads/docs/...
    const clean = path.replace(/^\/+/, '');
    return this.imgStorageUrl + clean;
  }

  isImageDoc(path: string | undefined | null): boolean {
    if (!path) return false;
    return /\.(png|jpe?g|gif|webp)$/i.test(path);
  }

  isPdfDoc(path: string | undefined | null): boolean {
    if (!path) return false;
    return /\.pdf$/i.test(path);
  }

  openPreview(path: string | undefined | null): void {
    if (!path) return;

    const fullUrl = this.buildDocUrl(path);
    this.previewUrl = fullUrl;

    const lower = fullUrl.toLowerCase();
    if (this.isPdfDoc(lower)) {
      this.previewType = 'pdf';
    } else if (this.isImageDoc(lower)) {
      this.previewType = 'image';
    } else {
      this.previewType = 'other';
    }

    this.previewOpen = true;
  }

  closePreview(): void {
    this.previewOpen = false;
    this.previewUrl = null;
  }

  // ------------------------------------------------------
  // 💾 Sauvegarder les modifications de la modale
  // ------------------------------------------------------
  saveShop() {
    console.log(`Editing shop: ${this.shop?.name}`);

    // 🔁 On transforme les heures "simples" de la modale
    //     -> structure complète par jour avant envoi
    const payload = this.buildShopPayloadForSave();

    this.shopService.update(payload).subscribe({
      next: (data: any) => {
        console.log('Shop updated:', data);
        this.modalOpen = false;

        const idx = this.shops.findIndex((s) => s._id === data._id);
        if (idx > -1) {
          this.shops[idx] = data;
          this.dataSource.data = [...this.shops];
        }

        this.toastr.success(
          this.translate.instant('SUCCESS.SHOPUPDATED') ||
          'Boutique mise à jour.'
        );
      },
      error: (error: any) => {
        console.error('Erreur lors de la sauvegarde de la boutique :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  /**
   * Construit le payload à envoyer à l’API :
   * - reconstruit hours pour toute la semaine
   * - supprime les champs internes (_fullHoursWeek)
   */
  private buildShopPayloadForSave(): any {
    const clone = JSON.parse(JSON.stringify(this.shop || {}));

    const simpleHours = clone?.hours || {};
    const fullWeekOriginal = clone?._fullHoursWeek || {};

    if (simpleHours?.morning && simpleHours?.afternoon) {
      const base = {
        morning: {
          start: simpleHours.morning.start || '',
          end: simpleHours.morning.end || '',
        },
        afternoon: {
          start: simpleHours.afternoon.start || '',
          end: simpleHours.afternoon.end || '',
        },
      };

      const result: any = { ...fullWeekOriginal };

      this.days.forEach((day) => {
        const existing = result[day] || {};
        result[day] = {
          morning: { ...base.morning },
          afternoon: { ...base.afternoon },
          closed:
            typeof existing.closed === 'boolean' ? existing.closed : false,
        };
      });

      clone.hours = result;
    }

    delete clone._fullHoursWeek;
    return clone;
  }

  // ------------------------------------------------------
  // ✏️ Editer (ouvre la modale)
  // ------------------------------------------------------
  editShop(shop: any) {
    console.log(`Editing shop: ${shop.name}`);

    // Clone profond pour ne pas modifier la liste tant qu’on n’a pas cliqué sur "Enregistrer"
    const clone = JSON.parse(JSON.stringify(shop || {}));

    // ---- Gestion spéciale des horaires ----
    const hours = clone.hours || {};
    clone._fullHoursWeek = hours; // on garde la version complète pour la sauvegarde

    // On choisit un jour de référence (monday sinon le premier trouvé)
    let ref: any = null;
    if (hours.monday) {
      ref = hours.monday;
    } else {
      for (const d of this.days) {
        if (hours[d]) {
          ref = hours[d];
          break;
        }
      }
    }

    // Si on a trouvé un jour de référence avec morning/afternoon → on alimente la structure simple
    if (ref && ref.morning && ref.afternoon) {
      clone.hours = {
        morning: {
          start: ref.morning.start || '',
          end: ref.morning.end || '',
        },
        afternoon: {
          start: ref.afternoon.start || '',
          end: ref.afternoon.end || '',
        },
      };
    } else {
      // Sinon, on s’assure d’avoir au moins la structure attendue par le template
      clone.hours = clone.hours || {};
      clone.hours.morning = clone.hours.morning || { start: '', end: '' };
      clone.hours.afternoon = clone.hours.afternoon || {
        start: '',
        end: '',
      };
    }

    this.shop = clone;

    // Image preview
    this.imagePreview = this.shop.image
      ? this.imgStorageUrl + this.shop.image
      : null;

    // Pour la validation réutilisée (compat ShopManagement)
    this.shopCopyData = { ...this.shop };

    this.modalOpen = true;
  }

  // ------------------------------------------------------
  // ❌ Fermer la modale
  // ------------------------------------------------------
  closeModal(): void {
    this.modalOpen = false;
  }

  // ------------------------------------------------------
  // 📷 Traitement IA de la photo existante du shop
  // ------------------------------------------------------
  changePhotoByAI(shop: any): void {
    if (!shop?._id) {
      console.warn('[AdminShops] changePhotoByAI: shopId manquant');
      return;
    }
    this.loading = true;

    // Flag de chargement pour désactiver le bouton IA + afficher le spinner
    shop._aiLoading = true;

    this.shopService.processShopImage(shop._id).subscribe({
      next: (res: any) => {
        shop._aiLoading = false;
        this.loading = false;

        if (res?.image) {
          // On met à jour l'image dans la ligne du tableau (optimiste)
          shop.image = res.image;

          // Et si la modale est ouverte sur ce shop, on sync aussi this.shop
          if (this.shop && this.shop._id === shop._id) {
            this.shop.image = res.image;
            this.imagePreview =
              this.imgStorageUrl + 'uploads/images/' + res.image;
          }
        }

        // Rechargement propre de toute la liste (pour être 100% synchro avec le backend)
        this.loadShops();

        this.toastr.success(
          this.translate.instant('SUCCESS.IMAGE_PROCESSED') ||
          'Image mise à jour.'
        );
      },
      error: (error) => {
        this.loading = false;
        shop._aiLoading = false;
        console.error('Erreur lors du traitement de l’image IA :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  // Upload "simple" (utilisé par ton HTML actuel)
  onFileSelected(event: any): void {
    try {
      const file: File = event?.target?.files?.[0];
      if (!file) return;

      this.selectedFile = file;

      // Aperçu immédiat
      const reader = new FileReader();
      reader.onload = () => (this.imagePreview = reader.result as string);
      reader.readAsDataURL(file);

      this.markFormModified();
    } catch (err) {
      console.error('[ShopManagement] onFileSelected error:', err);
    }
  }

  /**
   * Marque le formulaire comme modifié, revalide et (dans ton cas) déclenche une sauvegarde.
   */
  markFormModified(): void {
    try {
      this.formModified = true;
      this.validateForm();
      // this.saveShop(); // si tu veux l'autosave
    } catch (err) {
      console.error('[ShopManagement] markFormModified error:', err);
    }
  }

  /**
   * Validation très simple, inspirée de ton autre composant
   */
  validateForm(): void {
    try {
      if (!this.shopCopyData) {
        this.formValid = false;
        return;
      }

      const descriptionValid =
        !!this.shopCopyData.description &&
        this.shopCopyData.description.length >= 25;

      const cityValid =
        !!this.shopCopyData.ville && !!this.shopCopyData.district;

      const maxDistanceValid =
        this.shopCopyData.maxDistance &&
        Number(this.shopCopyData.maxDistance) > 0;

      const hours = this.shopCopyData.hours || {};
      const allDaysValid = this.days.every((d) => {
        const data = hours[d];
        if (!data) return true; // ici on est plus permissif
        if (data.closed) return true;
        return !!(
          data.morning?.start &&
          data.morning?.end &&
          data.afternoon?.start &&
          data.afternoon?.end
        );
      });

      this.formValid =
        descriptionValid && cityValid && maxDistanceValid && allDaysValid;
    } catch (err) {
      console.error('[ShopManagement] validateForm error:', err);
      this.formValid = false;
    }
  }

  // ------------------------------------------------------
  // 🖼️ Fallback si l’image ne charge pas (table)
  // ------------------------------------------------------
  onImageError(shop: any): void {
    if (!shop) {
      return;
    }
    shop.image = 'default.png';
  }

  // ------------------------------------------------------
  // Placeholders conservés
  // ------------------------------------------------------
  saveService() { }

  validateDoc(docType: string, status: string) {
    if (!this.shop?._id) return;

    this.shopService
      .validateDocument(this.shop._id, docType, status)
      .subscribe({
        next: (res: any) => {
          this.shop.verification = res.verification;
          this.toastr.success(
            status === 'approved' ? 'Document validé' : 'Document refusé'
          );
        },
        error: () => {
          this.toastr.error('Erreur lors de la validation.');
        },
      });
  }

  // ------------------------------------------------------
  // 🧠 Helpers pour la colonne Documents
  // ------------------------------------------------------
  isFullyVerified(shop: any): boolean {
    const v = shop?.verification;
    if (!v) return false;

    const docs: string[] = ['identity', 'insurance', 'kbis'];

    return docs.every((key) => {
      const doc = (v as any)[key];
      if (!doc) return false;
      return doc.status === 'approved';
    });
  }

  getDocStatus(shop: any, docType: string): string {
    const v = shop?.verification;
    if (!v) return 'missing';
    const doc = (v as any)[docType];
    return doc?.status || 'missing';
  }

  getDocStatusClass(shop: any, docType: string): string {
    return this.getDocStatus(shop, docType); // renvoie approved / rejected / pending / missing
  }

  getDocStatusTooltip(shop: any, docType: string): string {
    const label =
      docType === 'identity'
        ? "Pièce d'identité"
        : docType === 'insurance'
          ? 'Assurance'
          : 'KBIS';

    const status = this.getDocStatus(shop, docType);

    if (status === 'approved') return `${label} : approuvé`;
    if (status === 'pending') return `${label} : en attente`;
    if (status === 'rejected') return `${label} : refusé`;
    return `${label} : manquant`;
  }

  // ------------------------------------------------------
  // ✨ Toast d’erreur stylisé
  // ------------------------------------------------------
  private showCustomToast(message: string) {
    this.toastr.error(message);
  }

  // ------------------------------------------------------
  // ✅ Ouvrir / fermer + charger services on-demand
  // ------------------------------------------------------
  toggleRow(shop: any): void {
    const shopId = shop?._id;
    if (!shopId) return;

    // Si on reclique sur la même boutique -> on referme
    if (this.expandedShopId === shopId) {
      this.expandedShopId = null;
      return;
    }

    this.expandedShopId = shopId;

    // Si déjà en cache -> pas de refetch
    if (this.servicesByShopId[shopId]) return;

    this.servicesLoadingByShopId[shopId] = true;
    this.servicesErrorByShopId[shopId] = null;

    this.productService.getProductsByShopAdmin(shopId).subscribe({
      next: (services: any[]) => {
        // Petit tri sympa: non-blocked d'abord + ordre alpha
        const sorted = (services || []).slice().sort((a, b) => {
          const ab = Number(!!a.blocked);
          const bb = Number(!!b.blocked);
          if (ab !== bb) return ab - bb;
          return (a.name || '').localeCompare(b.name || '');
        });

        this.servicesByShopId[shopId] = sorted;
        this.servicesLoadingByShopId[shopId] = false;
      },
      error: (err) => {
        console.error('Erreur chargement services shop', shopId, err);
        this.servicesLoadingByShopId[shopId] = false;
        this.servicesErrorByShopId[shopId] =
          this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur de chargement.';
        this.showCustomToast(this.servicesErrorByShopId[shopId] || 'Erreur.');
      },
    });
  }

  isExpanded(shop: any): boolean {
    return !!shop?._id && this.expandedShopId === shop._id;
  }

  getServices(shop: any): any[] {
    const shopId = shop?._id;
    if (!shopId) return [];
    return this.servicesByShopId[shopId] || [];
  }

  isServicesLoading(shop: any): boolean {
    const shopId = shop?._id;
    if (!shopId) return false;
    return !!this.servicesLoadingByShopId[shopId];
  }

  getServicesError(shop: any): string | null {
    const shopId = shop?._id;
    if (!shopId) return null;
    return this.servicesErrorByShopId[shopId] || null;
  }

  formatDuration(mins: number): string {
    const m = Number(mins || 0);
    if (!m) return '—';
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h}h${String(r).padStart(2, '0')}` : `${h}h`;
  }

  formatPrice(price: number): string {
    const p = Number(price || 0);
    return `${p.toFixed(0)}€`;
  }

  isShopFlagged(shop: any): boolean {
    const flags = (shop?.flags?.length || 0) > 0;
    const status = shop?.status === 'needs_manual_review';
    const unsafe = shop?.moderation?.desc?.safe === false;
    return flags || status || unsafe;
  }

  getShopFlagReasons(shop: any): string[] {
    // priorité aux raisons IA détaillées si dispo
    const reasons = shop?.moderation?.desc?.reasons;
    if (Array.isArray(reasons) && reasons.length) return reasons;
    const flags = shop?.flags;
    if (Array.isArray(flags) && flags.length) return flags;
    return [];
  }

  blockShop(shop: any) {
    const reasons = this.getShopFlagReasons(shop);
    const reasonText = reasons?.length
      ? reasons.join(', ')
      : 'Blocage manuel (admin)';

    const msg =
      `Bloquer "${shop?.name}" et rembourser les bookings en attente (pending/accepted) ?\n\n` +
      `Motif: ${reasonText}\n\n` +
      `⚠️ Action irréversible côté client (emails + remboursements).`;

    if (!confirm(msg)) return;

    this.loading = true;

    this.shopService.blockShop(shop._id, reasonText).subscribe({
      next: (res: any) => {
        this.loading = false;

        const count = res?.refundedBookingsCount ?? 0;
        this.toastr.success(
          `Shop bloqué. ${count} booking(s) traité(s).`
        );

        // Recharge la liste (et donc tri flagged-first)
        this.loadShops();
      },
      error: (err: any) => {
        this.loading = false;
        console.error(err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  hasFlaggedServices(shop: any): boolean {
    return (shop?.moderation?.services?.flaggedCount || 0) > 0;
  }

  getFlaggedServicesBadgeText(shop: any): string {
    const n = shop?.moderation?.services?.flaggedCount || 0;
    return n > 1 ? `⚠️ ${n} prestations signalées` : `⚠️ 1 prestation signalée`;
  }

  getFlaggedServicesTooltip(shop: any): string {
    const n = shop?.moderation?.services?.flaggedCount || 0;
    const reasons = shop?.moderation?.services?.topReasons || [];

    if (!n) return "";

    if (!reasons.length) {
      return `${n} prestation(s) signalée(s).`;
    }

    return `${n} prestation(s) signalée(s) : ${reasons.join(", ")}`;
  }
}
