import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { environment } from "src/environments/environment";

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

    constructor(private http: HttpClient) { }

    // -----------------------------
    // CRUD
    // -----------------------------

    createBookingCategory(payload: Omit<BookingCategory, "_id" | "createdAt" | "updatedAt">): Observable<BookingCategory> {
        return this.http
            .post<BookingCategory>(`${environment.apiUrl}bookingCategory`, payload)
            .pipe(catchError(this.handleError));
    }

    getBookingCategories(shopId: string, active?: boolean): Observable<BookingCategory[]> {
        let params = new HttpParams().set("shopId", shopId);

        if (active !== undefined) {
            params = params.set("active", String(active));
        }

        return this.http
            .get<BookingCategory[]>(`${environment.apiUrl}bookingCategory`, { params })
            .pipe(catchError(this.handleError));
    }

    getBookingCategoryById(id: string): Observable<BookingCategory> {
        return this.http
            .get<BookingCategory>(`${environment.apiUrl}bookingCategory/${id}`)
            .pipe(catchError(this.handleError));
    }

    updateBookingCategory(id: string, payload: Partial<BookingCategory>): Observable<BookingCategory> {
        return this.http
            .put<BookingCategory>(`${environment.apiUrl}bookingCategory/${id}`, payload)
            .pipe(catchError(this.handleError));
    }

    deleteBookingCategory(id: string): Observable<{ message: string }> {
        return this.http
            .delete<{ message: string }>(`${environment.apiUrl}bookingCategory/${id}`)
            .pipe(catchError(this.handleError));
    }

    getBookingCategoryByShopId(id: string): Observable<BookingCategory[]> {
        return this.http

            .get<BookingCategory[]>(`${environment.apiUrl}bookingCategory-by-shopId/${id}`)
            .pipe(catchError(this.handleError));
    }

    // -----------------------------
    // Reorder
    // -----------------------------

    reorderBookingCategories(payload: ReorderPayload): Observable<BookingCategory[]> {
        return this.http
            .patch<BookingCategory[]>(`${environment.apiUrl}reorder`, payload)
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
