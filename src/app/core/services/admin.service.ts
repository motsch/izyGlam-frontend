import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AdminService {
    constructor(private http: HttpClient) {}

    /**
     * Créer une nouvelle régle admin
     * @param admin (données de la  régle admin à créer)
     */
    create(admin: any) {
        return this.http.post<any>(`${environment.apiUrl}admin`, admin);
    }

    /**
     * Récupérer toutes les  régles admin
     */
    getAll() {
        return this.http.get<any[]>(`${environment.apiUrl}admin`);
    }

    /**
     * Mettre à jour une  régle admin par son ID
     * @param admin (données de la  régle admin à mettre à jour)
     */
    update(admin: any) {
        return this.http.put<any>(
            `${environment.apiUrl}admin/${admin._id}`,
            admin
        );
    }

    /**
     * Récupérer toutes les configuration Bosch
     */
    getAllBoschConfig() {
        return this.http.get<any[]>(`${environment.apiUrl}boschConfig`);
    }

    /**
     * Créer une nouvelle régle admin
     * @param admin (données de la  régle admin à créer)
     */
    createBoschConfig(boschConfig: any) {
        return this.http.post<any>(
            `${environment.apiUrl}boschConfig`,
            boschConfig
        );
    }

    /**
     * Mettre à jour une  régle admin par son ID
     * @param admin (données de la  régle admin à mettre à jour)
     */
    updateBoschConfig(boschConfig: any) {
        return this.http.put<any>(
            `${environment.apiUrl}boschConfig/${boschConfig._id}`,
            boschConfig
        );
    }
}
