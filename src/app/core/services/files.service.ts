import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environnements/environment';
@Injectable({
  providedIn: 'root'
})
export class FilesService {

  constructor(private http: HttpClient) {}
  /**
   * permet de recupérer tous les robots
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadFile(file: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.http.post<any>(environment.apiUrl + 'file/temporary', file);
  }

  /**
   * Verifie le mail du user
   * @param user (email et password)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadMultipleFiles(file: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.http.post<any[]>(environment.apiUrl + 'file/temporary/multiple', file);
  }
}
