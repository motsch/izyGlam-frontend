import { Component, Input, OnInit } from '@angular/core';
import { ShopService } from '../../services/shop.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-shop-documents',
  templateUrl: './shop-documents.component.html',
  styleUrls: ['./shop-documents.component.scss'],
})
export class ShopDocumentsComponent implements OnInit {

  @Input() myShopData: any = {};
  @Input() me: any = {};

  // Fichiers sélectionnés
  identityFile: File | null = null;
  insuranceFile: File | null = null;
  kbisFile: File | null = null;

  identityFileName: string | null = null;
  insuranceFileName: string | null = null;
  kbisFileName: string | null = null;

  isLoading = false;
  verification: any = null;

  // 👉 base URL pour les fichiers (même logique que tes images)
  fileBaseUrl = environment.APIimgStorageUrl.replace(/\/$/, '') + '/';

  // 👉 état de la popup de preview
  previewOpen = false;
  previewUrl: string | null = null;
  previewType: 'image' | 'pdf' | 'other' = 'image';

  constructor(
    private shopService: ShopService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadVerification();
  }

  loadVerification() {
    if (!this.myShopData || !this.myShopData._id) return;

    this.shopService.getShopVerificationStatus(this.myShopData._id).subscribe({
      next: (verification: any) => {
        this.verification = verification;
      },
      error: () => {
        this.toastr.error(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // Quand un fichier est choisi
  onFileSelected(event: Event, type: 'identity' | 'insurance' | 'kbis') {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    if (type === 'identity') {
      this.identityFile = file;
      this.identityFileName = file.name;
    }
    if (type === 'insurance') {
      this.insuranceFile = file;
      this.insuranceFileName = file.name;
    }
    if (type === 'kbis') {
      this.kbisFile = file;
      this.kbisFileName = file.name;
    }
  }

  // Envoi au serveur
  uploadDocuments() {
    if (!this.myShopData?._id) return;

    this.isLoading = true;

    this.shopService.updateVerificationDocs(this.myShopData._id, {
      identityDoc: this.identityFile,
      insuranceDoc: this.insuranceFile,
      kbisDoc: this.kbisFile,
    }).subscribe({
      next: (resp: any) => {
        this.isLoading = false;
        this.verification = resp?.verification;
        this.toastr.success(this.translate.instant('CREATION_SHOP.VERIF_TOAST_SUCCESS'));
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  getStatusClass(status?: string): string {
    if (!status) return 'status-missing';
    return `status-${status}`;
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'pending': return 'Attente de validation';
      case 'approved': return 'Validé';
      case 'rejected': return 'Refusé';
      case 'missing':
      default: return 'Non fourni';
    }
  }

  // -----------------------------------
  // 🔗 Helpers pour l’URL + preview
  // -----------------------------------
  private buildFileUrl(relativePath: string): string {
    const base = this.fileBaseUrl.replace(/\/$/, '');
    const clean = relativePath.replace(/^\/+/, '');
    return `${base}/${clean}`;
  }

  openPreview(relativePath?: string | null) {
    if (!relativePath) return;

    const fullUrl = this.buildFileUrl(relativePath);
    this.previewUrl = fullUrl;

    const lower = fullUrl.toLowerCase();
    if (lower.endsWith('.pdf')) {
      this.previewType = 'pdf';
    } else if (
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.gif') ||
      lower.endsWith('.webp')
    ) {
      this.previewType = 'image';
    } else {
      this.previewType = 'other';
    }

    this.previewOpen = true;
  }

  closePreview() {
    this.previewOpen = false;
    this.previewUrl = null;
  }
}
