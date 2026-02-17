import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export type ProblemType = 'NO_SHOW' | 'LATE' | 'REFUND_REQUEST' | 'OTHER';
export type ProblemOutcome =
  | 'NO_SHOW_PRO'
  | 'NO_SHOW_CLIENT'
  | 'REFUND_FULL_NO_PENALTY'
  | 'NO_ACTION';

export type RefundMode = 'NONE' | 'FULL' | 'PARTIAL';

export interface ReportProblemPayload {
  type: ProblemType;
  message?: string;
  evidence?: {
    photoUrl?: string;
    lat?: number;
    lng?: number;
    accuracyMeters?: number;
  };
}

export interface ResolveProblemPayload {
  outcome: ProblemOutcome;
  note?: string;
  refund?: RefundMode;   // si non fourni, ton backend peut décider par défaut
  penalty?: boolean;     // true = appliquer pénalité (ex no-show-pro)
}

@Injectable({
  providedIn: 'root',
})
export class ProblemService {
  constructor(private http: HttpClient) {}

  /**
   * ✅ Client / Pro : signaler un problème sur un booking
   * POST /api/bookings/:bookingId/problem
   */
  reportProblem(bookingId: string, payload: ReportProblemPayload): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}bookings/${bookingId}/problem`, payload);
  }

  /**
   * ✅ Admin : lister les problèmes ouverts
   * GET /api/admin/problems/open
   */
  getOpenProblems(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}admin/problems/open`);
  }

  /**
   * ✅ Admin : résoudre un problème (verdict + traitements)
   * POST /api/admin/problems/:problemId/resolve
   */
  resolveProblem(problemId: string, payload: ResolveProblemPayload): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}admin/problems/${problemId}/resolve`, payload);
  }
}
