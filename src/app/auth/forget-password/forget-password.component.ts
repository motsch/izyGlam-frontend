import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationService } from 'src/app/core/services/authentication.service';
import { SeoService } from 'src/app/core/services/seo.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.scss'],
})
export class ForgetPasswordComponent implements OnInit {

  placeholderEmail: string = 'LOGIN.PLACEHOLDER_EMAIL';
  imgStorageUrl: string = environment.imgStorageUrl;
  //  user à logger;
  user: any = { login: '' }; // Initialize with an empty string
  isLoading = false;

  // Erreur lors du login
  error: any = {};
  emailRedBorder = true;
  year: string = '';
  isPasswordVisible: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private title: Title,
    private _snackBar: MatSnackBar,
    private translate: TranslateService,
    private seoService: SeoService,
    private authService: AuthenticationService
  ) { }

  ngOnInit() {
    this.title.setTitle(this.route.snapshot.data['title']);
    this.translate
      .get('LOGIN.PLACEHOLDER_EMAIL')
      .subscribe((res: string) => {
        this.placeholderEmail = res;
      });
    this.seoService.updateMeta('login');
  }

  onSubmit() {
    if (!this.user.login) {
      this.openSnackBar('Veuillez entrer un email valide.');
      return;
    }

    this.isLoading = true;
    this.authService.forgotPassword(this.user.login).subscribe({
      next: () => {
        this.isLoading = false;
        this.openSnackBar('Un email de réinitialisation a été envoyé.');
      },
      error: (err) => {
        this.isLoading = false;
        this.openSnackBar(err.error.message || 'Une erreur est survenue.');
      },
    });
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
