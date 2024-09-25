import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ProductService {
    constructor(private http: HttpClient) {}

    /**
     * Récupérer toutes les products
     */
    getAll() {
        return this.http.get<any[]>(`${environment.apiUrl}service`);
    }

    getProductsByShop(shopId: string) {
        return this.http.get<any[]>(`${environment.apiUrl}shop/${shopId}/services`);
    }

    /**
     * Récupérer un products par son ID
     * @param id (ID du product)
     */
    getById(id: number) {
        return this.http.get<any>(`${environment.apiUrl}service/${id}`);
    }

    /**
     * Créer un nouveau product
     * @param product (données du product à créer)
     */
    create(product: any) {
        return this.http.post<any>(environment.apiUrl + 'service', product);
    }

    /**
     * Créer plusieurs products en une seule requête
     * @param products (tableau de données des products à créer)
     */
    createMultiple(products: any[]) {
        return this.http.post<any[]>(environment.apiUrl + 'services/multiple', products);
    }

    /**
     * Mettre à jour un product par son ID
     * @param product (données du product à mettre à jour)
     */
    update(product: any) {
        return this.http.put<any>(`${environment.apiUrl}service/${product._id}`, product);
    }

    /**
     * Supprimer un product par son ID
     * @param id (ID du product à supprimer)
     */
    delete(id: number) {
        return this.http.delete<any>(`${environment.apiUrl}service/${id}`);
    }
}
