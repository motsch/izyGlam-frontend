import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GeoLocationService {
    private readonly API_URL = 'https://ipapi.co/json/';

    constructor(private http: HttpClient) {}

    public getLocation(): Observable<any> {
        return this.http.get(this.API_URL);
    }
}
