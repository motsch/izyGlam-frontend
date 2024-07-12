import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ImageEvaluationService {
    private API_URL = 'https://api.openai.com/v1/chat/completions';

    constructor(private http: HttpClient) {}

    evaluateImage(imageUrl: string): Observable<any> {
        const requestBody = {
            model: 'gpt-4', // Assurez-vous d'utiliser le bon modèle
            messages: [
                {
                    role: 'system',
                    content:
                        'A partir de maintenant, tu ne me répondras que par true ou false.',
                },
                {
                    role: 'user',
                    content: `Cette image est-elle en adéquation avec une plateforme proposant des soins de beauté. Cette image est esthétique ? Si oui, true, sinon, false.`,
                },
            ],
        };
        return this.http.post(this.API_URL, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer YOUR_API_KEY', // Remplacez YOUR_API_KEY par votre clé API
            },
        });
    }
}
