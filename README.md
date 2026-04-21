# NPTEL Quiz (Netlify)

Quiz website built from `../NPTEL ANSWERS.md`.

## Modes

- Practice Mode: instant feedback when you select an option.
- Exam Mode: pick answers for all questions, then see full report only after submitting.

## Run Locally

```bash
npm install
npm run gen:questions
npm run dev
```

## Update Questions

Edit `../NPTEL ANSWERS.md` then regenerate:

```bash
npm run gen:questions
```

## Deploy To Netlify

- Build command: `npm run build`
- Publish directory: `dist`

SPA routing is configured via `netlify.toml`.
