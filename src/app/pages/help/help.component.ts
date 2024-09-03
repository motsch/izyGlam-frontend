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
      question: "Comment puis-je créer un compte?",
      answer: "Pour créer un compte, cliquez sur le bouton 'S'inscrire' en haut à droite de la page d'accueil, puis suivez les instructions."
    },
    {
      question: "Comment réinitialiser mon mot de passe?",
      answer: "Cliquez sur 'Mot de passe oublié?' sur la page de connexion et suivez les instructions pour réinitialiser votre mot de passe."
    },
    {
      question: "Comment passer une commande?",
      answer: "Pour passer une commande, sélectionnez les produits que vous souhaitez acheter, ajoutez-les au panier, puis cliquez sur 'Passer la commande'."
    },
    {
      question: "Quels modes de paiement sont acceptés?",
      answer: "Nous acceptons les paiements par carte de crédit, PayPal et virement bancaire."
    },
    {
      question: "Comment puis-je suivre ma commande?",
      answer: "Vous pouvez suivre votre commande dans la section 'Mes commandes' de votre compte."
    },
    {
      question: "Comment annuler ma commande?",
      answer: "Pour annuler une commande, allez dans 'Mes commandes', sélectionnez la commande que vous souhaitez annuler et cliquez sur 'Annuler'."
    },
    {
      question: "Comment puis-je contacter le service client?",
      answer: "Vous pouvez contacter notre service client par e-mail, téléphone ou via le formulaire de contact sur notre site."
    },
    {
      question: "Quels sont les délais de livraison?",
      answer: "Les délais de livraison varient selon votre localisation et le mode de livraison choisi. Les détails sont disponibles lors du passage de votre commande."
    },
    {
      question: "Puis-je modifier mon adresse de livraison?",
      answer: "Oui, vous pouvez modifier votre adresse de livraison avant que la commande ne soit expédiée."
    },
    {
      question: "Comment puis-je retourner un produit?",
      answer: "Pour retourner un produit, rendez-vous dans la section 'Mes commandes', sélectionnez la commande concernée et suivez les instructions pour retourner le produit."
    }
  ];
  constructor(public sessionService: SessionService) {}
}
