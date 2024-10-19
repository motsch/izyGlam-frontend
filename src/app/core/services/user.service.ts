import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
    constructor(private http: HttpClient) {}

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

    /**
     * Verifie le mail du user
     * @param user (email et password)
     */
    create(user: any) {
        return this.http.post<any>(environment.apiUrl + 'users', user);
    }

    /**
     * Verifie le mail du user
     * @param user (email et password)
     */
    createNoToken(user: any) {
        return this.http.post<any>(environment.apiUrl + 'usersNoToken', user);
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
}
