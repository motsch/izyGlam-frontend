import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MetaService {
  constructor(private http: HttpClient) {}

  /**
   * Obtenir un token d'accès Meta
   * @param authCode (Code d'autorisation OAuth)
   */
  getAccessToken(authCode: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}meta/getAccessToken`, { code: authCode });
  }

  /**
   * Publier un post sur Facebook
   * @param pageId (ID de la page Facebook)
   * @param message (Message à publier)
   */
  publishFacebookPost(pageId: string, message: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}meta/publishFacebookPost`, { pageId, message });
  }

  /**
   * Publier un post sur Instagram
   * @param instagramAccountId (ID du compte Instagram professionnel)
   * @param imageUrl (URL de l'image à publier)
   * @param caption (Légende de la publication)
   */
  publishInstagramPost(instagramAccountId: string, imageUrl: string, caption: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}meta/publishInstagramPost`, {
      instagramAccountId,
      imageUrl,
      caption,
    });
  }

  /**
   * Récupérer les publications
   * @param accountId (ID de l'utilisateur ou du compte)
   */
  getPosts(accountId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}meta/posts?accountId=${accountId}`);
  }
}
