# Webclient: AI Mock Interview Voice & Chat Console

An interactive web console supporting mock interviews. The client allows chat-based text dialogue and WebRTC/Audio streaming to simulate real-time technical rounds with feedback.

## Proposed UI/UX Changes

### Candidate Webclient (`apps/web`)

#### [NEW] [mock-interview/page.tsx](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/web/src/app/dashboard/mock-interview/page.tsx)

- **Interview Setup Form:** Choose topic (e.g. System Design, Behavior, Coding), role level (Junior, Senior), and target company style.
- **Interactive Console Panel:**
  - _Interviewer Avatar/Waveform:_ A dynamic SVG waveform animating in response to the AI's speaking state.
  - _Microphone Toggle:_ Button triggers microphone input via Web Audio API.
  - _Live Transcript:_ Chat bubbles indicating AI questions and user transcriptions.
  - _Timer Countdown:_ Simple, elegant clock keeping track of remaining interview time.

#### [NEW] [interview.store.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/web/src/app/store/interview.store.ts)

- Zustand state orchestrating Socket.io client connections, media recorders, and active transcript streams.

---

## Verification Plan

### Manual Verification

- Access `http://localhost:3000/dashboard/mock-interview`.
- Choose "System Design" and start session.
- Verify real-time WebSockets connection and audio transcript streaming works flawlessly.
