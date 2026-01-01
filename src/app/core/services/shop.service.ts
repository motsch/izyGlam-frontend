// shop.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private shopDataSubject = new BehaviorSubject<any>(null);
  constructor(private http: HttpClient) { }

  private getLang(): string {
    // "fr-FR" -> "fr", fallback "en"
    const raw = localStorage.getItem('langue') || navigator.language || 'en';
    return raw.slice(0, 2).toLowerCase();
  }

  /**
   * Traitement IA de l'image principale d'un shop
   * à partir de l'image déjà stockée côté serveur.
   * @param shopId ID du shop
   */
  processShopImage(shopId: string): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}shop-image/process`,
      { shopId }
    );
  }

  getShopsCount() {
    return this.http.get<number>(environment.apiUrl + 'shops-count-all');
  }

  // Appel à l'API pour récupérer les données du shop
  loadShopData(id: string): void {
    this.http.get(`/api/shop/${id}`).subscribe(
      (data: any) => {
        this.shopDataSubject.next(data);
      },
      (error) => {
        console.error(
          'Erreur lors du chargement des données du shop:',
          error
        );
      }
    );
  }

  // Retourne un observable pour que le parent ou l'enfant puisse s'abonner aux données du shop
  getShopData(): Observable<any> {
    return this.shopDataSubject.asObservable();
  }

  /**
   * Récupérer toutes les shops
   */
  getAll() {
    return this.http.get<any[]>(`${environment.apiUrl}shop`);
  }

  /**
   * Récupérer toutes les shops
   */
  getAllAdmin() {
    return this.http.get<any[]>(`${environment.apiUrl}shop-admin`);
  }

  /**
   * Récupérer un shops par son ID
   * @param id (ID du shop)
   */
  getById(id: string) {
    return this.http.get<any>(`${environment.apiUrl}shop/${id}`);
  }

  /**
   * Créer un nouveau shop
   * @param shop (données du shop à créer)
   */
  create(shop: any) {
    return this.http.post<any>(environment.apiUrl + 'shop', shop);
  }

  /**
   * Mettre à jour un shop par son ID
   * @param shop (données du shop à mettre à jour)
   */
  update(shop: any) {
    return this.http.put<any>(
      `${environment.apiUrl}shop/${shop._id}`,
      shop
    );
  }

  /**
   * Supprimer un shop par son ID
   * @param id (ID du shop à supprimer)
   */
  delete(id: number) {
    return this.http.delete<any>(`${environment.apiUrl}shop/${id}`);
  }

  /**
   * Récupérer les boutiques associées à un utilisateur par userId
   * @param userId (ID de l'utilisateur)
   */
  getShopsByUserId(userId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}shops/user/${userId}`
    );
  }

  /**
   * Uploader des images pour la galerie d'un shop
   * @param shopId (ID du shop)
   * @param files (images à uploader)
   */
  uploadGalleryImages(shopId: string, files: File[]): Observable<any> {
    const formData: FormData = new FormData();

    files.forEach((file) => formData.append('gallery', file)); // Ajouter chaque fichier sélectionné

    return this.http.post<any>(
      `${environment.apiUrl}shop-gallery/${shopId}/gallery/upload`,
      formData
    );
  }

  /**
   * Récupérer les images de la galerie d'un shop
   * @param shopId (ID du shop)
   */
  getGalleryImages(shopId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}shop-gallery/${shopId}/gallery`
    );
  }

  getShopsByPostalCodes(codes: string[], country?: string): Observable<any[]> {
    let params = new HttpParams().set('codes', codes.join(','));
    if (country) {
      params = params.set('country', country);
    }
    const url = `${environment.apiUrl}shop/delivery`;
    return this.http.get<any[]>(url, { params });
  }

  getShopsByPostalCodesAll(codes: string[]): Observable<any[]> {
    // On transforme le tableau ["75001","75002"] en "75001,75002"
    const codesParam = codes.join(',');
    // On construit l’URL
    const url = `${environment.apiUrl}shop/deliveryAll?codes=${codesParam}`;
    return this.http.get<any[]>(url);
  }

  getShopsNearby(
    clientLatitude: number,
    clientLongitude: number
  ): Observable<any[]> {
    return this.http
      .get<any[]>(`${environment.apiUrl}shop`)
      .pipe(
        map((shops) =>
          shops.filter(
            (shop) =>
              this.calculateDistance(
                clientLatitude,
                clientLongitude,
                shop.location.latitude,
                shop.location.longitude
              ) <= shop.maxDistance
          )
        )
      );
  }

  // Récupérer les shops par leurs IDs
  getShopsByIds(shopIds: string[]): Observable<any[]> {
    return this.http.post<any[]>(`${environment.apiUrl}shops-by-ids`, {
      shopIds,
    });
  }

  addReview(shopId: string, review: any): Observable<any> {
    return this.http.patch<any>(
      `${environment.apiUrl}shop-add-review/${shopId}`,
      review
    );
  }

  /**
   * Recherche les shops et leurs services associés en fonction du code postal et d'une recherche texte
   * @param postalCode (ex: '75001')
   * @param query (ex: 'massage' ou 'coiffure')
   */
  searchShopsWithServices(postalCode: string, query: string): Observable<any[]> {
    const url = `${environment.apiUrl}shops-search?postalCode=${encodeURIComponent(postalCode)}&query=${encodeURIComponent(query)}`;
    return this.http.get<any[]>(url);
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in kilometers
    // Convert degrees to radians
    const radLat1 = (lat1 * Math.PI) / 180;
    const radLat2 = (lat2 * Math.PI) / 180;
    const deltaLat = radLat2 - radLat1;
    const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

    // Haversine formula
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(radLat1) *
      Math.cos(radLat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Génère une description professionnelle pour le produit
   * @param type Le type de salon (ex : 'coiffure', 'massage', etc.)
   * @param description Une description éventuelle saisie par l'utilisateur
   */
  generateIzyGlamProductDescription(product?: any) {
    const params = new HttpParams().set('lang', this.getLang());
    return this.http.post<{ data: any }>(
      `${environment.apiUrl}product-description`,
      { product },
      { params } // <-- IMPORTANT
    );
  }

  /**
   * Génère une description professionnelle à partir du type de salon et d'une description utilisateur (facultative)
   * @param type Le type de salon (ex : 'coiffure', 'massage', etc.)
   * @param description Une description éventuelle saisie par l'utilisateur
   */
  generateIzyGlamShopDescription(type: string, description?: string): Observable<string> {
    const params = new HttpParams().set('lang', this.getLang());
    return this.http.post<{ formattedDescription: string }>(
      `${environment.apiUrl}shop-description`,
      { type, description },
      { params } // <-- IMPORTANT
    ).pipe(map(response => response.formattedDescription));
  }

  /**
   * Génère une illustration professionnelle à partir du nom de la prestation et une description utilisateur (facultative)
   * @param type Le type de salon (ex : 'coiffure', 'massage', etc.)
   * @param userDescription Une description éventuelle saisie par l'utilisateur
   */
  generateIzyGlamImage(product?: any) {
    return this.http.post<{ formattedDescription: string }>(
      `${environment.apiUrl}prestation-image`,
      { product }
    );
  }

  getShopsByBoss(): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}shops-by-boss`
    );
  }

  updateVerificationDocs(shopId: string, docs: any) {
    const formData = new FormData();

    if (docs.identityDoc) formData.append('identityDoc', docs.identityDoc);
    if (docs.insuranceDoc) formData.append('insuranceDoc', docs.insuranceDoc);
    if (docs.kbisDoc) formData.append('kbisDoc', docs.kbisDoc);

    return this.http.post(`${environment.apiUrl}shop/${shopId}/verification-docs`, formData);
  }


  // ---------------------------------------------------
  // STEP 2 : Vérification & upload de documents (pro)
  // ---------------------------------------------------

  /**
   * Upload des documents de vérification pour un shop
   * @param shopId ID du shop
   * @param files { identityDoc, insuranceDoc, kbisDoc }
   */
  uploadVerificationDocs(
    shopId: string,
    files: {
      identityDoc?: File | null;
      insuranceDoc?: File | null;
      kbisDoc?: File | null;
    }
  ): Observable<any> {
    const formData = new FormData();

    if (files.identityDoc) {
      formData.append('identityDoc', files.identityDoc);
    }
    if (files.insuranceDoc) {
      formData.append('insuranceDoc', files.insuranceDoc);
    }
    if (files.kbisDoc) {
      formData.append('kbisDoc', files.kbisDoc);
    }

    return this.http.post<any>(
      `${environment.apiUrl}shop/${shopId}/verification-docs`,
      formData
    );
  }

  /**
   * Récupérer le statut de vérification d'un shop
   * @param shopId ID du shop
   */
  getShopVerificationStatus(shopId: string): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}shop/${shopId}/verification`
    );
  }

  validateDocument(shopId: string, docType: string, status: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}shop/validate-document`, {
      shopId,
      docType,
      status,
    });
  }

  /**
   * 🚫 Blocage shop (admin) + remboursements bookings pending/accepted
   */
  blockShop(shopId: string, reason: string) {
    return this.http.post<any>(`${environment.apiUrl}shop/${shopId}/block`, { reason });
  }

}
