import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  constructor(private http: HttpClient) {}

  /**
   * Upload d'une image
   * @param image (fichier image à uploader)
   */
  uploadImage(image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);

    return this.http.post<any>(`${environment.apiUrl}image/upload`, formData);
  }

  /**
   * Récupérer une image par son nom de fichier
   * @param filename (nom du fichier)
   */
  getImageByFilename(filename: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}image/${filename}`, { responseType: 'blob' });
  }

  /**
   * Supprimer une image par son nom de fichier
   * @param filename (nom du fichier à supprimer)
   */
  deleteImage(filename: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}image/${filename}`);
  }
}
