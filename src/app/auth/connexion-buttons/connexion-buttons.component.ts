import { Component, Input } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-connexion-buttons',
  templateUrl: './connexion-buttons.component.html',
  styleUrl: './connexion-buttons.component.scss'
})
export class ConnexionButtonsComponent {
  @Input() forConnection = false;
  apiURL = environment.apiUrl;
  imgStorageUrl: string = environment.imgStorageUrl;
  //  user à logger;
  user: any = {};
  // Erreur lors du login
  error: any = {};
  visible = false;
  rememberMe: boolean | undefined = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  langues: any[] | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selected: any;
  emailRedBorder = true;
  passwordRedBorder = true;
  imageDisplay: any;
  year: string = '';
  isPasswordVisible: boolean = false;

  private facebookOAuthUrl: string =
    'https://www.facebook.com/v17.0/dialog/oauth';
  private clientId: string = '1211724509934142'; // Remplace par ton App ID
  private redirectUri: string = 'http://localhost:4200/meta-login'; // Remplace par ton URI de redirection
  private scopes: string = 'public_profile,email'; //'pages_show_list,instagram_basic';


  metaConnect() {
    this.redirectToFacebookOAuth();
    /*
    this.metaService.getAccessToken('123456789').subscribe((res: any) => {
        console.log(res);
    });
    */
  }
  /**
   * Redirige l'utilisateur vers l'URL OAuth de Facebook pour obtenir un code d'autorisation.
   */
  redirectToFacebookOAuth(): void {
    //  const oauthUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=1211724509934142&redirect_uri=http://localhost:3000/api/meta/callback&scope=public_profile,email&response_type=code`;
    // private facebookOAuthUrl: string = 'https://www.facebook.com/v17.0/dialog/oauth';
    const oauthUrl = `${this.facebookOAuthUrl}?client_id=${environment.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
      environment.FACEBOOK_REDIRECT_URI
    )}&scope=${encodeURIComponent(this.scopes)}&response_type=code`;

    window.location.href = oauthUrl; // Redirige le navigateur vers l'URL
  }
}
