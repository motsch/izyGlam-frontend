import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

export interface CalendarLinkResponse {
  icsUrl: string;
  calendarSyncToken?: string; // optionnel (le backend le renvoie)
}

@Injectable({
  providedIn: "root",
})
export class CalendarSyncService {

  constructor(private http: HttpClient) { }

  /**
   * Récupère (ou crée) le lien ICS du user connecté
   * Backend: GET /calendar/me/link
   */
  getOrCreateMyCalendarLink(userId: string) {
    return this.http.get(`${environment.apiUrl}/calendar/link/${userId}`);
  }
}
