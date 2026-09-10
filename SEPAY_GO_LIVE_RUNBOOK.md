# SePay go-live — go.breaths.live

This checklist activates bank-transfer checkout without exposing credentials in Git or chat.

## 1. Create the SePay webhook

- Name: `go-breaths-live`
- URL: `https://go.breaths.live/api/sepay`
- Transaction type: **Tiền vào**
- Data format: **JSON**
- Select the actual BIDV receiving account (`96247688688`) in the account step.
- Security: **API Key**. Generate a new key and store it only as a Cloudflare secret.
- Enable failure notification to the operational email address.

Do not select `Tất cả`: an outgoing bank transaction is not a customer payment.

## 2. Add the key to Cloudflare Pages

Cloudflare Dashboard → Workers & Pages → `go-breaths-live` → Settings → Variables and Secrets → Production:

- Secret name: `SEPAY_WEBHOOK_API_KEY`
- Secret value: the fresh SePay API Key

Never add this value to `wrangler.toml`, a Git commit, a screenshot, or chat.

## 3. Prepare paid delivery before enabling checkout

The starter product must have one working fulfilment route before accepting payments:

1. Preferred: private Cloudflare R2 object `products/starter.zip` in the `opc-products` bucket.
2. Temporary: the existing approved Google Drive VIP access link, tested while signed out.

Enable Cloudflare R2 on the account before creating the bucket. Do not turn on checkout while neither route works.

## 4. Enable checkout and test

After the secret and delivery asset are confirmed:

- Change `CHECKOUT_ENABLED` to `true` in the deployment configuration and deploy.
- Open `/checkout?sku=starter` in an incognito window.
- Confirm the QR includes the exact 500,000 VND amount and a unique `DH…` transfer code.
- Use SePay's webhook test or a real test transaction matching that code and amount.
- Confirm `/api/order/{code}` changes from `pending` to `paid`, and the thank-you page displays the delivery path.

## Incident rule

If a credential appeared in a chat, source file, GitHub commit, image, or public page, revoke it at the source and replace it in Cloudflare Secrets before resuming tests.
