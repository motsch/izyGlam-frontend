import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { finalize, of, switchMap, catchError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

import {
  BookingCategory,
  BookingCategoryService,
} from '../../services/booking-category.service';

@Component({
  selector: 'app-shop-category-management',
  templateUrl: './shop-category-management.component.html',
  styleUrls: ['./shop-category-management.component.scss'],
})
export class ShopCategoryManagementComponent implements OnInit, OnChanges {
  // ===========================
  // Inputs / Outputs
  // ===========================
  @Input() myShopData: any = {};
  @Input() me: any = {};
  @Output() categoriesUpdated = new EventEmitter<void>();

  // ===========================
  // State
  // ===========================
  loading = false;
  saving = false;

  categories: BookingCategory[] = [];

  modalOpen = false;
  editingCategoryId: string | null = null;
  modalCategory: Partial<BookingCategory> = {};

  // Palette simple (Apple-like pink)
  colors: Array<{ hex: string; selected: boolean }> = [
    { hex: '#ffd6e0', selected: false },
    { hex: '#ffb3d1', selected: false },
    { hex: '#ff8ac4', selected: false },
    { hex: '#ff72bc', selected: false },
    { hex: '#ff4f9e', selected: false },
    { hex: '#ffc2d4', selected: false },
    { hex: '#ffe6f0', selected: false },
    { hex: '#f8cdd8', selected: false },
  ];

  constructor(
    private bookingCategoryService: BookingCategoryService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.safeLoad();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['myShopData']?.currentValue?._id) {
      this.safeLoad();
    }
  }

  // ===========================
  // i18n + toast helpers
  // ===========================
  private t(keyOrText: string): string {
    try {
      const tr = this.translate.instant(keyOrText);
      return tr && tr !== keyOrText ? tr : keyOrText;
    } catch {
      return keyOrText;
    }
  }

  private toast(msg: string, type: 'success' | 'error' = 'success') {
    if (type === 'success') this.toastr.success(msg);
    else this.toastr.error(msg);
  }

  // ===========================
  // Load
  // ===========================
  private safeLoad() {
    if (!this.myShopData?._id) return;
    this.loadCategories(this.myShopData._id);
  }

  loadCategories(shopId: string) {
    this.loading = true;

    // ✅ IMPORTANT : tu as demandé getBookingCategoryByShopId
    this.bookingCategoryService
      .getBookingCategoryByShopId(shopId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cd.detectChanges();
        }),
        catchError((err) => {
          console.error('[Categories] load ERROR:', err);
          this.toast(this.t(err?.message || 'Erreur chargement catégories'), 'error');
          return of([]);
        })
      )
      .subscribe((cats) => {
        // petit tri “order” si présent
        this.categories = (cats || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      });
  }

  // ===========================
  // Modal
  // ===========================
  openModal(category?: BookingCategory) {
    this.modalOpen = true;

    if (category?._id) {
      // EDIT
      this.editingCategoryId = category._id;
      this.modalCategory = { ...category };
      this.reflectColorSelection(this.modalCategory.color);
    } else {
      // CREATE
      this.editingCategoryId = null;
      this.modalCategory = {
        name: '',
        description: '',
        shopId: this.myShopData._id,
        userProId: this.me?._id || this.myShopData?.userId || this.myShopData?.userProId,
        active: true,
        color: '#ffd6e0',
      };
      this.reflectColorSelection(this.modalCategory.color);
    }
  }

  closeModal() {
    this.modalOpen = false;
    this.saving = false;
  }

  // ===========================
  // Color
  // ===========================
  selectColor(hex: string) {
    this.modalCategory.color = hex;
    this.reflectColorSelection(hex);
  }

  private reflectColorSelection(hex?: string) {
    this.colors.forEach((c) => (c.selected = c.hex === (hex || '')));
  }

  // ===========================
  // Save (create/update)
  // ===========================
  saveCategory() {
    if (this.saving) return;

    if (!this.myShopData?._id) {
      this.toast('ShopId manquant', 'error');
      return;
    }

    const name = (this.modalCategory?.name || '').trim();
    if (!name) {
      this.toast('Le nom est obligatoire', 'error');
      return;
    }

    this.saving = true;

    // ---------- EDIT ----------
    if (this.editingCategoryId) {
      const payload: Partial<BookingCategory> = {
        name,
        description: (this.modalCategory.description || '').trim() || undefined,
        color: this.modalCategory.color || undefined,
        active: typeof this.modalCategory.active === 'boolean' ? this.modalCategory.active : true,
        order: typeof this.modalCategory.order === 'number' ? this.modalCategory.order : undefined,
      };

      this.bookingCategoryService
        .updateBookingCategory(this.editingCategoryId, payload)
        .pipe(
          switchMap(() => this.bookingCategoryService.getBookingCategoryByShopId(this.myShopData._id)),
          finalize(() => {
            this.saving = false;
            this.cd.detectChanges();
          })
        )
        .subscribe({
          next: (cats) => {
            this.categories = (cats || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
            this.toast('Catégorie mise à jour ✅', 'success');
            this.categoriesUpdated.emit();
            this.closeModal();
          },
          error: (err) => {
            console.error('[Categories] update ERROR:', err);
            this.toast(err?.message || 'Erreur mise à jour ❌', 'error');
          },
        });

      return;
    }

    // ---------- CREATE ----------
    // ⚠️ On N'ENVOIE PAS userProId : le backend le récupère via getUserProId(req)
    const createPayload = {
      name,
      description: (this.modalCategory.description || '').trim() || undefined,
      shopId: this.myShopData._id,
      color: this.modalCategory.color || undefined,
      order: typeof this.modalCategory.order === 'number' ? this.modalCategory.order : this.categories.length,
      active: typeof this.modalCategory.active === 'boolean' ? this.modalCategory.active : true,
    };

    this.bookingCategoryService
      .createBookingCategory(createPayload as any)
      .pipe(
        switchMap(() => this.bookingCategoryService.getBookingCategoryByShopId(this.myShopData._id)),
        finalize(() => {
          this.saving = false;
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: (cats) => {
          this.categories = (cats || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
          this.toast('Catégorie créée ✅', 'success');
          this.categoriesUpdated.emit();
          this.closeModal();
        },
        error: (err) => {
          console.error('[Categories] create ERROR:', err);
          this.toast(err?.message || 'Erreur création ❌', 'error');
        },
      });
  }


  // ===========================
  // Delete
  // ===========================
  deleteCategory(cat: BookingCategory, index: number) {
    if (!cat?._id) return;

    // Optimiste: on retire direct
    const backup = [...this.categories];
    this.categories.splice(index, 1);

    this.bookingCategoryService.deleteBookingCategory(cat._id).subscribe({
      next: () => {
        this.toast('Catégorie supprimée ✅', 'success');
        this.categoriesUpdated.emit();
      },
      error: (err) => {
        console.error('[Categories] delete ERROR:', err);
        this.categories = backup;
        this.toast(err?.message || 'Erreur suppression ❌', 'error');
      },
    });
  }
}
