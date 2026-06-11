# Poll SaaS MVP

A simple web app for creating polls, sharing them by email, and collecting responses through a clean voting experience.

## Overview

This project is an MVP for a poll platform with role-based access and easy sharing.

- Poll owners create and manage polls
- Participants vote through shareable links
- Admins moderate users and polls

A single user can be an admin, poll owner, participant, or any combination of these roles.

## Core MVP Features

- User sign-up and sign-in
- Role-aware permissions (Admin, Poll Owner, Participant)
- Poll creation and publishing
- Email invite links for poll participation
- Participant voting flow
- Poll results view
- Basic admin moderation tools

## User Roles

- **Admin**: manages users and moderates polls
- **Poll Owner**: creates polls, sends invites, views results
- **Participant**: receives links and submits votes

## Project Docs

Detailed planning and design docs live in `docs/`:

- `docs/poll-mvp-plan.md`: full MVP scope, flows, data model, and backend functions
- `docs/poll-future-features.md`: later roadmap ideas
- `docs/poll-design-reference.md`: visual style, art direction, and CSS reference

## Run the MVP (Poll Function Only)

This first build focuses only on the poll function — creating polls, sharing a
link, voting, and viewing results. Accounts, roles, and email invites come later.

### Requirements

- Node.js 22+ (uses the built-in `node:sqlite` module)

### Steps

```bash
npm install
npm start
```

Then open http://localhost:3000

- Sign up with email, a unique username, a display name, and a password
- Log in (with email or username) to reach your dashboard
- Create a poll on the home page (you only see polls you created)
- Share the generated link (`/poll.html?id=...`) so others can vote
- View live results at `/results.html?id=...`

Data is stored locally in a SQLite database under `data/` (gitignored).

### Tech Stack

- Backend: Node.js + Express
- Storage: SQLite (`node:sqlite`)
- Frontend: static HTML/CSS/JS styled from `docs/poll-design-reference.md`

### Accounts

- Sign up with email, unique username, display name, and password (min 8 chars)
- Passwords are hashed (scrypt) — never stored in plain text
- Sessions use a bearer token stored in the browser and sent on API requests
- A logged-in user can only see polls they created

### API

Auth:

- `POST /api/auth/signup` — create an account, returns a session token
- `POST /api/auth/login` — log in with email or username, returns a token
- `POST /api/auth/logout` — end the current session
- `GET /api/auth/me` — get the current signed-in user

Polls:

- `GET /api/polls` — list polls created by the signed-in user (auth required)
- `POST /api/polls` — create a poll (auth required)
- `GET /api/polls/:id` — get a poll for voting (public link)
- `POST /api/polls/:id/vote` — submit a vote (public link)
- `GET /api/polls/:id/results` — get results

## Current Status

Working: account sign-up/login, owner-scoped poll dashboard, poll creation,
public voting links, and results. Next steps: roles/permissions (admin vs
owner vs participant), email invites, and admin moderation.
