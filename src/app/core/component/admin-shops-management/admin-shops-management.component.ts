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
  modalService: any = {};
  displayedColumns: string[] = ['name', 'ville', 'note', 'averagePrice', 'promo', 'actions'];
  dataSource = new MatTableDataSource<any>(this.shops);
  searchTerm: string = '';
  imageUsed: string | null = null;
  imagePreview: string | null = null;
  imgStorageUrl =  environment.APIimgStorageUrl.replace(/\/$/, '');
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private shopService: ShopService) {}

  ngOnInit(): void {
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

  editShop(shop: any) {
    // Logique pour éditer les détails d'une boutique
    console.log(`Editing shop: ${shop.name}`);
    this.modalService = shop;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  saveService() {}
  onFileSelected(event: any): void {}
  
}
