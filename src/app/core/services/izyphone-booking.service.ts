import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface IzyphoneIntakePrefill {
  email?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
}

export interface IzyphoneIntakeGetResponse {
  ok: boolean;
  booking?: any;
  prefill?: IzyphoneIntakePrefill;
  error?: string;
}

export interface IzyphoneIntakePostResponse {
  ok: boolean;
  bookingId?: string;
  checkoutUrl?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class IzyphoneBookingService {
  constructor(private http: HttpClient) {}

  /** GET /twilio/intake/:token */
  getIntake(token: string): Observable<IzyphoneIntakeGetResponse> {
    return this.http.get<IzyphoneIntakeGetResponse>(`${environment.apiUrlNoAPI}twilio/intake/${token}`);
  }

  /** POST /twilio/intake/:token */
  submitIntake(token: string, payload: IzyphoneIntakePrefill): Observable<IzyphoneIntakePostResponse> {
    return this.http.post<IzyphoneIntakePostResponse>(`${environment.apiUrlNoAPI}twilio/intake/${token}`, payload);
  }
}
