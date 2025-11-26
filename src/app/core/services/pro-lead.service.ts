import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class ProLeadService {
  private baseUrl = `${environment.apiUrl}/pro-leads`;

  constructor(private http: HttpClient) {}

  getLeads(options?: {
    status?: string | "all";
    hasEmail?: boolean;
    search?: string;
    postalCode?: string;
    category?: string;
  }): Observable<any[]> {
    let params = new HttpParams();

    if (options?.status && options.status !== "all") {
      params = params.set("status", options.status);
    }
    if (options?.postalCode) {
      params = params.set("postalCode", options.postalCode);
    }
    if (options?.category) {
      params = params.set("category", options.category);
    }
    if (options?.search) {
      params = params.set("search", options.search);
    }
    if (options?.hasEmail === true) {
      params = params.set("hasEmail", "true");
    }

    return this.http.get<any[]>(this.baseUrl, { params });
  }

  updateLead(id: string, payload: Partial<any>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, payload);
  }
}
