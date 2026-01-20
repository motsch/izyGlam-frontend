import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

export interface BookingCategory {
  _id?: string;

  name: string;
  description?: string;

  shopId: string;
  userProId: string;

  color?: string;
  order?: number;
  active: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface ReorderPayload {
  shopId: string;
  orders: Array<{ id: string; order: number }>;
}

@Injectable({
  providedIn: "root",
})
export class BookingCategoryService {
  /**
   * ✅ Mets ici ton URL d’API
   * - soit en dur: "http://localhost:3000"
   * - soit via environment.apiUrl
   */
  private readonly API_URL = "http://localhost:3000";

  constructor(private http: HttpClient) {}

  // -----------------------------
  // CRUD
  // -----------------------------

  createBookingCategory(payload: Omit<BookingCategory, "_id" | "createdAt" | "updatedAt">): Observable<BookingCategory> {
    return this.http
      .post<BookingCategory>(`${this.API_URL}/bookingCategory`, payload)
      .pipe(catchError(this.handleError));
  }

  getBookingCategories(shopId: string, active?: boolean): Observable<BookingCategory[]> {
    let params = new HttpParams().set("shopId", shopId);

    if (active !== undefined) {
      params = params.set("active", String(active));
    }

    return this.http
      .get<BookingCategory[]>(`${this.API_URL}/bookingCategory`, { params })
      .pipe(catchError(this.handleError));
  }

  getBookingCategoryById(id: string): Observable<BookingCategory> {
    return this.http
      .get<BookingCategory>(`${this.API_URL}/bookingCategory/${id}`)
      .pipe(catchError(this.handleError));
  }

  updateBookingCategory(id: string, payload: Partial<BookingCategory>): Observable<BookingCategory> {
    return this.http
      .put<BookingCategory>(`${this.API_URL}/bookingCategory/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  deleteBookingCategory(id: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.API_URL}/bookingCategory/${id}`)
      .pipe(catchError(this.handleError));
  }

  getBookingCategoryByShopId(id: string): Observable<BookingCategory[]> {
    return this.http
      .get<BookingCategory[]>(`${this.API_URL}/bookingCategory-by-shopId/${id}`)
      .pipe(catchError(this.handleError));
  }

  // -----------------------------
  // Reorder
  // -----------------------------

  reorderBookingCategories(payload: ReorderPayload): Observable<BookingCategory[]> {
    return this.http
      .patch<BookingCategory[]>(`${this.API_URL}/reorder`, payload)
      .pipe(catchError(this.handleError));
  }

  // -----------------------------
  // Errors
  // -----------------------------

  private handleError(err: any) {
    // Tu peux brancher ici ton toaster global si tu veux
    const message =
      err?.error?.message ||
      err?.message ||
      "Erreur réseau / serveur";

    return throwError(() => new Error(message));
  }
}
