import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-round-shop-card',
    templateUrl: './round-shop-card.component.html',
    styleUrls: ['./round-shop-card.component.scss'],
})
export class RoundShopCardComponent {
    @Input() me: any;
    @Input() profile: any;
    @Input() promoVisible: boolean = false;
    @Input() promoType: any;
    imgStorageUrl: string = environment.APIimgStorageUrl;
    // Nouvelle propriété pour gérer l'état favori
    isFavorite: boolean = false;

    constructor(private router: Router, private userService: UserService) {}
    // Méthode pour gérer le clic sur le coeur
    toggleFavorite(): void {
        if(!this.me.favoriteShops) {
            this.me.favoriteShops = [];
        }
        this.profile.isFavorite = !this.profile.isFavorite;
        if (this.profile.isFavorite) {
            // Ajouter le shop aux favoris
            this.me.favoriteShops.push(this.profile._id);
        } else {
            // Retirer le shop des favoris
            this.me.favoriteShops = this.me.favoriteShops.filter(
                (shopId: string) => shopId !== this.profile._id
            );
        }
        // Mise à jour de l'utilisateur dans la base de données
        this.userService.updateUserFavorites(this.me._id, this.me.favoriteShops)
            .subscribe({
                next: (response: any) => {
                    console.log(`${this.profile.name} est favori : ${this.isFavorite}`);
                },
                error: (err :any) => {
                    console.error('Erreur lors de la mise à jour des favoris', err);
                }
            });
    }

    // Redirige vers la page d'une boutique spécifique
    toShopPage(id: string) {
        this.router.navigate(['shop/' + id]); // Navigation programmée vers la page du shop
    }
}
