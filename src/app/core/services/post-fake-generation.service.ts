import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type SocialPlatform = 'instagram' | 'snapchat' | 'tiktok' | 'facebook';
export type LangCode = 'fr' | 'en' | 'es' | 'de' | 'it';

export interface PostTemplate {
    id: string;
    platform: SocialPlatform;
    lang: LangCode;
    shopTypes: string[];
    tone?: 'premium' | 'warm' | 'short' | 'fun';
    text: string;
}

interface PostTemplatesFile {
    version: number;
    templates: PostTemplate[];
}

@Injectable({ providedIn: 'root' })
export class PostFakeGenerationService {
    private templates: PostTemplate[] = [];
    private loaded = false;

    constructor(private http: HttpClient) { }

    async loadTemplates(): Promise<void> {
        if (this.loaded) return;

        const url = 'assets/data/post-templates.json';
        const data = await firstValueFrom(this.http.get<PostTemplatesFile>(url));

        this.templates = data?.templates ?? [];
        this.loaded = true;
    }

    getRandomTemplate(params: {
        platform: SocialPlatform;
        lang: LangCode;
        shopType: string;
    }): PostTemplate | null {
        const platform = params.platform;
        const lang = params.lang;
        const shopType = this.normalize(params.shopType);

        const filtered = this.templates.filter(t => {
            const types = (t.shopTypes ?? []).map(x => this.normalize(x));
            return (
                t.platform === platform &&
                t.lang === lang &&
                (types.includes(shopType) || types.includes('all'))
            );
        });

        if (!filtered.length) return null;
        return filtered[Math.floor(Math.random() * filtered.length)];
    }

    render(templateText: string, vars: Record<string, string>): string {
        return templateText.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
    }

    private normalize(value: string): string {
        return String(value ?? '')
            .trim()
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève accents
            .replace(/\s+/g, '');
    }
}
