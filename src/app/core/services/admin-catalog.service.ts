import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export type BigBuySyncType = 'STOCK' | 'PRICES' | 'INFO' | 'IMAGES';

export type AdminProductListResponse = {
  items: any[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

@Injectable({
  providedIn: 'root',
})
export class AdminCatalogService {
  constructor(private http: HttpClient) {}

  // ------------------------------------------------------------
  // ✅ ADMIN - PRODUITS
  // Backend: GET /api/admin/products
  // ------------------------------------------------------------

  getAllAdmin(options?: {
    page?: number;
    limit?: number;
    complete?: boolean;
    taxonomies?: number[];  // ⚠️ chez toi "taxonomies" = categoryIds
    search?: string;        // côté backend c'est "q"
    sort?: 'updatedAt' | 'createdAt' | 'price' | 'stock';
    dir?: 'asc' | 'desc';
  }): Observable<AdminProductListResponse> {
    let params = new HttpParams();

    if (options?.page) params = params.set('page', String(options.page));
    if (options?.limit) params = params.set('limit', String(options.limit));

    if (options?.complete !== undefined) {
      params = params.set('complete', String(options.complete));
    }

    // ✅ backend attend: categoryIds=5419,11496
    if (options?.taxonomies?.length) {
      params = params.set('categoryIds', options.taxonomies.join(','));
    }

    // ✅ backend attend: q=...
    if (options?.search) {
      params = params.set('q', options.search);
    }

    // ✅ backend: sort + dir
    if (options?.sort) params = params.set('sort', options.sort);
    if (options?.dir) params = params.set('dir', options.dir);

    return this.http.get<AdminProductListResponse>(`${environment.apiUrl}admin/products`, { params });
  }

  // ------------------------------------------------------------
  // ✅ ADMIN - DELETE
  // Backend: DELETE /api/admin/products/:id
  // ------------------------------------------------------------
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}admin/products/${id}`);
  }

  // ------------------------------------------------------------
  // ✅ ADMIN - UPDATE
  // (tu utilises toujours PUT /api/product/:id côté backend)
  // ------------------------------------------------------------
  update(product: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}product/${product._id}`, product);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}product/${id}`);
  }

  // ------------------------------------------------------------
  // ✅ ADMIN - STATS
  // Backend: GET /api/admin/products/stats
  // ------------------------------------------------------------
  getAdminStats(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}admin/products/stats`);
  }

  // ------------------------------------------------------------
  // ✅ ADMIN - DELETE MANY
  // Backend: POST /api/admin/products/delete-many
  // ------------------------------------------------------------
  deleteMany(ids: string[]): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}admin/products/delete-many`, { ids });
  }

  // ------------------------------------------------------------
  // ✅ ADMIN - PURGE
  // Backend: POST /api/admin/products/purge
  // ------------------------------------------------------------
  purgeAll(confirm: 'DELETE_ALL_PRODUCTS', completeOnly?: boolean): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}admin/products/purge`, {
      confirm,
      completeOnly: !!completeOnly,
    });
  }

  // ------------------------------------------------------------
  // ✅ ADMIN - BULK UPDATE
  // Backend: PATCH /api/admin/products/bulk
  // ------------------------------------------------------------
  bulkUpdate(ids: string[], set: any): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}admin/products/bulk`, { ids, set });
  }

  // ------------------------------------------------------------
  // ✅ ADMIN - BIGBUY JOBS (déjà OK)
  // ------------------------------------------------------------
  getBigBuyStatus(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}admin/bigbuy/status`);
  }

  startBigBuyBootstrap(payload?: {
    pages?: Partial<{ import: number; info: number; images: number; prices: number; stock: number }>;
    delaysMs?: Partial<{ import: number; info: number; images: number; prices: number; stock: number }>;
    enableImport?: boolean;
  }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}admin/bigbuy/bootstrap`, payload || {});
  }

  startBigBuySync(type: BigBuySyncType): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}admin/bigbuy/sync`, { type });
  }
}
