import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-avatar',
    templateUrl: './avatar.component.html',
    styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
    aPIimgStorageUrl = environment.APIimgStorageUrl.replace(/\/$/, '');
    backgroundImages =
        this.aPIimgStorageUrl + 'uploads/images/creation/15/24.png';
    imageNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

    getBackgroundStyle() {
        return {
            'background-image': `url(${this.backgroundImages})`,
        };
    }
}
