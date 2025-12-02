import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
// import { B2BLead } from "../models/b2b-lead.model";

@Injectable({
  providedIn: "root",
})
export class B2BLeadService {
  private baseUrl = `${environment.apiUrl}/b2b-leads`;

  constructor(private http: HttpClient) {}

  getLeads(options?: {
    status?: string;
    hasEmail?: boolean;
    search?: string;
    postalCode?: string;
  }): Observable<any[]> {
    let params = new HttpParams();

    if (options?.status) {
      params = params.set("status", options.status);
    }
    if (options?.postalCode) {
      params = params.set("postalCode", options.postalCode);
    }
    if (options?.search) {
      params = params.set("search", options.search);
    }
    if (options?.hasEmail === true) {
      // côté back tu peux ignorer ou utiliser plus tard
      params = params.set("hasEmail", "true");
    }

    return this.http.get<any[]>(this.baseUrl, { params });
  }

  updateLead(id: string, payload: Partial<any>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, payload);
  }

  triggerEmailEnrichment(limit: number = 20): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/enrich-emails?limit=${limit}`,
      {}
    );
  }


  
  sendDripEmail(leadId: string, step: number) {
    return this.http.post<any>(
      `${this.baseUrl}/${leadId}/send-email/${step}`,
      {}
    );
  }
}
