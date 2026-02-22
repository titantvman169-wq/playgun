# Publish PlayGun at www.playgun.net

Follow these steps to put the game live on **www.playgun.net** using Netlify.

---

## 1. Deploy to Netlify

### Option A — Netlify CLI (fastest)

1. Install and log in (one-time):
   ```bash
   npm install -g netlify-cli
   netlify login
   ```

2. In the project folder:
   ```bash
   cd C:\Users\yusuf\shooter-game
   netlify deploy --dir=. --prod
   ```

3. When asked **“Create a new site?”** choose **Yes** and pick your team. Note the site URL (e.g. `random-name-123.netlify.app`).

### Option B — GitHub + Netlify

1. Push the project to GitHub (create a repo, then):
   ```bash
   cd C:\Users\yusuf\shooter-game
   git init
   git add .
   git commit -m "PlayGun initial"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → **GitHub** → select the repo.

3. Settings:
   - **Build command:** leave empty  
   - **Publish directory:** `.`  
   Click **Deploy site**.

---

## 2. Add custom domain www.playgun.net

1. In Netlify: open your site → **Domain management** (or **Site configuration** → **Domain management**).

2. Click **Add custom domain** or **Add domain alias**.

3. Enter: **www.playgun.net** → **Verify** → **Add domain**.

4. Netlify will show how to point DNS to Netlify. You have two options.

---

## 3. Point DNS to Netlify

You must have **playgun.net** at a registrar (GoDaddy, Namecheap, Cloudflare, Google Domains, etc.). Use one of these:

### Option A — Netlify DNS (recommended)

1. In Netlify domain settings, choose **Set up Netlify DNS** for this domain.

2. At your **domain registrar** (where you bought playgun.net):
   - Find **Nameservers** / **DNS** settings.
   - Replace the current nameservers with the ones Netlify gives you, e.g.:
     - `dns1.p01.nsone.net`
     - `dns2.p01.nsone.net`
     - (Netlify will show the exact list.)

3. Save. Propagation can take from a few minutes up to 24–48 hours.

### Option B — CNAME at your current DNS

If you keep your registrar’s DNS (don’t change nameservers):

1. In your registrar’s **DNS** or **DNS records** for **playgun.net**, add:

   | Type  | Name/Host | Value/Target                    |
   |-------|-----------|----------------------------------|
   | CNAME | www       | **your-site-name.netlify.app**  |

   Replace `your-site-name` with your real Netlify site name (e.g. `amazing-playgun.netlify.app`).

2. Optional: to have **playgun.net** (no www) open the site too, add a redirect in Netlify:
   - **Domain management** → **Options** → **Add redirect**  
   - From: `https://playgun.net`  
   - To: `https://www.playgun.net`  
   - Status: **301**

   And at your DNS add an **A** record for `@` (or `playgun.net`) pointing to Netlify’s load balancer IP (Netlify shows this in the domain setup).

---

## 4. HTTPS

After DNS is correct, Netlify will issue a free SSL certificate for **www.playgun.net**. Enable **Force HTTPS** in **Domain management** → **HTTPS** if it isn’t already on.

---

## 5. Check

- Visit **https://www.playgun.net** — the PlayGun game should load.
- If it doesn’t, wait a bit for DNS and SSL, then clear cache or try another browser/device.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Deploy site with Netlify CLI or GitHub. |
| 2 | In Netlify, add custom domain **www.playgun.net**. |
| 3 | At your registrar: either switch to Netlify nameservers or add CNAME **www** → **yoursite.netlify.app**. |
| 4 | Wait for DNS/SSL, then open https://www.playgun.net. |
