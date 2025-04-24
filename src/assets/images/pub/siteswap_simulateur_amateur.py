import random
import time
import tkinter as tk

# Je stocke les séquences ici. J’ai failli faire un fichier json mais j’ai eu des bugs donc j’ai abandonné.
named_sequences = {}

# Affiche le menu principal – rien de fou ici
def afficher_menu():
    print("\n--- Simulateur de Jonglage avec Siteswap - Swanne ROUSTIT ---")
    print("1. Vérifier un siteswap")
    print("2. Générer un siteswap aléatoire")
    print("3. Sauvegarder une séquence personnalisée")
    print("4. Afficher les séquences enregistrées")
    print("5. Mode défi")
    print("6. Simuler graphiquement une séquence")
    print("7. Quitter")

# La boucle principale – j’ai mis tout ça ici, c’est pas super propre mais bon… ça marche.
def main():
    while True:
        afficher_menu()
        choix = input("Ton choix : ")

        if choix == "1":
            saisie = input("Entre ta séquence (ex: 3 3 3) : ")
            try:
                seq = list(map(int, saisie.strip().split()))
                if is_valid_siteswap(seq):
                    print("Cette séquence est VALIDE.")
                else:
                    print("Cette séquence est INVALIDE.")
            except ValueError:
                print("Entrée invalide. Utilise des espaces.")

        elif choix == "2":
            try:
                nb_balles = int(input("Nombre de balles ? "))
                longueur = int(input("Longueur du motif ? "))
                seq = generate_random_siteswap(nb_balles, longueur)
                if seq:
                    print("Séquence générée :", seq)
                else:
                    print("Impossible de générer une séquence valide.")
            except ValueError:
                print("Valeurs invalides.")

        elif choix == "3":
            saisie = input("Entre la séquence à sauvegarder : ")
            nom = input("Nom de ta séquence : ")
            try:
                seq = list(map(int, saisie.strip().split()))
                if is_valid_siteswap(seq):
                    save_sequence(nom, seq)
                else:
                    print("Séquence invalide. Pas enregistrée.")
            except ValueError:
                print("Entrée invalide.")

        elif choix == "4":
            if named_sequences:
                print("Séquences enregistrées :")
                for nom, seq in named_sequences.items():
                    print("-", nom, ":", seq)
            else:
                print("Aucune séquence enregistrée.")

        elif choix == "5":
            mode_defi()

        elif choix == "6":
            simulation_graphique()

        elif choix == "7":
            print("Fin du programme.")
            break

        else:
            print("Choix non reconnu. Essaie encore.")

# J’ai suivi la formule donnée par le prof. Pas 100% sûr de comprendre le %n mais ça marche
def is_valid_siteswap(sequence):
    n = len(sequence)
    if n == 0:
        return False
    if sum(sequence) % n != 0:
        return False
    landing_times = [(i + throw) % n for i, throw in enumerate(sequence)]
    return len(set(landing_times)) == n

# Je voulais faire un système plus intelligent ici mais j’ai fini par juste spammer des tirages aléatoires…
def generate_random_siteswap(num_balls=3, length=5, max_attempts=5000):
    for _ in range(max_attempts):
        seq = [random.randint(0, 2 * num_balls) for _ in range(length)]
        if sum(seq) == num_balls * length and is_valid_siteswap(seq):
            return seq
    return None

# Ça marche, mais rien n’est sauvegardé si on ferme. J’ai hésité à faire un json mais c’était trop galère.
def save_sequence(name, sequence):
    named_sequences[name] = sequence
    print("Séquence enregistrée :", name, ":", sequence)

# Franchement ce mode je l’aime bien. J’ai galéré à faire l’indice.
def mode_defi():
    score = 0
    niveau = input("Choisis un niveau (facile / moyen / difficile) : ").lower()

    if niveau == "facile":
        min_len, max_len, base_points = 3, 5, 10
    elif niveau == "moyen":
        min_len, max_len, base_points = 6, 8, 15
    elif niveau == "difficile":
        min_len, max_len, base_points = 9, 12, 20
    else:
        print("Niveau non reconnu.")
        return

    longueur = random.randint(min_len, max_len)
    sequence = generate_random_siteswap(num_balls=3, length=longueur)

    if not sequence:
        print("Impossible de générer une séquence valide à ce niveau.")
        print("Essaie un niveau plus simple ou réessaye plus tard.")
        return

    print("\nRegarde bien la séquence pendant quelques secondes :")
    print(sequence)
    time.sleep(4)
    print("\n" * 50)  # Je sais que c’est pas comme clear en terminal mais bon...

    essais = 0
    indice_donne = False

    while essais < 5:
        reponse = input(f"Essai {essais+1}/5 - Entre ta proposition (espaces entre les nombres) : ")
        try:
            user_seq = list(map(int, reponse.strip().split()))
        except ValueError:
            print("Entrée invalide.")
            continue

        if user_seq == sequence:
            points = base_points if not indice_donne else int(base_points / 2)
            print("Bonne réponse. Tu gagnes", points, "points.")
            score += points
            break
        else:
            essais += 1
            if essais == 3 and not indice_donne:
                choix = input("Souhaites-tu un indice ? (o/n) : ").lower()
                if choix == "o":
                    indice_donne = True
                    faux_indice = sequence.copy()
                    random.shuffle(faux_indice)
                    print("Indice : ", faux_indice)
    else:
        print("Réponse incorrecte. La bonne séquence était :", sequence)

    print("Score total :", score)

# J’ai cru que Tkinter serait facile. Spoiler : non.
def simulation_graphique():
    saisie = input("Entre une séquence à simuler (ex: 3 4 5) : ")
    try:
        sequence = list(map(int, saisie.strip().split()))
    except ValueError:
        print("Entrée invalide.")
        return

    if not is_valid_siteswap(sequence):
        print("Cette séquence n’est pas valide.")
        return

    window = tk.Tk()
    window.title("Simulation Siteswap")
    canvas = tk.Canvas(window, width=600, height=400, bg="white")
    canvas.pack()

    left_x = 150
    right_x = 450
    base_y = 300
    rayon = 15

    hand = "left"
    for value in sequence:
        x = left_x if hand == "left" else right_x
        y_max = base_y - (value * 20)
        ball = canvas.create_oval(x-rayon, base_y-rayon, x+rayon, base_y+rayon, fill="blue", outline="")

        steps = 30
        for t in range(steps):
            progress = t / steps
            y_offset = (1 - 4 * (progress - 0.5) ** 2) * (base_y - y_max)
            y = base_y - y_offset
            canvas.coords(ball, x - rayon, y - rayon, x + rayon, y + rayon)
            window.update()
            time.sleep(0.015)

        canvas.delete(ball)
        if value % 2 == 1:
            hand = "right" if hand == "left" else "left"

    window.mainloop()

# Bon bah voilà, c’est tout ici.
if __name__ == "__main__":
    main()