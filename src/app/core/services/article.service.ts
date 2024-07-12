import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environnements/environment';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les tâches
   */
  getAll() {
    return this.http.get<any[]>(`${environment.apiUrl}articles`);
  }

  /**
   * Récupérer une tâche par son ID
   * @param id (ID de la tâche)
   */
  getById(id: number) {
    return this.http.get<any>(`${environment.apiUrl}articles/${id}`);
  }

  /**
   * Créer une nouvelle tâche
   * @param article (données de la tâche à créer)
   */
  create(article: any) {
    // Ajoutez l'ID de la colonne comme paramètre
    return this.http.post<any>(`${environment.apiUrl}articles`, article);
  }

  /**
   * Créer de nouvelles tâches
   * @param article (données des tâches à créer)
   */
  createMultipleArticles(articles: any[]) {
    return this.http.post<any>(`${environment.apiUrl}articles/create-multiple`, articles);
  }

  /**
   * Mettre à jour une tâche par son ID
   * @param article (données de la tâche à mettre à jour)
   */
  update(article: any) {
    return this.http.put<any>(`${environment.apiUrl}articles/${article._id}`, article);
  }

  /**
   * Supprimer une tâche par son ID
   * @param id (ID de l'article à supprimer)
   */
  delete(id: number) {
    return this.http.delete<any>(`${environment.apiUrl}articles/${id}`);
  }

  /**
   * Supprimer tous les articles 
   */
  deleteAllArticles() {
    return this.http.delete<any>(`${environment.apiUrl}articles`);
  }



  // A supprimer !!!!


  /**
   * Récupérer une tâche par son ID
   * @param id (ID de la tâche)
   */
  checkQuantity(productID: string, quantity: string) {
    return this.http.get<any>(`${environment.apiUrl}articles/check-quantity/${productID}/${quantity}`);
  }

  /**
   * Récupérer une tâche par son ID
   * @param id (ID de la tâche)
   */
  getByName(productID: any) {
    return this.http.get<any>(`${environment.apiUrl}allee/nom/${productID.name}/productID/${productID.productID}/client/${productID.client}`);
  }

  /**
   * Supprimer une tâche par son ID
   * @param id (ID de l'article à supprimer)
   */
  manuallyDeleteArticleInAllee(alleeName: string, articleName: string) {
    return this.http.delete<any>(`${environment.apiUrl}allee/${alleeName}/article/${articleName}`);
  }
  
  /**
   * Récupérer une tâche par son ID
   * @param id (ID de la tâche)
   */
  robotDeleteArticleInAllee(alleeName: string) {
    return this.http.get<any>(`${environment.apiUrl}allee/robotDeleteArticleInAllee/${alleeName}`);
  }

  /**
   * Créer de nouvelles tâches
   * @param article (données des tâches à créer)
   */
  inventaireAllee(allee: any) {
    return this.http.post<any>(`${environment.apiUrl}allee/inventaireAllee/${allee.name}/${allee.dollyCount}`,allee);
  }
  
  /**
   * Récupérer une tâche par son ID
   * @param id (ID de la tâche)
   */
  getNumberOfArticlesByAllee(alleeName: string) {
    return this.http.get<any>(`${environment.apiUrl}allee/getNumberOfArticlesByAllee/${alleeName}`);
  }

  /**
   * Récupérer une tâche par son ID
   * @param id (ID de la tâche)
   */
  createBoschMission(requestObject: any) {
    return this.http.post<any>(`${environment.apiUrl}missions/create-new-bosch`, requestObject);
  }
  
  /**
   * Récupérer une tâche par son ID
   * @param id (ID de la tâche)
   */
  getAllMissions() {
    return this.http.get<any>(`${environment.apiUrl}missions`);
  }
}