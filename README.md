# My English Library

A personal English vocabulary library built with Next.js and Supabase.

## Included in this first version
- Email/password sign up and sign in with Supabase Auth
- Private vocabulary entries backed by the existing `english_entries` table
- Optional Arabic translation, part of speech and American phonetic transcription
- Multiple examples stored in `english_examples`
- Search, entry details, deletion and browser-based US English speech playback
- Responsive English-first interface with Arabic text support

## Setup
1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the Supabase project settings.
3. Install dependencies with `npm install`.
4. Start with `npm run dev`.

The app is configured for the existing Supabase project:
`sutttbnqmtqvuxahhyim`.

## Important next steps
- Add AI generation through a server-side API route or Supabase Edge Function. Keep any AI secret key server-side.
- Configure production auth redirect URLs in Supabase.
- Add a dedicated, high-quality American English TTS provider if consistent voice quality is required. The current Listen button uses the browser's available en-US speech voice.
- Run `npm run build` before deployment.

No service-role key or AI secret belongs in a `NEXT_PUBLIC_*` variable.
