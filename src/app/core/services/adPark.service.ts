import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AdParkService {
    constructor(private http: HttpClient) { }

    /**
     * Récupérer toutes les campagnes adPark
     */
    getAll(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}ad-park`);
    }

    /**
     * Récupérer une campagne adPark par son ID
     * @param id (ID de la campagne)
     */
    getById(id: string): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}ad-park/${id}`);
    }

    /**
     * Créer une nouvelle campagne adPark
     * @param adPark (données de la campagne à créer)
     */
    create(adPark: any): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}ad-park`, adPark);
    }

    /**
     * Mettre à jour une campagne adPark par son ID
     * @param adPark (données de la campagne à mettre à jour, doit contenir `_id`)
     */
    update(adPark: any): Observable<any> {
        return this.http.put<any>(`${environment.apiUrl}ad-park/${adPark._id}`, adPark);
    }

    /**
     * Supprimer une campagne adPark par son ID
     * @param id (ID de la campagne à supprimer)
     */
    delete(id: string): Observable<any> {
        return this.http.delete<any>(`${environment.apiUrl}ad-park/${id}`);
    }
    /**
   * Récupérer une campagne par son advertisementId
   * @param advertisementId (ID de la publicité)
   */
    getByAdvertisementId(advertisementId: string): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}ad-park-by-advertisement/${advertisementId}`);
    }
}
