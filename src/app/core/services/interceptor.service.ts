import { Injectable } from "@angular/core";
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from "@angular/common/http";
import { Observable, BehaviorSubject, throwError } from "rxjs";
import { catchError, filter, switchMap, take, finalize } from "rxjs/operators";
import { SessionService } from "./session.service";
import { AuthenticationService } from "./authentication.service";
import jwt_decode from "jwt-decode";
import { Router } from "@angular/router";

@Injectable()
export class InterceptorService implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private sessionService: SessionService,
    public router: Router,
    private authService: AuthenticationService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.sessionService.getCurrentUser(); // ici c'est ton JWT (string)

    // 1) Si on a un token => on l'ajoute au header
    if (token) {
      request = this.addTokenToRequest(request, token);
    }

    // 2) Si token expiring soon => refresh puis retry la requête
    if (token && this.isTokenExpiringSoon(token)) {
      return this.handleRefreshAndRetry(request, next);
    }

    // 3) Sinon => requête normale + gestion 401 si besoin
    return next.handle(request).pipe(
      catchError((err: any) => {
        // Si le serveur répond 401 (token expiré / invalide), on tente un refresh une fois
        if (err instanceof HttpErrorResponse && err.status === 401 && token) {
          return this.handleRefreshAndRetry(request, next);
        }
        return throwError(() => err);
      })
    );
  }

  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    // ✅ IMPORTANT : Bearer
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private isTokenExpiringSoon(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    const now = Date.now() / 1000; // secondes
    // Ici tu avais 30 minutes, ok
    return expiration - now < 1800;
  }

  private getTokenExpiration(token: string): number {
    const decodedToken: any = jwt_decode(token);
    return decodedToken.exp; // timestamp en secondes
  }

  private handleRefreshAndRetry(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const currentToken = this.sessionService.getCurrentUser();
    if (!currentToken) {
      // pas de token => on laisse partir tel quel
      return next.handle(request);
    }

    // Si refresh déjà en cours => on attend le nouveau token puis on retry
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((t) => !!t),
        take(1),
        switchMap((newToken) => {
          const newReq = this.addTokenToRequest(request, newToken!);
          return next.handle(newReq);
        })
      );
    }

    // Sinon => on déclenche le refresh
    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    const rememberMe = localStorage.getItem("rememberMe");
    const boolRememberMe = rememberMe ? JSON.parse(rememberMe) : false;

    return this.authService.refreshToken(currentToken).pipe(
      switchMap((response: any) => {
        const newToken = response.token;
        if (!newToken) {
          throw new Error("No token returned by refreshToken");
        }

        // stocker le nouveau token
        this.sessionService.setCurrentUser(newToken, boolRememberMe);
        this.refreshTokenSubject.next(newToken);

        // retry avec le nouveau token
        const newReq = this.addTokenToRequest(request, newToken);
        return next.handle(newReq);
      }),
      catchError((error) => {
        // refresh impossible => logout
        this.authService.logout();
        this.router.navigate(["/"]);
        return throwError(() => error);
      }),
      finalize(() => {
        this.isRefreshing = false;
      })
    );
  }
}
