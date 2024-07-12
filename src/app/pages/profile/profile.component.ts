import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
    profileForm: FormGroup | undefined;
    imagePreview: string | undefined;
    user = {
        name: 'Francis Motsch',
        phone: '+33619742564',
        email: 'francis.motsch@gmail.com',
    };
    constructor(private formBuilder: FormBuilder) {}

    ngOnInit() {
        this.profileForm = this.formBuilder.group({
            profileImage: [''], // Placeholder for profile image
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.minLength(6)],
        });
    }
    onSubmit() {
        if (this.profileForm!.valid) {
            // Process form data (e.g., send to backend)
            console.log(this.profileForm!.value);
        } else {
            // Handle form validation errors
            console.log('Form is invalid');
        }
    }
    onFileChange(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.profileForm!.patchValue({
                profileImage: file,
            });
            this.previewImage(file); // Preview the selected image
        }
    }

    previewImage(file: File) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            this.imagePreview = reader.result as string;
        };
    }
}
