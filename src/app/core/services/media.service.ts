import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class MediaService {
    constructor(private http: HttpClient) {}
    /**
     * Uploader un média (image ou vidéo) et mettre à jour un post
     * @param postId L'ID du post à mettre à jour
     * @param mediaFile Le fichier média à uploader
     * @param mediaType Le type de média ('image' ou 'video')
     */
    uploadMedia(
        postId: string,
        mediaFile: File,
        mediaType: 'image' | 'video'
    ): Observable<any> {
        const formData = new FormData();
        formData.append(mediaType, mediaFile);

        return this.http.post<any>(
            `${environment.apiUrl}${mediaType}-upload-with-post/${postId}`,
            formData
        );
    }

    /**
     * Uploader un média et mettre à jour un post
     * @param mediaFile Le fichier média à uploader
     * @param mediaType Le type de média ('image' ou 'video')
     * @param postId L'ID du post à mettre à jour
     */
    uploadMediaAndUpdatePost(
        mediaFile: File,
        mediaType: 'image' | 'video',
        postId: string
    ): Observable<any> {
        const formData = new FormData();
        formData.append(mediaType, mediaFile);

        return this.http.post<any>(
            `${environment.apiUrl}${mediaType}-upload-with-post/${postId}`,
            formData
        );
    }

    /**
     * Récupérer un média par son nom de fichier
     * @param filename Le nom du fichier média
     * @param mediaType Le type de média ('image' ou 'video')
     */
    getMediaByFilename(
        filename: string,
        mediaType: 'image' | 'video'
    ): Observable<Blob> {
        return this.http.get(`${environment.apiUrl}${mediaType}/${filename}`, {
            responseType: 'blob',
        });
    }

    /**
     * Supprimer un média par son nom de fichier
     * @param filename Le nom du fichier média
     * @param mediaType Le type de média ('image' ou 'video')
     */
    deleteMedia(
        filename: string,
        mediaType: 'image' | 'video'
    ): Observable<any> {
        return this.http.delete<any>(
            `${environment.apiUrl}${mediaType}/${filename}`
        );
    }
}
