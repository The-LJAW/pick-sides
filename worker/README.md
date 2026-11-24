# Pick Sides server

A Cloudflare Worker with a D1 database. It adds counters, crowd data, group
tables, make-your-own lists and AI roasts to the app. The app works without it.

## Run locally

    npx wrangler dev --port 8787

The app at http://localhost:4173 talks to this address automatically.

## Put it online (once)

    npx wrangler login                 # opens Cloudflare in your browser
    npx wrangler d1 create pick-sides  # copy the database_id into wrangler.toml
    npx wrangler deploy                # prints the server's address

Then put that address in `js/config.js` as `LIVE_API` and publish the app.
The database tables are created automatically on first use.

## AI roasts (optional)

    npx wrangler secret put ANTHROPIC_API_KEY

Each new ranking costs one short Claude request; identical rankings reuse the
stored roast, and `ROAST_DAILY_CAP` in wrangler.toml limits requests per day.

## See the numbers

Open the app at `#/stats`.

## Party Pack payments (Stripe)

Until these are set, every table gets the Party Pack free ("free preview")
and tables have room for 60. Once STRIPE_SECRET_KEY is set, free tables hold
8 people and the Party Pack costs PARTY_PACK_CENTS (in wrangler.toml).

1. Create a Stripe account and copy the secret key (use a test key first).

       npx wrangler secret put STRIPE_SECRET_KEY

2. In Stripe, add a webhook endpoint for the event `checkout.session.completed`:

       https://<this server's address>/api/stripe/webhook

   Copy its signing secret:

       npx wrangler secret put STRIPE_WEBHOOK_SECRET

Stripe test card: 4242 4242 4242 4242, any future date, any CVC.
