import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ShopService } from '../../services/shop.service';

@Component({
  selector: 'app-admin-shops-management',
  templateUrl: './admin-shops-management.component.html',
  styleUrls: ['./admin-shops-management.component.scss']
})
export class AdminShopsManagementComponent implements OnInit {
  shops: any[] = [/*
    {
      name: 'Salon Glam',
      description: 'Un salon moderne à Paris.',
      ville: 'Paris',
      note: '4.5',
      averagePrice: '€50',
      type: 'Coiffure',
      services: ['Coupe', 'Brushing'],
      promo: { active: true, type: 'Réduction' },
      hours: {
        morning: { start: '09:00', end: '12:00' },
        afternoon: { start: '14:00', end: '18:00' }
      }
    },
    {
      name: 'Spa Zen',
      description: 'Un spa relaxant à Lyon.',
      ville: 'Lyon',
      note: '4.7',
      averagePrice: '€100',
      type: 'Spa',
      services: ['Massage', 'Soins du visage'],
      promo: { active: false, type: '' },
      hours: {
        morning: { start: '10:00', end: '13:00' },
        afternoon: { start: '15:00', end: '19:00' }
      }
    },
    {
      name: 'Nail Studio',
      description: 'Un studio de manucure à Marseille.',
      ville: 'Marseille',
      note: '4.3',
      averagePrice: '€30',
      type: 'Manucure',
      services: ['Pose de vernis', 'Nail art'],
      promo: { active: true, type: 'Offre spéciale' },
      hours: {
        morning: { start: '08:00', end: '12:00' },
        afternoon: { start: '13:00', end: '17:00' }
      }
    }*/
  ];

  displayedColumns: string[] = ['name', 'ville', 'note', 'averagePrice', 'promo', 'actions'];
  dataSource = new MatTableDataSource<any>(this.shops);
  searchTerm: string = '';

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
  }
}
