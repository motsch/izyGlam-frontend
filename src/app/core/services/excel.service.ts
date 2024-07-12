import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
    providedIn: 'root',
})
export class ExcelService {
    constructor() {}

    // Méthode pour lire et convertir le fichier Excel en JSON
    async readArticleExcelFile(file: File): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e: any) => {
                const workbook = XLSX.read(e.target.result, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                });

                // Map des en-têtes d'origine aux en-têtes modifiés
                const headerMap: { [key: string]: string } = {
                    'Product ID': 'prodID',
                    'Product Description': 'prodDescrip',
                    'Description du frein': 'descripFrein',
                    'Inter/Exter': 'interExter',
                    'Couleur client': 'couleur',
                    "Type d'emballage ": 'typeEmb',
                    'Allée de supermarché': 'alleeSuper',
                    'Packaging size': 'packSize',
                    'Ligne de production': 'ligneProd',
                    Client: 'client',
                    Type: 'type',
                    'Réf poste suivant': 'refNextPost',
                    'Total Kanbans': 'totalKanban',
                    'Lanceur - Nb de K': 'ndLanceur',
                };

                // Remplacez les en-têtes d'origine par les en-têtes modifiés
                const modifiedHeaders = jsonData[0].map(
                    (key: string) => headerMap[key] || key
                );

                // Supprimer la première ligne (les en-têtes) du tableau de données
                jsonData.shift();

                // Créer un tableau d'objets JSON en utilisant les en-têtes modifiés
                const jsonArray = jsonData.map((row: any) => {
                    const obj: any = {};
                    modifiedHeaders.forEach((header: string, index: number) => {
                        obj[header] = row[index];
                    });
                    return obj;
                });

                resolve(jsonArray);
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsArrayBuffer(file);
        });
    }

    // Méthode pour lire et convertir le fichier Excel en JSON
    async readMappingExcelFile(file: File): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e: any) => {
                const workbook = XLSX.read(e.target.result, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                });

                // Map des en-têtes d'origine aux en-têtes modifiés
                const headerMap: { [key: string]: string } = {
                    Nom: 'name',
                    Emplacement: 'location',
                    ID: 'id',
                };

                // Remplacez les en-têtes d'origine par les en-têtes modifiés
                const modifiedHeaders = jsonData[0].map(
                    (key: string) => headerMap[key] || key
                );

                // Supprimer la première ligne (les en-têtes) du tableau de données
                jsonData.shift();

                // Créer un tableau d'objets JSON en utilisant les en-têtes modifiés
                const jsonArray = jsonData.map((row: any) => {
                    const obj: any = {};
                    modifiedHeaders.forEach((header: string, index: number) => {
                        obj[header] = row[index];
                    });
                    return obj;
                });

                resolve(jsonArray);
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsArrayBuffer(file);
        });
    }
    exportToXLSX(data: any[], filename: string) {
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
      const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
      this.saveAsExcelFile(excelBuffer, filename);
    }

    exportToXLSXArticle(data: any[], filename: string) {
      // Crée les en-têtes des colonnes sans inclure "rule"
      const flattenedData = [
        [
          '_id', 'Product ID', 'Product Description', 'Description du frein', 'Inter/Exter', 'Couleur client',
          'Type d\'emballage ', 'Packaging size', 'Allée de supermarché', 'Ligne de production', 'Client', 'Type', 'Total Kanbans', 'Lanceur - Nb de K', '__v'
        ]
      ];
    
      data.forEach(item => {
        const row: any[] = [];
        Object.keys(item).forEach(key => {
          const value = item[key];
          if (key === 'rule') {
            // Si la clé est "rule", extrayez les valeurs de "totalKanban" et "nbLanceur" s'ils existent
            const ruleData = item.rule[0] || {};
            const totalKanban = ruleData.totalKanban || "";
            const ndLanceur = ruleData.ndLanceur || "";
            row.push(totalKanban);
            row.push(ndLanceur);
          } else if (key !== '__v') {
            // Si la clé n'est pas "rule" ni "__v", traitez la valeur normalement
            if (key !== 'allee' && Array.isArray(value) && value.length > 0 && value[0].hasOwnProperty('name')) {
              // Si c'est un tableau avec un élément à l'index 0 qui a la propriété "name", extrayez la valeur de "name"
              row.push(value[0].name);
            } else if(key == 'allee') {
              // Si c'est un tableau avec un élément à l'index 0 qui a la propriété "name", extrayez la valeur de "name"
              let data = '';
              for(let i = 0; i < value.length; i++) {
                if(i < 1) {
                  data = data + value[i].name;
                }
                else {
                  data = data + '-' +value[i].name;
                }
              }
              row.push(data);
            } else if (typeof value === 'object' && !Array.isArray(value)) {
              // Si c'est un objet (et non un tableau), convertissez-le en une chaîne JSON
              row.push(JSON.stringify(value));
            } else if (value !== null && value !== undefined) {
              // Si la valeur n'est ni null ni undefined, convertissez la valeur en chaîne
              row.push(value.toString());
            } else {
              // Sinon, ajoutez une chaîne vide pour la colonne
              row.push("");
            }
          }
        });
    
        // Ajoutez la colonne __v
        row.push(item.__v);
    
        flattenedData.push(row);
      });
    
      const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(flattenedData);
      const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
      this.saveAsExcelFile(excelBuffer, filename);
    }
    
    
    
    
    

    private saveAsExcelFile(buffer: any, fileName: string): void {
        const data: Blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url: string = window.URL.createObjectURL(data);
        const link: HTMLAnchorElement = document.createElement('a');

        link.href = url;
        link.download = fileName + '.xlsx';
        link.click();

        window.URL.revokeObjectURL(url);
    }
}
