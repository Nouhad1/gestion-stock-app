const ngrok = require('ngrok');
const { spawn } = require ('child_process');
const { resolve } = require('path');

(async ()=>{

      // Démarre nodemon pour surveiller et redémarrer le serveur automatiquement
    const nodemonProcess = spawn('nodemon', ['config/server.js'], { stdio: 'inherit', shell: true });

    // Attend que le serveur démarre (ajuste le délai si besoin)
    await new Promise(resolve=>setTimeout(resolve,3000));

    try{

        // Lance ngrok sur le port 3000, URL publique dynamique (sans domaine fixe)
        const url=await ngrok.connect(3000);
        console.log(`🚀 Serveur accessible sur : ${url}`);
    }catch(error){
        console.log('Erreur ngrok:',error);
    }
})();