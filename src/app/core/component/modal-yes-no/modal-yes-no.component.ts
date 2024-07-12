import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal-yes-no',
  templateUrl: './modal-yes-no.component.html',
  styleUrls: ['./modal-yes-no.component.css'],
})
export class ModalYesNoComponent implements OnInit {
  @Input() user: any = {};
  @Input() red!: boolean;
  @Input() buttonType!: string;
  name = "ok";
  message:string | undefined;

  constructor(public activeModal: NgbActiveModal,
    private modalRMSService: ModalService) {
  }

  ngOnInit() {
    this.modalRMSService.currentMessage.subscribe(message => this.message = message)
  }

  /**
   * Close the yes/no modal (accepted)
   * @param value 
   */
  close(value: string) {
    this.activeModal.close(value);
  }

  /**
   * Remove the yes/no modal (nothing triggered)
   */
  dismiss() {
    this.activeModal.dismiss('Dismissed');
  }
}
