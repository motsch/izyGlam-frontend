import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'markdown'
})
export class AiMarkdownPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return '';

    // Remplacer **texte** par <strong>texte</strong> pour le gras
    let formattedText = value.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Remplacer _texte_ par <em>texte</em> pour l'italique
    formattedText = formattedText.replace(/_(.*?)_/g, '<em>$1</em>');

    // Remplacer les listes numérotées "1. " par <ol><li>...</li></ol>
    formattedText = formattedText.replace(/(\d+)\.\s/g, '<li>');

    // Remplacer les retours à la ligne (\n) par des <br>
    formattedText = formattedText.replace(/\n/g, '<br>');

    // Ajouter un <ol> et </ol> autour des listes numérotées
    formattedText = formattedText.replace(/<li>/g, '<ol><li>');
    formattedText = formattedText.replace(/(<\/li>)/g, '$1</ol>');

    return formattedText;
  }
}
