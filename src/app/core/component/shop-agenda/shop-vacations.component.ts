import { Component, Input, OnInit } from '@angular/core';
import { ShopService } from '../../services/shop.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { VacationService } from '../../services/shop-vacations.service';

@Component({
  selector: 'app-shop-vacations',
  templateUrl: './shop-vacations.component.html',
  styleUrls: ['./shop-vacations.component.scss'],
})
export class ShopVacationsComponent implements OnInit {
  @Input() myShopData: any = {};
  @Input() me: any = {};

  // ✅ UI state
  loadingVacations = false;
  formError = '';

  // ✅ data
  vacations: any[] = [];

  // ✅ form model (lié au HTML via ngModel)
  vacationForm: {
    title: string;
    start: string; // datetime-local string
    end: string;   // datetime-local string
  } = {
      title: '',
      start: '',
      end: '',
    };

  constructor(
    private vacationService: VacationService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    // On charge dès que possible si shopId ok
    if (this.myShopData?._id) {
      this.loadVacations();
    }
  }

  // ------------------------------------------------------
  // 🔁 Helpers
  // ------------------------------------------------------
  trackByVacationId(index: number, v: any) {
    return v?._id || index;
  }

  resetForm() {
    this.formError = '';
    this.vacationForm = { title: '', start: '', end: '' };
  }

  private setFormError(key: string, fallback: string) {
    this.formError = this.translate.instant(key) || fallback;
  }

  private toastSuccess(key: string, fallback: string) {
    this.toastr.success(this.translate.instant(key) || fallback);
  }

  private toastError(key: string, fallback: string) {
    this.toastr.error(this.translate.instant(key) || fallback);
  }

  /**
   * Convertit une valeur <input type="datetime-local"> en Date.
   * Important : "2026-02-16T09:30" = heure locale (sans timezone).
   * new Date("2026-02-16T09:30") est interprété en local par la plupart des browsers.
   */
  private parseDateTimeLocal(value: string): Date | null {
    if (!value || typeof value !== 'string') return null;

    // Format attendu: YYYY-MM-DDTHH:mm
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  // ------------------------------------------------------
  // 📥 Load vacations
  // ------------------------------------------------------
  loadVacations() {
    const shopId = this.myShopData?._id;
    if (!shopId) return;

    this.loadingVacations = true;
    this.formError = '';

    // ✅ Suppose ShopService.getVacations(shopId)
    this.vacationService.getVacations(shopId).subscribe({
      next: (data: any[]) => {
        this.vacations = (data || []).map((v) => ({
          ...v,
          start: v.start ? new Date(v.start) : v.start,
          end: v.end ? new Date(v.end) : v.end,
        }));
        this.loadingVacations = false;
      },
      error: (err: any) => {
        console.error('Erreur loadVacations:', err);
        this.loadingVacations = false;
        this.toastError('ERROR.GENERIC_ERROR', 'Une erreur est survenue.');
      },
    });
  }

  // ------------------------------------------------------
  // ➕ Add vacation
  // ------------------------------------------------------
  addVacation() {
    const shopId = this.myShopData?._id;
    if (!shopId) return;

    this.formError = '';

    const startDate = this.parseDateTimeLocal(this.vacationForm.start);
    const endDate = this.parseDateTimeLocal(this.vacationForm.end);

    if (!startDate || !endDate) {
      this.setFormError(
        'VACATIONS.ERRORS.START_END_REQUIRED',
        'Merci de renseigner une date de début et une date de fin.'
      );
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      this.setFormError(
        'VACATIONS.ERRORS.END_AFTER_START',
        'La date de fin doit être après la date de début.'
      );
      return;
    }

    // Optionnel : limiter à un minimum (ex: 30 minutes) si tu veux
    // const diffMin = (endDate.getTime() - startDate.getTime()) / 60000;
    // if (diffMin < 30) { ... }

    const payload = {
      title:
        (this.vacationForm.title || '').trim() ||
        (this.translate.instant('VACATIONS.DEFAULT_TITLE') || 'Vacances'),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      allDay: false,
      color: '#0b0b0b',
    };

    this.loadingVacations = true;

    // ✅ Suppose ShopService.addVacation(shopId, payload)
    this.vacationService.addVacation(shopId, payload).subscribe({
      next: (updated: any[]) => {
        this.vacations = (updated || []).map((v) => ({
          ...v,
          start: v.start ? new Date(v.start) : v.start,
          end: v.end ? new Date(v.end) : v.end,
        }));

        this.loadingVacations = false;
        this.resetForm();
        this.toastSuccess(
          'SUCCESS.VACATION_ADDED',
          'Période de vacances ajoutée.'
        );
      },
      error: (err: any) => {
        console.error('Erreur addVacation:', err);
        const key = err?.error?.messageKey || 'ERROR.GENERIC_ERROR';
        this.toastr.error(this.translate.instant(key));
      },
    });
  }

  // ------------------------------------------------------
  // 🗑️ Delete vacation
  // ------------------------------------------------------
  deleteVacation(vacationId: string) {
    const shopId = this.myShopData?._id;
    if (!shopId || !vacationId) return;

    this.loadingVacations = true;

    // ✅ Suppose ShopService.deleteVacation(shopId, vacationId)
    this.vacationService.deleteVacation(shopId, vacationId).subscribe({
      next: (updated: any[]) => {
        this.vacations = (updated || []).map((v) => ({
          ...v,
          start: v.start ? new Date(v.start) : v.start,
          end: v.end ? new Date(v.end) : v.end,
        }));

        this.loadingVacations = false;
        this.toastSuccess(
          'SUCCESS.VACATION_DELETED',
          'Période supprimée.'
        );
      },
      error: (err: any) => {
        console.error('Erreur deleteVacation:', err);
        this.loadingVacations = false;
        this.toastError('ERROR.GENERIC_ERROR', 'Une erreur est survenue.');
      },
    });
  }
}
