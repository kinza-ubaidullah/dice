
export const translations = {
  English: {
    // Auth
    'Welcome Back': 'Welcome Back',
    'Login': 'LOGIN',
    'Phone Number': 'Phone Number',
    'Password': 'Password',
    'Create Account': 'Create Account',
    'Register': 'REGISTER',
    'First Name': 'First Name',
    'Last Name': 'Last Name',
    'Confirm Password': 'Confirm Password',
    'Verify Phone': 'Verify Phone',
    'Enter Code': 'Enter Code',
    'Verify & Login': 'Verify & Login',
    'Code sent to': 'Code sent to',
    'Resend': 'Resend',

    // Menu
    'Lobby': 'Lobby',
    'Games': 'Games',
    'Wallet': 'Wallet',
    'Profile': 'Profile',
    'Logout': 'Logout',
    
    // Game
    'Simple': 'Simple',
    'VIP': 'VIP',
    'Bet': 'Bet',
    'Payout': 'Payout',
    'Select Number': 'Select a Number',
    'Select Amount': 'Select Bet Amount',
    'Rolling': 'Rolling...',
    'You Win': 'YOU WIN!',
    'You Lose': 'YOU LOSE',
    'House Wins': 'HOUSE WINS',
    'Multiplier': '5x Payout',
    'Start Game': 'START GAME',
    'Insufficient Funds': 'Insufficient Funds',
    'Number 1 Rule': 'Number 1 is reserved for the House.',
    'Choose Bet': 'Choose your bet for Number',
    'Cancel': 'Cancel',

    // Wallet
    'Deposit': 'Deposit',
    'Withdraw': 'Withdraw',
    'Balance': 'Balance',

    // Profile
    'Account Settings': 'Account Settings',
    'General': 'General',
    'Legal': 'Legal',
    'Edit Profile': 'Edit Profile',
    'Change Password': 'Change Password',
    'Sound Settings': 'Sound Settings',
    'Language': 'Language',
    'Help & FAQ': 'Help & FAQ',
  },
  'Français': {
    // Auth
    'Welcome Back': 'Bon retour',
    'Login': 'CONNEXION',
    'Phone Number': 'Numéro de Téléphone',
    'Password': 'Mot de passe',
    'Create Account': 'Créer un compte',
    'Register': "S'INSCRIRE",
    'First Name': 'Prénom',
    'Last Name': 'Nom',
    'Confirm Password': 'Confirmer le mot de passe',
    'Verify Phone': 'Vérifier le téléphone',
    'Enter Code': 'Entrer le code',
    'Verify & Login': 'Vérifier & Connexion',
    'Code sent to': 'Code envoyé au',
    'Resend': 'Renvoyer',

    // Menu
    'Lobby': 'Accueil',
    'Games': 'Jeux',
    'Wallet': 'Portefeuille',
    'Profile': 'Profil',
    'Logout': 'Déconnexion',

    // Game
    'Simple': 'Simple',
    'VIP': 'VIP',
    'Bet': 'Mise',
    'Payout': 'Gain',
    'Select Number': 'Choisissez un numéro',
    'Select Amount': 'Choisissez le montant',
    'Rolling': 'Lancement...',
    'You Win': 'VOUS GAGNEZ !',
    'You Lose': 'VOUS PERDEZ',
    'House Wins': 'LA MAISON GAGNE',
    'Multiplier': 'Gain 5x',
    'Start Game': 'LANCER LE JEU',
    'Insufficient Funds': 'Fonds Insuffisants',
    'Number 1 Rule': 'Le numéro 1 est réservé à l\'administrateur.',
    'Choose Bet': 'Mise pour le numéro',
    'Cancel': 'Annuler',

    // Wallet
    'Deposit': 'Dépôt',
    'Withdraw': 'Retrait',
    'Balance': 'Solde',

    // Profile
    'Account Settings': 'Paramètres du compte',
    'General': 'Général',
    'Legal': 'Légal',
    'Edit Profile': 'Modifier le Profil',
    'Change Password': 'Changer le mot de passe',
    'Sound Settings': 'Paramètres Audio',
    'Language': 'Langue',
    'Help & FAQ': 'Aide & FAQ',
  }
};

export const translate = (key: string, lang: string): string => {
  const dict = translations[lang as keyof typeof translations] || translations['English'];
  return dict[key as keyof typeof dict] || key;
};
