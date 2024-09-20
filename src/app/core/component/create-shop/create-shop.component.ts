import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-create-shop',
  templateUrl: './create-shop.component.html',
  styleUrls: ['./create-shop.component.scss']
})
export class CreateShopComponent implements OnInit {
user: any = {};
error: string | null = null;
ngOnInit() {
  this.user.companyType = "coiffure";
  this.user.countryIndication = "FR";
}
onSubmit() {
    console.log(this.user);
}
}
