# Payments
Flow: create order → `POST /api/payments/:orderId/initiate` → redirect/POST to gateway → gateway calls `/api/payments/{jazzcash|easypaisa}/callback` → hash verified, amount + reference matched → payment & order marked Paid (idempotent). Any mismatch leaves it Pending/Failed.
Without credentials `initiate` returns 503 and the order stays Pending. Enable a method in Admin > Settings (`paymentMethods`) after configuring env vars.
JazzCash: HTTP-POST integration (HMAC-SHA256 secure hash over salt + sorted non-empty pp_* fields), amounts in paisa. Test in the sandbox with your merchant credentials and confirm field names/versions against JazzCash's current docs.
EasyPaisa: implemented with a generic HMAC-SHA256 of sorted key=value pairs (`merchantHashedReq`). Replace `easypaisaHash` in `apps/api/src/modules/payments/infrastructure/signing.ts` with the scheme from your EasyPaisa merchant docs, and prefer a server-side transaction-status inquiry before go-live.
Bank transfer: instructions from settings; customer submits a reference; admin verifies and marks Paid.
COD: Paid automatically when the order is Delivered.
Set the callback URLs in each merchant portal to `${API_URL}/api/payments/<provider>/callback` (must be public HTTPS).
