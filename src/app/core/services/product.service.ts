import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ProductService {
    constructor(private http: HttpClient) { }

    /**
     * Uploader une image pour la galerie d'un shop
     * @param shopId (ID du shop)
     * @param file (image à uploader)
     */
    uploadGalleryImages(shopId: string, file: File) {
        const formData: FormData = new FormData();

        // Ajouter le fichier au FormData
        formData.append('gallery', file); // On n'a plus besoin de boucle, juste un seul fichier

        // Envoyer la requête HTTP POST avec l'image
        return this.http.post<any>(
            `${environment.apiUrl}service-gallery/${shopId}/gallery/upload`,
            formData
        );
    }

    /**
     * Récupérer les images de la galerie d'un shop
     * @param shopId (ID du shop)
     */
    getGalleryImages(shopId: string) {
        return this.http.get<any>(
            `${environment.apiUrl}service-gallery/${shopId}/gallery`
        );
    }

    /**
     * Récupérer toutes les products
     */
    getAll() {
        return this.http.get<any[]>(`${environment.apiUrl}service`);
    }

    getProductsByShop(shopId: string) {
        return this.http.get<any[]>(
            `${environment.apiUrl}shop/${shopId}/services`
        );
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
        return this.http.post<any[]>(
            environment.apiUrl + 'services/multiple',
            products
        );
    }

    /**
     * Mettre à jour un product par son ID
     * @param product (données du product à mettre à jour)
     */
    update(serviceId: string, product: any) {
        return this.http.put<any>(
            `${environment.apiUrl}service/${serviceId}`,
            product
        );
    }

    /**
     * Supprimer un product par son ID
     * @param id (ID du product à supprimer)
     */
    delete(id: number) {
        return this.http.delete<any>(`${environment.apiUrl}service/${id}`);
    }

    deleteAllByShopId(shopId: string) {
        return this.http.delete<any>(`${environment.apiUrl}service-delete-all-by-shop/${shopId}`);
    }


    downloadServicesCsvByShop(shopId: string) {
        return this.http.get(
            `${environment.apiUrl}shop-csv-download/${shopId}/services/export/csv`,
            { responseType: 'blob' } // IMPORTANT: on récupère un fichier
        );
    }

    uploadServicesCsv(shopId: string, file: File) {
        const formData = new FormData();
        formData.append('csv', file); // doit matcher uploadCsv.single("csv")

        return this.http.post<any>(
            `${environment.apiUrl}shop-csv-upload/${shopId}/services/import/csv`,
            formData
        );
    }
}
