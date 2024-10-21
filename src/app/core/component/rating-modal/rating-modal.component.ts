import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';

@Component({
    selector: 'app-rating-modal',
    templateUrl: './rating-modal.component.html',
    styleUrl: './rating-modal.component.scss',
})
export class RatingModalComponent {
    shopId: string | null = null;
    rating: number = 5;
    comment: string = '';
    stars = [5, 4, 3, 2, 1];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<RatingModalComponent>,
        private userService: UserService,
        private shopService: ShopService
    ) {
        console.log('Order ID received in modal:', data.shopId);
        this.shopId = data.shopId;
    }

    closeDialog() {
        this.dialogRef.close();
    }

    submitReview() {
        this.userService.getMe().subscribe({
            next: (data: any) => {
                console.log(data);
                const review = {
                    user: data._id,
                    rating: this.rating,
                    comment: this.comment,
                };
                if (this.shopId) {
                    this.shopService.addReview(this.shopId, review).subscribe({
                        next: (data: any) => {
                            console.log(data);
                            this.dialogRef.close(review);
                        },
                        error: (error: any) => {
                            console.log(error);
                        },
                    });
                } else {
                    console.error('shopId is null or undefined');
                    // Optionally show an error message to the user here
                }
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }
}
