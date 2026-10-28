---
name: first-payment-fireworks
description: >
  Add a fireworks animation (about 3 seconds) plus a congratulations dialog when a customer comes back to
  the site after their FIRST successful payment or subscription (e.g. "恭喜升級 Pro"). Use when the user asks for
  a payment-success, upgrade, or subscription celebration, confetti or fireworks after checkout. Dependency-free
  vanilla JS (ES modules), works with any payment provider (ECPay, Stripe, PayPal, ...) and any backend or framework.
license: MIT
---

# First-payment fireworks

A celebration that fires **once**, when a shopper returns from the payment page after their first successful
payment, and never for renewals. Two small ES modules and one `<dialog>`; no libraries, no build step.

## What you get

| File | Purpose |
|---|---|
| `src/fireworks.js` | `fireworks({ host, shells, duration, colors })`: canvas fireworks, 8 shells, ~3 s, removes itself. Honors `prefers-reduced-motion`. |
| `src/celebrate.js` | `celebrateFirstPayment({ isActive, dialog, ... })`: detects the return marker, polls your backend, then shows the dialog and fireworks. |
| `examples/dialog.html`, `examples/dialog.css` | The "恭喜升級 Pro" dialog markup and styles to copy and restyle. |
| `examples/demo.html` | Runnable demo, including the real return flow with a fake backend. |

## How to apply it to a project

1. **Copy** `src/fireworks.js` and `src/celebrate.js` next to the project's other front-end modules (keep them together; `celebrate.js` imports `./fireworks.js`). If the project has a build step, import them normally; otherwise load with `<script type="module">`.
2. **Add the dialog.** Paste `examples/dialog.html` into the page that the shopper lands on after paying (dashboard, account, thank-you page) and merge `examples/dialog.css` into the site stylesheet. Change the copy, perks and colors to the product's own. Keep it a native `<dialog>` so `showModal()` handles focus and Esc. Wire the close button: `dialog.querySelector('#pro-dlg-close').addEventListener('click', () => dialog.close())`.
3. **Make the payment provider return to that page with a marker.** The return/success URL must carry `?pay=return` (or pass your own `param`/`value`). Examples: Stripe Checkout `success_url: 'https://site/dashboard?pay=return'`; ECPay `OrderResultURL` should redirect (303) to `/dashboard?pay=return`; PayPal `return_url`.
4. **Expose a server check.** `isActive` must ask YOUR backend whether the payment or subscription is really active, for example `fetch('/api/me').then(r => r.json()).then(me => me.subscription === 'active')`. This is the security-relevant step: see "Rules" below.
5. **Call it once on page load:**

```js
import { celebrateFirstPayment } from './celebrate.js';

celebrateFirstPayment({
  dialog: document.getElementById('pro-dlg'),
  isActive: async () => (await (await fetch('/api/me')).json()).billing.status === 'active',
  onActive: refreshPlanCard,                       // optional: update the UI before the dialog opens
  onPending: () => toast('付款處理中，請稍候…'),   // optional
  onTimeout: () => toast('付款結果還在確認中，稍後重新整理即可'), // optional
});
```

6. **Verify** (see "Checklist"). Do not skip: the first time through, the dialog, the fireworks layering and the "only once" behavior are the parts that go wrong.

## Rules (these are the point; keep them)

- **Never trust the URL.** `?pay=return` only means "the browser came back". Celebrate only after the backend confirms the payment (webhook processed). Anyone can type that URL, and a failed or abandoned checkout can also redirect back.
- **First payment only.** Renewals are charged by the provider in the background; the shopper does not pass through the return URL, so nothing fires. Do not add timers, push events or "payment succeeded" polling elsewhere that would trigger it on renewals.
- **Once per return.** `celebrateFirstPayment` removes the marker from the URL with `history.replaceState` before doing anything, so reload and back never replay it. Keep that.
- **Webhooks can lag the browser** by a few seconds. That is why it polls (default every 2 s, 8 times) instead of checking once. If it times out, tell the user the result is still being confirmed; do not celebrate optimistically.
- **Layering.** Pass `host: dialog` (celebrate.js already does). An open modal `<dialog>` sits in the browser top layer and paints over any `z-index`, so a canvas appended to `<body>` would be hidden behind the dialog's content.
- **Accessibility.** The canvas is `aria-hidden` and `pointer-events: none`; the show is skipped for `prefers-reduced-motion: reduce`. The dialog still appears, so reduced-motion users get the message without the animation.
- **CSP.** Needs no inline scripts, external scripts or images. A canvas and a same-origin module are enough.

## Tuning

`fireworks({ shells: 12, duration: 4000, colors: ['#ffd700', '#ff3b30'] })`. Launches are spread over about 57% of `duration`, so the last burst fades out near the end; if you shorten `duration` a lot, reduce `shells` too.

## Checklist

- [ ] Opening the page without the marker does nothing.
- [ ] Returning with the marker while the backend says "not active" shows the pending message, then the timeout message, and no fireworks.
- [ ] Returning with the marker after a real (or sandbox/test) payment shows the dialog and the fireworks in front of it, and they stop after about 3 s.
- [ ] Reloading afterwards shows nothing (marker removed).
- [ ] A renewal charge does not show anything.
- [ ] With OS "reduce motion" on, the dialog shows but nothing animates.
- [ ] On a phone-width viewport the dialog fits and the fireworks fill the screen.

## Provider notes

- **ECPay (綠界):** the first charge notifies `ReturnURL`; later charges notify `PeriodReturnURL`. `OrderResultURL` is a browser POST from ECPay, so answer it with a `303` redirect to your marker URL; it cannot be a static page. Skip your same-origin/CSRF check for that one path (ECPay is a different origin) and rely on the server-to-server `ReturnURL` notification, verified by CheckMacValue, for the real result.
- **Stripe:** use `success_url` with the marker and confirm via the `checkout.session.completed` / `invoice.paid` webhook, not the redirect.
- Any provider: same pattern. Return URL = a hint for the browser; webhook = the truth.
