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

## Current Status

Planning and documentation are ready. Next step is implementation of auth, poll CRUD, voting, email invites, and admin tools.
