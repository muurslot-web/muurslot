// POST /api/formulier: alle formulieren van de site. De uitleg staat in cloudflare/formulier.js.
import { verwerk } from '../../cloudflare/formulier.js';

export const onRequest = ({ request, env }) => verwerk(request, env);
