import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class BookingService {
    constructor(private http: HttpClient) {}

    // Récupérer les réservations d'une boutique
    getBookingsByShop(shopId: string): Observable<any> {
      return this.http.get(`${environment.apiUrl}/shop/${shopId}`);
    }
  
    // Récupérer les créneaux disponibles pour un service dans une boutique
    getAvailableTimeSlots(shopId: string, serviceId: string, date: string): Observable<any> {
      return this.http.get(`${environment.apiUrl}/shops/${shopId}/services/${serviceId}/available-slots/${date}`);
    }

    /**
     * Récupérer toutes les products
     */
    getAll(): Observable<any> {
        return this.http.get<any[]>(`${environment.apiUrl}booking`);
    }

    /**
     * Récupérer un products par son ID
     * @param id (ID du product)
     */
    getById(id: number): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}booking/${id}`);
    }

    /**
     * Créer un nouveau product
     * @param task (données du product à créer)
     */
    create(product: any): Observable<any> {
        // Ajoutez l' comme paramètre
        return this.http.post<any>(
            `${environment.apiUrl + 'booking', product}`,
            product
        );
    }

    /**
     * Mettre à jour un product par son ID
     * @param task (données du product à mettre à jour)
     */
    update(product: any): Observable<any> {
        return this.http.put<any>(
            `${environment.apiUrl}booking/${product._id}`,
            product
        );
    }

    /**
     * Supprimer un product par son ID
     * @param id (ID du product à supprimer)
     */
    delete(id: number): Observable<any> {
        return this.http.delete<any>(`${environment.apiUrl}booking/${id}`);
    }
}
