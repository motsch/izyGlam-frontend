import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FakePost, FakePostService, SocialPlatform } from '../../services/fake-post.service';
import { TranslateService } from '@ngx-translate/core';

type ActiveFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class PostComponent implements OnInit {
  loading = false;

  posts: FakePost[] = [];
  filtered: FakePost[] = [];

  // filters
  q = '';
  platform: SocialPlatform | 'all' = 'all';
  shopType = 'all';
  activeFilter: ActiveFilter = 'all';

  // pagination
  page = 1;
  pageSize = 10;

  // modal/form
  modalOpen = false;
  editing: FakePost | null = null;

  form = {
    platform: 'instagram' as SocialPlatform,
    shopTypesText: 'all', // "coiffure, manucure" ou "all"
    tone: '',
    text: '',
    active: true,
  };

  constructor(
    private fakePostService: FakePostService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.load();
    this.form.platform = 'instagram';
  }

  load(): void {
    this.loading = true;

    this.fakePostService.getAll().subscribe({
      next: (data) => {
        this.posts = Array.isArray(data) ? data : [];
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err?.error?.message || this.translate.instant('Impossible de récupérer les posts'));
      }
    });
  }

  // ======================
  // Filters
  // ======================
  applyFilters(): void {
    const q = (this.q || '').trim().toLowerCase();
    const type = this.normalizeType(this.shopType || 'all');

    this.filtered = this.posts.filter((p) => {
      // platform
      if (this.platform !== 'all' && p.platform !== this.platform) return false;

      // active
      if (this.activeFilter === 'active' && !p.active) return false;
      if (this.activeFilter === 'inactive' && p.active) return false;

      // shopType
      if (type && type !== 'all') {
        const types = (p.shopTypes || []).map((x) => this.normalizeType(x));
        if (!types.includes(type) && !types.includes('all')) return false;
      }

      // search
      if (q) {
        const inText = (p.text || '').toLowerCase().includes(q);
        const inTone = (p.tone || '').toLowerCase().includes(q);
        const inTypes = (p.shopTypes || []).join(',').toLowerCase().includes(q);
        if (!inText && !inTone && !inTypes) return false;
      }

      return true;
    });

    // reset pagination when filter changes
    this.page = 1;
  }

  get shopTypeOptions(): string[] {
    // liste stable des types trouvés en base + "all"
    const set = new Set<string>();
    set.add('all');
    this.posts.forEach((p) => (p.shopTypes || []).forEach((t) => set.add(this.normalizeType(t))));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  // ======================
  // Pagination helpers
  // ======================
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get paged(): FakePost[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.page++;
  }

  prevPage(): void {
    if (this.page > 1) this.page--;
  }

  // ======================
  // Modal / Form
  // ======================
  openCreate(): void {
    this.editing = null;
    this.form = {
      platform: 'instagram',
      shopTypesText: 'all',
      tone: '',
      text: '',
      active: true,
    };
    this.modalOpen = true;
  }

  openEdit(p: FakePost): void {
    this.editing = p;
    this.form = {
      platform: p.platform,
      shopTypesText: (p.shopTypes || []).join(', '),
      tone: p.tone || '',
      text: p.text || '',
      active: !!p.active,
    };
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  save(): void {
    const payload = this.buildPayloadFromForm();

    if (!payload.text) {
      this.toastr.error('Le texte est requis');
      return;
    }

    if (!payload.shopTypes?.length) {
      payload.shopTypes = ['all'];
    }

    this.loading = true;

    if (this.editing?._id) {
      this.fakePostService.update(this.editing._id, payload).subscribe({
        next: (updated) => {
          this.toastr.success('Post mis à jour ✨');
          this.replaceLocal(updated);
          this.loading = false;
          this.modalOpen = false;
          this.applyFilters();
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error(err?.error?.message || 'Erreur lors de la mise à jour');
        }
      });
    } else {
      this.fakePostService.create(payload).subscribe({
        next: (created) => {
          this.toastr.success('Post créé ✨');
          this.posts = [created, ...this.posts];
          this.loading = false;
          this.modalOpen = false;
          this.applyFilters();
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error(err?.error?.message || 'Erreur lors de la création');
        }
      });
    }
  }

  toggleActive(p: FakePost): void {
    const nextActive = !p.active;

    this.fakePostService.update(p._id, { active: nextActive }).subscribe({
      next: (updated) => {
        p.active = updated.active;
        this.toastr.success(updated.active ? 'Activé' : 'Désactivé');
        this.applyFilters();
      },
      error: () => this.toastr.error('Impossible de modifier le statut')
    });
  }

  delete(p: FakePost): void {
    const ok = confirm('Supprimer ce post ?');
    if (!ok) return;

    this.fakePostService.delete(p._id).subscribe({
      next: () => {
        this.toastr.success('Post supprimé');
        this.posts = this.posts.filter((x) => x._id !== p._id);
        this.applyFilters();
      },
      error: () => this.toastr.error('Impossible de supprimer')
    });
  }

  // ======================
  // Helpers
  // ======================
  private replaceLocal(updated: FakePost): void {
    this.posts = this.posts.map((p) => (p._id === updated._id ? updated : p));
  }

  private buildPayloadFromForm(): Partial<FakePost> {
    const types = (this.form.shopTypesText || '')
      .split(',')
      .map((x) => this.normalizeType(x))
      .filter(Boolean);

    return {
      platform: this.form.platform,
      lang: 'fr',
      shopTypes: types.length ? types : ['all'],
      tone: (this.form.tone || '').trim() || undefined,
      text: (this.form.text || '').trim(),
      active: !!this.form.active,
    };
  }

  private normalizeType(value: string): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }
}
