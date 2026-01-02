import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FakePostService } from '../../services/fake-post.service'; // adapte le path si besoin
import { environment } from 'src/environments/environment';
import { ShopService } from '../../services/shop.service';

@Component({
  selector: 'app-post-fake-generation',
  templateUrl: './post-fake-generation.component.html',
  styleUrls: ['./post-fake-generation.component.scss']
})
export class PostFakeGenerationComponent implements OnInit {
  @Input() shop:any = {};


  imgStorageUrl: string = environment.imgStorageUrl;
  generatedPost = '';
  error = '';

  loading = false;
  copying = false;
  copied = false;
  suggestionIndex = -1;

  constructor(
    private fakePostService: FakePostService,
    private toastr: ToastrService,
    private shopService: ShopService
  ) { }

  ngOnInit(): void {
    // Optionnel : auto-générer au chargement
    // this.generate();

    this.shopService.getById

  }

  generate(): void {
    this.error = '';
    this.copied = false;

    const type = this.normalizeType(this.shop.type || 'all');

    this.loading = true;
    this.fakePostService.getRandom(type, 'instagram').subscribe({
      next: (tpl) => {
        const shopLink = this.buildShopLink(this.shop._id);

        this.generatedPost = this.render(tpl.text, {
          shopName: this.shop.name || 'Mon activité',
          city: this.shop.ville || '',
          category: type,
          cityHashtag: this.toHashtag(this.shop.ville),
          shopLink
        });

        // compteur de suggestions (pour “Autre suggestion”)
        this.suggestionIndex = this.suggestionIndex + 1;

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.generatedPost = '';
        this.suggestionIndex = 0;
        this.error = err?.error?.message || 'Aucun post disponible pour votre activité pour le moment.';
      }
    });
  }

  async copy(): Promise<void> {
    if (!this.generatedPost) return;

    this.copying = true;
    try {
      await navigator.clipboard.writeText(this.generatedPost);
      this.copied = true;

      // mini feedback discret (toast léger)
      this.toastr.success('Copié ✨');

      // reset état “copié” après 2s
      setTimeout(() => (this.copied = false), 2000);
    } catch {
      this.toastr.error('Impossible de copier 😕');
    } finally {
      this.copying = false;
    }
  }

  private render(templateText: string, vars: Record<string, string>): string {
    return String(templateText ?? '').replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
  }

  private normalizeType(value: string): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }

  private toHashtag(value: string): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private buildShopLink(shopId: string): string {
    if (!shopId) return '';
    return `${window.location.origin}/shop/${shopId}`;
  }
}
