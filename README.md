# Neon Shooter — Multiplayer & Agent Select

Web-based top-down shooter with **multiplayer** (Supabase), **Valorant-style agent select**, and unique agent abilities.

## Features

- **Multiplayer:** Create or join a room with a 6-letter code. Lobby shows all players; host starts the game.
- **Agent select (Valorant-style):** Before the match, pick one of 6 agents. Timer counts down; lock in or wait. No duplicate picks in multiplayer.
- **6 agents** with 3 abilities each (E, Q, R): Phoenix, Jett, Sage, Viper, Reyna, Cypher. Each has heal, shield, dash, speed, damage boost, or zone effects.
- **Weapons, enemies, bosses, power-ups, wave upgrades** — same as before.

## Controls

- **W A S D** — Move  
- **Mouse** — Aim · **Click** / **Space** — Shoot  
- **E, Q, R** — Agent abilities (cooldowns)  
- **1–4** — Weapon (when unlocked)  

## Multiplayer setup (optional)

1. Create a free project at [supabase.com](https://supabase.com).
2. Copy `config.example.js` to `config.js`.
3. In Supabase: **Settings → API** — copy **Project URL** and **anon public** key into `config.js`:
   ```js
   window.SUPABASE_URL = 'https://xxxx.supabase.co';
   window.SUPABASE_ANON_KEY = 'your-anon-key';
   ```
4. Without `config.js` (or with placeholders), only **Play Solo** is available.

## Run locally

```bash
npx serve .
# or
python -m http.server 8080
```

Open http://localhost:8080

## Publish to Netlify

- **CLI:** `netlify deploy --dir=. --prod` (after `netlify login`).
- **GitHub:** Push the repo, then in Netlify: Add new site → Import from Git → select repo → Deploy. Publish directory: `.`

**Using www.playgun.net:** See **[DEPLOY.md](DEPLOY.md)** for step-by-step instructions to deploy and attach the custom domain www.playgun.net.

## License

MIT
