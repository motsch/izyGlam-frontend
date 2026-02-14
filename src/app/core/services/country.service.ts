import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

/** Modèle minimal côté front (aligne-toi sur ton backend) */
export interface ICountry {
  _id: string;
  name: string;
  translation: string;
  active: boolean;
  languages: string[];
  createdAt?: string;
  updatedAt?: string;
}

/** DTO de création */
export interface CreateCountryDto {
  name: string;
  translation: string;
  active?: boolean;
  languages?: string[];
}

/** DTO de mise à jour */
export interface UpdateCountryDto {
  _id: string;
  name?: string;
  translation?: string;
  active?: boolean;
  languages?: string[];
}

/** Réponse pour /country/name/:name/languages */
export interface CountryLanguagesResponse {
  countryId: string;
  name: string;
  languages: string[];
}

/** Réponse pour /country/name/:name/subscriptions */
export interface CountrySubscriptionsResponse {
  countryId: string;
  name: string;
  currency: string;
  proMonthlyCents: number;
  premiumMonthlyCents: number;
}

/** Réponse pour /country-me/subscriptions */
export interface MyCountrySubscriptionsResponse {
  userId: string;
  shopName: string;
  shopCountry: string;
  countryName: string;
  currency: string;
  proMonthlyCents: number;
  premiumMonthlyCents: number;
}

@Injectable({
  providedIn: 'root',
})
export class CountryService {
  constructor(private http: HttpClient) {}

  /**
   * Récupérer tous les pays (avec filtres optionnels)
   * @param opts.active true/false pour filtrer les pays actifs/inactifs
   * @param opts.q recherche texte (name, translation, languages)
   */
  getAll(opts?: { active?: boolean; q?: string }): Observable<ICountry[]> {
    let params = new HttpParams();

    if (typeof opts?.active === 'boolean') {
      params = params.set('active', String(opts.active));
    }
    if (opts?.q) {
      params = params.set('q', opts.q.trim());
    }

    return this.http.get<ICountry[]>(`${environment.apiUrl}country`, { params });
  }

  /**
   * Récupérer un pays par son ID
   * @param id (ID du pays)
   */
  getById(id: string): Observable<ICountry> {
    return this.http.get<ICountry>(`${environment.apiUrl}country/${id}`);
  }

  /**
   * Créer un nouveau pays
   * @param payload (données du pays à créer)
   */
  create(payload: CreateCountryDto): Observable<ICountry> {
    return this.http.post<ICountry>(`${environment.apiUrl}country`, payload);
  }

  /**
   * Mettre à jour un pays par son ID
   * @param payload (données à mettre à jour — doit contenir _id)
   */
  update(payload: UpdateCountryDto): Observable<ICountry> {
    return this.http.put<ICountry>(`${environment.apiUrl}country/${payload._id}`, payload);
  }

  /**
   * Supprimer un pays par son ID
   * @param id (ID du pays à supprimer)
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}country/${id}`);
  }

  /**
   * Activer/Désactiver rapidement un pays
   * @param id (ID du pays)
   * @param active (true pour activer, false pour désactiver)
   */
  setActive(id: string, active: boolean): Observable<ICountry> {
    return this.http.patch<ICountry>(`${environment.apiUrl}country/${id}/active`, { active });
  }

  /**
   * Récupérer les langues d'un pays par son nom (insensible à la casse)
   * @param name (nom ou traduction du pays, ex: "France" ou "Germany")
   */
  getLanguagesByName(name: string): Observable<CountryLanguagesResponse> {
    const safe = encodeURIComponent(name.trim());
    return this.http.get<CountryLanguagesResponse>(
      `${environment.apiUrl}country/name/${safe}/languages`
    );
  }

  /**
   * Récupérer uniquement les abonnements d'un pays par son nom (insensible à la casse)
   * @param name (nom ou traduction du pays, ex: "France" ou "Germany")
   */
  getSubscriptionsByName(name: string): Observable<CountrySubscriptionsResponse> {
    const safe = encodeURIComponent(name.trim());
    return this.http.get<CountrySubscriptionsResponse>(
      `${environment.apiUrl}country/name/${safe}/subscriptions`
    );
  }

  /**
   * ✅ Récupérer les abonnements du pays du shop du user connecté
   * Route backend : GET /country-me/subscriptions
   */
  getMySubscriptions(): Observable<MyCountrySubscriptionsResponse> {
    return this.http.get<MyCountrySubscriptionsResponse>(
      `${environment.apiUrl}country-me/subscriptions`
    );
  }

  /**
   * Petite utilité si tu veux un bouton toggle dans l’UI
   */
  toggleActive(country: ICountry): Observable<ICountry> {
    return this.setActive(country._id, !country.active);
  }
}
