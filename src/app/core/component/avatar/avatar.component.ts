import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';

// ✅ Ajouts IzyGlam : toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'], // ✅ correction : styleUrls (tableau)
})
export class AvatarComponent {
  // URL d'accès aux images depuis le backend (on retire un éventuel trailing slash)
  aPIimgStorageUrl = environment.APIimgStorageUrl.replace(/\/$/, '');

  // Image de fond utilisée pour l'aperçu
  backgroundImages = this.aPIimgStorageUrl + 'uploads/images/creation/15/24.png';

  // Liste d'index d'avatars disponibles (si utilisée dans le template)
  imageNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  constructor(
    // ✅ IzyGlam
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  // ------------------------------------------------------
  // 🎨 Style de fond pour le conteneur d'avatar
  // (défensif : si jamais l'URL n'est pas définie)
  // ------------------------------------------------------
  getBackgroundStyle() {
    try {
      const url = this.backgroundImages || '';
      return {
        'background-image': `url(${url})`,
      };
    } catch (err) {
      console.error('Erreur lors de la génération du style de fond :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      return {};
    }
  }

  // ------------------------------------------------------
  // ✨ Toast d’erreur stylisé IzyGlam (centralisé)
  // ------------------------------------------------------
  private showCustomToast(message: string) {
    // Standard IzyGlam : erreurs → toastr.error
    this.toastr.error(message);
  }
}
