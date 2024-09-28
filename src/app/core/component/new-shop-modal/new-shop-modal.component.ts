import { Component, Input, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-new-shop-modal',
  templateUrl: './new-shop-modal.component.html',
  styleUrls: ['./new-shop-modal.component.scss']  // Corrige `styleUrl` en `styleUrls`
})

export class NewShopModalComponent {
  @Input() shops: any[] = [];
  amount: number = 0;
  categories: any[] = [];
  selectedCategory: any = null;
  dropdownOpen = false;

  constructor(
    public dialogRef: MatDialogRef<NewShopModalComponent>,  // Remplace `NgbActiveModal` par `MatDialogRef`
    private categoryService: CategoryService,
    @Inject(MAT_DIALOG_DATA) public data: any // Injection des données passées via MatDialog (si nécessaire)
  ) {
    this.shops = data?.user || [];  // Récupérer les données passées si tu les as passées lors de l'ouverture
  }

  ngOnInit() {
  }

  credit() {
    if (this.amount > 0) {
      this.dialogRef.close(this.amount); // Ferme la modal et renvoie le montant crédité
    }
  }

  close() {
    this.dialogRef.close(); // Ferme la modal sans renvoyer de valeur
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectShop(type: any) {
  }
}
