import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ShopService } from '../../services/shop.service';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-shop-photo-gallery',
  templateUrl: './shop-photo-gallery.component.html',
  styleUrl: './shop-photo-gallery.component.scss',
})
export class ShopPhotoGalleryComponent implements OnInit, OnChanges {
  @Input() myShopData: any = {};
  @Input() me: any = {};
  @Output() shopUpdated: EventEmitter<string> = new EventEmitter<string>();
  imgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');

  galleryImages: string[] = []; // Stocke les images de la galerie

  constructor(private shopService: ShopService,
    private toastr: ToastrService,
        private translate: TranslateService) { }
  ngOnInit() {
    localStorage.setItem("menu-param", 'management');
    // Rafraîchir la galerie
    this.setGalleryImages();
  }



  ngOnChanges(changes: SimpleChanges): void {
    if (changes['myShopData'] && changes['myShopData'].currentValue) {
      this.setGalleryImages();
    }
  }

  // Méthode pour uploader des images
  onFilesSelected(event: any): void {
    const files: File[] = Array.from(event.target.files); // Récupérer les fichiers sélectionnés
    this.shopService.uploadGalleryImages(this.myShopData._id, files).subscribe(
      (response) => {
        console.log('Images uploadées avec succès:', response);
        // Rafraîchir la galerie après l'upload
        this.setGalleryImages();
        this.showCustomToast(this.translate.instant('SUCCESS.PHOTO_UPLOAD'));
      },
      (error) => {
        console.error("Erreur lors de l'upload des images:", error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    );
  }

  setGalleryImages(): void {
    // Récupère les images de la galerie au chargement du composant
    this.shopService.getGalleryImages(this.myShopData._id).subscribe(
      (images: any) => {
        for (let elem of images.galleryImages) {
          // Générer l'URL complète pour chaque image
          elem = elem.replace(/^\/+/, '');
          console.log('elem:', elem); // Ici, les URLs sont correctes dans la console
        }
        this.myShopData.galleryImages = images.galleryImages;
        // Ensuite, mettre à jour le tableau des images avec les URLs complètes
        this.galleryImages = images.galleryImages;//.map((img:any) => environment.APIimgStorageUrl + img.replace(/^\/+/, ''));
        console.log('Images de la galerie:', this.galleryImages);
      },
      (error) => {
        console.error(
          'Erreur lors du chargement des images de la galerie:',
          error
        );
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    );
  }

  showCustomToast(message: string) {
    this.toastr.success(message);
  }

  deleteImage(image: string): void {
    // Logique pour supprimer l'image de la galerie
    const index = this.galleryImages.indexOf(image);
    if (index !== -1) {
      this.galleryImages.splice(index, 1);
    }

    this.myShopData.galleryImages = this.galleryImages;
    this.shopService.update(this.myShopData).subscribe({
      next: (data: any) => {
        this.shopUpdated.emit(this.myShopData._id);
        console.log(data);
        console.log('Photo supprimée de la galerie');
        this.showCustomToast(this.translate.instant('SUCCESS.PHOTO_DELETE'));
      },
      error: (error) => {
        console.log('Error updating shop:', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }
}
