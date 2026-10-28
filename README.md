# Skill-first-payment-fireworks

About three seconds of fireworks and a "恭喜升級 Pro" dialog, shown **once** when a customer returns to your site after their **first** successful payment. Dependency-free vanilla JS, any payment provider, any framework. MIT licensed.

一次性的付款成功慶祝動畫：客戶**首次**付款完成回到網站時，放約 3 秒煙火並跳出「恭喜升級 Pro」視窗；續訂扣款不會觸發。

## Use it with an AI assistant

This repo is an AI skill (see [`SKILL.md`](./SKILL.md)). With Claude Code, clone it into your skills folder (the folder name must match the skill name):

```bash
git clone https://github.com/jimmyLC/Skill-first-payment-fireworks ~/.claude/skills/first-payment-fireworks
```

(or into a project's `.claude/skills/`) and ask: *"Add the first-payment fireworks to my checkout return page."* Other assistants can read `SKILL.md` directly; it contains the full integration steps, rules and checklist.

## Use it by hand

```js
import { celebrateFirstPayment } from './src/celebrate.js';

celebrateFirstPayment({
  dialog: document.getElementById('pro-dlg'),               // markup in examples/dialog.html
  isActive: async () => (await (await fetch('/api/me')).json()).billing.status === 'active',
});
```

1. Have your payment provider return to `…/dashboard?pay=return`.
2. `isActive` asks **your backend** whether the payment is really confirmed (never trust the URL).
3. On the first confirmed return it opens the dialog and runs `fireworks({ host: dialog })`, then removes `?pay=return` so reloads don't replay it.

Just the animation: `import { fireworks } from './src/fireworks.js'; fireworks();`

## Demo

```bash
npx serve .
# open http://localhost:3000/examples/demo.html
# or http://localhost:3000/examples/demo.html?pay=return for the full return-from-checkout flow
```

## Files

- `src/fireworks.js`: canvas fireworks. Options: `host`, `shells` (8), `duration` (3000 ms), `colors`. Respects `prefers-reduced-motion`.
- `src/celebrate.js`: return-marker detection, polling your backend, dialog + fireworks.
- `examples/`: dialog markup, styles and a runnable demo.
- `SKILL.md`: instructions for AI assistants.

Extracted from [UTMory](https://utmory.cc), where it runs after the first ECPay subscription payment.

## License

[MIT](./LICENSE)
