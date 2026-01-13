import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

function apiUrl(): string {
  return (window as any).__env?.API_URL || 'http://localhost:3000/api';
}

/**
 * On ne fige pas encore le shape, on met un type souple.
 * On typera quand tu me montres un exemple de réponse.
 */
export type ProFeedStatsResponse = any;

@Injectable({ providedIn: 'root' })
export class FeedAnalyticsService {
  private readonly API_URL = apiUrl();

  constructor(private http: HttpClient) {}

  /**
   * GET /pro/feed/stats
   * On laisse optionnel: période / shop / etc si ton backend le supporte
   */
  getProFeedStats(query?: { from?: string; to?: string; shopId?: string }): Observable<ProFeedStatsResponse> {
    let params = new HttpParams();
    if (query?.from) params = params.set('from', query.from);
    if (query?.to) params = params.set('to', query.to);
    if (query?.shopId) params = params.set('shopId', query.shopId);

    return this.http.get<ProFeedStatsResponse>(`${this.API_URL}/pro/feed/stats`, { params });
  }
}
