# 🎯 Forex Master Course - Trading App

Una **Progressive Web App (PWA)** completa per corsi di trading forex con sistema di pagamenti PayPal, prenotazioni video lezioni e pannello amministratore.

## 🚀 Funzionalità Principali

### 👥 **Per gli Utenti**
- ✅ **Sezione Apprendimento Gratuita** - Video lezioni e PowerPoint introduttivi
- ✅ **Corso Completo Premium** (€79.99) - Accesso a contenuti avanzati
- ✅ **Contenuti Extra** - PowerPoint strategie (€10.99), Video strategia (€14.99), PowerPoint nicchia (€17.99)
- ✅ **Prenotazioni Video Call** - Sessioni gratuite di 50 minuti
- ✅ **Pagamenti PayPal** - Sistema sicuro integrato
- ✅ **PWA Support** - Installabile come app nativa su mobile/desktop

### 🔧 **Per gli Amministratori**
- ✅ **Upload Contenuti** - Carica video, PowerPoint e documenti
- ✅ **Gestione Prenotazioni** - Visualizza e gestisci le richieste
- ✅ **Configurazione API** - Setup PayPal e Google Calendar
- ✅ **Dashboard Completo** - Statistiche e gestione utenti

## 🛠️ Stack Tecnologico

### Frontend
- **React 18** - Libreria UI moderna
- **Tailwind CSS** - Framework CSS utility-first
- **PayPal React SDK** - Integrazione pagamenti
- **Service Worker** - Funzionalità PWA

### Backend
- **FastAPI** - Framework Python ad alte prestazioni
- **MongoDB** - Database NoSQL
- **JWT Authentication** - Sistema di autenticazione sicuro
- **PayPal API** - Gestione pagamenti

## 📱 Installazione PWA

### Su Mobile (iOS/Android)
1. Apri l'app nel browser
2. Tocca il menu del browser (⋮ o ⚙️)
3. Seleziona "Aggiungi alla schermata Home"
4. L'app apparirà come icona nativa

### Su Desktop
1. Apri l'app in Chrome/Edge
2. Clicca sull'icona "Installa" nella barra degli indirizzi
3. Conferma l'installazione
4. L'app si aprirà come finestra dedicata

## 🚀 Setup e Installazione

### Prerequisiti
- Node.js 16+
- Python 3.8+
- MongoDB
- Yarn o npm

### 1. Clone del Repository
```bash
git clone <repository-url>
cd forex-course-app
```

### 2. Setup Backend
```bash
cd backend
pip install -r requirements.txt

# Configura le variabili d'ambiente
cp .env.example .env
# Modifica .env con le tue configurazioni
```

### 3. Setup Frontend
```bash
cd frontend
yarn install

# Configura le variabili d'ambiente
cp .env.example .env
# Modifica .env con le tue configurazioni
```

### 4. Avvia i Servizi
```bash
# Backend (porta 8001)
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (porta 3000)
cd frontend
yarn start
```

## ⚙️ Configurazione

### Variabili d'Ambiente Backend
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=forex_course_db
```

### Variabili d'Ambiente Frontend
```env
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id
```

### PayPal Setup
1. Vai su [PayPal Developer](https://developer.paypal.com/)
2. Crea una nuova app
3. Ottieni Client ID e Secret
4. Configura nel pannello admin dell'app

### Google Calendar Setup (Opzionale)
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Abilita Google Calendar API
3. Crea credenziali OAuth 2.0
4. Configura nel pannello admin

## 📂 Struttura del Progetto

```
forex-course-app/
├── backend/
│   ├── server.py              # API FastAPI principale
│   ├── requirements.txt       # Dipendenze Python
│   └── .env                   # Variabili d'ambiente
├── frontend/
│   ├── src/
│   │   ├── App.js            # Componente principale
│   │   ├── App.css           # Stili globali
│   │   └── components/       # Componenti React
│   ├── public/
│   │   ├── manifest.json     # Configurazione PWA
│   │   └── sw.js            # Service Worker
│   └── package.json         # Dipendenze Node.js
└── README.md                # Documentazione
```

## 🔐 Sicurezza

- ✅ **JWT Authentication** - Token sicuri per l'autenticazione
- ✅ **HTTPS Ready** - Supporto SSL/TLS
- ✅ **Input Validation** - Validazione lato server
- ✅ **CORS Configuration** - Controllo accessi cross-origin
- ✅ **Password Hashing** - Hash bcrypt per le password

## 💳 Sistema Pagamenti

### Pacchetti Disponibili
- **Corso Completo**: €79.99
- **PowerPoint Strategie**: €10.99
- **Video Strategia**: €14.99
- **PowerPoint Nicchia**: €17.99

### Flusso Pagamento
1. Utente seleziona corso
2. Login/Registrazione se necessario
3. PayPal Checkout
4. Conferma pagamento
5. Attivazione accesso premium

## 📅 Sistema Prenotazioni

### Funzionalità
- ✅ Prenotazione video call gratuite
- ✅ Durata sessioni: 50 minuti
- ✅ Orari configurabili dall'admin
- ✅ Gestione stato prenotazioni
- ✅ Note personalizzate

## 🎨 Personalizzazione

### Temi e Colori
Modifica le variabili CSS in `frontend/src/App.css`:
```css
:root {
  --primary-color: #2563eb;
  --secondary-color: #64748b;
  --success-color: #10b981;
  /* ... */
}
```

### Contenuti
- Modifica testi in `App.js`
- Sostituisci immagini in `public/`
- Aggiorna configurazione PWA in `manifest.json`

## 🔧 API Endpoints

### Autenticazione
- `POST /api/auth/register` - Registrazione utente
- `POST /api/auth/login` - Login utente
- `GET /api/auth/me` - Info utente corrente

### Corsi
- `GET /api/courses/free` - Contenuti gratuiti
- `GET /api/courses/premium` - Contenuti premium
- `GET /api/payment/packages` - Pacchetti disponibili

### Prenotazioni
- `POST /api/bookings/request` - Richiesta prenotazione
- `GET /api/bookings/my` - Mie prenotazioni

### Pagamenti
- `POST /api/paypal/create-order` - Crea ordine PayPal
- `POST /api/paypal/capture-order/{id}` - Cattura pagamento

### Admin
- `GET /api/admin/bookings` - Tutte le prenotazioni
- `POST /api/admin/config` - Configurazione
- `POST /api/admin/content/upload` - Upload contenuti

## 🚀 Deploy in Produzione

### Backend (Railway/Heroku)
1. Configura variabili d'ambiente
2. Deploy con Git push
3. Aggiorna CORS origins

### Frontend (Vercel/Netlify)
1. Build del progetto: `yarn build`
2. Deploy cartella `build/`
3. Configura redirects per SPA

### Database (MongoDB Atlas)
1. Crea cluster gratuito
2. Configura IP whitelist
3. Aggiorna connection string

## 📱 App Mobile Native (Futuro)

Per convertire in app nativa:
- **React Native** - Condividi logica con Expo
- **Ionic** - Wrapper Cordova/Capacitor
- **Flutter** - Ricostruzione completa

## 🤝 Contributi

1. Fork del repository
2. Crea branch feature: `git checkout -b feature/nuova-funzionalita`
3. Commit: `git commit -m 'Aggiunta nuova funzionalità'`
4. Push: `git push origin feature/nuova-funzionalita`
5. Apri Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi `LICENSE` per dettagli.

## 📞 Supporto

Per supporto tecnico o domande:
- 📧 Email: support@forexmaster.com
- 💬 Chat: Disponibile nell'app
- 📚 Docs: [docs.forexmaster.com](https://docs.forexmaster.com)

---

**Forex Master Course** - *La tua guida definitiva al trading forex professionale* 🎯📈