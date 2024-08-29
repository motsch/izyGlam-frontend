import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-shop-management',
  templateUrl: './shop-management.component.html',
  styleUrls: ['./shop-management.component.scss']
})
export class ShopManagementComponent implements OnInit {

  shopForm: FormGroup;
  serviceForm: FormGroup;
  services: any[] = [];
  editingServiceIndex: number | null = null;

  constructor(private fb: FormBuilder) {
    this.shopForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      image: ['', Validators.required],
      averagePrice: ['', Validators.required],
      ville: ['', Validators.required],
      latitude: [0, Validators.required],
      longitude: [0, Validators.required],
      morningStart: ['', Validators.required],
      morningEnd: ['', Validators.required],
      afternoonStart: ['', Validators.required],
      afternoonEnd: ['', Validators.required],
    });

    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, Validators.required],
      duration: [0, Validators.required],
    });
  }

  ngOnInit(): void {
    // Chargement des données initiales ici, si nécessaire
  }

  saveShop(): void {
    if (this.shopForm.valid) {
      const shopData = this.shopForm.value;
      console.log('Enregistrement de la boutique:', shopData);
      // Ajouter la logique pour enregistrer la boutique via une API ou autre méthode
    }
  }

  saveService(): void {
    if (this.serviceForm.valid) {
      const serviceData = this.serviceForm.value;
      if (this.editingServiceIndex !== null) {
        // Modifier le service existant
        this.services[this.editingServiceIndex] = serviceData;
        this.editingServiceIndex = null;
      } else {
        // Ajouter un nouveau service
        this.services.push(serviceData);
      }
      this.serviceForm.reset();
    }
  }

  editService(service: any): void {
    this.editingServiceIndex = this.services.indexOf(service);
    this.serviceForm.patchValue(service);
  }

  deleteService(serviceId: string): void {
    this.services = this.services.filter(service => service._id !== serviceId);
  }
}
