import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ModalYesNoComponent } from '../component/modal-yes-no/modal-yes-no.component';
import { BehaviorSubject } from 'rxjs';
import { UserService } from './user.service';
import { EmitterService } from './emitter.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  modalRef: NgbModalRef | undefined;

  private messageSource = new BehaviorSubject('default message');
  currentMessage = this.messageSource.asObservable();

  constructor(
    private modalService: NgbModal,
    private userService: UserService,
    private emitterService: EmitterService,
    public router: Router
  ) {}
  /**
   * Open the "yes no" modal
   * @param object
   * @param red
   * @param type
   */
  openModal(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    object: any,
    red: boolean,
    type?: string,
    buttonType?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    const modalRef: NgbModalRef = this.modalService.open(ModalYesNoComponent, {
      size: 'lg',
      centered: true,
    });
    modalRef.componentInstance.user = object;
    modalRef.componentInstance.red = red;
    modalRef.componentInstance.buttonType = buttonType;
    // Set the user object on the modal component
    modalRef.result.then(
      (result) => {
        if (result == 'OK') {
          if (type == 'deleteUser') {
            this.deleteUser(object._id);
          }
        }
        return result;
      },
      (error) => {
        console.log(error);
        return false;
      }
    );
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  updateData() {
    // Set the message value that says that Group has been succesfully deleted
    this.changeMessage('update data');
  }

  cancelUpdate() {
    // Set the message value that says that Group has been succesfully deleted
    this.changeMessage('not updated');
  }

  /**
   * User accepted to remove the user from the BDD
   * @param id
   */
  deleteUser(id: number) {
    // une fois l'erreur : on desactive le loader
    this.emitterService.change(true);
    // Then we deleted the user from the service
    this.userService.delete(id).subscribe(
      () => {
        // Set the message value that says that user has been succesfully deleted
        this.updateData();
      },
      (error) => {
        console.log(error);
        // une fois l'erreur : on desactive le loader
        this.emitterService.change(false);
      }
    );
  }

  /**
   * It allows to set the value of the message variable
   * @param message
   */
  changeMessage(message: string) {
    this.messageSource.next(message);
  }
}
