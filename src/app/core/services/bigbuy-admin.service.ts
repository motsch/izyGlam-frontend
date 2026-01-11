import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BigBuyAdminService {
  constructor(private http: HttpClient) {}

  importCatalog(): Observable<any> {
    return this.http.post(`${environment.apiUrl}admin/bigbuy/import`, {});
  }

  syncStock(): Observable<any> {
    return this.http.post(`${environment.apiUrl}admin/bigbuy/sync-stock`, {});
  }

  syncPrices(): Observable<any> {
    return this.http.post(`${environment.apiUrl}admin/bigbuy/sync-prices`, {});
  }
}
