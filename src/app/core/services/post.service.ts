import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class PostService {
    constructor(private http: HttpClient) { }

    /**
     * Récupère ou génère les posts pour le mois en cours
     */
    getMonthlyPosts(userId: string): Observable<any[]> {
        return this.http.get<any[]>(
            `${environment.apiUrl}posts-monthly/${userId}`
        );
    }

    /**
     * Récupère ou génère les posts pour le mois en cours
     */
    updateOnePostFromAi(userId: string, postId: string): Observable<any[]> {
        return this.http.get<any[]>(
            `${environment.apiUrl}posts-update-one/${userId}/${postId}`
        );
    }

    /**
     * Récupère ou génère les posts pour le mois en cours
     */
    createOnePostFromAi(userId: string, platform: string): Observable<any[]> {
        return this.http.get<any[]>(
            `${environment.apiUrl}posts-create-one/${userId}/${platform}`
        );
    }

    // Récupère tous les posts d'un utilisateur
    getAllPosts(userId: string): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}posts/${userId}`);
    }

    // Récupère un post par ID
    getPostById(postId: string): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}posts/${postId}`);
    }

    // Supprime un post par ID
    deletePostById(postId: string): Observable<any> {
        return this.http.delete<any>(`${environment.apiUrl}posts/${postId}`);
    }

    // Met à jour un post par ID
    updatePostById(postId: string, postData: any): Observable<any> {
        return this.http.put<any>(
            `${environment.apiUrl}posts/${postId}`,
            postData
        );
    }

    /**
     * Améliore un texte pour Instagram en utilisant l'API ChatGPT
     * @param text Le texte brut à améliorer
     * @returns Observable avec le texte amélioré
     */
    improveInstagramPost(post: any, platform: string, userId: string): Observable<any> {
        return this.http.post<any>(
            `${environment.apiUrl}posts/improve-instagram-post/${post._id}`,
            { text: post.content.caption, platform: platform, userId: userId, type: post.content.type }
        );
    }

    /**
     * Génère une image IA pour un seul post
     * @param postId ID du post
     * @returns Observable avec la réponse du backend
     */
    sendPromptToAiImage(postId: string): Observable<any> {
        return this.http.get<any>(
            `${environment.apiUrl}posts-ai-image/${postId}`
        );
    }

    /**
     * Génère des images IA pour plusieurs posts
     * @param postIds Tableau d'IDs de posts
     * @returns Observable avec la réponse du backend
     */
    sendPromptsToAiImage(postIds: string[]): Observable<any> {
        return this.http.post<any>(
            `${environment.apiUrl}posts-multiple-ai-image`,
            { postIds } // body JSON : { postIds: [...] }
        );
    }



    updatePostImageUrl(postId: string, imageUrl: string): Observable<any> {
        return this.http.put<any>(
            `${environment.apiUrl}posts/update-image-url`,
            {
                postId,
                imageUrl,
            }
        );
    }
}
