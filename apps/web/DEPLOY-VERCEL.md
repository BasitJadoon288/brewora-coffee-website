# BREWORA Web — Vercel par deploy

**Pehle API deploy ho chuki ho** (api folder ki DEPLOY-VERCEL.md dekhein) aur `https://YOUR-API.vercel.app/api/health` kaam kar raha ho.

1. Is `web` folder ko GitHub repo mein push karein (`.env.local` push na karein — `.gitignore` laga hai).
2. Vercel → Add New → Project → repo chunen → Framework = **Next.js** (automatic) → Root Directory = web folder.
3. **Deploy se PEHLE** Environment Variables daalein:
   - `API_INTERNAL_URL` = `https://YOUR-API.vercel.app`  (aakhir mein `/` nahi)
   - `NEXT_PUBLIC_SITE_URL` = `https://YOUR-WEB.vercel.app`
   (Agar `API_INTERNAL_URL` na ho to build jaan boojh kar fail hoti hai, taake website galat jagah na chale.)
4. Deploy dabayen.
5. Web ka URL mil jaye to **API project** mein `CUSTOMER_URL` = web ka URL daal kar API ko **Redeploy** karein.
6. Test: homepage → login (admin) → /admin → ek image upload karein.

## Agar kuch na chale
- Products/homepage khali: `API_INTERNAL_URL` galat hai ya API par `npm run seed` nahi chala.
- Login ke baad foran logout: API par `CUSTOMER_URL` web ke URL se match nahi karta.
- Image upload fail: API par `CLOUDINARY_*` variables set nahi.
- Env variable badalne ke baad hamesha **Redeploy** karein (web par rewrites build ke waqt bante hain).
- Homepage par `/assets/...` ki default images nahi hain (public folder nahi tha). Admin se apni images upload karein, tab tak coffee wali placeholder tile dikhegi.
