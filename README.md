# Daylog

A personal gym logging app. Log whatever you did each day — push-ups, pull-ups, cardio — and browse your history, trends, and streaks.

## Development

Requires Node.js 20+.

```sh
cd gym-log
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint
- `npm run format` — format with Prettier

## Stack

- TanStack Start & Router
- React 19
- TypeScript
- Tailwind CSS
- Local storage for journal data

## Production (GCP)

Deploy to Cloud Run in project `kaana-prod`:

```sh
gcloud builds submit \
  --project kaana-prod \
  --config gcp/cloudbuild.yaml \
  --service-account=projects/kaana-prod/serviceAccounts/kaana-cloudbuild-deployer@kaana-prod.iam.gserviceaccount.com \
  .
```

After the first deploy, wire the load balancer (once):

```sh
bash gcp/scripts/setup-backend.sh
```

Live URL: **https://gym-log.kaana.in**
