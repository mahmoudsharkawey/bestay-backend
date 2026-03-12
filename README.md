# Terminal 1
npm run dev

# Terminal 2
ngrok http --url=inspective-unbred-lois.ngrok-free.dev 3000

Purpose	URL
API base	https://inspective-unbred-lois.ngrok-free.dev/api/v1
Stripe webhook	https://inspective-unbred-lois.ngrok-free.dev/api/v1/payments/webhook




TODOS:
canceled by owner 
I have refactored the landlord.controller.js to use the project's standard httpError and httpResponse patterns.