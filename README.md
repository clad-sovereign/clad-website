# Clad Sovereign Website

[![CI](https://github.com/clad-sovereign/clad-website/actions/workflows/ci.yml/badge.svg)](https://github.com/clad-sovereign/clad-website/actions/workflows/ci.yml)

Marketing website for Clad Sovereign — open-source infrastructure for tokenized sovereign debt issuance.

Part of the [Clad ecosystem](https://github.com/clad-sovereign/clad-studio) for sovereign RWA tokenization on Polkadot.

## Tech Stack

- [Astro](https://astro.build/) — Static site generator
- [Tailwind CSS v4](https://tailwindcss.com/) — Utility-first CSS
- [SolidJS](https://www.solidjs.com/) — For interactive components (if needed)

## Development

```sh
# Install dependencies
bun install

# Start dev server at localhost:4321
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run tests
bun run test
```

## Related Projects

| Repository | Description |
|------------|-------------|
| [clad-studio](https://github.com/clad-sovereign/clad-studio) | Substrate blockchain — pallet-clad-token, runtime, node binary |
| clad-mobile (private) | Kotlin Multiplatform mobile signer — biometric auth, offline QR signing |
| [clad-dashboard](https://github.com/clad-sovereign/clad-dashboard) | SvelteKit monitoring dashboard — read-only chain state, event history |
| [clad-website](https://github.com/clad-sovereign/clad-website) | Marketing landing page (this repo) |

