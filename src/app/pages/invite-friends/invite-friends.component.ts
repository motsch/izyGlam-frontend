import { Component } from '@angular/core';

@Component({
    selector: 'app-invite-friends',
    templateUrl: './invite-friends.component.html',
    styleUrls: ['./invite-friends.component.scss'],
})
export class InviteFriendsComponent {
    email: string = '';
    friendsList: string[] = [];
    successMessage: string | null = null;
    errorMessage: string | null = null;

    addFriend() {
        if (this.email && this.isValidEmail(this.email)) {
            this.friendsList.push(this.email);
            this.email = ''; // Réinitialiser l'email
            this.successMessage = 'Ami ajouté à la liste !';
            this.errorMessage = null;
        } else {
            this.errorMessage = 'Veuillez entrer une adresse email valide.';
            this.successMessage = null;
        }
    }

    sendInvitations() {
        if (this.friendsList.length > 0) {
            // Envoyer les invitations (cette partie est à implémenter)
            console.log('Invitations envoyées à :', this.friendsList);
            this.successMessage = 'Invitations envoyées avec succès !';
            this.errorMessage = null;
            this.friendsList = []; // Réinitialiser la liste des amis après envoi
        } else {
            this.errorMessage = 'Veuillez ajouter au moins un ami à inviter.';
            this.successMessage = null;
        }
    }

    isValidEmail(email: string): boolean {
        // Vérifier si l'email est valide (expression régulière simple)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
