import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type FeedMediaType = 'image' | 'video';

export type FeedPostStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'DELETED';

export type FeedPostMedia = {
  type: FeedMediaType;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  durationSec?: number;
};

export type FeedPostMetrics = {
  likesCount: number;
  viewsCount: number;
  savesCount: number;
};

export type FeedPostLocation = {
  geo: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
  city?: string;
  zipCode?: string;
  country?: string;
};

export type FeedPost = {
  _id: string;
  proId: string;
  shopId?: string;
  status: FeedPostStatus;
  media: FeedPostMedia;
  caption?: string;
  tags: string[];
  serviceIds?: string[];
  location?: FeedPostLocation;
  metrics: FeedPostMetrics;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
};

export type FeedListResponse = {
  items: FeedPost[];
  nextCursor: string | null;
};

export type ProFeedStatsResponse = {
  range: { from: string; to: string };
  interactions: {
    views: number;
    likes: number;
    saves: number;
    ctaBook: number;
    openProfile: number;
  };
  followersGained: number;
  attribution: {
    ctaBook: { count: number; revenue: number };
    viewAssisted: { count: number; revenue: number };
  };
};

@Injectable({ providedIn: 'root' })
export class FeedService {
  private readonly API_URL = (window as any).__env?.API_URL || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // -------------------------
  // FEED LISTING
  // -------------------------
  list(params: {
    limit?: number;
    cursor?: string | null;

    // filters
    proId?: string;
    tag?: string;
    city?: string;
    zipCode?: string;

    // geo
    lat?: number;
    lng?: number;
    radiusKm?: number;
  }): Observable<FeedListResponse> {
    let httpParams = new HttpParams();

    if (params.limit != null) httpParams = httpParams.set('limit', String(params.limit));
    if (params.cursor) httpParams = httpParams.set('cursor', params.cursor);

    if (params.proId) httpParams = httpParams.set('proId', params.proId);
    if (params.tag) httpParams = httpParams.set('tag', params.tag);
    if (params.city) httpParams = httpParams.set('city', params.city);
    if (params.zipCode) httpParams = httpParams.set('zipCode', params.zipCode);

    if (params.lat != null && params.lng != null) {
      httpParams = httpParams.set('lat', String(params.lat)).set('lng', String(params.lng));
      if (params.radiusKm != null) httpParams = httpParams.set('radiusKm', String(params.radiusKm));
    }

    return this.http.get<FeedListResponse>(`${this.API_URL}/feed`, { params: httpParams });
  }

  getById(id: string): Observable<FeedPost> {
    return this.http.get<FeedPost>(`${this.API_URL}/feed/${id}`);
  }

  // -------------------------
  // INTERACTIONS
  // -------------------------
  view(postId: string): Observable<{ ok: boolean; counted: boolean }> {
    return this.http.post<{ ok: boolean; counted: boolean }>(`${this.API_URL}/feed/${postId}/view`, {});
  }

  like(postId: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.API_URL}/feed/${postId}/like`, {});
  }

  unlike(postId: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.API_URL}/feed/${postId}/like`);
  }

  save(postId: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.API_URL}/feed/${postId}/save`, {});
  }

  unsave(postId: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.API_URL}/feed/${postId}/save`);
  }

  ctaBook(postId: string, ref?: string | null): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.API_URL}/feed/${postId}/cta/book`, { ref: ref || null });
  }

  followPro(proId: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.API_URL}/feed/pro/${proId}/follow`, {});
  }

  unfollowPro(proId: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.API_URL}/feed/pro/${proId}/follow`);
  }

  // -------------------------
  // PRO ANALYTICS
  // -------------------------
  getProStats(params?: { from?: string; to?: string }): Observable<ProFeedStatsResponse> {
    let httpParams = new HttpParams();
    if (params?.from) httpParams = httpParams.set('from', params.from);
    if (params?.to) httpParams = httpParams.set('to', params.to);

    return this.http.get<ProFeedStatsResponse>(`${this.API_URL}/pro/feed/stats`, { params: httpParams });
  }
}
