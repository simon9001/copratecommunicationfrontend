# Universal Backend Link Configuration

This folder is the single source of truth for the backend URL. You do **not** need to put the link in `.env` or restart dev servers for link changes.

## How to Change the Backend URL

Open [`backendLink.js`](./backendLink.js) and update `BACKEND_URL`:

```javascript
export const BACKEND_URL = 'https://your-backend-domain-or-tunnel.com'
```

That's it! All API services, maps, routes, logins, and project data loaders will immediately use the updated link.
