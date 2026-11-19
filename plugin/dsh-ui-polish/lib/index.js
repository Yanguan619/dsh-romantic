/**
 * dsh-ui-polish host entry (v0.37.0).
 *
 * The whole visual effect lives in the client bundle (`client/client.js`),
 * including the maid-atelier calm layer. This half adds the one thing a client
 * cannot do: keep the calm layer's per-block settings in a file, so a window
 * that restarts — the desktop app picks a fresh loopback port each launch, and
 * localStorage is per-origin — comes back configured.
 *
 * One route, same pattern as @liustack/modsearch:
 *   GET  /dsh-ui-polish/calm  -> { settings }
 *   POST /dsh-ui-polish/calm  -> merge + validate + write, returns { settings }
 *
 * `webServer` exists only under the web profile, and this cordis has no
 * optional-inject form, so the registration rides a scoped `ctx.inject`. A
 * headless profile therefore keeps everything else and simply has no route;
 * the card then says so and falls back to localStorage.
 */

import { readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const name = 'dsh-ui-polish';

const LOG = 'C:\\Users\\11315\\OneDrive\\桌面\\Daily\\dsh-ui-polish-host.log';
const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'calm-settings.json');
const ROUTE = '/dsh-ui-polish/calm';

const DEFAULTS = {
	veil: true,
	veilOpacity: 100,
	figures: true,
	figureScale: 100,
	figureOpacity: 62,
	paper: true,
	cardRadius: 16,
	paperBlur: 10,
	rows: true,
	surfaces: true,
	composer: true,
	bow: true,
	bowHeight: 34,
	trims: true,
	sidebar: true,
	header: true,
	dark: true
};

const RANGES = {
	veilOpacity: [0, 100],
	figureScale: [40, 160],
	figureOpacity: [0, 100],
	cardRadius: [8, 28],
	paperBlur: [0, 24],
	bowHeight: [0, 60]
};

/** Same shape the card sends: known keys only, booleans by type, numbers clamped. */
function normalize(raw) {
	const source = raw && typeof raw === 'object' ? raw : {};
	const next = {};
	for (const key of Object.keys(DEFAULTS)) {
		const fallback = DEFAULTS[key];
		if (typeof fallback === 'boolean') {
			next[key] = typeof source[key] === 'boolean' ? source[key] : fallback;
			continue;
		}
		const range = RANGES[key];
		const value = Number(source[key]);
		next[key] = Number.isFinite(value) && range
			? Math.min(range[1], Math.max(range[0], Math.round(value)))
			: fallback;
	}
	return next;
}

async function readSettings() {
	try {
		const raw = await readFile(FILE, 'utf8');
		return normalize(JSON.parse(raw));
	} catch {
		return { ...DEFAULTS };
	}
}

/** Merge over what is on disk, so a partial POST never resets the other rows. */
async function writeSettings(patch) {
	const merged = Object.assign(await readSettings(), patch && typeof patch === 'object' ? patch : {});
	const settings = normalize(merged);
	const tmp = FILE + '.tmp';
	await writeFile(tmp, JSON.stringify(settings, null, 2) + '\n', 'utf8');
	await rename(tmp, FILE);
	return settings;
}

function registerRoute(ctx) {
	const route = {
		name: 'dsh-ui-polish-calm',
		kind: 'exact',
		path: ROUTE,
		handler: async (req, res) => {
			const send = (status, body) => {
				res.writeHead(status, {
					'content-type': 'application/json',
					'cache-control': 'no-store'
				});
				res.end(JSON.stringify(body));
			};
			if (req.method === 'GET') {
				try {
					send(200, { settings: await readSettings() });
				} catch (error) {
					send(500, { error: String(error?.message ?? error) });
				}
				return;
			}
			if (req.method !== 'POST') {
				res.writeHead(405).end();
				return;
			}
			try {
				const chunks = [];
				let total = 0;
				for await (const chunk of req) {
					total += chunk.length;
					if (total > 16 * 1024) {
						send(413, { error: 'settings payload too large' });
						req.destroy();
						return;
					}
					chunks.push(chunk);
				}
				const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
				const next = parsed && typeof parsed === 'object' && parsed.settings
					? parsed.settings
					: parsed;
				send(200, { settings: await writeSettings(next) });
			} catch (error) {
				send(400, { error: String(error?.message ?? error) });
			}
		}
	};
	ctx.effect(() => ctx.webServer.register(route), 'dsh-ui-polish: calm settings route');
}

export function apply(ctx) {
	// Activation trace: answers "did this row enter the layer stack?" without
	// devtools. Never allowed to break activation.
	import('node:fs')
		.then(({ appendFileSync }) => {
			appendFileSync(
				LOG,
				`[${new Date().toISOString()}] host apply ok pid=${process.pid} v=0.37.0 file=${FILE}\n`,
				'utf8'
			);
		})
		.catch(() => {});

	if (typeof ctx?.inject === 'function') {
		ctx.inject(['webServer'], (scope) => {
			try {
				registerRoute(scope);
			} catch (error) {
				try {
					console.error(`[dsh-ui-polish] calm route skipped: ${error}`);
				} catch {}
			}
		});
	}
}
