# Poll SaaS MVP Plan

## Refined Prompt
Build a web app MVP for creating and sharing polls. Users sign in with their personal info, create polls, and share participation links by email. The system supports three role types: Admin, Poll Owner, and Participant. A single user can have one role, multiple roles, or all three roles. Deliver a working MVP with authentication, role-aware permissions, poll creation, email invite links, voting, result viewing, and basic admin management.

## Product Goal
Create a simple poll platform where:
- Users can sign in and create polls quickly.
- Poll links can be emailed to participants.
- Participants can vote with minimal friction.
- Admins can monitor and moderate the platform.

## MVP Scope
### In Scope
- Account sign-up and sign-in with user info.
- Role assignment and role-based access checks.
- Poll creation and management by poll owners.
- Shareable poll links sent by email.
- Participant voting flow.
- Basic poll results view.
- Admin controls for user and poll moderation.

### Out of Scope (for MVP)
- Advanced analytics dashboards.
- Team workspaces and organizations.
- Paid plans and billing.
- Multi-language support.
- Mobile apps (web only for now).

## User Roles and Permissions
- **Admin**
  - View all users and polls.
  - Disable abusive polls.
  - Suspend or reactivate users.
- **Poll Owner**
  - Create, edit, publish, close, or delete owned polls.
  - Email participation links.
  - View results for owned polls.
- **Participant**
  - Open poll link and submit vote.
  - View results only if enabled by poll owner.

Note: A user can hold multiple roles. Permission checks should evaluate role membership per action.

## Core User Flows
### 1) Sign Up / Sign In
- User enters name, email, and password.
- Email uniqueness is enforced.
- System signs user in and redirects to dashboard.

### 2) Create Poll (Owner)
- Owner enters poll title, description, options, and close date.
- Owner chooses settings:
  - single choice or multiple choice
  - anonymous votes on/off
  - results visibility (before close/after close/owner only)
- Poll status starts as draft or published.

### 3) Email Poll Links
- Owner enters recipient emails manually (comma-separated for MVP).
- System sends email with poll title and unique poll link.
- Each email send event is stored for audit/history.

### 4) Vote as Participant
- Participant opens poll link.
- If allowed, participant provides basic identity (or anonymous if enabled).
- Participant submits vote once (MVP rule: one vote per email or session token).
- Confirmation screen shown after successful submission.

### 5) View Results
- Owner can always view their poll results.
- Participant sees results only if poll settings allow.
- Results page shows option counts and percentages.

### 6) Admin Moderation
- Admin reviews flagged or reported polls.
- Admin can unpublish/disable a poll.
- Admin can suspend user access in severe cases.

## Basic Pages
- `/` Landing page
- `/auth/signup`
- `/auth/login`
- `/dashboard`
- `/polls/new`
- `/polls/:pollId/edit`
- `/polls/:pollId/share`
- `/polls/:pollId` (vote page)
- `/polls/:pollId/results`
- `/admin/users`
- `/admin/polls`

## Data Model (MVP)
### User
- id
- name
- email
- password_hash
- roles (array or relation table)
- status (active/suspended)
- created_at

### Poll
- id
- owner_user_id
- title
- description
- status (draft/published/closed/disabled)
- allow_multiple_choices
- allow_anonymous_votes
- results_visibility
- closes_at
- created_at

### PollOption
- id
- poll_id
- option_text
- sort_order

### Vote
- id
- poll_id
- poll_option_id
- participant_user_id (nullable if anonymous)
- participant_email (nullable)
- vote_token (for duplicate prevention)
- created_at

### PollInvite
- id
- poll_id
- owner_user_id
- recipient_email
- invite_token
- sent_at
- delivery_status (queued/sent/failed)

## Basic API/Backend Functions
- `registerUser(input)`
- `loginUser(input)`
- `assignRoles(userId, roles)`
- `createPoll(ownerId, pollInput)`
- `updatePoll(ownerId, pollId, pollInput)`
- `publishPoll(ownerId, pollId)`
- `closePoll(ownerId, pollId)`
- `sendPollInvites(ownerId, pollId, emails[])`
- `submitVote(pollId, voteInput)`
- `getPollResults(requesterId, pollId)`
- `adminDisablePoll(adminId, pollId)`
- `adminSuspendUser(adminId, userId)`

## Functional Requirements Checklist
- Users can create accounts and sign in.
- Role-based permissions are enforced at API and UI level.
- Owners can create and publish polls.
- Owners can email poll links.
- Participants can vote successfully.
- Duplicate vote protection is applied.
- Results visibility follows poll settings.
- Admin can disable polls and suspend users.

## Security and Validation (MVP Level)
- Hash passwords (never store plain text).
- Validate and sanitize poll inputs.
- Verify authorization on every protected endpoint.
- Rate-limit vote submissions and invite sending.
- Use signed tokens for invite links.

## Suggested MVP Build Order
1. Auth + user model
2. Role and permission middleware
3. Poll CRUD + publish/close
4. Vote flow + duplicate prevention
5. Results page
6. Email invite flow
7. Admin moderation pages

## MVP Success Criteria
- Poll owner can create and publish a poll in under 3 minutes.
- Owner can send at least one invite email successfully.
- Participant can open link and submit vote without account creation (if allowed).
- Role permissions behave correctly for all three role types.
- Admin can disable a poll and suspend a user from admin screens.
