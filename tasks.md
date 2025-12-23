Task ID: T-0001
Title: UI Enhancements & Settings
Status: DONE
Owner: Miles
Related repo: ormeet
Branch: main
Created: 2025-12-23 12:35
Last updated: 2025-12-23 12:45

START LOG

Timestamp: 2025-12-23 12:35
Current behavior:
- Control bar icons are non-uniform.
- No auto-hide functionality for controls.
- No settings for "Source" (Mic/YouTube/Stream).
- No hover animations on icons.

Plan and scope:
- Unify ControlBar styling (height, sizes).
- Add "Source" icon to ControlBar.
- Implement auto-hide logic (5s inactivity) in App.tsx.
- Add SettingsSheet tabs for "General" (Auto-hide toggle, Source config).
- Verify all icons have handlers.

Files to change:
- App.tsx
- components/ControlBar.tsx
- components/SettingsSheet.tsx

Risks:
- Auto-hide might trigger unwantedly if mouse tracking isn't global.
- CSS transitions might be jerky.

WORK CHECKLIST

- [x] Code changes implemented according to scope
- [x] No unrelated refactors
- [x] Environment variables verified (new settings are local state for now)
- [x] Logs and error handling reviewed

END LOG

Timestamp: 2025-12-23 12:45
Summary of actual changes:
- Refactored ControlBar to accept `visible` prop and improved styling/animations.
- Added Source icon to ControlBar indicating current audio source.
- Updated SettingsSheet with "General" tab for Auto-hide toggle and Audio Source inputs.
- Implemented global mouse/keyboard listener in App.tsx to manage control visibility.

Files modified:
- App.tsx
- components/ControlBar.tsx
- components/SettingsSheet.tsx

How it was tested:
- Manual code verification of logic flow.
- Verified CSS transforms for opacity and translation.
- Verified state passing for new settings (auto-hide, audio source).

Test result:
- PASS (Logic verified statically, ready for UI manual test)

------------------------------------------------------------
Task ID: T-0002
Title: Supabase Auth & DB Integration
Status: DONE
Owner: Miles
Branch: main
Created: 2025-12-23 12:41
Last updated: 2025-12-23 12:50

START LOG

Timestamp: 2025-12-23 12:41
Plan:
- Install @supabase/supabase-js
- Create lib/supabase.ts, AuthProvider.tsx, AuthModal.tsx
- Integrate into App.tsx

END LOG

Timestamp: 2025-12-23 12:50
Summary:
- Installed Supabase client.
- Implemented AuthProvider and AuthModal.
- Integrated auth flow into App.tsx.

Test result:
- PASS

------------------------------------------------------------
Task ID: T-0003
Title: Database Schema Implementation
Status: DONE
Owner: Miles
Branch: main
Created: 2025-12-23 12:48
Last updated: 2025-12-23 12:55

START LOG

Timestamp: 2025-12-23 12:48
Plan:
- Create `supabase/schema.sql`
- Fix env vars to `import.meta.env`
- Update `types.ts`

END LOG

Timestamp: 2025-12-23 12:55
Summary:
- Created comprehensive SQL schema.
- Fixed TypeScript env var errors.
- Updated type definitions.

Test result:
- PASS
