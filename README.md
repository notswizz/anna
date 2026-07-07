# Anna 🍌

A personal food tracker. Tell Anna what you ate — in plain text or with a photo — and she breaks it into items, finds the nutrition facts, and logs it against your daily goals.

For restaurant/chain meals and branded packaged foods, Anna **searches the web for the officially published nutrition facts** (via OpenAI's web_search tool) instead of guessing. Generic/home-cooked food gets a USDA-style estimate.

## Run it

```bash
npm install
npm run dev        # http://localhost:3004
```

Requires `ANNA_OPENAI_API_KEY` in `.env.local` (deliberately not `OPENAI_API_KEY` — a machine-wide export of that name would silently override the file).

## How it works

```
src/
├── app/
│   ├── page.tsx                  # renders <Dashboard/>
│   └── api/
│       ├── analyze/route.ts      # POST {text?, image?} → AnalysisResult
│       ├── entries/route.ts      # GET ?date= / POST new entry
│       ├── entries/[id]/route.ts # DELETE
│       ├── goals/route.ts        # GET / PUT daily goals
│       └── profile/route.ts      # GET / PUT profile → computes + applies targets
├── lib/
│   ├── types.ts                  # FoodItem, FoodEntry, Goals, Profile, AnalysisResult
│   ├── profile.ts                # Mifflin–St Jeor BMR/TDEE → calorie + macro targets
│   ├── ai/analyze.ts             # OpenAI Responses API: gpt-5.1 + web_search + strict JSON schema
│   ├── store/
│   │   ├── index.ts              # AnnaStore interface — swap backends here
│   │   └── json-store.ts         # file-backed impl → data/anna.json (gitignored)
│   └── client/                   # fetch wrappers + client-side image downscaling
└── components/                   # dashboard, composer, review card, entry tiles, brand logo…
```

Flow: **Composer** (text/photo) → `/api/analyze` → **ReviewCard** (edit/remove items) → "Log it" → `/api/entries` → dashboard totals update.

- The log is a **horizontal snap-scroll row of tiles** with filter chips (All / Photos / Brands & restaurants / High protein).
- Each tile gets an image: your **photo** (stored as a ~420px thumbnail), the **brand/restaurant logo** (Clearbit → Google favicon → initial fallback, driven by the AI-returned `brandDomain`), or the meal **emoji** the AI picks.
- **Profile** (height, weight, age, sex, activity, goal) → Anna computes BMR/TDEE (Mifflin–St Jeor) and sets daily calorie + macro targets.
- Photos are downscaled client-side (max 1280px JPEG) before upload.

## Extending it

- **Different storage** (Firestore, SQLite): implement `AnnaStore` in `src/lib/store/` and switch it in `getStore()`. Nothing else changes.
- **Different model**: set `ANNA_MODEL` in `.env.local` (defaults to `gpt-5.1`).
- **More nutrients**: they're already captured per-item (fiber, sugar, sodium) — surface them in the UI.
- Obvious next features: weekly trends view, per-meal grouping (breakfast/lunch/dinner), quantity editing in the review card, favorites/repeat meals.
