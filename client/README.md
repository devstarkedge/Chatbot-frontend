# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

The chat widget sends requests to Django's RAG API. For local development, it defaults to
`http://localhost:8000/api/v1`. To use another backend, set `VITE_DJANGO_API_BASE_URL`
to the Django API base URL (for example, `https://api.example.com/api/v1`) in the client environment.
The Django server must allow the frontend's origin in `DJANGO_CORS_ALLOWED_ORIGINS`.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
