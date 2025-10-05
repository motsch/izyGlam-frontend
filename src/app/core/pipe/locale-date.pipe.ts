import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'localeDate',
  pure: true, // calcule seulement si l'input change (perf)
})
export class LocaleDatePipe implements PipeTransform {

  // On peut préciser une timezone si besoin (optionnel)
  transform(
    isoDateYmd: string,               // "2025-10-06"
    locale: string = 'fr',            // "fr", "de", "ca", "zh", ...
    timeZone?: string                 // ex: "Europe/Paris"
  ): string {
    if (!isoDateYmd) return '';

    // Sécurité: parser YYYY-MM-DD sans décalage fuseau (évite J-1/J+1)
    const [y, m, d] = isoDateYmd.split('-').map(Number);
    const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));

    // Normalisation minimaliste de certaines locales "génériques"
    // (juste pour obtenir un rendu plus standard selon les habitudes)
    const normalized = this.normalizeLocale(locale);

    const formatter = new Intl.DateTimeFormat(normalized, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: timeZone || 'UTC', // garde la même date partout
    });

    // Exemple: "lundi 6 octobre 2025"
    const label = formatter.format(date);

    // Optionnel: mettre la 1ʳᵉ lettre en majuscule si tu préfères.
    return label.charAt(0).toLocaleUpperCase(normalized) + label.slice(1);
  }

  private normalizeLocale(locale: string): string {
    // Si tu reçois "fr", "de", "pt", "zh", etc.
    // on “peaufine” quelques codes fréquents sans région :
    const lc = (locale || '').toLowerCase();

    const map: Record<string, string> = {
      // Européennes
      'pt': 'pt-PT',
      'es': 'es-ES',
      'en': 'en-GB',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'nl': 'nl-NL',
      'it': 'it-IT',
      'sv': 'sv-SE',
      'da': 'da-DK',
      'fi': 'fi-FI',
      'pl': 'pl-PL',
      'ro': 'ro-RO',
      'ru': 'ru-RU',
      'uk': 'uk-UA',
      'sq': 'sq-AL',
      'be': 'be-BY',
      'et': 'et-EE',
      'eu': 'eu-ES',
      'gl': 'gl-ES',

      // Asie
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'th': 'th-TH',
      'vi': 'vi-VN',
      'id': 'id-ID',
      'ms': 'ms-MY',
      'hi': 'hi-IN',
      'bn': 'bn-BD',
      'fa': 'fa-IR',
      'tr': 'tr-TR',

      // Moyen-Orient / RTL
      'ar': 'ar-EG',
      'ku': 'ku-TR',
      'so': 'so-SO',
      'tl': 'tl-PH',
      'ca': 'ca-ES',
      'pt-br': 'pt-BR', // si jamais tu sais différencier côté UI
    };

    return map[lc] || lc || 'en';
  }
}
