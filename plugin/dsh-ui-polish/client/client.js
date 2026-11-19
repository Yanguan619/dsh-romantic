/**
 * dsh-ui-polish — client bundle (v0.19.0).
 *
 * 1) Tab indicator: one 2px bar that slides between tabs; the native per-tab
 *    underline is suppressed. v0.14 lesson: never gate that suppression behind
 *    an html attribute — a gate that is not set silently disables the rule and
 *    leaves two bars on screen.
 * 2) View panel: the enter animation is replayed explicitly (remove class ->
 *    force reflow -> add class) on the first descendant that has a real box,
 *    because the slot host under `_viewArea` is not remounted per switch.
 * 3) Trajectory rows. Four distinct situations, three of which used to look the
 *    same (i.e. not animated at all):
 *      a. entering the view       -> the whole batch spreads over ~340ms.
 *      b. live growth (streaming)-> one row, same look, no stagger.
 *      c. collapse (many rows vanish, one summary row appears)
 *                                 -> the summary row carries no data-record-index
 *                                    (the framework drops it for collapsed rows),
 *                                    so there is nothing per-row to animate; the
 *                                    table itself gets a short settle gesture.
 *      d. expand (many rows reappear)
 *                                 -> only the rows that came back are staggered,
 *                                    not the whole table.
 *    Rows that mount because the user scrolled are always skipped.
 *
 * 4) maid-atelier calm layer (MAID_CALM_CSS): the skin over-decorates the
 *    conversation view. A separate stylesheet recedes the palace art, keeps the
 *    characters in the gutters, gives the transcript a quiet paper/frost panel
 *    and strips the ribbon banner off the composer. Scoped to
 *    body[data-dsh-maid-atelier], so other skins are untouched.
 *
 * Hot reload: edit client/client.js, then Ctrl+Shift+R (plain Ctrl+R hits the
 * immutable plugin-artifact cache because `rev` is computed at app start).
 */

window.__ModuleLoader__.load({
	id: 'dsh-ui-polish',
	factory: (require) => {
		var module = { exports: {} };
		const exports = module.exports;

		const name = 'dsh-ui-polish';
		const VERSION = '0.37.0';
		const STYLE_ID = 'dsh-ui-polish-style';
		const KILL_ID = 'dsh-ui-polish-kill';

		const TABS_BAR = '[data-conversation-tabs]';
		const TAB_MS = 260;
		const THICKNESS = 2;
		const MOVE = 'data-dsh-ui-polish-move';

		const VIEW_AREA = '[class*="_viewArea"]';
		const PANEL_CLASS = 'dsh-ui-polish-panel-in';
		const PANEL_MS = 240;
		const LAYER_CLASS = 'dsh-ui-polish-layer-in';
		const LAYER_STEP_MS = 40;
		const LAYER_MS = 300;
		const CELL_CLASS = 'dsh-ui-polish-cell-in';
		const CELL_MS = 150;
		const CLICK_WINDOW_MS = 700;

		const FRAME_SEL = '[class*="_frame"]';
		const FREEZE_ATTR = 'data-dsh-ui-polish-freeze';
		const FRAME_MS_FALLBACK = 240;

		const SET_MODAL = '[data-shortcut-modal="settings"]';
		const SET_LIST = '[class*="_navList"]';
		const SET_CELL = '[class*="_navCell"]';
		const SET_ACTIVE = '[class*="_navCell"][class*="_active"]';
		const SET_OPTIONS = '[class*="_options"]';
		const SET_STATE = 'data-dsh-ui-polish-set';
		const SET_IN_CLASS = 'dsh-ui-polish-set-in';
		const SET_MS = 220;
		const LAYER_MAX = 3;

		const TRAJ_PLAY = 'data-dsh-ui-polish-traj';
		const ROW_SEL = 'tbody > tr[data-record-index]';
		const ROW_NEW_CLASS = 'dsh-ui-polish-row-new';
		const COLLAPSE_CLASS = 'dsh-ui-polish-table-settle';
		const COLLAPSE_MS = 110;
		const ROW_MS = 190;
		const ROW_MS_BATCH = 165;
		const ROW_DROP_PX = 8;
		const SPREAD_MS = 340;
		const STEP_MIN_MS = 10;
		const STEP_MAX_MS = 48;
		const BATCH_SPREAD_MS = 175;
		const BATCH_STEP_MIN_MS = 4;
		const BATCH_STEP_MAX_MS = 22;
		const SCROLL_QUIET_MS = 320;
		const BULK_THRESHOLD = 3;

		const KILL_CSS = `
[data-conversation-tabs] [role="tab"]::after,
[class*="_tabActive"]::after,
[class*="_tab"]::after {
	content: none !important;
	background: none !important;
	background-color: transparent !important;
	display: none !important;
}
`;
		// dsh-ui-polish: "calm" layer for the maid-atelier skin.
		// The skin paints palace art, two full-height maids, lace trims and a ribbon
		// banner around the composer. That reads as decoration competing with the
		// content. This sheet keeps the theme identity (palace veil, characters at
		// the gutters, gold hairlines, one small bow) while giving the reading
		// surface a quiet paper panel. Every selector is scoped to the skin body
		// attribute and repeats it plus :root so it wins on specificity no matter
		// where each editor-style sheet lands in <head>.
		const MAID_CALM_ID = 'dsh-ui-polish-maid-calm';
const MAID_CALM_CSS = `
/* ============================================================
   maid-atelier · calm layer  (content first)
   Scope: body[data-dsh-maid-atelier] only.
   Placed after the skin sheet (dsh-ui-polish injects later) and
   uses a \`html\` prefix so every rule outranks the skin at equal
   specificity no matter which sheet loads first.

   GATES: every block is announced by a marker comment of the form
   @calm:<id>. The build script turns that marker into a
   :not([data-calm-off~="<id>"]) condition on the body prefix, so the
   settings card can switch a block off without a new stylesheet.
   \`base\` blocks are always on.
   KNOBS: numbers read from custom properties set on <html>.
   ============================================================ */

/* ---------- tokens ---------- */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier] {
  --calm-paper: rgba(250, 251, 254, 0.9);
  --calm-paper-solid: #fafbfe;
  --calm-card: rgba(250, 251, 254, 0.88);
  --calm-card-line: rgba(23, 35, 71, 0.1);
  --calm-slip: rgba(250, 251, 254, 0.5);
  --calm-line: rgba(23, 35, 71, 0.1);
  --calm-gold-line: rgba(197, 164, 104, 0.42);
  --calm-shadow: 0 12px 32px rgba(15, 30, 72, 0.12), 0 1px 3px rgba(15, 30, 72, 0.08);
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier][data-ds-dark-theme] {
  --calm-paper: rgba(15, 23, 46, 0.9);
  --calm-paper-solid: #0f172e;
  --calm-card: rgba(15, 23, 46, 0.86);
  --calm-card-line: rgba(151, 169, 216, 0.16);
  --calm-slip: rgba(12, 20, 42, 0.6);
  --calm-line: rgba(151, 169, 216, 0.16);
  --calm-gold-line: rgba(211, 180, 119, 0.34);
  --calm-shadow: 0 14px 36px rgba(0, 0, 0, 0.38), 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* ---------- palace art: fogged backdrop ---------- */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="veil"]) [data-skin-chrome="character-stage"]:after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: var(--calm-veil-k, 1);
  background:
    radial-gradient(58% 54% at 50% 46%, rgba(250, 248, 243, 0.34), rgba(250, 248, 243, 0) 72%),
    linear-gradient(180deg, rgba(247, 245, 240, 0.26), rgba(247, 245, 240, 0.5));
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="veil"])[data-ds-dark-theme] [data-skin-chrome="character-stage"]:after {
  background:
    radial-gradient(58% 54% at 50% 46%, rgba(4, 9, 26, 0.2), rgba(4, 9, 26, 0) 72%),
    linear-gradient(180deg, rgba(4, 9, 26, 0.16), rgba(4, 9, 26, 0.3));
}

/* ---------- figures: back to the margins ---------- */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="figures"]) [data-maid-character] {
  height: calc(var(--calm-figure-k, 1) * 66%);
  opacity: 0.95;
  filter: saturate(0.94) drop-shadow(0 16px 22px rgba(27, 44, 91, 0.16));
  -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 15%, #000 100%);
  mask-image: linear-gradient(180deg, transparent 0, #000 15%, #000 100%);
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="figures"])[data-ds-dark-theme] [data-maid-character] {
  filter: brightness(0.92) saturate(0.9) drop-shadow(0 18px 26px rgba(0, 0, 0, 0.34));
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="figures"])[data-maid-chat-active] [data-maid-character="left"] {
  height: calc(var(--calm-figure-k, 1) * 46%);
  opacity: var(--calm-figure-o, 0.62);
  left: -34px;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="figures"])[data-maid-chat-active] :is([data-maid-character="right"], [data-maid-character="vision"]) {
  height: calc(var(--calm-figure-k, 1) * 44%);
  opacity: var(--calm-figure-o, 0.62);
  right: -30px;
}
/* landing: figures step out of the way of the composer */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="figures"]):not([data-maid-chat-active]) [data-maid-character="left"] {
  left: -46px;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="figures"]):not([data-maid-chat-active]) :is([data-maid-character="right"], [data-maid-character="vision"]) {
  right: -40px;
}

/* ---------- one card per message, instead of one sheet over the column ---------- */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="paper"]) [data-conversation-scroll] {
  position: relative;
  z-index: 3;
  padding-top: 10px;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="paper"]) [data-chat-flow-kind="assistant-step"] > * > * > * > div[class*="markdown"] {
  max-width: none;
  background: var(--calm-card);
  border: 1px solid var(--calm-card-line);
  border-radius: var(--calm-card-r, 16px);
  padding: 16px 20px;
  margin-block: 4px 8px;
  box-shadow: 0 8px 24px rgba(15, 30, 72, 0.09), 0 1px 2px rgba(15, 30, 72, 0.05);
  backdrop-filter: blur(var(--calm-paper-blur, 10px)) saturate(0.96);
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="paper"])[data-ds-dark-theme] [data-chat-flow-kind="assistant-step"] > * > * > * > div[class*="markdown"] {
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.34), 0 1px 2px rgba(0, 0, 0, 0.24);
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="paper"]) :is(
    [data-chat-flow-kind="turn-process"],
    [data-chat-flow-kind="turn-tail"]
  ) {
  width: fit-content;
  padding: 1px 9px;
  border-radius: 9px;
  background: var(--calm-slip);
}

/* ---------- trajectory rows: no glass, no blur ---------- */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="rows"]):not([data-ds-dark-theme])
  :is([data-variant], [data-chat-flow-kind="context"]) [data-disclosure-row],
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="rows"])[data-ds-dark-theme]
  :is([data-variant], [data-chat-flow-kind="context"]) [data-disclosure-row],
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="rows"]):not([data-ds-dark-theme])
  :is(
    [data-variant="bash"]:not(:has([data-disclosure-row])),
    [data-chat-flow-kind="system-prompt"] [data-disclosure-row],
    [data-tool="present"]:not([data-open="true"]) > [data-disclosure-row],
    [data-tool="present"]:not([data-open="true"]) > [data-disclosure-header] > [data-disclosure-row],
    [data-variant] > :not([data-open="true"]) > [data-disclosure-row],
    [data-variant] > :not([data-open="true"]) > [data-disclosure-header] > [data-disclosure-row]
  ),
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="rows"])[data-ds-dark-theme]
  :is(
    [data-variant="bash"]:not(:has([data-disclosure-row])),
    [data-chat-flow-kind="system-prompt"] [data-disclosure-row],
    [data-tool="present"]:not([data-open="true"]) > [data-disclosure-row],
    [data-tool="present"]:not([data-open="true"]) > [data-disclosure-header] > [data-disclosure-row],
    [data-variant] > :not([data-open="true"]) > [data-disclosure-row],
    [data-variant] > :not([data-open="true"]) > [data-disclosure-header] > [data-disclosure-row]
  ) {
  background: transparent;
  backdrop-filter: none;
}

/* ---------- message surfaces ---------- */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="surfaces"]) [class*="userRow"] [class*="bubble"]:not([role="tooltip"]),
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="surfaces"]) [data-question-reply] > [class*="bubble"] {
  background: rgba(232, 237, 249, 0.72);
  border: 1px solid rgba(23, 35, 71, 0.08);
  box-shadow: 0 2px 10px rgba(19, 38, 87, 0.06);
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="surfaces"])[data-ds-dark-theme] [class*="userRow"] [class*="bubble"]:not([role="tooltip"]),
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="surfaces"])[data-ds-dark-theme] [data-question-reply] > [class*="bubble"] {
  background: rgba(31, 46, 84, 0.7);
  border-color: rgba(151, 169, 216, 0.16);
}

/* running pill: calm, no shimmer */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="surfaces"]) [data-chat-running] > [class*="runningContent"] {
  background: rgba(250, 251, 254, 0.88);
  backdrop-filter: none;
  box-shadow: 0 0 0 1px var(--calm-gold-line), 0 2px 8px rgba(19, 38, 87, 0.08);
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="surfaces"])[data-ds-dark-theme] [data-chat-running] > [class*="runningContent"] {
  background: rgba(19, 28, 56, 0.9);
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="surfaces"]) [data-chat-running] > [class*="runningContent"]:after {
  display: none;
}

/* ---------- composer: ribbon banner -> plain card ---------- */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="composer"]) [data-composer-card] {
  padding-top: 6px;
  border-radius: 20px;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="composer"]) [data-composer-card]:after {
  background: var(--calm-paper-solid);
  box-shadow: var(--calm-shadow), inset 0 0 0 1px var(--calm-line);
  backdrop-filter: none;
  border-radius: 20px;
  inset: 0 -6px -6px;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="composer"])[data-phase="hero"] [data-composer-card] {
  --maid-composer-backdrop-filter: none;
  --maid-composer-surface: var(--calm-paper-solid);
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="composer"]) [data-composer-card] > [data-skin-chrome="composer-lace"] {
  display: none;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="composer"]) [data-composer-card] + div[class*="dock"]:before {
  backdrop-filter: none;
}

/* ---------- the one ornament kept: a small bow ---------- */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="bow"]) [data-composer-card]:before {
  border-width: 0;
  border-image: none;
  background-image: var(--maid-bow-art);
  background-position: center top;
  background-repeat: no-repeat;
  background-size: auto var(--calm-bow-h, 34px);
  inset: calc(var(--calm-bow-h, 34px) / -2) 0 auto;
  height: var(--calm-bow-h, 34px);
  opacity: 0.92;
}

/* ---------- trims: hairline, not frieze ---------- */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="trims"]) [data-skin-chrome="top-trim"] {
  height: 30px;
  opacity: 0.55;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="trims"]) [data-skin-chrome="bottom-trim"] {
  height: 22px;
  opacity: 0.4;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="trims"]) [data-skin-chrome="bottom-trim"]:after {
  display: none;
}

/* ---------- sidebar: quiet frame ---------- */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="sidebar"]) [data-skin-chrome="sidebar-corners"] {
  opacity: 0.45;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="sidebar"]) [data-skin-chrome="sidebar-corners"] > [data-skin-corner] {
  width: 44px;
  height: 44px;
  background-size: 92px 92px;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="sidebar"]) [data-skin-chrome="sidebar-mascot"] {
  opacity: 0.3;
  max-height: 24%;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="sidebar"]) [data-maid-sidebar-footer]:before {
  opacity: 0.55;
}

/* ---------- sidebar: one bright element, not five ---------- */
/* the plate around the wordmark goes away; the divider stays */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="sidebar"]) [class*="logoRow"] {
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  min-height: 52px;
  margin: 2px 10px 0;
  padding: 6px 2px 8px;
}
/* new-session keeps its cream pill, loses the ribbon tails and lace (border-image art) */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="sidebar"]) button[class*="newSession"] {
  border-width: 0;
  border-image: none;
  border-radius: 999px;
  background: linear-gradient(180deg, #fdfaf4, #f1e8d6);
  box-shadow: inset 0 0 0 1px rgba(197, 164, 104, 0.5), 0 2px 8px rgba(2, 8, 28, 0.28);
  color: #16244a;
  min-height: 40px;
  margin: 2px 10px 8px;
  padding-inline: 14px;
  filter: none;
  gap: 8px;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="sidebar"]) button[class*="newSession"]:is(:hover, :focus-visible) {
  background: linear-gradient(180deg, #fffdf8, #f6efdf);
  box-shadow: inset 0 0 0 1px rgba(197, 164, 104, 0.7), 0 3px 10px rgba(2, 8, 28, 0.32);
  filter: none;
  transform: none;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="sidebar"])[data-ds-dark-theme] button[class*="newSession"] {
  background: linear-gradient(180deg, #fbf7ee, #eee4d1);
  color: #16244a;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="sidebar"]) button[class*="newSession"] svg {
  width: 16px;
  height: 16px;
  opacity: 0.8;
}

/* ---------- header: a quiet title bar, legible in both themes ---------- */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="header"]) header:has([data-slot^="conversation.session.header"]) {
  background: var(--calm-paper-solid);
  border-bottom: 1px solid var(--calm-line);
  box-shadow: none;
}
/* the skin paints header text cream so it reads on palace art; on the paper it must go ink */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="header"]):not([data-ds-dark-theme]) [data-slot^="conversation.session.header"] :is(span, button, a) {
  color: #2a3a5e;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="header"]):not([data-ds-dark-theme]) [data-slot^="conversation.session.header"] [role="tab"][aria-selected="true"],
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="header"]):not([data-ds-dark-theme]) [data-slot^="conversation.session.header"] [role="tab"][aria-selected="true"] span {
  color: #2f4b86;
  font-weight: 600;
}

/* ---------- dark mode: keep trajectory text readable ---------- */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="dark"])[data-ds-dark-theme] [data-conversation-scroll] [data-disclosure-row] {
  color: #d9e2f5;
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="dark"])[data-ds-dark-theme] [data-composer-card]::before {
  filter: brightness(1.45) saturate(1.05);
}
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier]:not([data-calm-off~="dark"])[data-ds-dark-theme] [data-skin-chrome="bottom-trim"] {
  opacity: 0.22;
}

/* ---------- low-power mode: drop the frosted cards ---------- */
html:root body[data-dsh-maid-atelier][data-dsh-maid-atelier][data-maid-low-power] [data-chat-flow-kind="assistant-step"] > * > * > * > div[class*="markdown"] {
  backdrop-filter: none;
  background: var(--calm-paper-solid);
}
`;

		/* >>> calm-settings-runtime */
		/* ================= calm settings (settings → plugins) =================
		 * The calm layer above is one stylesheet, but each block is a decision
		 * the user may want to take back. Every block answers to a token in
		 * `data-calm-off` on <body>, and the numeric ones to a custom property
		 * on <html>; this section owns that state, the card that edits it, and
		 * the file behind it.
		 *
		 * Persistence: GET/POST /dsh-ui-polish/calm, registered by the host half.
		 * A window that predates the route (or a host without it) still gets a
		 * working card: reads and writes fall back to localStorage, which is
		 * per-origin and therefore per-port, so the card says so instead of
		 * pretending the choice will survive a restart.
		 */
		const CALM_ROUTE = '/dsh-ui-polish/calm';
		const CALM_LOCAL_KEY = 'dsh-ui-polish.calm';
		// Cookies are scoped by host, not by port, so this survives a restart even
		// when the desktop host picks a new port (and localStorage does not).
		const CALM_COOKIE = 'dsh-ui-polish.calm';
		const CALM_OFF_TOKENS = [
			'veil', 'figures', 'paper', 'rows', 'surfaces', 'composer', 'bow',
			'trims', 'sidebar', 'header', 'dark'
		];
		const CALM_DEFAULTS = Object.freeze({
			veil: true, veilOpacity: 100,
			figures: true, figureScale: 100, figureOpacity: 62,
			paper: true, cardRadius: 16, paperBlur: 10,
			rows: true,
			surfaces: true,
			composer: true,
			bow: true, bowHeight: 34,
			trims: true,
			sidebar: true,
			header: true,
			dark: true
		});
		const CALM_RANGES = {
			veilOpacity: [0, 100],
			figureScale: [40, 160],
			figureOpacity: [0, 100],
			cardRadius: [8, 28],
			paperBlur: [0, 24],
			bowHeight: [0, 60]
		};

		function calmNormalize(raw) {
			const source = raw && typeof raw === 'object' ? raw : {};
			const next = {};
			for (const key of Object.keys(CALM_DEFAULTS)) {
				const fallback = CALM_DEFAULTS[key];
				if (typeof fallback === 'boolean') {
					next[key] = typeof source[key] === 'boolean' ? source[key] : fallback;
					continue;
				}
				const range = CALM_RANGES[key];
				const value = Number(source[key]);
				next[key] = Number.isFinite(value) && range
					? Math.min(range[1], Math.max(range[0], Math.round(value)))
					: fallback;
			}
			return next;
		}

		/**
		 * One place where a settings object becomes pixels: the off list and the
		 * numeric knobs. Idempotent, so the card can call it on every keystroke
		 * without rebuilding the stylesheet.
		 */
		function calmApply(settings) {
			const state = calmNormalize(settings);
			const root = document.documentElement;
			const body = document.body;
			if (body) {
				const off = CALM_OFF_TOKENS.filter((key) => state[key] === false);
				if (off.length) body.setAttribute('data-calm-off', off.join(' '));
				else body.removeAttribute('data-calm-off');
			}
			root.style.setProperty('--calm-veil-k', String(state.veilOpacity / 100));
			root.style.setProperty('--calm-figure-k', String(state.figureScale / 100));
			root.style.setProperty('--calm-figure-o', String(state.figureOpacity / 100));
			root.style.setProperty('--calm-card-r', state.cardRadius + 'px');
			root.style.setProperty('--calm-paper-blur', state.paperBlur + 'px');
			root.style.setProperty('--calm-bow-h', state.bowHeight + 'px');
			return state;
		}

		let calmState = calmNormalize(null);
		let calmStoreState = 'sync'; // 'file' | 'local' | 'sync'
		let calmSaveTimer = 0;
		const calmListeners = new Set();

		function calmStatus() {
			return calmStoreState;
		}

		function calmNotify() {
			for (const listener of Array.from(calmListeners)) {
				try {
					listener();
				} catch {}
			}
		}

		function calmSetStatus(next) {
			calmStoreState = next;
			// A new object identity is what wakes useSyncExternalStore; the card
			// reads the status through calmStatus(), so nothing else changes.
			calmState = Object.assign({}, calmState);
			calmNotify();
		}

		function calmSnapshot() {
			return calmState;
		}

		function calmSubscribe(listener) {
			calmListeners.add(listener);
			return () => calmListeners.delete(listener);
		}

		function calmReadLocal() {
			try {
				const raw = localStorage.getItem(CALM_LOCAL_KEY);
				if (!raw) return null;
				const parsed = JSON.parse(raw);
				if (!parsed || typeof parsed !== 'object') return null;
				const settings = parsed.s && typeof parsed.s === 'object' ? parsed.s : parsed;
				return { settings, at: Number(parsed.at) || 0 };
			} catch {
				return null;
			}
		}

		function calmReadCookie() {
			try {
				const prefix = CALM_COOKIE + '=';
				const hit = document.cookie.split('; ').find((part) => part.startsWith(prefix));
				if (!hit) return null;
				const parsed = JSON.parse(decodeURIComponent(hit.slice(prefix.length)));
				if (!parsed || typeof parsed !== 'object') return null;
				const settings = parsed.s && typeof parsed.s === 'object' ? parsed.s : parsed;
				return { settings, at: Number(parsed.at) || 0 };
			} catch {
				return null;
			}
		}

		function calmWriteCookie(settings, at) {
			try {
				const raw = encodeURIComponent(JSON.stringify({ s: settings, at }));
				document.cookie =
					CALM_COOKIE + '=' + raw + '; path=/; max-age=' + 400 * 86400 + '; SameSite=Lax';
			} catch {}
		}

		function calmPersist() {
			const payload = JSON.stringify({ settings: calmState });
			const at = Date.now();
			try {
				localStorage.setItem(CALM_LOCAL_KEY, JSON.stringify({ s: calmState, at }));
			} catch {}
			calmWriteCookie(calmState, at);
			fetch(CALM_ROUTE, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: payload
			})
				.then((response) => {
					calmSetStatus(response.ok ? 'file' : 'local');
				})
				.catch(() => calmSetStatus('local'));
		}

		function calmScheduleSave() {
			clearTimeout(calmSaveTimer);
			calmSaveTimer = setTimeout(() => {
				try {
					calmPersist();
				} catch {}
			}, 260);
		}

		/** Patch, apply, persist. `persist: false` is the load path. */
		function calmSet(patch, options) {
			calmState = calmNormalize(Object.assign({}, calmState, patch || {}));
			calmApply(calmState);
			calmNotify();
			if (!options || options.persist !== false) calmScheduleSave();
			return calmState;
		}

		function calmLoad() {
			// Whichever of the two client-side copies was written last wins; the
			// host file below overrides both when the route exists.
			const newest = [calmReadCookie(), calmReadLocal()]
				.filter(Boolean)
				.sort((a, b) => b.at - a.at)[0];
			if (newest) {
				calmState = calmNormalize(newest.settings);
				calmApply(calmState);
				calmNotify();
			}
			fetch(CALM_ROUTE, { headers: { accept: 'application/json' } })
				.then((response) => {
					if (response.status === 404) {
						calmSetStatus('local');
						return null;
					}
					if (!response.ok) throw new Error('HTTP ' + response.status);
					calmSetStatus('file');
					return response.json();
				})
				.then((data) => {
					const saved = data && typeof data === 'object'
						? (data.settings && typeof data.settings === 'object' ? data.settings : data)
						: null;
					if (saved && Object.keys(saved).length) {
						calmState = calmNormalize(saved);
						calmApply(calmState);
						calmNotify();
					}
				})
				.catch(() => calmSetStatus('local'));
		}

		/**
		 * The card. Rows mirror the stylesheet block by block: a block name, what
		 * it does to the window, and the numbers it reads.
		 */
		function calmCard(React) {
			const h = React.createElement;
			const ui = {
				text: 'var(--dsw-alias-label-primary, #1d2430)',
				sub: 'var(--dsw-alias-label-secondary, #57617a)',
				dim: 'var(--dsw-alias-label-tertiary, #7c879c)',
				line: 'var(--dsw-alias-border-l2, rgba(127,127,127,.26))',
				accent: 'var(--dsw-alias-brand-primary, #4b73c9)'
			};

			function useCalm() {
				if (typeof React.useSyncExternalStore === 'function') {
					return React.useSyncExternalStore(calmSubscribe, calmSnapshot);
				}
				const pair = React.useState(calmSnapshot());
				React.useEffect(() => calmSubscribe(() => pair[1](calmSnapshot())), []);
				return pair[0];
			}

			function Toggle(props) {
				const on = props.on;
				return h(
					'button',
					{
						type: 'button',
						role: 'switch',
						'aria-checked': on ? 'true' : 'false',
						'aria-label': props.label,
						title: props.label,
						onClick: () => props.onChange(!on),
						style: {
							flex: 'none',
							width: 40,
							height: 23,
							borderRadius: 999,
							padding: 0,
							cursor: 'pointer',
							position: 'relative',
							border: on ? '1px solid ' + ui.accent : '1px solid ' + ui.line,
							background: on ? ui.accent : 'transparent',
							transition: 'background .16s, border-color .16s'
						}
					},
					h('span', {
						style: {
							position: 'absolute',
							top: 2,
							left: on ? 19 : 2,
							width: 17,
							height: 17,
							borderRadius: '50%',
							background: on ? '#fff' : ui.dim,
							boxShadow: '0 1px 2px rgba(0, 0, 0, .26)',
							transition: 'left .16s, background .16s'
						}
					})
				);
			}

			function Slider(props) {
				return h(
					'div',
					{
						style: {
							display: 'flex',
							alignItems: 'center',
							gap: 10,
							opacity: props.disabled ? 0.45 : 1
						}
					},
					h(
						'span',
						{
							style: {
								flex: 'none',
								width: 88,
								fontSize: 12,
								lineHeight: 1.4,
								color: ui.dim
							}
						},
						props.label
					),
					h('input', {
						type: 'range',
						min: props.min,
						max: props.max,
						step: 1,
						value: props.value,
						disabled: props.disabled ? true : undefined,
						'aria-label': props.label,
						onChange: (event) => props.onChange(Number(event.target.value)),
						style: {
							flex: 1,
							minWidth: 0,
							accentColor: ui.accent,
							cursor: props.disabled ? 'default' : 'pointer'
						}
					}),
					h(
						'span',
						{
							style: {
								width: 52,
								textAlign: 'right',
								fontSize: 12,
								color: ui.dim,
								fontVariantNumeric: 'tabular-nums'
							}
						},
						props.value + (props.suffix || '')
					)
				);
			}

			function Row(props) {
				return h(
					'div',
					{ style: { padding: '9px 0', borderTop: '1px solid ' + ui.line } },
					h(
						'div',
						{ style: { display: 'flex', alignItems: 'flex-start', gap: 12 } },
						h(
							'div',
							{ style: { flex: 1, minWidth: 0 } },
							h('div', { style: { fontSize: 13, lineHeight: 1.45, color: ui.text } }, props.title),
							props.hint
								? h(
										'div',
										{ style: { fontSize: 12, lineHeight: 1.5, marginTop: 2, color: ui.dim } },
										props.hint
									)
								: null
						),
						props.control || null
					),
					props.children
						? h('div', { style: { marginTop: 7, display: 'grid', gap: 5 } }, props.children)
						: null
				);
			}

			function Group(props) {
				return h(
					'section',
					{ style: { marginTop: 16 } },
					h(
						'div',
						{
							style: {
								fontSize: 11,
								letterSpacing: '.08em',
								textTransform: 'uppercase',
								color: ui.dim
							}
						},
						props.title
					),
					h('div', { style: { marginTop: 2 } }, props.children)
				);
			}

			return function MaidCalmCard(props) {
				const s = useCalm();
				const status = calmStatus();
				const set = (patch) => calmSet(patch);
				const page = props && props.view ? props.view === 'page' : true;

				// The plugins list asks each entry for a one-liner too; the form
				// itself belongs to the bundle's own page.
				if (!page) {
					const off = CALM_OFF_TOKENS.filter((key) => s[key] === false);
					return h(
						'div',
						{ style: { fontSize: 12, lineHeight: 1.5, color: ui.dim } },
						off.length
							? '降噪层：' + (CALM_OFF_TOKENS.length - off.length) + '/' + CALM_OFF_TOKENS.length + ' 项生效（关掉：' + off.join('、') + '）'
							: '降噪层：' + CALM_OFF_TOKENS.length + ' 项全部生效'
					);
				}

				const note =
					status === 'file'
						? '已写入插件配置文件，重启后保留'
						: status === 'local'
							? '当前窗口内生效（重启后会回到默认）'
							: '正在读取…';

				const head = h(
					'div',
					{
						style: {
							display: 'flex',
							alignItems: 'baseline',
							justifyContent: 'space-between',
							gap: 12
						}
					},
					h(
						'div',
						null,
						h('div', { style: { fontSize: 14, fontWeight: 600, color: ui.text } }, '女仆工坊 · 降噪层'),
						h(
							'div',
							{ style: { fontSize: 12, lineHeight: 1.5, marginTop: 3, color: ui.dim } },
							'只影响 maid-atelier 皮肤。关掉一项，那块就还原成皮肤原样。'
						)
					),
					h(
						'button',
						{
							type: 'button',
							onClick: () => calmSet(CALM_DEFAULTS),
							style: {
								flex: 'none',
								fontSize: 12,
								padding: '5px 10px',
								borderRadius: 8,
								cursor: 'pointer',
								color: ui.sub,
								background: 'transparent',
								border: '1px solid ' + ui.line
							}
						},
						'恢复默认'
					)
				);

				const body = h(
					'div',
					null,
					h(
						Group,
						{ title: '背景' },
						h(
							Row,
							{
								title: '背景雾化',
								hint: '给宫殿背景加一层柔光纱幕，压掉细节对比',
								control: h(Toggle, {
									on: s.veil,
									label: '背景雾化',
									onChange: (value) => set({ veil: value })
								})
							},
							s.veil
								? h(Slider, {
										label: '雾化强度',
										value: s.veilOpacity,
										min: 0,
										max: 100,
										suffix: '%',
										onChange: (value) => set({ veilOpacity: value })
									})
								: null
						),
						h(
							Row,
							{
								title: '人物退到两侧',
								hint: '把两位鲸鱼娘缩小、挪进边沟，不再压住正文',
								control: h(Toggle, {
									on: s.figures,
									label: '人物退到两侧',
									onChange: (value) => set({ figures: value })
								})
							},
							s.figures
								? [
										h(Slider, {
											key: 'scale',
											label: '人物大小',
											value: s.figureScale,
											min: 40,
											max: 160,
											suffix: '%',
											onChange: (value) => set({ figureScale: value })
										}),
										h(Slider, {
											key: 'opacity',
											label: '会话中不透明度',
											value: s.figureOpacity,
											min: 0,
											max: 100,
											suffix: '%',
											onChange: (value) => set({ figureOpacity: value })
										})
									]
								: null
						)
					),
					h(
						Group,
						{ title: '阅读区' },
						h(
							Row,
							{
								title: '对话卡片',
								hint: '每条消息单独一块纸／玻璃，不再铺满整列',
								control: h(Toggle, {
									on: s.paper,
									label: '对话卡片',
									onChange: (value) => set({ paper: value })
								})
							},
							s.paper
								? [
										h(Slider, {
											key: 'radius',
											label: '卡片圆角',
											value: s.cardRadius,
											min: 8,
											max: 28,
											suffix: 'px',
											onChange: (value) => set({ cardRadius: value })
										}),
										h(Slider, {
											key: 'blur',
											label: '卡片模糊',
											value: s.paperBlur,
											min: 0,
											max: 24,
											suffix: 'px',
											onChange: (value) => set({ paperBlur: value })
										})
									]
								: null
						),
						h(Row, {
							title: '轨迹行去玻璃',
							hint: '每行都不再单独模糊，长轨迹不再发花',
							control: h(Toggle, {
								on: s.rows,
								label: '轨迹行去玻璃',
								onChange: (value) => set({ rows: value })
							})
						}),
						h(Row, {
							title: '消息气泡收敛',
							hint: '我的消息压成浅色块，去掉金边',
							control: h(Toggle, {
								on: s.surfaces,
								label: '消息气泡收敛',
								onChange: (value) => set({ surfaces: value })
							})
						})
					),
					h(
						Group,
						{ title: '输入器与边饰' },
						h(
							Row,
							{
								title: '输入器净化',
								hint: '去掉金框、左右缎带和蕾丝横幅，只留一张干净卡',
								control: h(Toggle, {
									on: s.composer,
									label: '输入器净化',
									onChange: (value) => set({ composer: value })
								})
							},
							s.composer && s.bow
								? h(Slider, {
										label: '蝴蝶结高度',
										value: s.bowHeight,
										min: 0,
										max: 60,
										suffix: 'px',
										onChange: (value) => set({ bowHeight: value })
									})
								: null
						),
						h(Row, {
							title: '保留小蝴蝶结',
							hint: '输入器顶部那枚装饰，压到 34px；关掉则完全素面',
							control: h(Toggle, {
								on: s.bow,
								label: '保留小蝴蝶结',
								onChange: (value) => set({ bow: value })
							})
						}),
						h(Row, {
							title: '贴边蕾丝收窄',
							hint: '顶部／底部花边压成细线，去掉中心徽记',
							control: h(Toggle, {
								on: s.trims,
								label: '贴边蕾丝收窄',
								onChange: (value) => set({ trims: value })
							})
						})
					),
					h(
						Group,
						{ title: '界面' },
						h(Row, {
							title: '侧栏安静化',
							hint: '去掉铭牌金框和缎带尾巴，角落花纹与看板娘减淡',
							control: h(Toggle, {
								on: s.sidebar,
								label: '侧栏安静化',
								onChange: (value) => set({ sidebar: value })
							})
						}),
						h(Row, {
							title: '顶栏对比度',
							hint: '标题栏改成实色，皮肤给的米白字换回墨色',
							control: h(Toggle, {
								on: s.header,
								label: '顶栏对比度',
								onChange: (value) => set({ header: value })
							})
						}),
						h(Row, {
							title: '暗色文字提亮',
							hint: '暗色主题下轨迹行文字本来就是深灰，这里抬到可读',
							control: h(Toggle, {
								on: s.dark,
								label: '暗色文字提亮',
								onChange: (value) => set({ dark: value })
							})
						})
					),
					h(
						'div',
						{
							style: {
								marginTop: 14,
								paddingTop: 10,
								borderTop: '1px solid ' + ui.line,
								fontSize: 12,
								color: ui.dim
							}
						},
						note
					)
				);

				return h(
					'div',
					{ style: { padding: page ? '2px 0 6px' : '2px 0' } },
					head,
					body
				);
			};
		}

		/**
		 * Boot: defaults on, then the saved set. The card rides the plugins page
		 * slot; every optional dependency takes its own scoped inject, because a
		 * missing service must not take the calm layer down with it.
		 */
		function installCalmSettings(ctx) {
			try {
				calmApply(calmState);
			} catch {}
			try {
				calmLoad();
			} catch {}
			try {
				if (!ctx || typeof ctx.inject !== 'function') return;
				ctx.inject(['slots'], (scope) => {
					try {
						const React = require('react');
						const Card = calmCard(React);
						scope.slots.inject('plugins.bundle.config', function* () {
							yield scope.slots.register(
								{ name: 'plugins.bundle.config', key: 'dsh-ui-polish' },
								Card
							);
						});
					} catch (error) {
						try {
							console.error('[dsh-ui-polish] calm card skipped: ' + error);
						} catch {}
					}
				});
			} catch {}
		}
		/* <<< calm-settings-runtime */


		const diag = {
			version: VERSION,
			installedAt: new Date().toISOString(),
			bars: 0,
			clicks: 0,
			moves: 0,
			nudges: 0,
			kill: 'unknown',
			native: 'unknown',
			panelPlays: 0,
			panelLayers: 0,
			panelTarget: 'unset',
			panelAnim: 'unset',
			trajArmed: 0,
			trajPlays: 0,
			trajRows: 0,
			trajStep: 'unset',
			trajLatencyMs: null,
			trajReveal: 0,
			trajClickWindow: 0,
			frameTransition: 'unset',
			setSwitches: 0,
			setPill: 'unset',
			setMountMs: null,
			setTarget: 'unset',
			trajLive: 0,
			trajBatch: 0,
			trajSettle: 0,
			trajSkippedScroll: 0,
			last: null,
			errors: []
		};

		const CSS = `
${TABS_BAR} {
	position: relative;
	--dsh-ui-polish-pill-x: 0px;
	--dsh-ui-polish-pill-w: 0px;
	--dsh-ui-polish-pill-y: 0px;
}

${TABS_BAR}::before {
	content: '';
	position: absolute;
	left: 0;
	top: var(--dsh-ui-polish-pill-y);
	height: ${THICKNESS}px;
	width: var(--dsh-ui-polish-pill-w);
	border-radius: 2px;
	background: var(--dsw-alias-state-business-primary);
	pointer-events: none;
	transform: translateX(var(--dsh-ui-polish-pill-x));
	transition: none;
	will-change: transform, width;
}

html[${MOVE}="on"] ${TABS_BAR}::before {
	transition:
		transform ${TAB_MS}ms cubic-bezier(0.4, 0, 0.2, 1),
		width ${TAB_MS}ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes dsh-ui-polish-view-in {
	from { opacity: 0; transform: translate3d(var(--dsh-ui-polish-px, 16px), 0, 0); }
	to { opacity: 1; transform: translate3d(0, 0, 0); }
}

.${PANEL_CLASS} {
	animation: dsh-ui-polish-view-in ${PANEL_MS}ms cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

@keyframes dsh-ui-polish-layer-in {
	from { opacity: 0; transform: translate3d(var(--dsh-ui-polish-lx, 10px), 0, 0); }
	to { opacity: 1; transform: none; }
}

.${LAYER_CLASS} {
	animation: dsh-ui-polish-layer-in ${LAYER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
	animation-delay: var(--dsh-ui-polish-ld, 0ms);
}

@keyframes dsh-ui-polish-row-in {
	from { opacity: 0; transform: translate3d(0, -${ROW_DROP_PX}px, 0); }
	to { opacity: 1; transform: translate3d(0, 0, 0); }
}

html[${TRAJ_PLAY}="play"] ${ROW_SEL} {
	transform-origin: top center;
	animation: dsh-ui-polish-row-in var(--dsh-ui-polish-rd, ${ROW_MS}ms) cubic-bezier(0.22, 0.61, 0.36, 1) backwards;
	animation-delay: var(--dsh-ui-polish-d, 0ms);
}

${ROW_SEL}.${ROW_NEW_CLASS} {
	animation: dsh-ui-polish-row-in ${ROW_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1) backwards;
	animation-delay: var(--dsh-ui-polish-d, 0ms);
}

@keyframes dsh-ui-polish-cell-in {
	from { opacity: 0; transform: translate3d(0, -6px, 0); }
	to { opacity: 1; transform: none; }
}

.${CELL_CLASS} {
	animation: dsh-ui-polish-cell-in ${CELL_MS}ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

@keyframes dsh-ui-polish-table-settle {
	from { opacity: 0.94; transform: scaleY(0.992) translate3d(0, -2px, 0); }
	to { opacity: 1; transform: none; }
}

.${COLLAPSE_CLASS} {
	animation: dsh-ui-polish-table-settle ${COLLAPSE_MS}ms ease-out;
	transform-origin: top center;
}

/* Ctrl+B: the frame ships a grid-template-columns transition but gates it on
   [data-animating], which the shortcut never sets, so collapsing jumps. Keep
   the transition on and switch it off only while the window is resized. */
${FRAME_SEL} {
	transition: grid-template-columns
		var(--ds-transition-duration-slow, ${FRAME_MS_FALLBACK}ms)
		var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1));
}

${FRAME_SEL}[data-dragging],
html[${FREEZE_ATTR}] ${FRAME_SEL} {
	transition: none;
}

/* Settings dialog: nav and content must start on the same line. */
[data-shortcut-modal="settings"] > nav[class*="_nav"] {
	padding-top: 18px;
	gap: 10px;
}

[data-shortcut-modal="settings"] > [class*="_content"] > [class*="_options"] {
	padding-bottom: 20px;
}

/* Settings items: loosen the vertical rhythm between rows. */
[data-shortcut-modal="settings"] [class*="_navList"] {
	gap: 2px;
}

[data-shortcut-modal="settings"] [class*="_navCell"] {
	height: 32px;
	padding-top: 5px;
	padding-bottom: 5px;
}

[data-shortcut-modal="settings"] [class*="_row"] {
	padding-top: 10px;
	padding-bottom: 10px;
}

/* Settings nav: the active cell repainted its own background instantly, so
   switching pages looked like a hard cut. A pseudo-element slides between
   cells and the page body fades in from the direction of travel. */
[data-shortcut-modal="settings"] [class*="_navList"] {
	position: relative;
	--dsh-ui-polish-set-y: 0px;
	--dsh-ui-polish-set-h: 32px;
}

[data-shortcut-modal="settings"] [class*="_navList"]::before {
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	height: var(--dsh-ui-polish-set-h);
	border-radius: var(--dsw-radius-md, 8px);
	background: var(--dsw-specific-sidebar-nav-item-active);
	transform: translate3d(0, var(--dsh-ui-polish-set-y), 0);
	transition:
		transform 280ms cubic-bezier(0.16, 1, 0.3, 1),
		height 200ms cubic-bezier(0.16, 1, 0.3, 1);
	opacity: 0;
	pointer-events: none;
}

[data-shortcut-modal="settings"][data-dsh-ui-polish-set] [class*="_navList"]::before {
	opacity: 1;
}

[data-shortcut-modal="settings"][data-dsh-ui-polish-set="init"] [class*="_navList"]::before {
	transition: none;
}

[data-shortcut-modal="settings"][data-dsh-ui-polish-set] [class*="_navCell"][class*="_active"] {
	background: transparent !important;
}

[data-shortcut-modal="settings"] [class*="_navCell"] {
	position: relative;
	z-index: 1;
}

.dsh-ui-polish-set-in {
	animation: dsh-ui-polish-set-in ${SET_MS}ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

@keyframes dsh-ui-polish-set-in {
	from { opacity: 0; transform: translate3d(0, 8px, 0); }
	to { opacity: 1; transform: none; }
}

/* Left sidebar: tighter vertical rhythm. The column width itself stays
   user-draggable, so only the inner metrics are touched here. The scope is
   the shell that owns a logo row, which no other view root has. */
[class*="_root"]:has(> [class*="_logoRow"]) {
	--dsh-sidebar-inline-padding: 8px;
}

[class*="_root"]:has(> [class*="_logoRow"]) [class*="_logoRow"] {
	height: 44px !important;
	padding-top: 4px !important;
	padding-bottom: 4px !important;
}

/* DSH's sidebar now wraps the button in _newSessionRow and splits the label
   into _newSessionLabelMask / _newSessionLabel / _newSessionShortcut. A bare
   [class*="_newSession"] matches all of them, so the row *and* the label box
   were clamped to 32px inside a 32px button: the label overflowed its line
   box, the icon stopped lining up with the text, and the button read as
   squeezed. Keep the row's rhythm, but size the button only - the same guard
   the Windows caption block below already uses. */
[class*="_root"]:has(> [class*="_logoRow"]) [class*="_newSessionRow"] {
	height: 32px !important;
	margin-bottom: 8px !important;
}

[class*="_root"]:has(> [class*="_logoRow"]) button[class*="_newSession"]:not([class*="Content"]) {
	height: 32px !important;
	padding-top: 4px !important;
	padding-bottom: 4px !important;
}

[class*="_root"]:has(> [class*="_logoRow"]) [class*="_panelList"] {
	gap: 1px !important;
	margin-bottom: 6px !important;
}

[class*="_root"]:has(> [class*="_logoRow"]) [class*="_panelRow"] {
	min-height: 30px !important;
	padding-top: 4px !important;
	padding-bottom: 4px !important;
}

[class*="_root"]:has(> [class*="_logoRow"]) [class*="_sessionRow"] {
	height: 27px !important;
}

[class*="_root"]:has(> [class*="_logoRow"]) [class*="_projectRow"] {
	height: 28px !important;
}

[class*="_root"]:has(> [class*="_logoRow"]) {
	container-type: inline-size;
}

@container (max-width: 248px) {
	[class*="_brandName"] {
		display: none !important;
	}
}

@media (prefers-reduced-motion: reduce) {
	html[${TRAJ_PLAY}="play"] ${ROW_SEL},
	${ROW_SEL}.${ROW_NEW_CLASS},
	.${PANEL_CLASS},
	.${LAYER_CLASS},
	.${CELL_CLASS},
	.${COLLAPSE_CLASS} { animation: none; }
	${TABS_BAR}::before { transition: none; }
}

/* ---- Windows caption row -------------------------------------------------
   The desktop shell pins the rail controls into the 40px titlebar band
   (28px box, top: (band - 28px) / 2) and injects its own menubar host into
   body. The sidebar rhythm above this block forces height 32px plus 4px
   padding on that same button, which pushes the glyph off the band line.
   Restore the shell's own geometry and hold the whole caption row on one
   shared 28px line, whatever the band height happens to be. */
html[data-windows-titlebar] [class*="_root"][class*="_collapsed"] [class*="_logoRow"] {
	height: 0 !important;
	min-height: 0 !important;
	padding-top: 0 !important;
	padding-bottom: 0 !important;
	overflow: hidden !important;
}
html[data-windows-titlebar] [class*="_root"][class*="_collapsed"] button[class*="_newSession"]:not([class*="Content"]),
html[data-windows-titlebar] [class*="_root"][class*="_collapsed"] button[class*="_toggle"] {
	top: calc((var(--dsh-windows-titlebar-height, 40px) - 28px) / 2) !important;
	width: 28px !important;
	min-width: 28px !important;
	height: 28px !important;
	min-height: 28px !important;
	margin: 0 !important;
	padding: 0 !important;
	box-sizing: border-box !important;
	transform: none !important;
}
html[data-windows-titlebar] [class*="_root"][class*="_collapsed"] [class*="_newSessionContent"] {
	width: 100% !important;
	height: 100% !important;
	gap: 0 !important;
}
html[data-windows-titlebar] [class*="_root"][class*="_collapsed"] button[class*="_newSession"] svg,
html[data-windows-titlebar] [class*="_root"][class*="_collapsed"] button[class*="_toggle"] svg {
	display: block !important;
	width: 18px !important;
	height: 18px !important;
}
html[data-windows-titlebar] div[data-windows-menu] {
	top: 0 !important;
	height: var(--dsh-windows-titlebar-height, 40px) !important;
	align-items: center !important;
}
`;

		let firstPlacement = false;
		let trajToken = 0;
		let burstUntil = 0;
		let lastScrollAt = 0;
		let tableObserver = null;
		let observedTable = null;
		let maxIndexSeen = -1;
		let lastTabIndex = -1;

		let panelDir = 1;
		let lastClickAt = 0;
		let lastTableClickAt = 0;

		// ---- tab indicator ------------------------------------------------------

		function readNative(tab) {
			if (!tab || typeof getComputedStyle !== 'function') return null;
			const after = getComputedStyle(tab, '::after');
			const bg = after.backgroundColor || '';
			diag.native = bg || 'none';
			return !(bg === '' || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent');
		}

		function ensureKill(tab) {
			const painted = readNative(tab);
			if (painted === null) return;
			if (!painted) {
				diag.kill = 'css';
				return;
			}
			if (!document.getElementById(KILL_ID)) {
				const s = document.createElement('style');
				s.id = KILL_ID;
				s.textContent = KILL_CSS;
				(document.head || document.documentElement).appendChild(s);
			}
			diag.kill = readNative(tab) ? 'failed' : 'fallback';
		}

		function movePill() {
			try {
				const bars = document.querySelectorAll(TABS_BAR);
				diag.bars = bars.length;
				if (!bars.length) return false;

				let placed = false;
				let activeEl = null;
				for (const bar of bars) {
					const active = bar.querySelector('[role="tab"][aria-selected="true"]');
					if (!active) continue;
					const barRect = bar.getBoundingClientRect();
					const tabRect = active.getBoundingClientRect();
					if (tabRect.width < 1) continue;

					const x = Math.round(tabRect.left - barRect.left);
					const w = Math.max(8, Math.round(tabRect.width));
					const y = Math.round(tabRect.bottom - barRect.top) - THICKNESS + 1;

					bar.style.setProperty('--dsh-ui-polish-pill-x', x + 'px');
					bar.style.setProperty('--dsh-ui-polish-pill-w', w + 'px');
					bar.style.setProperty('--dsh-ui-polish-pill-y', y + 'px');
					placed = true;
					activeEl = active;
					diag.moves += 1;
					diag.last = {
						at: new Date().toISOString(),
						label: String((active.textContent || '').trim()).slice(0, 24),
						x,
						y,
						w
					};
				}
				if (!placed) return false;

				ensureKill(activeEl);

				if (!firstPlacement) {
					firstPlacement = true;
					const root = document.documentElement;
					requestAnimationFrame(() => root.setAttribute(MOVE, 'on'));
				}
				return true;
			} catch (e) {
				diag.errors.push(String(e));
				return false;
			}
		}

		// ---- view panel entrance ------------------------------------------------

		function pickPanel(area) {
			let el = area.firstElementChild;
			let depth = 0;
			while (el && depth < 6) {
				const r = el.getBoundingClientRect();
				if (r.width > 20 && r.height > 20) return el;
				const next = el.firstElementChild;
				if (!next) return el;
				el = next;
				depth += 1;
			}
			return el;
		}

		/**
		 * Some views (the trajectory one) put several sibling bands inside the view
		 * root: a toolbar, the timeline overview, the ledger. Animating only the
		 * root makes all three appear as one flat block, so when that shape is
		 * recognised the bands are staggered instead. The test uses the semantic
		 * role of the first child, not the hashed class names.
		 */
		function trailLayers(el) {
			try {
				if (!el || !el.children || el.children.length < 2) return [];
				const first = el.children[0];
				if (!first || first.getAttribute('role') !== 'toolbar') return [];
				const out = [];
				for (const child of el.children) {
					if (out.length >= LAYER_MAX) break;
					const r = child.getBoundingClientRect();
					if (r.height > 4) out.push(child);
				}
				return out.length >= 2 ? out : [];
			} catch {
				return [];
			}
		}

		function playPanel() {
			try {
				const areas = document.querySelectorAll(VIEW_AREA);
				let played = 0;

				for (const area of areas) {
					const el = pickPanel(area);
					if (!el || !el.classList) continue;

					const layers = trailLayers(el);
					played += 1;
					diag.panelTarget =
						el.tagName.toLowerCase() + '.' + String(el.className || '').slice(0, 40);

					if (layers.length >= 2) {
						diag.panelLayers = layers.length;
						layers.forEach((node, i) => {
							node.classList.remove(LAYER_CLASS);
							node.style.setProperty('--dsh-ui-polish-ld', i * LAYER_STEP_MS + 'ms');
							node.style.setProperty('--dsh-ui-polish-lx', panelDir * (10 + i * 6) + 'px');
							void node.offsetWidth;
							node.classList.add(LAYER_CLASS);
						});
						setTimeout(() => {
							for (const node of layers) {
								node.style.removeProperty('--dsh-ui-polish-lx');
								try {
									node.classList.remove(LAYER_CLASS);
									node.style.removeProperty('--dsh-ui-polish-ld');
								} catch {}
							}
						}, LAYER_MS + (layers.length - 1) * LAYER_STEP_MS + 80);
					} else {
						diag.panelLayers = 0;
						el.style.setProperty('--dsh-ui-polish-px', panelDir * 16 + 'px');
						el.classList.remove(PANEL_CLASS);
						void el.offsetWidth;
						el.classList.add(PANEL_CLASS);

						const node = el;
						setTimeout(() => {
							try {
								node.classList.remove(PANEL_CLASS);
								node.style.removeProperty('--dsh-ui-polish-px');
							} catch {}
						}, PANEL_MS + 80);
					}
				}

				if (played) {
					diag.panelPlays += 1;
					setTimeout(() => {
						try {
							const area = document.querySelector(VIEW_AREA);
							const el = area && pickPanel(area);
							if (!el) {
								diag.panelAnim = 'no-el';
								return;
							}
							const probe =
								el.querySelector('.' + LAYER_CLASS) ||
								(el.classList.contains(PANEL_CLASS) ? el : null);
							diag.panelAnim = probe ? getComputedStyle(probe).animationName : 'faded';
						} catch {}
					}, 40);
				}
			} catch (e) {
				diag.errors.push(String(e));
			}
		}

		// ---- trajectory rows ----------------------------------------------------

		function unwrapRows() {
			for (const row of document.querySelectorAll(ROW_SEL)) {
				row.style.removeProperty('--dsh-ui-polish-d');
			}
			document.documentElement.removeAttribute(TRAJ_PLAY);
		}

		function stepFor(count) {
			if (count < 2) return 0;
			const raw = Math.round(SPREAD_MS / (count - 1));
			return Math.max(STEP_MIN_MS, Math.min(STEP_MAX_MS, raw));
		}

		/**
		 * Expanding a collapsed block can bring back hundreds of rows. The 340ms
		 * entrance spread is far too long for content the user has already seen, so
		 * batches get a much tighter window instead.
		 */
		function batchStep(count) {
			if (count < 2) return 0;
			const raw = Math.round(BATCH_SPREAD_MS / (count - 1));
			return Math.max(BATCH_STEP_MIN_MS, Math.min(BATCH_STEP_MAX_MS, raw));
		}

		function raiseWatermark(rows) {
			for (const row of rows) {
				const idx = Number(row.dataset.recordIndex);
				if (Number.isFinite(idx) && idx > maxIndexSeen) maxIndexSeen = idx;
			}
		}

		function playRows(token) {
			if (token !== trajToken) return;
			if (lastClickAt) diag.trajLatencyMs = Date.now() - lastClickAt;

			const rows = Array.from(document.querySelectorAll(ROW_SEL));
			if (!rows.length) return;

			unwrapRows();

			const step = stepFor(rows.length);
			rows.forEach((row, i) => {
				row.classList.remove(ROW_NEW_CLASS);
				row.style.setProperty('--dsh-ui-polish-d', i * step + 'ms');
			});

			raiseWatermark(rows);

			diag.trajPlays += 1;
			diag.trajRows = rows.length;
			diag.trajStep = step;

			void document.documentElement.offsetWidth;
			document.documentElement.setAttribute(TRAJ_PLAY, 'play');

			const total = ROW_MS + (rows.length - 1) * step + 80;
			burstUntil = Date.now() + total;

			setTimeout(() => {
				if (token === trajToken) unwrapRows();
			}, total);
		}

		/** One row appended while the turn is streaming: same look, no stagger. */
		function animateLiveRow(row) {
			try {
				row.classList.remove(ROW_NEW_CLASS);
				row.style.setProperty('--dsh-ui-polish-d', '0ms');
				void row.offsetWidth;
				row.classList.add(ROW_NEW_CLASS);
				diag.trajLive += 1;
				setTimeout(() => {
					try {
						row.classList.remove(ROW_NEW_CLASS);
						row.style.removeProperty('--dsh-ui-polish-d');
					} catch {}
				}, ROW_MS + 90);
			} catch (e) {
				diag.errors.push(String(e));
			}
		}

		/**
		 * A block of rows appeared or came back (expand, or a subtree re-render):
		 * stagger just those rows, leave the rest of the table alone.
		 */
		function animateBatch(rows) {
			try {
				const ordered = rows.slice().sort((a, b) => {
					const ai = Number(a.dataset.recordIndex);
					const bi = Number(b.dataset.recordIndex);
					return (Number.isFinite(ai) ? ai : 0) - (Number.isFinite(bi) ? bi : 0);
				});
				const step = batchStep(ordered.length);
				ordered.forEach((row, i) => {
					row.classList.remove(ROW_NEW_CLASS);
					row.style.setProperty('--dsh-ui-polish-d', i * step + 'ms');
					row.style.setProperty('--dsh-ui-polish-rd', ROW_MS_BATCH + 'ms');
					void row.offsetWidth;
					row.classList.add(ROW_NEW_CLASS);
				});
				raiseWatermark(ordered);
				diag.trajBatch += 1;

				const ms = ROW_MS_BATCH + Math.max(0, ordered.length - 1) * step + 90;
				setTimeout(() => {
					for (const row of ordered) {
						row.style.removeProperty('--dsh-ui-polish-rd');
						try {
							row.classList.remove(ROW_NEW_CLASS);
							row.style.removeProperty('--dsh-ui-polish-d');
						} catch {}
					}
				}, ms);
			} catch (e) {
				diag.errors.push(String(e));
			}
		}

		/**
		 * Collapse removes the tool-call rows and leaves a single summary row that
		 * carries no data-record-index, so there is no per-row entrance to play.
		 * Settle the table region instead of letting it snap.
		 */
		function settleTable() {
			try {
				const holder = observedTable;
				const table =
					(holder && holder.matches && holder.matches('table')
						? holder
						: holder && holder.querySelector
							? holder.querySelector('table')
							: null) ||
					(document.querySelector(ROW_SEL) || {}).closest?.('table');
				if (!table || !table.classList) return;
				table.classList.remove(COLLAPSE_CLASS);
				void table.offsetWidth;
				table.classList.add(COLLAPSE_CLASS);
				diag.trajSettle += 1;
				setTimeout(() => {
					try {
						table.classList.remove(COLLAPSE_CLASS);
					} catch {}
				}, COLLAPSE_MS + 40);
			} catch (e) {
				diag.errors.push(String(e));
			}
		}

		function collectRows(nodes, out) {
			for (const node of nodes) {
				if (!node || node.nodeType !== 1) continue;
				if (node.matches && node.matches(ROW_SEL)) out.push(node);
				else if (node.querySelectorAll) {
					for (const inner of node.querySelectorAll(ROW_SEL)) out.push(inner);
				}
			}
		}

		/**
		 * Content that appears *inside* a row (a call body, a thinking block, a JSON
		 * subtree) is not a new row, so the row stagger cannot reach it. Find the
		 * inserted element with a real box and fade it in. The click window is what
		 * keeps streamed content from flickering.
		 */
		function revealEls(els) {
			for (const el of els) {
				try {
					if (!el.isConnected) continue;
					if (el.closest('[data-running]')) continue;
					const r = el.getBoundingClientRect();
					if (r.height < 12) continue;
					el.classList.remove(CELL_CLASS);
					void el.offsetWidth;
					el.classList.add(CELL_CLASS);
					diag.trajReveal += 1;
					const node = el;
					setTimeout(() => {
						try {
							node.classList.remove(CELL_CLASS);
						} catch {}
					}, CELL_MS + 60);
				} catch {}
			}
		}

		function onMutations(records) {
			try {
				const now = Date.now();
				if (now < burstUntil) return; // the entrance burst owns this window

				// A click is user intent: anything that appears right after it is a
				// deliberate expand, no matter how it is rendered.
				const clicked = now - lastTableClickAt < CLICK_WINDOW_MS;
				if (clicked) diag.trajClickWindow += 1;

				if (!clicked && now - lastScrollAt < SCROLL_QUIET_MS) {
					diag.trajSkippedScroll += 1;
					return; // materialised by scrolling, not by new content
				}

				const added = [];
				const removed = [];
				const looseEls = [];
				for (const rec of records) {
					collectRows(rec.addedNodes, added);
					collectRows(rec.removedNodes, removed);
					if (clicked) {
						for (const node of rec.addedNodes) {
							if (node && node.nodeType === 1) looseEls.push(node);
						}
					}
				}

				if (!added.length) {
					// Collapse: rows leave, the summary row that replaces them does not
					// match ROW_SEL, so `added` stays empty.
					if (removed.length >= BULK_THRESHOLD) {
						settleTable();
						return;
					}
					// Inline expansion: the new content lands inside an existing row.
					if (clicked) revealEls(looseEls);
					return;
				}
				if (added.length >= BULK_THRESHOLD) {
					animateBatch(added);
					return;
				}
				if (added.length > 1) {
					animateBatch(added);
					return;
				}

				const row = added[0];
				const idx = Number(row.dataset.recordIndex);
				if (!clicked && Number.isFinite(idx) && idx <= maxIndexSeen) return; // re-mounted record
				if (Number.isFinite(idx)) maxIndexSeen = idx;
				animateLiveRow(row);
			} catch (e) {
				diag.errors.push(String(e));
			}
		}

		function ensureTableObserver() {
			try {
				const sample = document.querySelector(ROW_SEL) ||
					document.querySelector('tr[data-virtual-spacer]');
				const table = sample ? sample.closest('table') : null;
				if (!table) return;
				const container =
					table.closest('[data-conversation-composer-overlay]') || table;
				if (container === observedTable) return;
				if (tableObserver) tableObserver.disconnect();
				tableObserver = new MutationObserver(onMutations);
				tableObserver.observe(container, { childList: true, subtree: true });
				observedTable = container;
			} catch (e) {
				diag.errors.push(String(e));
			}
		}

		function armTrajectory(delayMs) {
			const token = ++trajToken;
			diag.trajArmed += 1;
			const tickMs = 50;
			const budget = 2500;
			let waited = 0;

			const tick = () => {
				if (token !== trajToken) return;
				if (document.querySelector(ROW_SEL)) {
					playRows(token);
					ensureTableObserver();
					return;
				}
				if (waited >= budget) return;
				waited += tickMs;
				setTimeout(tick, tickMs);
			};
			setTimeout(tick, delayMs || 0);
		}

		function nudgePill(tab) {
			try {
				const bar = tab.closest(TABS_BAR);
				if (!bar) return;
				const barRect = bar.getBoundingClientRect();
				const tabRect = tab.getBoundingClientRect();
				if (tabRect.width < 1) return;
				bar.style.setProperty(
					'--dsh-ui-polish-pill-x',
					Math.round(tabRect.left - barRect.left) + 'px'
				);
				bar.style.setProperty(
					'--dsh-ui-polish-pill-w',
					Math.max(8, Math.round(tabRect.width)) + 'px'
				);
				bar.style.setProperty(
					'--dsh-ui-polish-pill-y',
					Math.round(tabRect.bottom - barRect.top) - THICKNESS + 1 + 'px'
				);
				diag.nudges += 1;
			} catch (e) {
				diag.errors.push(String(e));
			}
		}

		function onClick(event) {
			try {
				const node = event.target;
				if (!node || typeof node.closest !== 'function') return;

				// Any click in the trajectory opens a short intent window during which
				// newly inserted content is treated as a deliberate expand.
				if (node.closest('table') || node.closest('[data-conversation-composer-overlay]')) {
					lastTableClickAt = Date.now();
					ensureTableObserver();
				}

				const tab = node.closest('[role="tab"]');
				if (!tab || !tab.closest(TABS_BAR)) return;

				diag.clicks += 1;
				const tabBar = tab.closest(TABS_BAR);
				const tabList = tabBar
					? Array.from(tabBar.querySelectorAll('[role="tab"]'))
					: [];
				const tabIndex = tabList.indexOf(tab);
				if (tabIndex >= 0) {
					panelDir = lastTabIndex >= 0 && tabIndex < lastTabIndex ? -1 : 1;
					lastTabIndex = tabIndex;
				}

				lastClickAt = Date.now();
			nudgePill(tab);
				requestAnimationFrame(() =>
					requestAnimationFrame(() => {
						movePill();
						playPanel();
					})
				);
				armTrajectory(0);
			} catch (e) {
				diag.errors.push(String(e));
			}
		}

		function apply(ctx) {
			if (typeof document === 'undefined' || !document.head) return;

			if (!document.getElementById(STYLE_ID)) {
				const style = document.createElement('style');
				style.id = STYLE_ID;
				style.textContent = CSS;
				document.head.appendChild(style);
			
			if (!document.getElementById(MAID_CALM_ID)) {
				const calm = document.createElement('style');
				calm.id = MAID_CALM_ID;
				calm.textContent = MAID_CALM_CSS;
				document.head.appendChild(calm);
			}}

			document.documentElement.dataset.dshUiPolish = VERSION;
			window.__dshUiPolish = diag;

			try {
				installCalmSettings(ctx);
			} catch (error) {
				diag.errors.push(String(error));
			}

			setTimeout(() => {
				try {
					const frame = document.querySelector(FRAME_SEL);
					diag.frameTransition = frame
						? getComputedStyle(frame).transitionProperty
						: 'no-frame';
				} catch {}
			}, 800);

			function settingsTarget(host) {
				let node = host;
				for (let depth = 0; depth < 3; depth += 1) {
					let next = null;
					for (let i = 0; i < node.children.length; i += 1) {
						const child = node.children[i];
						if (child.getBoundingClientRect().height > 4) {
							next = child;
							break;
						}
					}
					if (!next) break;
					node = next;
					if (node.children.length === 0) break;
				}
				return node === host ? null : node;
			}

			function settingsPage(host) {
				if (!host) return;
				const picked = settingsTarget(host);
				const target = picked || host;
				diag.setTarget = picked ? picked.tagName.toLowerCase() : 'host';
				target.classList.remove(SET_IN_CLASS);
				void target.offsetWidth;
				target.classList.add(SET_IN_CLASS);
				setTimeout(() => {
					try {
						target.classList.remove(SET_IN_CLASS);
					} catch {}
				}, SET_MS + 80);
				diag.setSwitches += 1;
			}

			function settingsSync(animate) {
				const modal = document.querySelector(SET_MODAL);
				if (!modal) return;
				const list = modal.querySelector(SET_LIST);
				if (!list) return;
				const active = list.querySelector(SET_ACTIVE) || list.querySelector(SET_CELL);
				if (active) {
					const listBox = list.getBoundingClientRect();
					const cellBox = active.getBoundingClientRect();
					const y = Math.round(cellBox.top - listBox.top + list.scrollTop);
					list.style.setProperty('--dsh-ui-polish-set-y', y + 'px');
					list.style.setProperty(
						'--dsh-ui-polish-set-h',
						Math.round(cellBox.height) + 'px'
					);
					diag.setPill = y;
				}
				if (!modal.hasAttribute(SET_STATE)) {
					modal.setAttribute(SET_STATE, 'init');
					requestAnimationFrame(() => {
						try {
							modal.setAttribute(SET_STATE, 'on');
						} catch {}
					});
				}
				settingsAttach();
			}

			let lastPointerAt = 0;
			let setWatch = null;

			function settingsAttach() {
				const modal = document.querySelector(SET_MODAL);
				const host = modal ? modal.querySelector(SET_OPTIONS) : null;
				if (!host) {
					if (setWatch) {
						setWatch.disconnect();
						setWatch = null;
					}
					return;
				}
				if (setWatch && setWatch.host === host) return;
				if (setWatch) setWatch.disconnect();
				const observer = new MutationObserver((records) => {
					let swapped = false;
					for (let i = 0; i < records.length; i += 1) {
						if (records[i].target !== host) continue;
						const added = records[i].addedNodes;
						if (added && added.length > 0) swapped = true;
					}
					if (!swapped) return;
					if (lastPointerAt > 0) {
						diag.setMountMs = Math.round(performance.now() - lastPointerAt);
					}
					try {
						settingsSync(false);
					} catch (error) {
						diag.errors.push(String(error));
					}
					requestAnimationFrame(() => {
						try {
							settingsPage(host);
						} catch (error) {
							diag.errors.push(String(error));
						}
					});
				});
				observer.observe(host, { childList: true });
				setWatch = { host, disconnect: () => observer.disconnect() };
			}

			function scheduleSettings(animate) {
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						try {
							settingsSync(animate);
						} catch (error) {
							diag.errors.push(String(error));
						}
					});
				});
			}

			document.addEventListener('pointerdown', (event) => {
				const target = event.target;
				if (!target || !target.closest || !target.closest(SET_MODAL)) return;
				lastPointerAt = performance.now();
				scheduleSettings(false);
			}, true);

			document.addEventListener('keydown', (event) => {
				if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
				if (!document.querySelector(SET_MODAL)) return;
				lastPointerAt = performance.now();
				scheduleSettings(false);
			}, true);

			setInterval(() => {
				try {
					settingsSync(false);
					settingsAttach();
				} catch (error) {
					diag.errors.push(String(error));
				}
			}, 700);

			document.addEventListener('click', onClick, true);

			const settle = setInterval(() => {
				if (movePill()) {
					clearInterval(settle);
					ensureTableObserver();
					try {
						console.log('[dsh-ui-polish] ready ' + VERSION + ' kill=' + diag.kill);
					} catch {}
				}
			}, 400);

			addEventListener('resize', movePill);

			// A resizing window must stay instant; only deliberate layout changes
			// (Ctrl+B, panel open/close) get the transition.
			let freezeTimer = 0;
			addEventListener('resize', () => {
				const root = document.documentElement;
				root.setAttribute(FREEZE_ATTR, '');
				clearTimeout(freezeTimer);
				freezeTimer = setTimeout(() => {
					try {
						root.removeAttribute(FREEZE_ATTR);
					} catch {}
				}, 260);
			});

			document.addEventListener(
				'scroll',
				(e) => {
					lastScrollAt = Date.now();
					const t = e.target;
					if (t && t.nodeType === 1 && t.matches && t.closest && t.closest(TABS_BAR)) movePill();
				},
				true
			);

			armTrajectory(150);
		}

		exports.name = name;
		exports.inject = [];
		exports.apply = apply;
		return module.exports;
	}
});
