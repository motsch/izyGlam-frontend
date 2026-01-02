import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { UserService } from 'src/app/core/services/user.service';

@Component({
    selector: 'app-message',
    templateUrl: './message.component.html',
    styleUrls: ['./message.component.scss'],
})
export class MessageComponent implements OnInit {
    me: any = {};
    constructor(
        private userService: UserService,
    ) { }
    ngOnInit(): void {

        this.userService.getMe().subscribe({
            next: (user: any) => {
                this.me = user;
            },
            error: (err: any) => {
                console.error('[loadConversations] Erreur HTTP :', err);
            }
        })
    }
}
