import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { LangCode, PostFakeGenerationService, SocialPlatform } from '../../services/post-fake-generation.service';

@Component({
  selector: 'app-post-fake-generation',
  templateUrl: './post-fake-generation.component.html',
  styleUrls: ['./post-fake-generation.component.scss']
})
export class PostFakeGenerationComponent implements OnInit {
  // ✅ shopType = string (ex: "manucure", "coiffure", "massage")
  @Input() shopType: string = 'all';

  // optionnels pour rendre le post plus "prêt à poster"
  @Input() shopId: string = '';
  @Input() shopName: string = 'Mon activité';
  @Input() city: string = '';

  platform: SocialPlatform = 'instagram';
  lang: LangCode = 'fr';

  generatedPost = '';
  error = '';

  constructor(
    private postGen: PostFakeGenerationService,
    private toastr: ToastrService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.postGen.loadTemplates();
    this.generate();
  }

  generate(): void {
    this.error = '';

    const type = this.normalizeType(this.shopType || 'all');
    const shopLink = this.buildShopLink(this.shopId);

    const tpl = this.postGen.getRandomTemplate({
      platform: this.platform,
      lang: this.lang,
      shopType: type
    });

    if (!tpl) {
      this.generatedPost = '';
      this.error = `Aucun post disponible pour ${this.platform}/${this.lang}/${type}`;
      return;
    }

    this.generatedPost = this.postGen.render(tpl.text, {
      shopName: this.shopName || 'Mon activité',
      city: this.city || '',
      category: type,
      cityHashtag: this.toHashtag(this.city),
      shopLink
    });
  }

  async copy(): Promise<void> {
    if (!this.generatedPost) return;

    try {
      await navigator.clipboard.writeText(this.generatedPost);
      this.toastr.success('Post copié ✨');
    } catch {
      this.toastr.error('Impossible de copier 😕');
    }
  }

  private normalizeType(value: string): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève accents
      .replace(/\s+/g, '');
  }

  private toHashtag(value: string): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private buildShopLink(shopId: string): string {
    // Si pas d'id, on laisse vide (mais le template "all" s'affichera quand même)
    if (!shopId) return '';
    return `${window.location.origin}/shop/${shopId}`;
  }
}
