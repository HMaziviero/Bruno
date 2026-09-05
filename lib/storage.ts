import {env} from 'cloudflare:workers';
export function database(){if(!env.DB)throw Error('Banco de dados indisponível');return env.DB}
