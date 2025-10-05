import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
    constructor(private http: HttpClient) { }

    private getLang(): string {
        // "fr-FR" -> "fr", fallback "en"
        const raw = localStorage.getItem('langue') || navigator.language || 'en';
        return raw.slice(0, 2).toLowerCase();
    }

    getUsersCount() {
        return this.http.get<number>(environment.apiUrl + 'users-count-all');
    }
    /**
     * permet de recupérer tous les users
     */
    getAll() {
        return this.http.get<any[]>(environment.apiUrl + 'users');
    }
    /**
     * permet de recupérer tous les users
     */
    getAllNoToken() {
        return this.http.get<any[]>(environment.apiUrl + 'usersNoToken');
    }

    /**
     * Permet de récupérer un user par son id
     * @param id (id du user)
     */
    getById(_id: number) {
        return this.http.get<any>(environment.apiUrl + 'users/' + _id);
    }

    /**
     * Permet de récupérer un user par son id
     * @param id (id du user)
     */
    getByCompanyId(_id: number) {
        return this.http.get<any>(environment.apiUrl + 'users-by-companyId/' + _id);
    }

    /**
     * Permet de récupérer le user connecté
     * @param id (id du user)
     */
    getMe() {
        return this.http.get<any>(environment.apiUrl + 'me');
    }

    // Ajoute une adresse pour un utilisateur donné
    addAddress(userId: string, address: any) {
        const url = environment.apiUrl + 'users/' + userId + '/address';
        // Utilise PATCH pour une mise à jour partielle
        return this.http.patch<any>(url, { address });
    }

    /**
     * Verifie le mail du user
     * @param user (email et password)
     */
    create(user: any) {
        return this.http.post<any>(environment.apiUrl + 'users', user);
    }

    /** Verifie le mail du user (création sans token) */
    createNoToken(user: any) {
        const params = new HttpParams().set('lang', this.getLang());
        return this.http.post<any>(`${environment.apiUrl}usersNoToken`, user, { params });
    }

    /**
     * Met à jour les infos du user
     * @param user (info du user à mettre à jour)
     */
    update(user: any) {
        return this.http.put<any>(
            environment.apiUrl + 'users/' + user._id,
            user
        );
    }

    /**
     * Met à jour les infos du user
     * @param user (info du user à mettre à jour)
     */
    updatePassword(user: any) {
        // Créer l'en-tête avec le type de contenu JSON
        const headers = new HttpHeaders().set(
            'Content-Type',
            'application/json'
        );

        return this.http.put<any>(
            environment.apiUrl + 'users/' + user._id + '/password',
            user
        );
    }

    /**
     * Supprime le user
     * @param id (id du user)
     */
    delete(_id: number) {
        return this.http.delete<any>(environment.apiUrl + 'users/' + _id);
    }

    // Méthode pour mettre à jour les favoris d'un utilisateur
    updateUserFavorites(userId: string, favoriteShops: Array<string>) {
        return this.http.put<any>(environment.apiUrl + 'update-user-favs/' + userId, { favoriteShops });
    }

    /**
 * Récupère les employés rattachés à un patron (le user connecté)
 */
    getMyEmployees() {
        return this.http.get<any[]>(environment.apiUrl + 'boss/employees');
    }

    /**
     * Ajoute un employé au patron connecté (lien bidirectionnel boss-employé)
     * @param employeeId ID du professionnel à rattacher
     */
    addEmployeeToBoss(employeeId: string) {
        return this.http.post<any>(
            environment.apiUrl + 'boss/add-employee',
            { employeeId }
        );
    }

    removeEmployeeFromBoss(employeeId: string) {
        return this.http.post<any>(environment.apiUrl + 'boss/remove-employee', { employeeId });
    }

    /**
     * Crée un professionnel et l'ajoute au boss connecté
     * @param newEmployee Données du nouvel employé (email, firstname, lastname)
     */
    createAndAddEmployeeToBoss(newEmployee: { email: string, firstname: string, lastname: string }) {
        return this.http.post<any>(environment.apiUrl + 'boss/create-and-add-employee', newEmployee);
    }

    /** Vérifie l’email via token reçu par mail (GET /verify-email?token=...) */
    verifyEmail(token: string) {
        const params = new HttpParams()
            .set('token', token)
            .set('lang', this.getLang());
        return this.http.get<any>(`${environment.apiUrl}verify-email`, { params });
    }

    /** Renvoyer l’email d’activation */
    resendVerificationEmail(email: string) {
        return this.http.post<any>(environment.apiUrl + 'resend-verification', { email });
    }

    getSubscription() {
        return this.http.get<any>(environment.apiUrl + 'users-subscription');
    }

    subscribeToPlan(plan: string, durationInMonths: number) {
        return this.http.post<any>(environment.apiUrl + 'users-subscribe', { newPlan: plan, durationInMonths });
    }


}
