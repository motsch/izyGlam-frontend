import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class BookingService {
    constructor(private http: HttpClient) {}
  
    getCACount() {
        return this.http.get<number>(environment.apiUrl + 'ca-count-all');
    }
    // Récupérer les créneaux disponibles pour un service dans une boutique
    getAvailableTimeSlots(shopId: string, serviceId: string): Observable<any> {
      return this.http.get(`${environment.apiUrl}available-slots/${shopId}/services/${serviceId}`);
    }

    // Récupérer les réservations d'une boutique
    getBookingsByShop(shopId: string): Observable<any> {
      return this.http.get(`${environment.apiUrl}booking-by-shop/${shopId}`);
    }

    /**
     * Permet de récupérer un user par son id
     * @param id (id du user)
     */
    getBookingByUserPro(_id: number) {
        return this.http.get<any>(environment.apiUrl + 'booking-by-userPro/' + _id);
    }

    /**
     * Permet de récupérer un user par son id
     * @param id (id du user)
     */
    getBookingByClient(_id: number) {
        return this.http.get<any>(environment.apiUrl + 'booking-by-client/' + _id);
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
    create(booking: any): Observable<any> {
        // Ajoutez l' comme paramètre
        return this.http.post<any>(environment.apiUrl + 'booking', booking);
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


  // Méthode pour mettre à jour le statut d'une commande
  updateBookingStatus(bookingId: string, status: string): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}booking-update-status/${bookingId}`, { status });
  }

  /**
   * Confirmer le code d'une booking
   * @param bookingId (ID de la booking)
   * @param code (code à vérifier)
   * @returns Observable<{ confirmed: boolean }>
   */
  confirmBookingCode(bookingId: string, code: string): Observable<{ confirmed: boolean }> {
      return this.http.post<{ confirmed: boolean }>(`${environment.apiUrl}bookings-confirm-code`, { bookingId, code });
  }
}
