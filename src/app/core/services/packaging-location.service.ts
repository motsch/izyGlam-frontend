import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class PackagingLocationService {
    constructor(private http: HttpClient) {}

    /**
     * Récupérer toutes les packagingLocations
     */
    getAll() {
        return this.http.get<any[]>(`${environment.apiUrl}packagingLocation`);
    }

    /**
     * Récupérer une packagingLocation par son ID
     * @param id (ID de la packagingLocation)
     */
    getById(id: number) {
        return this.http.get<any>(
            `${environment.apiUrl}packagingLocation/${id}`
        );
    }

    /**
     * Créer une nouvelle packagingLocation
     * @param task (données de la packagingLocation à créer)
     */
    create(packagingLocation: any, packagingLocationId: string) {
        // Ajoutez l'ID de la colonne comme paramètre
        return this.http.post<any>(
            `${environment.apiUrl}packagingLocation?columnId=${packagingLocationId}`,
            packagingLocation
        );
    }

    /**
     * Créer de nouvelles tâches
     * @param article (données des tâches à créer)
     */
    createMultiplePackagingLocations(packagingLocations: any[]) {
        return this.http.post<any>(
            `${environment.apiUrl}packagingLocation/create-multiple`,
            packagingLocations
        );
    }

    /**
     * Mettre à jour une packagingLocation par son ID
     * @param task (données de la packagingLocation à mettre à jour)
     */
    update(packagingLocation: any) {
        return this.http.put<any>(
            `${environment.apiUrl}packagingLocation/${packagingLocation._id}`,
            packagingLocation
        );
    }

    /**
     * Supprimer une packagingLocation par son ID
     * @param id (ID de la tâche à supprimer)
     */
    delete(id: number) {
        return this.http.delete<any>(
            `${environment.apiUrl}packagingLocation/${id}`
        );
    }

    /**
     * Supprimer tous packagingLocation
     */
    deleteAllPackagingLocations() {
        return this.http.delete<any>(`${environment.apiUrl}packagingLocation`);
    }
}
