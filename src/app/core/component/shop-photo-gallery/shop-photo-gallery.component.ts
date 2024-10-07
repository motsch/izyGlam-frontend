import { Component, Input } from '@angular/core';
import { ShopService } from '../../services/shop.service';

@Component({
    selector: 'app-shop-photo-gallery',
    templateUrl: './shop-photo-gallery.component.html',
    styleUrl: './shop-photo-gallery.component.scss',
})
export class ShopPhotoGalleryComponent {
    @Input() myShopData: any = {};
    @Input() me: any = {};
    galleryImages: string[] = []; // Stocke les images de la galerie

  constructor(private shopService: ShopService) {}
  ngOnInit() {
    // Récupère les images de la galerie au chargement du composant
    this.shopService.getGalleryImages(this.myShopData._id).subscribe(
      (images) => {
        this.galleryImages = images;
      },
      (error) => {
        console.error('Erreur lors du chargement des images de la galerie:', error);
      }
    );
  }

  // Méthode pour uploader des images
  onFilesSelected(event: any): void {
    const files: File[] = Array.from(event.target.files); // Sélectionne les fichiers
    this.shopService.uploadGalleryImages(this.myShopData._id, files).subscribe(
      (response) => {
        console.log('Images uploadées avec succès:', response);
        // Rafraîchir la galerie après l'upload
        this.shopService.getGalleryImages(this.myShopData._id).subscribe((images) => {
          this.galleryImages = images;
        });
      },
      (error) => {
        console.error('Erreur lors de l\'upload des images:', error);
      }
    );
  }
}