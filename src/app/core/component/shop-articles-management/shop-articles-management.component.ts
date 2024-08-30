import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-shop-articles-management',
  templateUrl: './shop-articles-management.component.html',
  styleUrls: ['./shop-articles-management.component.scss']
})
export class ShopArticlesManagementComponent implements OnInit {
    @Input() myArticlesData: any[] = [];
  services: any[] = [];
  editingServiceIndex: number | null = null;
  articlesCopyData: any[] = [];
  constructor() {}

  ngOnInit(): void {
    /*
      this.articlesCopyData = {...this.myArticlesData};
      console.log("this.myArticlesData : ");
      console.log(this.myArticlesData)
      */
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['myArticlesData'] && changes['myArticlesData'].currentValue) {
      this.articlesCopyData = [...this.myArticlesData];
      console.log('myArticlesData has been updated:', this.myArticlesData);
    }
  }
  saveService(): void {
    this.myArticlesData = this.articlesCopyData;
          const serviceData = this.myArticlesData;
          if (this.editingServiceIndex !== null) {
              // Modifier le service existant
              this.services[this.editingServiceIndex] = serviceData;
              this.editingServiceIndex = null;
          } else {
              // Ajouter un nouveau service
              this.services.push(serviceData);
          }
  }

  editService(service: any): void {
      this.editingServiceIndex = this.services.indexOf(service);
      // this.serviceForm.patchValue(service);
  }

  deleteService(serviceId: string): void {
      this.services = this.services.filter(
          (service) => service._id !== serviceId
      );
  }
}
