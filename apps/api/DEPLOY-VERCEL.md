# BREWORA — Vercel par deploy (API + Web, dono alag Vercel projects)

## Pehle se zaroori (ek baar)
1. **MongoDB Atlas** (free M0) cluster banayen → Database Access mein user banayen → Network Access mein `0.0.0.0/0` allow karein → "Connect > Drivers" se connection string copy karein.
   Localhost MongoDB Vercel par kaam nahi karta.
2. **Cloudinary** (free) account banayen → Cloud name, API key, API secret copy karein. Admin ki image upload ab seedhi Cloudinary par jati hai.
3. Do random secrets banayen (JWT ke liye):
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` (2 baar chalayen)

## Step 1 — API deploy
1. Is `api` folder ko GitHub repo mein push karein (**`.env` push na karein**, `.gitignore` already laga hai).
2. Vercel → Add New → Project → repo chunen → **Root Directory** = api folder → Framework Preset = **Other**.
3. Environment Variables mein `.env.example` wali sab values daalein (MONGODB_URI, JWT_*, CLOUDINARY_*, CUSTOMER_URL, API_URL …).
   `API_URL` abhi khali/temporary rakhein, deploy ke baad apna API URL daal kar Redeploy karein.
4. Deploy. Phir check karein: `https://YOUR-API.vercel.app/api/health` → `{"ok":true}`

## Step 2 — Database mein data/admin daalna (apne computer se, ek baar)
```
cd api
npm install
# .env mein MONGODB_URI = Atlas wali string, ADMIN_EMAIL, ADMIN_PASSWORD daalein
npm run seed
```
(Isse admin account, categories, products aur indexes ban jate hain.)

## Step 3 — Web deploy
1. Web project (Next.js) ko alag repo/project banayen → Framework = Next.js.
2. Environment Variables:
   - `API_INTERNAL_URL` = `https://YOUR-API.vercel.app`   (**deploy se pehle set karein**, rewrites build ke waqt bante hain)
   - `NEXT_PUBLIC_SITE_URL` = `https://YOUR-WEB.vercel.app`
3. Deploy. Phir API project mein `CUSTOMER_URL` = web ka URL daal kar API ko **Redeploy** karein.

## Dhyan rakhein
- Purani local images (`/uploads/...`) Vercel par nahi chalengi. Admin se dobara upload karein (ab Cloudinary par jayengi).
- Rate limit har server instance par alag hota hai (serverless), bohat zyada traffic ke liye Upstash/Redis behtar hai.
- `/api/docs` (Swagger) Vercel par band hai.
- Agar `.env` file kisi ko bheji gayi ho to MongoDB password aur JWT secrets badal dein.
