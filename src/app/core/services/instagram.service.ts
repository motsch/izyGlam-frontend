import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
// idéalement tu typages avec une interface IPost côté front aussi

@Injectable({
    providedIn: 'root'
})
export class InstagramService {

    constructor(private http: HttpClient) { }

    // instagram.service.ts
    publishInstagramPost(post: any): Observable<any> {
        // Construire le texte de la légende
        const captionText = post.content.caption;
        const hashtagsArray = post.content.hashtags || [];
        const hashtags = hashtagsArray.map((h: string) => `#${h}`).join(' ');

        const finalCaption = hashtags
            ? `${captionText}\n\n${hashtags}`
            : captionText;

        const body = {
            postId: post._id,        // <-- ici on envoie l'id Mongo
            imageUrl: post.imageUrl, // ex: /uploads/images/...
            caption: finalCaption,   // string prête pour Instagram
        };

        return this.http.post<any>(environment.apiUrl + 'instagram/post', body);
    }



    publishLinkedinPost(post: any): Observable<any> {
        // Construire le texte du post (comme pour Insta)
        const captionText = post.content.caption;
        const hashtagsArray = post.content.hashtags || [];
        const hashtags = hashtagsArray.map((h: string) => `#${h}`).join(' ');

        const finalText = hashtags
            ? `${captionText}\n\n${hashtags}`
            : captionText;

        const body = {
            postId: post._id,        // Pour mettre à jour le status côté backend
            content: finalText,      // Texte du post LinkedIn
            imageUrl: post.imageUrl  // On l’envoie déjà, même si pour l’instant on poste du texte seul
        };

        return this.http.post<any>(environment.apiUrl + 'linkedin/post', body);
    }

}
