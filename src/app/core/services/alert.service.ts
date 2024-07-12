import {Injectable} from '@angular/core';
import {Router, NavigationStart} from '@angular/router';
import {Observable, Subject} from 'rxjs';

@Injectable()
export class AlertService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private subject = new Subject<any>();
  private keepAfterNavigationChange = false;

  private booleanSubject = new Subject<boolean>();
  private modalTitleSubject = new Subject<string>();
  private modalContentSubject = new Subject<string>();
  private modalTypeSubject = new Subject<string>();
  private modalObjectSubject = new Subject<string>();

  booleanState$ = this.booleanSubject.asObservable();
  modalTitle$ = this.modalTitleSubject.asObservable();
  modalContent$ = this.modalContentSubject.asObservable();
  modalType$ = this.modalTypeSubject.asObservable();
  modalObject$ = this.modalObjectSubject.asObservable();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setYesNoModalState(state: boolean, content: string, type: string, object: any) {
    this.booleanSubject.next(state);
    // this.modalTitleSubject.next(title);
    this.modalContentSubject.next(content);
    this.modalTypeSubject.next(type);
    this.modalObjectSubject.next(object);
  }

  constructor(private router: Router) {
    // clear alert message on route change
    router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        if (this.keepAfterNavigationChange) {
          // only keep for a single location change
          this.keepAfterNavigationChange = false;
        } else {
          // clear alert
          this.subject.next("");
        }
      }
    });
  }

  /**
   * En cas de réussite
   * @param message  (message d'erreur)
   * @param keepAfterNavigationChange (boolean)
   */
  success(message: string, keepAfterNavigationChange = false) {
    this.keepAfterNavigationChange = keepAfterNavigationChange;
    this.subject.next({type: 'success', text: message});
  }

  /**
   * En cas d'erreur
   * @param message (message d'erreur)
   * @param keepAfterNavigationChange (boolean)
   */
  error(message: string, keepAfterNavigationChange = false) {
    this.keepAfterNavigationChange = keepAfterNavigationChange;
    this.subject.next({type: 'error', text: message});
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }
}
