# Poll SaaS Design Reference

Use this document as the default source of truth for:
- visual style decisions
- art direction
- component styling
- CSS conventions

When design questions come up, refer here first before changing UI styles.

## Brand and Visual Direction
- Product style: modern, clean, approachable.
- Tone: trustworthy for business use, simple for everyday users.
- Overall look: card-based layout, clear hierarchy, generous spacing.

## Design Principles
- Prioritize readability over decoration.
- Keep important actions obvious (`Create Poll`, `Send Invite`, `Vote`).
- Use consistent spacing and typography scale.
- Avoid visual clutter and unnecessary animation.
- Ensure accessible contrast and keyboard navigability.

## Color System (Initial)
- Primary: `#2563EB` (blue)
- Primary hover: `#1D4ED8`
- Success: `#16A34A`
- Warning: `#D97706`
- Danger: `#DC2626`
- Background: `#F8FAFC`
- Surface: `#FFFFFF`
- Text primary: `#0F172A`
- Text secondary: `#475569`
- Border: `#E2E8F0`

## Typography
- Font family: `Inter, system-ui, sans-serif`
- Heading sizes:
  - H1: 32px / 700
  - H2: 24px / 700
  - H3: 20px / 600
- Body text: 16px / 400
- Caption text: 14px / 400

## Spacing and Layout
- Spacing scale: 4, 8, 12, 16, 24, 32, 48
- Max content width: 1100px
- Standard card padding: 16px or 24px
- Border radius:
  - small controls: 8px
  - cards/modals: 12px

## Core Components
- Buttons: primary, secondary, ghost, danger
- Inputs: text, email, password, textarea
- Poll option item with selected/unselected states
- Result bar component (count + percentage)
- Notification banner for success/error
- Table/list rows for admin views

## Page-Level UI Guidance
- Landing page: simple hero + CTA + short feature list.
- Dashboard: recent polls, status chips, quick actions.
- Poll builder: step-like form sections and clear save/publish buttons.
- Vote page: distraction-free layout with large option click targets.
- Results page: percentages first, raw counts second.
- Admin pages: dense but readable tables with clear moderation actions.

## CSS Conventions
- Prefer CSS variables for theme tokens.
- Keep reusable utility classes for spacing and layout.
- Use semantic class names (`poll-card`, `results-bar`, `admin-table`).
- Avoid one-off hardcoded colors inside components.
- Keep responsive breakpoints simple:
  - mobile: < 640px
  - tablet: 640px to 1023px
  - desktop: >= 1024px

## Suggested CSS Tokens
```css
:root {
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-danger: #DC2626;
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-border: #E2E8F0;

  --radius-sm: 8px;
  --radius-md: 12px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
}
```

## Art Direction Notes
- Use simple line icons with consistent stroke width.
- Prefer illustration accents only on marketing pages.
- Keep product screens functional-first and low-noise.
- If custom graphics are added, match brand colors and rounded geometry.

## Accessibility Baseline
- Minimum color contrast of 4.5:1 for body text.
- All interactive controls must be keyboard reachable.
- Visible focus states on buttons, links, and inputs.
- Labels required for every form control.
