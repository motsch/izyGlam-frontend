import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SsoService {
  constructor(private http: HttpClient) {}

  /**
   * CORE → Demande au backend un code SSO temporaire (1 min, usage unique)
   * Nécessite que l'utilisateur soit déjà authentifié côté Core (cookie / token / session)
   */
  createHandoffCode(): Observable<{ code: string }> {
    return this.http.post<{ code: string }>(
      `${environment.apiUrl}sso/handoff`,
      {},
      { withCredentials: true }
    );
  }

  /**
   * SHOP → Envoie le code au backend pour l'échanger contre une session/cookie
   * Le backend pose ensuite le cookie HttpOnly (access_token)
   */
  exchangeCode(code: string): Observable<{ ok: true }> {
    return this.http.post<{ ok: true }>(
      `${environment.apiUrl}sso/exchange`,
      { code },
      { withCredentials: true }
    );
  }

  /**
   * Helper: construit l'URL de redirection vers Shop
   * Exemple: https://shop.izyglam.com/sso?code=xxxxx
   */
  buildShopSsoUrl(shopBaseUrl: string, code: string): string {
    return `${shopBaseUrl}sso?code=${encodeURIComponent(code)}`;
  }

  

  /**
   * Helper: lit le code dans l'URL actuelle (côté Shop)
   */
  getCodeFromUrl(): string | null {
    return new URLSearchParams(window.location.search).get('code');
  }

  /**
   * Helper: nettoie l'URL (enlève ?code=...)
   * Très important pour éviter de laisser trainer le code dans l'historique
   */
  clearCodeFromUrl(): void {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
