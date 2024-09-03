import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class ShopService {
    constructor(private http: HttpClient) {}

    /**
     * Récupérer toutes les shops
     */
    getAll() {
        return this.http.get<any[]>(`${environment.apiUrl}shop`);
    }

    /**
     * Récupérer un shops par son ID
     * @param id (ID du shop)
     */
    getById(id: number) {
        return this.http.get<any>(`${environment.apiUrl}shop/${id}`);
    }

    /**
     * Créer un nouveau shop
     * @param shop (données du shop à créer)
     */
    create(shop: any) {
        return this.http.post<any>(environment.apiUrl + 'shop', shop);
    }

    /**
     * Mettre à jour un shop par son ID
     * @param shop (données du shop à mettre à jour)
     */
    update(shop: any) {
        return this.http.put<any>(
            `${environment.apiUrl}shop/${shop._id}`,
            shop
        );
    }

    /**
     * Supprimer un shop par son ID
     * @param id (ID du shop à supprimer)
     */
    delete(id: number) {
        return this.http.delete<any>(`${environment.apiUrl}shop/${id}`);
    }

    /**
     * Récupérer les boutiques associées à un utilisateur par userId
     * @param userId (ID de l'utilisateur)
     */
    getShopsByUserId(userId: string): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}shops/user/${userId}`);
    }

    getShopsNearby(
        clientLatitude: number,
        clientLongitude: number
    ): Observable<any[]> {
        return this.http
            .get<any[]>(`${environment.apiUrl}shop`)
            .pipe(
                map((shops) =>
                    shops.filter(
                        (shop) =>
                            this.calculateDistance(
                                clientLatitude,
                                clientLongitude,
                                shop.location.latitude,
                                shop.location.longitude
                            ) <= shop.maxDistance
                    )
                )
            );
    }

    private calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371; // Earth radius in kilometers
        // Convert degrees to radians
        const radLat1 = (lat1 * Math.PI) / 180;
        const radLat2 = (lat2 * Math.PI) / 180;
        const deltaLat = radLat2 - radLat1;
        const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

        // Haversine formula
        const a =
            Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(radLat1) *
                Math.cos(radLat2) *
                Math.sin(deltaLon / 2) *
                Math.sin(deltaLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
