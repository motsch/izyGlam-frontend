import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminService } from './admin.service';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class DeviceService {
    serverBosch = '';
    apiKey = '';

    constructor(private http: HttpClient) {}

    getAllDevices() {
        return this.http.get<any>(environment.apiUrl + 'device');
    }

    getAllActuators() {
        return this.http.get<any>(environment.apiUrl + 'getAllActuator');
    }
}
