/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommunicationService {
  private myVariable: any = [];
  private myVariableSubject = new Subject<any[]>();
  private myTemplate: any = {};
  private myTemplateSubject = new Subject<any>();
  private myRole: any = {};
  private myRoleSubject = new Subject<any>();

  get myVariable$(): Observable<any[]> {
    return this.myVariableSubject.asObservable();
  }
  get myTemplate$(): Observable<any> {
    return this.myTemplateSubject.asObservable();
  }
  get myRole$(): Observable<any> {
    return this.myRoleSubject.asObservable();
  }

  get getFilAriane(): any[] {
    return this.myVariable;
  }

  set setFilAriane(value: any[]) {
    this.myVariable = value;
    this.myVariableSubject.next(value);
  }

  get getTemplate(): any {
    return this.myTemplate;
  }

  set setTemplate(value: any) {
    this.myTemplate = value;
    this.myTemplateSubject.next(value);
  }

  get getRole(): any {
    return this.myRole;
  }

  set setRole(value: any) {
    this.myRole = value;
    this.myRoleSubject.next(value);
  }
}
