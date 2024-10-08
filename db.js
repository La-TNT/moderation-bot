const mongoose = require('mongoose');
require('dotenv').config();  // Charge les variables d'environnement du fichier .env

const mongoURI = process.env.MONGO_URI; // Utilise la variable d'environnement

// Connexion à MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
}).then(() => {
    console.log('Connexion à MongoDB réussie');
}).catch((err) => {
    console.error('Erreur de connexion à MongoDB:', err);
});
