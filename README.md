# Pet Mog Duel

Build a complete, polished, fully interactive web app called **PetMog** (tagline: "Who’s the cutest? Let the pets decide.").

### Core Concept
PetMog is a fun, viral 1v1 webcam pet-rating duel game inspired by Omoggle. Two players randomly match (or use a friend code), both show their pet on camera for a 15-second round, the AI scores both pets on cuteness, energy, fluffiness, and overall vibe, then declares a winner (“Mogger”) and loser (“Mogged”). Players earn/lose ELO points and climb fun pet-themed ranks. Everything is playful, wholesome, and extremely shareable.

### Exact Features to Build Now (MVP – keep it solid but not overly complex)

1. **Landing / Home Screen**
   - Clean, cute, modern design with soft pastel colors + playful pet illustrations
   - Big “Start Duel” button
   - “Create Friend Code” and “Join with Code” options
   - Live counter of online players (can be simulated)
   - Short explanation of how it works

2. **Matchmaking**
   - Simple random matchmaking (use simulated matching for now if real WebRTC is too heavy)
   - Friend code system (6-digit code, shareable)
   - Once matched, both players see each other’s live webcam feed side-by-side

3. **Duel Round (15 seconds)**
   - Big countdown timer
   - Both webcam feeds visible
   - Progress bar while “AI is analyzing the pets…”
   - After 15 seconds → results screen

4. **Results Screen**
   - Clear winner and loser announcement with fun language (“Your pet just mogged them!”, “You got mogged by a fluffy legend”)
   - Scores for both pets (Cuteness, Energy, Fluff, Overall /10)
   - ELO change (+ or – points)
   - Current rank badge
   - Big “Share Result” button that generates a beautiful share card (pet scores + rank + “Play PetMog”)
   - Buttons: Rematch, New Match, Back to Home

5. **Ranking System**
   - Fun pet-themed ranks (from lowest to highest):
     - Stray
     - Good Boy/Girl
     - Neighborhood Legend
     - Absolute Unit
     - Fluff God
     - Supreme Overlord of Cuteness
   - Simple ELO system (start at 1000)
   - Basic leaderboard page showing top pets/players

6. **Profile / Stats**
   - Simple username (no full auth needed yet – just local or basic)
   - Win/loss record, current ELO, highest rank reached

7. **Extra Polish**
   - Fully mobile responsive (priority)
   - Smooth animations and micro-interactions
   - Cute loading states and sound effects (optional toggle)
   - Dark/light mode toggle
   - Clear 18+ or “for fun only” disclaimer
   - Privacy note: “Camera is only used for the duel and not stored”

### Technical Preferences
- Modern clean React + Tailwind CSS
- Use Lovable Cloud / Supabase for any needed backend (leaderboard, friend codes, basic stats)
- Webcam access with getUserMedia
- Keep the first version as self-contained and reliable as possible
- Make the share card look premium and Instagram/X-ready

### Important Instructions
- Make the very first version as complete and polished as possible so it already feels fun and shareable.
- Prioritize visual delight, clear flow, and mobile experience.
- After the app is generated, please immediately set up GitHub integration and push the entire project (all files) to my GitHub repository. Ask me for the repository URL or create a new one if needed, and make sure every file is committed and pushed.

Start building PetMog now with a beautiful, production-ready first version.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/38f4b24f-ce99-4bf3-ace1-9b5ad03e92cd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
