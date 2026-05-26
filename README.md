# 🌟 Zen Developer Discord Bot

Bot Discord lengkap dengan fitur Verification, Ticket, Music, Leveling, Giveaway, Temp Voice, dan banyak lagi!

## ✨ Fitur

### 🟢 Basic Features
- ✅ **Server Setup** - Auto-create channels, categories, & roles
- ✅ **Verification System** - Button verify untuk member baru
- ✅ **Ticket System** - Multi-category ticket support
- ✅ **Leveling System** - XP & Level dengan leaderboard
- ✅ **Welcome & Goodbye** - Custom embed messages
- ✅ **Auto Roles** - Otomatis beri role saat member join
- ✅ **Custom Rules** - Template rules embed (Gaming/Developer/General/Marketplace)
- ✅ **Custom Embed** - Buat embed message dengan warna & fields

### 🟡 Premium Features
- 🎵 **Music System** - Play, queue, skip, loop, pause dari YouTube
- 🎉 **Giveaway System** - Start, end, reroll giveaways
- 🎮 **Mini Games** - RPS, Coinflip, Dice, 8Ball, Guess Number
- 🎙️ **Temp Voice** - Creator Voice Channel yang otomatis
- 🎭 **Reaction Roles** - Button roles & dropdown menu roles
- 📺 **Notifications** - YouTube & TikTok new post alerts
- 🎯 **Onboarding** - Guided server onboarding (max 3 questions)
- 📊 **Server Stats** - Auto-updating member count channels

## 🚀 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configuration
Copy `.env.example` ke `.env` dan isi dengan data bot kamu:
```bash
cp .env.example .env
```

### 3. Deploy Commands
```bash
npm run deploy
```

### 4. Start Bot
```bash
npm start
```

## 📋 Commands

### Admin Commands
| Command | Description |
|---------|-------------|
| `/server-setup` | Auto-setup server (Basic/Premium template) |
| `/verify-setup` | Setup verification panel |
| `/ticket-setup` | Setup ticket panel |
| `/welcome-setup` | Setup welcome/goodbye messages |
| `/autorole` | Manage auto-roles |
| `/reactionrole` | Setup button/dropdown reaction roles |
| `/tempvoice-setup` | Setup creator voice channel |
| `/stats-setup` | Setup server stats channels |
| `/notification` | Setup YouTube/TikTok notifications |
| `/onboarding` | Setup onboarding system |
| `/rules-setup` | Send rules embed (with templates) |
| `/embed` | Create custom embed message |
| `/giveaway` | Start/end/reroll giveaways |

### User Commands
| Command | Description |
|---------|-------------|
| `/rank` | Lihat level & XP kamu |
| `/leaderboard` | Lihat leaderboard server |
| `/play` | Putar lagu |
| `/pause` | Pause/resume lagu |
| `/skip` | Skip lagu |
| `/stop` | Stop & disconnect |
| `/loop` | Toggle loop |
| `/queue` | Lihat antrian lagu |
| `/minigame` | Main mini games |

## 📁 Struktur Folder

```
src/
├── commands/
│   ├── admin/       # Admin-only commands
│   ├── fun/         # Fun & game commands
│   ├── leveling/    # Leveling commands
│   └── music/       # Music commands
├── events/          # Discord.js event handlers
├── systems/         # Core system logic
├── utils/           # Utilities (database, etc)
├── index.js         # Bot entry point
└── deploy-commands.js
```

## 🔧 Server Template (Premium - 70 channels)

```
✧───✧ SERVER STATS ✧───✧
✧───✧ ZEN GATE ✧───✧
✧───✧ ZEN COMMUNITY ✧───✧
✧───✧ ROBLOX SCRIPTING ✧───✧
✧───✧ ZEN MARKET ✧───✧
✧ SUPPORT AREA ✧───✧
✧ NOTIFICATIONS ✧───✧
✧ VOICE CHANNELS ✧───✧
✧ VIP ZONE ✧───✧
✧ STAFF AREA ✧───✧
✧ LOGS ✧───✧
```

## ⚠️ Requirements

- Node.js 16.9+
- Discord Bot Token (dari Discord Developer Portal)
- Bot Intents: Guilds, Guild Messages, Guild Members, Guild Voice States, Message Content

## 📝 License

MIT
