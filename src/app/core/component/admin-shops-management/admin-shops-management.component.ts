import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ShopService } from '../../services/shop.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-admin-shops-management',
  templateUrl: './admin-shops-management.component.html',
  styleUrls: ['./admin-shops-management.component.scss']
})
export class AdminShopsManagementComponent implements OnInit {
  shops: any[] = [];
  modalOpen = false;
  shop: any = {};
  displayedColumns: string[] = ['name', 'ville', 'note', 'averagePrice', 'promo', 'actions'];
  dataSource = new MatTableDataSource<any>(this.shops);
  searchTerm: string = '';
  imageUsed: string | null = null;
  imagePreview: string | null = null;
  imgStorageUrl =  environment.APIimgStorageUrl.replace(/\/$/, '');
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private shopService: ShopService) {}

  ngOnInit(): void {
    localStorage.setItem("menu-param", 'admin');
    this.shop.location = {};
    this.shop.hours = {};
    this.shop.hours.morning = {};
    this.shop.hours.afternoon = {};
    this.shop.location.latitude = 0;
    this.shop.location.longitude = 0;
    this.shop.promo = {};
    this.shopService.getAll().subscribe({
      next: (data: any[]) => {
        console.log(data);
        this.shops = data;
        this.dataSource = new MatTableDataSource<any>(this.shops);
        this.dataSource.paginator = this.paginator;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  applyGlobalSearch() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  togglePromo(shop: any) {
    shop.promo.active = !shop.promo.active;
    console.log(`Promotion toggled for ${shop.name}: ${shop.promo.active}`);
  }

  saveShop() {
    // Logique pour éditer les détails d'une boutique
    console.log(`Editing shop: ${this.shop.name}`);
    this.shopService.update(this.shop).subscribe({
      next: (data: any) => {
        console.log(data);
        this.modalOpen = false;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }
  

  editShop(shop: any) {
    // Logique pour éditer les détails d'une boutique
    console.log(`Editing shop: ${shop.name}`);
    this.shop = shop;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  saveService() {}
  onFileSelected(event: any): void {}

}
