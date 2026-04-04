# 0xRIP

![0xRIP Logo](./assert/logo.svg)

**Data dies, but does not disappear.**

0xRIP is a digital memorial space for meaningful relationships: people, AI collaborators, and past versions of ourselves. The project prioritizes remembrance over productivity, and emotional continuity over data permanence.

## Design Philosophy

In an era of infinite generation, 0xRIP focuses on what cannot be regenerated: context, memory, and emotional residue.

- We choose what to remember, instead of letting platforms decide.
- We treat human-human, human-AI, and self-history as equally valid memory objects.
- We build rituals for revisiting memory, not just archiving files.

## Current Demo
 [Changelog](./CHANGELOG.md)

- Frontend v1 is available with 3D memorial scene + chat interaction.
- Preview image: ![0xRIP UI V1](./assert/0xRIP-UI-V1.png)

## Quick Deploy 

Run frontend and backend together:

    python run_dev.py

Then open:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Advanced Deployment

For split-service or production-style setup, use these entry points:

- Frontend service (`frontend/`): build and host static assets.
- Backend service (`backend/`): run FastAPI app with your process manager.

Check docs before production rollout:

- [API Docs Index](./docs/api/README.md)
- [UX Docs Index](./docs/ux/README.md)
- [Story & Product Narrative](./docs/story/README.md)


## Acknowledgments

- Built with React, Vite, Three.js/R3F, FastAPI, and uv/Bun tooling.
- Visual inspiration: Monument Valley and Sheikah Slate interface language.

## License

Apache-2.0. See [LICENSE](./LICENSE).


