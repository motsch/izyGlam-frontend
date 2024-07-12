import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environnements/environment';

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
     * @param task (données du shop à créer)
     */
    create(shop: any, shopId: string) {
        // Ajoutez l' comme paramètre
        return this.http.post<any>(
            `${environment.apiUrl}shop?columnId=${shopId}`,
            shop
        );
    }

    /**
     * Mettre à jour un shop par son ID
     * @param task (données du shop à mettre à jour)
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
}
