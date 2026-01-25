/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommunicationService {
  private myVariable: any = [];
  private myVariableSubject = new Subject<any[]>();
  private myItemToBuy: any = {};
  private myItemToBuySubject = new Subject<any>();
  private myRole: any = {};
  private myRoleSubject = new Subject<any>();

  get myVariable$(): Observable<any[]> {
    return this.myVariableSubject.asObservable();
  }
  get myTemplate$(): Observable<any> {
    return this.myItemToBuySubject.asObservable();
  }
  get myRole$(): Observable<any> {
    return this.myRoleSubject.asObservable();
  }

  get getItemToBuy(): any {
    return this.myItemToBuy;
  }

  set setItemToBuy(value: any) {
    this.myItemToBuy = value;
    this.myItemToBuySubject.next(value);
  }

  get getRole(): any {
    return this.myRole;
  }

  set setRole(value: any) {
    this.myRole = value;
    this.myRoleSubject.next(value);
  }
}
