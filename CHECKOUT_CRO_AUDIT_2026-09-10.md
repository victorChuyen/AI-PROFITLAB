# Checkout CRO audit — OPC AI PROFITLAB

## Finding fixed

The live checkout hid the entire purchasing action whenever automated VietQR was disabled. That is correct payment safety behavior but a conversion dead end: the visitor saw a price and no action except a text Zalo link.

The page now shows a prominent, product-specific Zalo purchase CTA in that state. It explains that automated VietQR is being tested, preserves the secure fail-closed backend, and gives the visitor a clear next step.

## Benchmark patterns adapted

The Monetise offer page uses a clear repeated CTA, a concrete offer stack, proof, objection handling, and a support path. OPC should adapt the structure rather than copy unverified revenue, guarantee, scarcity, or testimonial claims.

Implemented for checkout:

1. A single next action in every state: create VietQR when enabled; contact Victor when disabled.
2. A short visible list of Starter deliverables before a visitor reaches a form.
3. Plain payment-state language and a no-sensitive-data reassurance.
4. Product-specific messaging for Starter and the separate 1:1 implementation service.

## Day 4 funnel framework applied

The Day 4 notes reinforce a value ladder rather than a single-product checkout. The checkout now communicates the safe customer path without adding unverified urgency or outcome claims:

| Customer stage | OPC action | What reduces friction |
|---|---|---|
| First purchase | Starter at 500.000đ | Short playbook, reusable Skills and a direct support CTA if automation is unavailable. |
| Optional expansion | Prompts and video scripts add-on | Presented only after the visitor elects the Starter checkout flow. |
| Higher-touch help | Scope discussion for 1:1 implementation | No payment request before deliverables, timeline and scope are agreed. |

This applies the Day 4 Value Gap principles: reduce time-to-first-step with a short playbook, reduce effort with reusable assets, and reduce risk with a real support path plus verifiable proof from live builds. Price is shown before the visitor commits to contact.

## Remaining work before automated payment opens

1. Rotate former provider credentials and store fresh values only as Cloudflare Pages Secrets.
2. Bind the private R2 `PRODUCTS` bucket and upload the final Starter ZIP.
3. Point SePay webhook to the production endpoint with the fresh key.
4. Set `CHECKOUT_ENABLED=true` only after a real end-to-end test: order, QR, webhook, paid status, delivery, support record.
5. Add proof only when it is verifiable: named customer permission, dated result, source screenshot, and no earnings promise.

## Sources consulted

- https://www.monetise.com/offer
- https://event.monetise.com/lp-1-o
- https://consulting.com/side-hustle-profit-calculator/calculator
