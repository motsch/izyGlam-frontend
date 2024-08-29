import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ScheduleService {
    constructor(private http: HttpClient) {}

    /**
     * Récupérer tous les schedules
     */
    getAll(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}schedule`);
    }

    /**
     * Récupérer un schedule par son ID
     * @param id (ID du schedule)
     */
    getById(id: string): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}schedule/${id}`);
    }

    /**
     * Créer un nouveau schedule
     * @param schedule (données du schedule à créer)
     */
    create(schedule: any): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}schedule`, schedule);
    }

    /**
     * Mettre à jour un schedule par son ID
     * @param schedule (données du schedule à mettre à jour)
     */
    update(schedule: any): Observable<any> {
        return this.http.put<any>(
            `${environment.apiUrl}schedule/${schedule._id}`,
            schedule
        );
    }

    /**
     * Supprimer un schedule par son ID
     * @param id (ID du schedule à supprimer)
     */
    delete(id: string): Observable<any> {
        return this.http.delete<any>(`${environment.apiUrl}schedule/${id}`);
    }

    /**
     * Récupérer tous les schedules pour une boutique spécifique
     * @param shopId (ID de la boutique)
     */
    getByShopId(shopId: string): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}schedule/shop/${shopId}`);
    }
}
