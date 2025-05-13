# invoiaiqpro

A modern invoicing and analytics platform for small businesses with invoice generation, client management, and financial insights.

## Project Structure
- `/client` — React frontend (Vite, TailwindCSS)
- `/server` — Express backend (Node.js, TypeScript)
- `/shared` — Shared types and schema

## Getting Started

### 1. Clone the repository
```sh
git clone https://github.com/Brandon255-rgb/invoiaiqpro.git
cd invoiaiqpro
```

### 2. Install dependencies
```sh
npm install
cd client && npm install
cd ../server && npm install
```

### 3. Set up environment variables
Copy `.env.example` to `.env` and fill in your values:
```sh
cp .env.example .env
```

### 4. Run the app
- **Backend:**
  ```sh
  npm run dev
  ```
- **Frontend:**
  ```sh
  cd client
  npm run dev
  ```

## Environment Variables
See `.env.example` for all required keys:
- `DATABASE_URL` — Postgres connection string
- `STRIPE_SECRET_KEY` — Stripe secret key (optional)
- `MAILTRAP_API_KEY` — Mailtrap API key (for email delivery)
- `EMAIL_FROM` — Default sender email
- `VITE_API_URL` — API URL for frontend (default: `http://localhost:5000`)

## Security
- Never commit your real `.env` file or secrets.
- Use HTTPS in production.

## Contributing
Pull requests are welcome! Please open an issue first to discuss major changes.

---

**MIT License** 