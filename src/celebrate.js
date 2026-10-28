import { fireworks } from './fireworks.js';

/**
 * Celebrates a FIRST successful payment when the shopper lands back on your site.
 *
 * Call it once on page load. It only acts when the URL carries the "returned from checkout" marker
 * (default `?pay=return`), strips the marker so a refresh or the back button never replays it, and then
 * waits until YOUR SERVER says the subscription/payment is really active before celebrating.
 *
 * It never fires for renewals: a renewal is charged by the payment provider in the background, the shopper
 * never comes back through your return URL, so there is no page load to hang a celebration on.
 *
 * @param {object} o
 * @param {() => Promise<boolean>} o.isActive  Ask your own backend whether the payment/subscription is active.
 *        Never trust the return URL alone: anyone can type ?pay=return.
 * @param {HTMLDialogElement} o.dialog         The congratulations dialog (see examples/dialog.html).
 * @param {() => void} [o.onActive]            Runs just before celebrating, e.g. refresh the plan card.
 * @param {() => void} [o.onPending]           Called once when polling starts ("payment processing...").
 * @param {() => void} [o.onTimeout]           Called if the backend never reported active.
 * @param {string} [o.param='pay']
 * @param {string} [o.value='return']
 * @param {number} [o.pollMs=2000]             Provider webhooks can land a few seconds after the browser does.
 * @param {number} [o.maxPolls=8]
 * @returns {Promise<'celebrated'|'timeout'|'skipped'>}
 */
export async function celebrateFirstPayment({
  isActive, dialog, onActive, onPending, onTimeout, param = 'pay', value = 'return', pollMs = 2000, maxPolls = 8,
}) {
  const url = new URL(location.href);
  if (url.searchParams.get(param) !== value) return 'skipped';
  url.searchParams.delete(param);
  history.replaceState(null, '', url.pathname + url.search + url.hash);

  const celebrate = async () => {
    if (onActive) await onActive();
    dialog.showModal();
    fireworks({ host: dialog }); // inside the dialog, so it draws in front of the dialog's content
    return 'celebrated';
  };

  if (await isActive()) return celebrate();
  if (onPending) onPending();
  for (let i = 0; i < maxPolls; i++) {
    await new Promise((resolve) => setTimeout(resolve, pollMs));
    try { if (await isActive()) return celebrate(); } catch { /* keep polling */ }
  }
  if (onTimeout) onTimeout();
  return 'timeout';
}
