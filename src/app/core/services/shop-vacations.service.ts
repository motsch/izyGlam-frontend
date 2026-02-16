import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: "root" })
export class VacationService {

  constructor(private http: HttpClient) { }

  getVacations(shopId: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}shop-vacations/${shopId}`);
  }

  addVacation(shopId: string, payload: any): Observable<any[]> {
    return this.http.post<any[]>(`${environment.apiUrl}shop-vacations/${shopId}`, payload);
  }

  deleteVacation(shopId: string, vacationId: string): Observable<any[]> {
    return this.http.delete<any[]>(`${environment.apiUrl}shop-vacations/${shopId}/${vacationId}`);
  }
}
