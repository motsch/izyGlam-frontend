import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdvertisementService {

  constructor(private http: HttpClient) { }

  getAdvertisements(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}ads`);
  }

  updateAdvertisement(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}ads/${data._id}`, data);
  }

  // Mettre à jour les impressions
  incrementImpression(adId: string): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}ads/${adId}/impression`, {});
  }

  // Mettre à jour les clics
  incrementClick(adId: string): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}ads/${adId}/click`, {});
  }

  // Mettre à jour le temps d'affichge d'une publiité
  updateAdDisplayTime(adId: string, timeSpent: number): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}ads/${adId}/affichage`, { duree_affichage: timeSpent });
  }
}
