import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ConsentCategory = 'essential' | 'analytics' | 'marketing';

export interface CookieConsent {
  version: string;           // utile si tu changes tes catégories plus tard
  updatedAt: string;         // ISO date
  categories: Record<ConsentCategory, boolean>;
}

const CONSENT_KEY = 'cookie_consent_v1';

@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly version = '1.0.0';

  private consentSubject = new BehaviorSubject<CookieConsent | null>(this.read());
  consent$ = this.consentSubject.asObservable();

  get consent(): CookieConsent | null {
    return this.consentSubject.value;
  }

  hasChoice(): boolean {
    return !!this.consentSubject.value;
  }

  isAllowed(category: ConsentCategory): boolean {
    const c = this.consentSubject.value;
    if (!c) return false;
    if (category === 'essential') return true; // toujours true
    return !!c.categories[category];
  }

  acceptAll(): void {
    this.save({
      version: this.version,
      updatedAt: new Date().toISOString(),
      categories: { essential: true, analytics: true, marketing: true },
    });
  }

  rejectAll(): void {
    this.save({
      version: this.version,
      updatedAt: new Date().toISOString(),
      categories: { essential: true, analytics: false, marketing: false },
    });
  }

  saveCustom(partial: { analytics: boolean; marketing: boolean }): void {
    this.save({
      version: this.version,
      updatedAt: new Date().toISOString(),
      categories: { essential: true, analytics: partial.analytics, marketing: partial.marketing },
    });
  }

  reset(): void {
    localStorage.removeItem(CONSENT_KEY);
    this.consentSubject.next(null);
  }

  private save(consent: CookieConsent): void {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    this.consentSubject.next(consent);
  }

  private read(): CookieConsent | null {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CookieConsent;
      // minimum safety check
      if (!parsed?.categories) return null;
      return parsed;
    } catch {
      return null;
    }
  }
}
