import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SEO_TRANSLATIONS } from './seo-translations'; // Fichier des traductions

@Injectable({
    providedIn: 'root'
})
export class SeoService {
    private currentLang: keyof typeof SEO_TRANSLATIONS = 'fr'; // Langue par défaut

    constructor(private meta: Meta, private title: Title) {}

    setLanguage(lang: keyof typeof SEO_TRANSLATIONS): void {
        this.currentLang = lang;
    }

    updateMeta(pageKey: string): void {
        const translations = SEO_TRANSLATIONS[this.currentLang][pageKey];
        if (translations) {
            this.title.setTitle(translations.title);
            this.meta.updateTag({ name: 'description', content: translations.description });
            this.meta.updateTag({ name: 'keywords', content: translations.keywords });
        } else {
            console.error(`Traductions introuvables pour la page : ${pageKey}`);
        }
    }
}
