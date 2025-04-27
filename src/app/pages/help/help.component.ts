import { Component } from '@angular/core';
import { SessionService } from 'src/app/core/services/session.service';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent {
  panels = [
    {
      question: "Comment réserver une prestation sur IzyGlam ?",
      answer: "C'est très simple ! Choisis ton service préféré, découvre les professionnels disponibles près de chez toi, puis sélectionne une date et une heure. Un simple clic sur \"Réserver\" suffit. Tu recevras immédiatement une confirmation par email et dans ton espace personnel.",
    },
    {
      question: "Comment choisir le bon professionnel pour moi ?",
      answer: "Chaque professionnel sur IzyGlam dispose d’un profil détaillé avec ses prestations, ses tarifs, ses photos de réalisations et les avis clients. Prends quelques minutes pour consulter les profils, comparer et choisir celui qui te correspond le mieux !"
    },
    {
      question: "Comment modifier ou annuler mon rendez-vous ?",
      answer: "Nous acceptons les paiements par carte de crédit, PayPal et virement bancaire."
    },
    {
      question: "Comment puis-je suivre ma commande?",
      answer: "Rends-toi dans ton espace personnel, rubrique \"Mes réservations\", puis clique sur \"Modifier\" ou \"Annuler\" en respectant les conditions d'annulation indiquées. Si tu rencontres un souci, notre service client est là pour t'aider."
    },
    {
      question: "Quels moyens de paiement puis-je utiliser ?",
      answer: "Nous acceptons les paiements par carte bancaire (Visa, MasterCard, American Express) ainsi que certaines solutions de paiement mobile. Tout est sécurisé pour garantir ta tranquillité."
    },
    {
      question: "Comment suivre ma commande ou ma réservation ?",
      answer: "Après ta réservation, tu peux suivre son statut directement dans ton espace personnel : confirmation, rappel avant la prestation et historique de tes commandes. Nous t’envoyons aussi des notifications par email ou SMS."
    },
    {
      question: "Puis-je laisser un avis après ma prestation ?",
      answer: "Oui, et c’est même encouragé ! Après ta prestation, tu recevras une invitation pour laisser un avis. Ton retour aide toute la communauté IzyGlam à faire les meilleurs choix."
    },
    {
      question: "Comment utiliser mes offres fidélité et promotions ?",
      answer: "Tes avantages fidélité et codes promotionnels sont visibles dans ton espace personnel. Il te suffit de les sélectionner au moment du paiement pour qu'ils soient automatiquement appliqués à ta commande."
    },
    {
      question: "Que faire si j’ai un problème avec ma commande ?",
      answer: "Pas d'inquiétude : contacte-nous directement via la rubrique \"Contact\" ou en écrivant à notre support. Nous nous engageons à te répondre rapidement et à trouver une solution adaptée."
    },
    {
      question: "Comment contacter l’équipe IzyGlam ?",
      answer: "Tu peux nous contacter directement via le formulaire de contact disponible sur l'application ou le site." +
        "Par email : support@izyglam.com (exemple à adapter si besoin)." +
        "Nous sommes là pour toi du lundi au samedi, de 9h à 18h."
    },
    {
      question: "Comment fonctionne la politique d’annulation et de remboursement ?",
      answer: "Tu peux annuler ta réservation sans frais jusqu'à 24h avant l'heure prévue. Au-delà, des frais peuvent s'appliquer selon la politique du professionnel. En cas de souci majeur, contacte notre support pour étudier un éventuel remboursement."
    },
    {
      question: "Puis-je réserver pour quelqu’un d’autre (cadeau, surprise) ?",
      answer: "Non, pas pour le moment. Nous souhaitons que chaque compte représente une personne majeur."
    },
    {
      question: "Comment devenir professionnel partenaire sur IzyGlam ?",
      answer: "Tu es un professionnel de la beauté ou du bien-être et tu veux rejoindre notre communauté ? Rien de plus simple : rends-toi sur la page \"Devenir partenaire\", remplis le formulaire, et notre équipe te recontactera très vite !"
    },
    {
      question: "Comment protéger mes informations personnelles sur IzyGlam ?",
      answer: "La sécurité de tes données est notre priorité. Tes informations sont chiffrées et ne sont jamais partagées sans ton accord. Pour en savoir plus, tu peux consulter notre Politique de Confidentialité à tout moment."
    },
  ];
  constructor(public sessionService: SessionService) { }
}
