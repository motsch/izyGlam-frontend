import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export type SocialPlatform = 'instagram' | 'tiktok' | 'facebook';

export interface FakePost {
  _id: string;
  platform: SocialPlatform;
  lang: 'fr';
  shopTypes: string[]; // ex: ["coiffure"] ou ["all"]
  tone?: string;
  text: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class FakePostService {
  constructor(private http: HttpClient) {}

  // ADMIN
  getAll(): Observable<FakePost[]> {
    return this.http.get<FakePost[]>(`${environment.apiUrl}fake-post`);
  }

  getById(id: string): Observable<FakePost> {
    return this.http.get<FakePost>(`${environment.apiUrl}fake-post/${id}`);
  }

  create(payload: Partial<FakePost>): Observable<FakePost> {
    return this.http.post<FakePost>(`${environment.apiUrl}fake-post`, payload);
  }

  update(id: string, payload: Partial<FakePost>): Observable<FakePost> {
    return this.http.put<FakePost>(`${environment.apiUrl}fake-post/${id}`, payload);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}fake-post/${id}`);
  }

  // PUBLIC
  getRandom(shopType: string, platform: SocialPlatform = 'instagram'): Observable<FakePost> {
    const params = new HttpParams()
      .set('shopType', shopType || 'all')
      .set('platform', platform);

    return this.http.get<FakePost>(`${environment.apiUrl}fake-post/random`, { params });
  }
}
