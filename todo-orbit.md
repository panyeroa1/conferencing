````md
# ORBIT— FULL TODO
================================================================================
1) PROJECT OVERVIEW
================================================================================
Project Name:
- Orbit

One-paragraph Goal:
- Gumawa ng **meeting web app** na may premium Orbit branding at modern UI, supporting:
  (1) real-time audio/video call via WebRTC,
  (2) live captions + translation,
  (3) “read-aloud translation” (translated audio) using Gemini Live Audio,
  with solid mobile portrait UX, reconnection, and stable performance.

Primary Users:
- Host: gumagawa ng room, nag-iinvite, may basic controls.
- Guest: sumasali via code/link, pumipili ng language preferences, pwedeng mag-enable ng captions/read-aloud.

Non-Negotiables:
- From scratch codebase.
- No external meeting-product repos/libs as dependency (layout/flow is original Orbit).
- Gemini API keys are server-side only.
- Responsive: desktop + mobile portrait (small screens) first-class.
- Every task must be logged in DEVELOPER.md (start/end timestamps Asia/Manila).
- If a change risks large conflict: STOP, explain risk, offer alternatives.

Definition of Done (DoD):
- Host can create room; guest can join via room code/link.
- WebRTC call works (audio/video) for MVP: 2–6 participants (mesh).
- Captions appear live in room; translation appears; read-aloud plays when enabled.
- UI: top bar + participant grid + bottom control bar + right panel; mobile portrait uses active-speaker focus + swipe/tap to grid.
- Reconnect works for WS + best-effort WebRTC recovery.
- No “foreign meeting brand” strings anywhere.

================================================================================
2) SYSTEM ARCHITECTURE (HIGH-LEVEL)
================================================================================
Components:
A) Web App (Frontend)
- Handles UI, device selection, WebRTC peer connections, captions display, translated audio playback.

B) Orion Backend (FastAPI)
- Room management (create/join), WebSocket signaling, events broadcast, translator proxy (Gemini Live Audio).

C) AI Service (Gemini Live Audio)
- Receives mic audio stream (PCM16 16k), outputs translated text + translated audio stream (PCM16 24k).

D) Database (Supabase)
- Rooms, participants, transcript segments, translation segments, events (for replay/debug).

Transport Plan:
- WebRTC: media plane (peer-to-peer mesh for MVP).
- WebSocket: signaling (offer/answer/ice) + captions/events + translator audio chunks broadcast.
- HTTP: room create/join.

Security Plan:
- Gemini key never sent to client.
- Server issues participantId; WS requires pid query param (later: signed token).

================================================================================
3) AI / TRANSLATION REQUIREMENTS (GEMINI LIVE AUDIO)
================================================================================
Capabilities:
- Streaming STT + streaming translation + streaming audio output for read-aloud.

User Controls:
- Captions: ON/OFF
- Read-aloud translation: ON/OFF
- “I speak” language hint (optional; default Auto)
- “I listen in” target language (default English)
- Mix mode:
  - Original audio full
  - Duck original while translated audio plays
  - Translation only

Read-Aloud Fidelity Rules (must be enforced in system instruction):
- Match delivery: pace/pauses/emphasis.
- No extra commentary, no summary, no “assistant-y” filler.
- Keep it short like real interpreting.

Fallback Behavior:
- If translator fails: keep original call audio stable + show toast “Translation unavailable”.
- If captions fail: disable captions UI only; call continues.

================================================================================
4) DATABASE SPEC (SUPABASE) — TABLES + INDEXES + RLS
================================================================================
Tables:
1) rooms
- id uuid pk
- code text unique not null
- title text not null
- created_at timestamptz default now()
- settings jsonb default '{}'

Indexes:
- unique(code)

RLS:
- Read: members only (by room membership)
- Write: host only (or server-role)

2) participants
- id uuid pk
- room_id uuid fk rooms.id on delete cascade
- pid text not null (server participant id)
- display_name text not null
- role text check in ('host','guest')
- speak_lang text default 'Auto'
- target_lang text default 'English'
- joined_at timestamptz default now()
- left_at timestamptz null

Indexes:
- (room_id, joined_at)

RLS:
- Read: members only
- Write: server role

3) transcript_segments
- id uuid pk
- room_id uuid fk
- speaker_pid text not null
- start_ms int not null
- end_ms int not null
- source_lang text null
- text text not null
- created_at timestamptz default now()

Indexes:
- (room_id, start_ms)

4) translation_segments
- id uuid pk
- room_id uuid fk
- transcript_id uuid fk transcript_segments.id on delete cascade
- target_lang text not null
- text text not null
- created_at timestamptz default now()

Indexes:
- (room_id, target_lang, created_at)

5) events (optional)
- id uuid pk
- room_id uuid
- type text
- payload jsonb
- created_at timestamptz default now()

================================================================================
5) API + WS CONTRACTS (CONTRACT-FIRST)
================================================================================
HTTP:
- POST /api/rooms
  req: { title, targetLang }
  res: { code }

- POST /api/rooms/{code}/join
  req: { displayName, role, speakLang, targetLang }
  res: { participantId, wsUrl, targetLang }

WebSocket Client -> Server:
1) signal
{ t:"signal", to:"<pid>", data:{ type:"offer|answer|ice", sdp?, candidate? } }

2) translator_enable
{ t:"translator_enable", enabled:true|false, speakLang:"Auto|...", targetLang:"English|..." }

3) audio_chunk
{ t:"audio_chunk", pcm16k_b64:"...", mime:"audio/pcm" }

4) ping
{ t:"ping" }

WebSocket Server -> Client:
1) participant_joined
{ t:"participant_joined", pid, name, role, ts }

2) participant_left
{ t:"participant_left", pid, ts }

3) signal
{ t:"signal", from:"<pid>", data:{...} }

4) caption
{ t:"caption", speakerPid, speakerName, targetLang, text, ts }

5) translated_audio
{ t:"translated_audio", speakerPid, speakerName, targetLang, pcm24k_b64, ts }

6) toast
{ t:"toast", level:"info|warn|error", msg, ts }

7) pong
{ t:"pong", ts }

================================================================================
6) UI / LOOK & FEEL — “TSURA NG GAGAWIN” (SCREEN + COMPONENT SPEC)
================================================================================
Orbit Visual Style:
- Dark-first premium (black/charcoal), with Light mode variant.
- Glass panels (semi-transparent), subtle borders, soft shadows.
- Rounded corners 14–18px.
- High-contrast text, readable captions.
- Animations: 150–220ms ease (transform/opacity only).

Layout Pattern (Orbit-native):
A) Top Bar (fixed)
- Left: Orbit Meet logo + Room code/title
- Center: connection indicator (Online/Connecting)
- Right: elapsed time + settings icon

B) Main Stage
- Participant Grid responsive:
  - Desktop: grid tiles (2–6 participants), auto-fit
  - Mobile portrait: Active speaker tile as default, with a “Grid” button to expand.

C) Right Panel (collapsible)
- Tabs:
  1) Participants
  2) Captions (scrolling transcript)
  3) Chat (optional in later phase)

D) Bottom Control Bar (fixed)
- Primary buttons:
  - Mic toggle
  - Camera toggle
  - Captions toggle
  - Translate/Read-aloud toggle
  - Settings
  - Leave (red)
- Mobile portrait:
  - Only 3 main buttons visible + “More” sheet (to avoid clutter)
  - Buttons must remain tappable (>=44px).

Captions Overlay:
- Bottom-center overlay (2–3 lines max)
- Shows: Speaker name + translated text
- Tap to expand to Captions Panel
- Must not cover bottom control bar on mobile.

================================================================================
7) FULL TODO LIST (PHASED) — TASK CARDS (DETAILED)
================================================================================
Task Card Rules:
- ID
- Goal
- Exact file paths touched
- Acceptance Criteria
- Verification steps (commands + manual checks)
- Risk + rollback

-----------------------------------------
PHASE 0 — BOOTSTRAP + GUARDRAILS
-----------------------------------------
[TASK P0-01] Repo scaffold (from scratch)
Goal:
- Create structure: /apps/web, /apps/orion, root docs, env templates.

Files:
- /README.md
- /DEVELOPER.md
- /.env.example
- /apps/web/** (Vite React)
- /apps/orion/** (FastAPI)

AC:
- Web runs on :5173
- Orion runs on :8787
- /health returns ok

Verify:
- Start backend, open /health
- Start frontend, loads Home screen

Rollback:
- Delete repo folder.

[TASK P0-02] “Fail-fast” config validation
Goal:
- If GEMINI_API_KEY missing, translator toggle gives a clear toast error (call still works).

Files:
- /apps/orion/app/gemini_live.py
- /apps/orion/app/main.py

AC:
- Enabling translator without key shows toast error; no crash.

Verify:
- Remove key, enable translator, observe toast.

Rollback:
- Revert file changes.

-----------------------------------------
PHASE 1 — ROOM FLOW + WS EVENTS (NO WEBRTC YET)
-----------------------------------------
[TASK P1-01] Implement create/join endpoints
Goal:
- /api/rooms and /api/rooms/{code}/join working.

Files:
- /apps/orion/app/main.py
- /apps/orion/app/rooms.py

AC:
- Host create returns room code
- Join returns participantId + wsUrl

Verify:
- curl create/join

Rollback:
- Revert.

[TASK P1-02] WS connect + join/leave broadcast
Goal:
- WS accepts pid, announces join/leave.

Files:
- /apps/orion/app/main.py
- /apps/orion/app/rooms.py

AC:
- Two clients see each other in Participants panel (frontend later task will display)

Verify:
- Use simple WS client or browser; check events.

Rollback:
- Revert.

[TASK P1-03] Frontend routes + screens skeleton
Goal:
- Home → Lobby → Room navigation works, Orbit branding applied.

Files:
- /apps/web/src/App.tsx
- /apps/web/src/pages/Home.tsx
- /apps/web/src/pages/Lobby.tsx
- /apps/web/src/pages/Room.tsx
- /apps/web/src/components/* (basic UI)

AC:
- Host can create room and land in Lobby
- Guest can input code and land in Lobby
- Join button lands in Room (even before WebRTC is built)

Verify:
- Manual UI walkthrough.

Rollback:
- Revert.

-----------------------------------------
PHASE 2 — WEBRTC MESH MVP (AUDIO/VIDEO)
-----------------------------------------
[TASK P2-01] WS signaling: offer/answer/ice pass-through
Goal:
- Server forwards signaling messages to correct participant.

Files:
- /apps/orion/app/main.py

AC:
- signaling events relayed: offer/answer/ice.

Verify:
- Log payloads; confirm arrival client-to-client via server.

Rollback:
- Revert.

[TASK P2-02] PeerManager (RTCPeerConnection per remote pid)
Goal:
- Implement peer connection lifecycle:
  - createOffer/createAnswer
  - setLocal/RemoteDescription
  - ICE candidates buffering
  - ontrack attach

Files:
- /apps/web/src/webrtc/PeerManager.ts
- /apps/web/src/lib/ws.ts
- /apps/web/src/pages/Room.tsx

AC:
- Two browsers see/hear each other.

Verify:
- Join 2 clients; confirm remote video + audio.

Rollback:
- Delete PeerManager and revert.

[TASK P2-03] Media capture + device switching (Lobby + in-call)
Goal:
- getUserMedia, choose devices, toggle mic/cam, apply changes live.

Files:
- /apps/web/src/webrtc/media.ts
- /apps/web/src/webrtc/devices.ts
- /apps/web/src/pages/Lobby.tsx
- /apps/web/src/pages/Room.tsx

AC:
- Switch mic/cam device without reload.
- Mic toggle stops outgoing audio track.

Verify:
- Manual device changes.

Rollback:
- Revert.

[TASK P2-04] UI: Grid + Active Speaker (mobile portrait)
Goal:
- Responsive grid + active speaker focus for mobile portrait.

Files:
- /apps/web/src/components/Grid.tsx
- /apps/web/src/components/Tile.tsx
- /apps/web/src/pages/Room.tsx

AC:
- Desktop grid auto-fits.
- Mobile portrait shows active speaker with easy grid access.

Verify:
- Resize; emulate mobile.

Rollback:
- Revert.

[TASK P2-05] Reconnect logic (WS + best-effort WebRTC)
Goal:
- WS auto reconnect; peer manager attempts ICE restart on failure.

Files:
- /apps/web/src/lib/ws.ts
- /apps/web/src/webrtc/PeerManager.ts

AC:
- Network drop recovers without full reload (best-effort).

Verify:
- Toggle network; observe reconnect + recovery.

Rollback:
- Revert.

-----------------------------------------
PHASE 3 — CAPTIONS (TEXT) PIPELINE
-----------------------------------------
[TASK P3-01] Client audio capture for translator (PCM16 16k)
Goal:
- Capture mic audio, downsample to 16k PCM16, send WS audio_chunk frames.

Files:
- /apps/web/src/translator/audioCapture.ts
- /apps/web/src/lib/pcm.ts
- /apps/web/src/pages/Room.tsx

AC:
- When translate enabled, chunks stream continuously.

Verify:
- Inspect WS frames in devtools; stable chunk cadence.

Rollback:
- Revert.

[TASK P3-02] Server translator session start/stop + caption broadcast
Goal:
- On translator_enable, start Gemini Live session and broadcast caption events.

Files:
- /apps/orion/app/gemini_live.py
- /apps/orion/app/main.py

AC:
- Speak; caption events arrive; UI shows overlay.

Verify:
- Manual speak test.

Rollback:
- Revert.

[TASK P3-03] Captions UI overlay + Captions right panel
Goal:
- Overlay 2–3 lines + panel transcript list (scroll, recent N segments).

Files:
- /apps/web/src/components/CaptionsOverlay.tsx
- /apps/web/src/components/RightPanel.tsx
- /apps/web/src/pages/Room.tsx

AC:
- Overlay never blocks bottom controls on mobile.
- Captions panel updates live.

Verify:
- Mobile emulation + live speaking.

Rollback:
- Revert.

-----------------------------------------
PHASE 4 — READ-ALOUD TRANSLATED AUDIO (PLAYBACK)
-----------------------------------------
[TASK P4-01] Client translated audio playback queue (PCM24k)
Goal:
- Decode base64 PCM16 24k, queue in WebAudio with jitter buffer.

Files:
- /apps/web/src/audio/PCMPlayer.ts
- /apps/web/src/pages/Room.tsx

AC:
- Smooth playback (no popping), minimal stutter.

Verify:
- Enable translate; speak; hear translated audio.

Rollback:
- Revert.

[TASK P4-02] Mix modes (Original / Duck / Translation-only)
Goal:
- Implement audio mixing strategy; duck original when translated chunks arrive.

Files:
- /apps/web/src/audio/mix.ts
- /apps/web/src/components/BottomBar.tsx
- /apps/web/src/pages/Room.tsx

AC:
- Switching modes updates audio behavior immediately.

Verify:
- Toggle modes; confirm effect.

Rollback:
- Revert.

[TASK P4-03] Server audio chunk broadcast reliability
Goal:
- Ensure translated_audio events broadcast safely and don’t overload WS.

Files:
- /apps/orion/app/gemini_live.py
- /apps/orion/app/main.py

AC:
- Throttle or chunk sizing stable; no WS disconnect under normal usage.

Verify:
- 2–3 minute speaking test.

Rollback:
- Revert.

-----------------------------------------
PHASE 5 — HOST CONTROLS + POLISH
-----------------------------------------
[TASK P5-01] Participants panel (host actions)
Goal:
- Host can “Remove” participant (server instructs client to leave).
- (Mute-all optional MVP) Host can request mute (client-side compliance).

Files:
- /apps/orion/app/main.py (new WS command: kick / request_mute)
- /apps/web/src/components/ParticipantsPanel.tsx
- /apps/web/src/pages/Room.tsx

AC:
- Host removes guest; guest returns to Home with toast.

Verify:
- Manual.

Rollback:
- Revert.

[TASK P5-02] In-call Settings (devices + languages)
Goal:
- Change devices mid-call; update language preferences; translator restarts safely.

Files:
- /apps/web/src/components/SettingsSheet.tsx
- /apps/web/src/pages/Room.tsx
- /apps/orion/app/main.py (translator_enable updates)

AC:
- Switch mic while in call without breaking call.

Verify:
- Manual.

Rollback:
- Revert.

[TASK P5-03] Branding audit (Orbit-only)
Goal:
- Ensure no foreign meeting product strings or assets.

Files:
- /apps/web/src/**
- /README.md

AC:
- grep -R -i "<foreign_brand_name>" -n . returns nothing.

Verify:
- internal repo string scan.

Rollback:
- Revert.

-----------------------------------------
PHASE 6 — DB INTEGRATION + QA + DEPLOY
-----------------------------------------
[TASK P6-01] Supabase schema migrations
Goal:
- Create SQL migrations for rooms/participants/transcripts/translations.

Files:
- /apps/orion/migrations/001_init.sql
- /apps/orion/migrations/002_rls.sql

AC:
- Migrations apply cleanly.

Verify:
- Apply in Supabase SQL editor.

Rollback:
- Revert SQL.

[TASK P6-02] Persist transcript/translation segments
Goal:
- On caption/translation event, store to DB (server-side).

Files:
- /apps/orion/app/db.py
- /apps/orion/app/main.py

AC:
- Reload room shows recent transcript history (panel fetch optional).

Verify:
- Query DB table.

Rollback:
- Revert.

[TASK P6-03] QA checklist + release notes
Goal:
- Document happy-path tests and known limitations.

Files:
- /QA.md
- /RELEASE.md

AC:
- Anyone can validate in < 10 minutes.

Verify:
- Follow QA steps.

Rollback:
- Delete docs.

================================================================================
8) MERMAID SYSTEM FLOW (MANDATORY)
================================================================================
```mermaid
flowchart LR
  A[Browser A - Orbit UI] <-->|WebRTC media| B[Browser B - Orbit UI]
  A <-->|WS signaling + events| ORION[Orion Backend (FastAPI)]
  B <-->|WS signaling + events| ORION
  A -->|PCM16 16k audio_chunk| ORION
  ORION -->|Live audio stream| AI[Gemini Live Audio]
  AI -->|caption text| ORION
  AI -->|translated PCM16 24k| ORION
  ORION -->|caption events| A
  ORION -->|translated_audio events| A
  ORION -->|caption events| B
  ORION -->|translated_audio events| B
  ORION --> DB[(Supabase)]
````

================================================================================
9) DEVELOPER.md LOGGING (STRICT FORMAT)
=======================================

For every TASK above, log:

## [TASK <ID>] <Title>

* Start: YYYY-MM-DD HH:MM (Asia/Manila)
* Finish: YYYY-MM-DD HH:MM (Asia/Manila)
* Goal:
* Files changed:

  * path/to/file
* Commands run:

  * command
* Verification:

  * what was tested + observed
* Risks:
* Rollback plan:
* Notes:

================================================================================
10) IMPORTANT MVP NOTES (SO DEVS DON’T MISUNDERSTAND)
=====================================================

* MVP WebRTC uses mesh (simpler). For >6 participants, we plan SFU later.
* Translator v1 uses 1 target language per room (simple). Per-listener language is v2.
* Call stability is always priority; translator may degrade gracefully.


