import { Component, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payement-validation',
  templateUrl: './payement-validation.component.html',
  styleUrls: ['./payement-validation.component.scss'],
})
export class PayementValidationComponent implements OnInit {
  success = false;
  shopId = "";
  paiement = false
  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.success = params['success'] === 'true';
      this.shopId = params['shopId'];
      this.paiement = params['paiement'] === 'true';
      console.log(this.success, this.shopId);
    });
  }
}
