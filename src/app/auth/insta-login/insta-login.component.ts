import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SessionService } from 'src/app/core/services/session.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-insta-login',
  templateUrl: './insta-login.component.html',
  styleUrl: './insta-login.component.scss'
})
export class InstaLoginComponent {
  code: string | null = null;
  backendResponse: any = null;
  rememberMe: boolean | null = false;


  constructor(private route: ActivatedRoute, private http: HttpClient,
    private sessionService: SessionService,
    public router: Router, private _snackBar: MatSnackBar) { }

  ngOnInit(): void {
    // Récupérer le paramètre 'code' dans l'URL
    this.route.queryParamMap.subscribe((params) => {
      this.code = params.get('code'); // Récupère la valeur du paramètre 'code'
      console.log('Code récupéré depuis l’URL :', this.code);

      // Si un code est présent, l'envoyer au backend
      if (this.code) {
        this.sendCodeToBackend(this.code);
      }
    });
  }

  // Fonction pour envoyer le code au backend
  private sendCodeToBackend(code: string): void {
    this.http.post('http://localhost:3000/api/meta/exchangeCode', { code }).subscribe(
      (response: any) => {
        console.log('Réponse backend :', response);

        const accessToken = response.accessToken;
        const expiresIn = response.expires_in;

        // Vérification des données reçues
        if (!accessToken || !expiresIn) {
          console.error('Access token ou expiration non reçu du backend.');
          this.openSnackBar('Erreur lors de la récupération du token Facebook');
          return;
        }

        // Stocker le token Facebook et son expiration
        this.sessionService.setFacebookToken(accessToken, expiresIn);

        // Étape 2 : Utiliser l'accessToken pour créer ou récupérer l'utilisateur
        this.http.post('http://localhost:3000/api/facebook-login', { accessToken }).subscribe(
          (user: any) => {
            console.log('Réponse serveur :', user);

            // Stocker le token JWT et rediriger l'utilisateur
            this.sessionService.setCurrentUser(user.token, this.rememberMe);
            const shopId = localStorage.getItem('shopSelected');
            this.router.navigate(shopId ? ['shop', shopId] : ['main']);
          },
          (error) => {
            console.error('Erreur lors du login utilisateur :', error);
            this.openSnackBar(error.error.message || 'Erreur de connexion');
          }
        );
      },
      (error) => {
        console.error('Erreur lors de l’échange du code au backend :', error);
        this.openSnackBar('Erreur lors de l’échange du code');
      }
    );
  }

  openSnackBar(phrase: string) {
    // const uploadTranslation = this.translate.instant("ALERT.CLOSE");
    this._snackBar.open(phrase, 'uploadTranslation', {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      duration: 5000,
      panelClass: ['orange-snackbar', 'login-snackbar'],
    });
  }
}
