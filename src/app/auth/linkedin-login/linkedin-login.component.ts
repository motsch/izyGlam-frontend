import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-linkedin-login',
  templateUrl: './linkedin-login.component.html',
  styleUrls: ['./linkedin-login.component.scss']
})
export class LinkedinLoginComponent implements OnInit {
  code: string | null = null;
  backendResponse: any = null;
  apiURL = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private _snackBar: MatSnackBar,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    // Récupérer le paramètre 'code' dans l'URL
    this.route.queryParamMap.subscribe((params) => {
      this.code = params.get('code'); // Récupère le code de l'URL
      console.log('Code LinkedIn récupéré :', this.code);

      if (this.code) {
        this.sendCodeToBackend(this.code);
      } else {
        this.openSnackBar('Erreur : Aucun code reçu depuis LinkedIn');
      }
    });
  }

  // Fonction pour envoyer le code au backend
  private sendCodeToBackend(code: string): void {

    // Récupérer les informations utilisateur
    this.userService.getMe().subscribe({
      next: (user: any) => {
        const userId = user._id;
        this.http.post(this.apiURL + 'connect/linkedin', { code, userId }).subscribe(
          (response: any) => {
            console.log('Réponse du backend :', response);

            // Rediriger l'utilisateur ou afficher un message
            this.openSnackBar('Connexion LinkedIn réussie.');
            this.router.navigate(['main']);
          },
          (error) => {
            console.error('Erreur lors de la connexion LinkedIn :', error);
            this.openSnackBar('Erreur lors de la connexion à LinkedIn.');
          }
        );
      },
      error: (error: any) => {
        console.error('Erreur lors de la récupération des données utilisateur :', error);
      }
    })
  }

  openSnackBar(message: string) {
    this._snackBar.open(message, 'Fermer', {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      duration: 5000,
      panelClass: ['blue-snackbar']
    });
  }
}
