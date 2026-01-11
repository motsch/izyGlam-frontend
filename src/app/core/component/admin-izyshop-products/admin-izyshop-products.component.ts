import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { AdminCatalogService } from '../../services/admin-catalog.service';
import { BigBuyAdminService } from '../../services/bigbuy-admin.service';

type SortKey = 'updatedAt' | 'createdAt' | 'price' | 'stock';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-admin-izyshop-products',
  templateUrl: './admin-izyshop-products.component.html',
  styleUrls: ['./admin-izyshop-products.component.scss']
})
export class AdminIzyshopProductsComponent implements OnInit, OnDestroy {
  // -----------------------------
  // UI state
  // -----------------------------
  loading = false;
  error: string | null = null;

  // -----------------------------
  // List / pagination
  // -----------------------------
  items: any[] = [];
  page = 1;
  limit = 50;
  total = 0;
  totalPages = 0;

  // -----------------------------
  // Filters
  // -----------------------------
  searchCtrl = new FormControl<string>('', { nonNullable: true });

  // si tu veux “Complets” (cover + desc + price), tu as un bool côté backend adminProductController
  completeOnly = false;

  // taxonomies[] côté service (chez toi = categoryIds)
  // ici on laisse un champ texte simple "5419,11496"
  taxonomiesInputCtrl = new FormControl<string>('', { nonNullable: true });

  // Tri (optionnel)
  sort: SortKey = 'updatedAt';
  dir: SortDir = 'desc';

  // -----------------------------
  // Edit modal
  // -----------------------------
  editOpen = false;
  editing: any | null = null;

  // -----------------------------
  // BigBuy / Jobs
  // -----------------------------
  bigBuyStatus: any = null;
  bigBuyLoading = false;

  private sub = new Subscription();

  constructor(
    private adminCatalog: AdminCatalogService,
    private bigBuyAdmin: BigBuyAdminService
  ) {}

  ngOnInit(): void {
    // Recherche: debounce
    this.sub.add(
      this.searchCtrl.valueChanges
        .pipe(debounceTime(350), distinctUntilChanged())
        .subscribe(() => {
          this.page = 1;
          this.load();
        })
    );

    // Taxonomies input: debounce aussi
    this.sub.add(
      this.taxonomiesInputCtrl.valueChanges
        .pipe(debounceTime(450), distinctUntilChanged())
        .subscribe(() => {
          this.page = 1;
          this.load();
        })
    );

    this.load();
    this.refreshBigBuyStatus();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  private parseTaxonomies(input: string): number[] {
    const s = (input || '').trim();
    if (!s) return [];
    return s
      .split(',')
      .map(x => Number(String(x).trim()))
      .filter(n => Number.isFinite(n));
  }

  getCover(p: any): string {
    return p?.imageUrl || (Array.isArray(p?.images) ? p.images[0] : '') || '';
  }

  money(v: any): string {
    const n = Number(v);
    if (!Number.isFinite(n)) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  }

  // ------------------------------------------------------------
  // Data load
  // ------------------------------------------------------------
  load(): void {
    this.loading = true;
    this.error = null;

    const search = this.searchCtrl.value?.trim() || '';
    const taxonomies = this.parseTaxonomies(this.taxonomiesInputCtrl.value);

    // ⚠️ IMPORTANT:
    // Ton service attend "search" et "taxonomies" (pas "q" ni "categoryIds")
    // Donc j’utilise exactement ça.
    this.adminCatalog.getAllAdmin({
      page: this.page,
      limit: this.limit,
      complete: this.completeOnly,
      taxonomies,
      search
    }).subscribe({
      next: (res) => {
        this.items = res.items || [];
        this.page = res.page;
        this.limit = res.limit;
        this.total = res.total;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Impossible de récupérer les produits';
      }
    });
  }

  refresh(): void {
    this.load();
    this.refreshBigBuyStatus();
  }

  // ------------------------------------------------------------
  // UI actions: filters & pagination
  // ------------------------------------------------------------
  toggleComplete(): void {
    this.completeOnly = !this.completeOnly;
    this.page = 1;
    this.load();
  }

  setLimit(n: number): void {
    this.limit = n;
    this.page = 1;
    this.load();
  }

  prev(): void {
    if (this.page <= 1) return;
    this.page--;
    this.load();
  }

  next(): void {
    if (this.page >= this.totalPages) return;
    this.page++;
    this.load();
  }

  // ------------------------------------------------------------
  // Edit
  // ------------------------------------------------------------
  openEdit(p: any): void {
    // clone deep pour éviter de modifier la liste avant save
    this.editing = JSON.parse(JSON.stringify(p));
    // fallback sur structure si elle n’existe pas
    this.editing.pricing = this.editing.pricing || {};
    this.editing.stock = this.editing.stock || {};
    this.editOpen = true;
  }

  closeEdit(): void {
    this.editOpen = false;
    this.editing = null;
  }

  saveEdit(): void {
    if (!this.editing?._id) return;

    this.loading = true;
    this.error = null;

    this.adminCatalog.update(this.editing).subscribe({
      next: () => {
        this.closeEdit();
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Impossible de sauvegarder le produit';
      }
    });
  }

  // ------------------------------------------------------------
  // Delete
  // ------------------------------------------------------------
  deleteOne(p: any): void {
    const title = p?.title || 'ce produit';
    const ok = confirm(`Supprimer "${title}" ?`);
    if (!ok) return;

    this.loading = true;
    this.error = null;

    // ⚠️ ton service delete() tape /product/:id (pas /admin/products/:id)
    // Je respecte ton service tel quel.
    this.adminCatalog.delete(p._id).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Impossible de supprimer le produit';
      }
    });
  }

  // ------------------------------------------------------------
  // BigBuy actions
  // ------------------------------------------------------------
  refreshBigBuyStatus(): void {
    this.bigBuyLoading = true;
    this.adminCatalog.getBigBuyStatus().subscribe({
      next: (s) => {
        this.bigBuyStatus = s;
        this.bigBuyLoading = false;
      },
      error: () => {
        this.bigBuyLoading = false;
      }
    });
  }

  /**
   * Bouton principal : lance le bootstrap (import)
   * => via AdminCatalogService.startBigBuyBootstrap()
   */
  startBigBuyBootstrap(): void {
    const ok = confirm('Lancer l’import BigBuy (bootstrap) ?');
    if (!ok) return;

    this.bigBuyLoading = true;
    this.error = null;

    this.adminCatalog.startBigBuyBootstrap({}).subscribe({
      next: () => {
        this.bigBuyLoading = false;
        this.refreshBigBuyStatus();
        // option : refresh liste
        this.page = 1;
        this.load();
      },
      error: (err) => {
        this.bigBuyLoading = false;
        this.error = err?.error?.message || 'Impossible de lancer l’import BigBuy';
        this.refreshBigBuyStatus();
      }
    });
  }

  /**
   * Si tu veux absolument utiliser ton BigBuyAdminService existant
   * (il appelle /admin/bigbuy/import /sync-stock /sync-prices).
   * Je te le laisse prêt, mais je ne l’utilise pas par défaut
   * car ton backend actuel (d’après ce que tu as collé) expose plutôt bootstrap/sync.
   */
  startLegacyImportCatalog(): void {
    const ok = confirm('Lancer importCatalog (legacy) ?');
    if (!ok) return;

    this.bigBuyLoading = true;
    this.bigBuyAdmin.importCatalog().subscribe({
      next: () => {
        this.bigBuyLoading = false;
        this.refreshBigBuyStatus();
        this.page = 1;
        this.load();
      },
      error: (err) => {
        this.bigBuyLoading = false;
        this.error = err?.error?.message || 'Import legacy impossible';
      }
    });
  }
}
