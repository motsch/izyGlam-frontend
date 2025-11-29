import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CompanyService {
    constructor(private http: HttpClient) {}

    /**
     * Récupérer toutes les entreprises
     */
    getAll(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}company`);
    }

    /**
     * Récupérer une entreprise par son ID
     * @param id (ID de l'entreprise)
     */
    getById(id: string): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}company/${id}`);
    }

    /**
     * Créer une nouvelle entreprise
     * @param company (données de l'entreprise à créer)
     */
    create(company: any): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}company`, company);
    }

    /**
     * Mettre à jour une entreprise par son ID
     * @param company (données de l'entreprise à mettre à jour)
     */
    update(company: any): Observable<any> {
        return this.http.put<any>(`${environment.apiUrl}company/${company._id}`, company);
    }

    /**
     * Supprimer une entreprise par son ID
     * @param id (ID de l'entreprise à supprimer)
     */
    delete(id: string): Observable<any> {
        return this.http.delete<any>(`${environment.apiUrl}company/${id}`);
    }

    /**
     * Récupérer toutes les entreprises par secteur d'activité
     * @param industry (secteur d'activité de l'entreprise)
     */
    getByIndustry(industry: string): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}companies/industry/${industry}`);
    }

        /**
     * Récupérer tous les employés d'une entreprise
     * @param companyId (ID de l'entreprise)
     */
    getCompanyEmployees(companyId: string): Observable<any[]> {
        return this.http.get<any[]>(
            `${environment.apiUrl}company/${companyId}/employees`
        );
    }

    /**
     * Récupérer tous les bookings d'un employé
     * @param employeeId (ID de l'employé)
     */
    getEmployeeBookings(employeeId: string): Observable<any[]> {
        return this.http.get<any[]>(
            `${environment.apiUrl}company/employee/${employeeId}/bookings`
        );
    }



        /**
     * Créer un employé pour une entreprise (B2B)
     */
    createCompanyEmployee(companyId: string, payload: any): Observable<any> {
        return this.http.post<any>(
            `${environment.apiUrl}company/${companyId}/employees`,
            payload
        );
    }

    /**
     * Mettre à jour le crédit courant d'un employé
     */
    updateEmployeeCurrentCredit(companyId: string, employeeId: string, newCredit: number): Observable<any> {
        return this.http.patch<any>(
            `${environment.apiUrl}company/${companyId}/employees/${employeeId}/credit`,
            { newCredit }
        );
    }

    /**
     * Mettre à jour l'allocation mensuelle d'un employé
     */
    updateEmployeeMonthlyCredit(companyId: string, employeeId: string, newMonthlyCredit: number): Observable<any> {
        return this.http.patch<any>(
            `${environment.apiUrl}company/${companyId}/employees/${employeeId}/monthly-credit`,
            { newMonthlyCredit }
        );
    }

    /**
     * Activer / désactiver un employé
     */
    updateEmployeeStatus(companyId: string, employeeId: string, active: boolean): Observable<any> {
        return this.http.patch<any>(
            `${environment.apiUrl}company/${companyId}/employees/${employeeId}/status`,
            { active }
        );
    }

    /**
     * Reset global des allocations selon le barème de la company
     */
    resetCompanyAllocations(companyId: string): Observable<any> {
        return this.http.post<any>(
            `${environment.apiUrl}company/${companyId}/reset-allocations`,
            {}
        );
    }

    

}
