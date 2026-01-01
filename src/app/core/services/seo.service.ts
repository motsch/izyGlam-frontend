import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SEO_TRANSLATIONS } from './seo-translations'; // Fichier des traductions

@Injectable({
    providedIn: 'root'
})
export class SeoService {
    private currentLang: keyof typeof SEO_TRANSLATIONS = 'fr'; // Langue par défaut

    constructor(private meta: Meta, private title: Title) { }

    setLanguage(lang: string): void {
        const normalized = (lang || 'fr').toLowerCase();

        // exemples: "fr-FR" -> "fr"
        const short = normalized.split('-')[0];

        if (SEO_TRANSLATIONS[short as keyof typeof SEO_TRANSLATIONS]) {
            this.currentLang = short as keyof typeof SEO_TRANSLATIONS;
        } else {
            console.warn(`[SEO] Langue non supportée: "${lang}", fallback fr`);
            this.currentLang = 'fr';
        }
    }


    updateMeta(pageKey: string): void {
        const lang = (this.currentLang && SEO_TRANSLATIONS[this.currentLang])
            ? this.currentLang
            : 'fr';

        const dictForLang = SEO_TRANSLATIONS[lang];
        const translations = dictForLang?.[pageKey];

        if (translations) {
            this.title.setTitle(translations.title);
            this.meta.updateTag({ name: 'description', content: translations.description });
            this.meta.updateTag({ name: 'keywords', content: translations.keywords });
        } else {
            console.error(`[SEO] Traductions introuvables pour page="${pageKey}" lang="${lang}"`, {
                currentLang: this.currentLang,
                availableLangs: Object.keys(SEO_TRANSLATIONS),
                availablePagesForLang: Object.keys(dictForLang ?? {})
            });
        }
    }

}
