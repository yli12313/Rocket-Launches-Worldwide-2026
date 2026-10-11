# Rocket Launches Worldwide

<img width="1693" height="879" alt="image" src="https://github.com/user-attachments/assets/79a8e181-544b-4396-b7c0-83b5ac0d5341" />

An interactive 3D globe showing upcoming rocket launches around the world, with live countdowns.

## Features

- **Globe view:** launch pads are shown as glowing beacons on a night-side Earth. Taller beams launch sooner, and the next few launches pulse.
- **Next-launch countdown:** a T-minus clock for the next launch, which switches to "LIFTOFF" at launch time.
- **Launch list:** the next 30 launches, filterable by country.
- **Launch details:** click a pad or a list entry to fly the camera there and see the rocket, provider, orbit, pad, Wikipedia links and the webcast (when one is available).
- **Mobile-friendly:** on small screens the list becomes a bottom sheet.

Launch data comes from the [Launch Library 2 API](https://thespacedevs.com) by The Space Devs.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Getting started

Install dependencies (first time only):

```sh
npm install
```

### Start

```sh
npm run dev
```

Then open the URL shown in the terminal (usually http://localhost:5173). Changes to the source reload automatically.

### Stop

Press `Ctrl+C` in the terminal where the server is running.

## Other commands

| Command           | What it does                                         |
| ----------------- | ---------------------------------------------------- |
| `npm run build`   | Type-checks and builds a production bundle to `dist/` |
| `npm run preview` | Serves the production build locally (stop with `Ctrl+C`) |
| `npm run lint`    | Lints the code with Oxlint                            |

## Configuration

The API server is set by `VITE_LL_BASE`:

- **Development** (`.env.development`) uses `https://lldev.thespacedevs.com`. This is a dev server with generous rate limits, but its data may be out of date.
- **Production** builds default to `https://ll.thespacedevs.com` for live data.

The public API limits how many requests anonymous users can make. To stay within that limit, the app caches results in your browser for 30 minutes and refreshes every 10 minutes. If you see an API error, wait a bit and press **Retry**.

## Tech stack

React 19, TypeScript, Vite, [react-globe.gl](https://github.com/vasturiano/react-globe.gl) (three.js) and Framer Motion.
