# Product Requirements Document: Daily Accountability App

## Project Overview

Build a mobile-friendly daily planning app that helps people turn responsibilities into a clear, manageable schedule and follow through without relying only on last-minute pressure. It combines a time-based accountability calendar, to-do lists, deadlines, calendar syncing, and a simple reward system.

The problem is not simply having too much to do: interviewees described procrastination, phone distraction, difficulty getting out of bed, long or irregular breaks, and trouble balancing responsibilities with leisure. The creator's routine audit also documents groggy mornings and difficulty falling asleep. The MVP should make the day's commitments easy to scan and act on. Better sleep may support better time management, but the MVP is not a sleep treatment and should not claim to improve sleep or mental health.

**MVP goal:** Help a user plan their day, see what is due and when, and record task completion in one low-friction place.

**Product principles:** Keep the interface self-evident, optimized for scanning rather than reading, and focused on the user's next action. Design for mobile use and a broad age range. Avoid childish visual treatment.

## Target users

Primary users are students and working adults who have difficulty starting tasks, estimating or allocating time, keeping track of deadlines, or balancing work with rest. Some may experience executive dysfunction, procrastination, or inconsistent sleep; the product should not assume a diagnosis or a single cause.

Interview research so far covers three like-minded peers. They described phone scrolling and other distractions, using deadlines or future rewards as motivation, taking breaks that vary by task, and liking the option of working alongside other people. One participant reported reading rather than scrolling while procrastinating, so the app should not assume all distraction looks the same. These findings are directional, not representative of all intended users.

## Skills Required

- Next.js (required)
- Vercel (required)
- TypeScript (recommended)
- Calendar-provider integration and date/time handling (provider and integration approach TBD)
- Data persistence and, if needed, authentication (provider TBD)

## Key Features

### Milestone 1: Plan and complete today's tasks

- A user can enter the prototype as a guest; the sign-in screen is a visual preview and does not authenticate or store account details.
- A user can choose a color palette for the planner, with the preference saved in the current browser.
- A user can see a daily motivational quote from a bundled set of original quotes.
- A user can read curated sleep-habit resources from public health organizations and select routine patterns to see general, non-medical bedtime ideas.
- A user can optionally record bedtime, wake-up time, a self-reported sleep quality (bad, okay, or great), and a morning feeling. The date-based duration is the time between bedtime and wake-up, not a measure of time actually asleep. Entries are held only while the page is open.
- A user can review sleep log dates on a compact monthly calendar, where red, yellow, or green dots show the self-reported quality; the rating is also labeled in text.
- A user can create, edit, and delete a task with a title, due date, and optional scheduled time.
- A user can view tasks in a daily time-based accountability calendar and a to-do list, with deadlines and completion status easy to scan.
- A user can mark a task complete and see that status reflected in both views.
- The main view prioritizes upcoming and overdue tasks without requiring the user to navigate through multiple screens.
- The layout works on a phone-sized viewport and uses clear labels and controls rather than relying on color alone.
- A user can run an in-app focus timer with customizable focus and break durations. The timer does not block other apps or lock the device.

**Milestone check:** In a usability test, a first-time user can add a task with a deadline, find it in the day's plan, and mark it complete without guidance. Record where they hesitate and whether the schedule is understandable at a glance.

### Milestone 2: Accountability and rewards

- A user can connect a calendar and see its events alongside their planned tasks. The supported provider(s), permissions, and whether sync is one-way or two-way must be decided before implementation.
- A user can earn a simple, visible reward for completing tasks. The reward must reinforce progress without penalizing missed tasks; reward rules and presentation should be validated with users.
- A user can review task completion for the day so they can tell what they followed through on.
- A user can use the app without granting location access. Location-based behavior is not part of the MVP unless later research establishes a need.

**Milestone check:** A user can connect a supported calendar, distinguish events from their own tasks, complete a task, and understand the resulting reward. Verify that calendar access can be declined or disconnected without blocking task planning.

### Out of scope for the MVP

- Community notes, shared accountability, or social features
- Daily motivational articles or third-party quote feeds
- Phone widgets or push notifications
- Phone-level app blocking or a timer that prevents users from leaving the app
- Location-based calendar or task behavior
- Individualized sleep coaching or treatment, sleep-device integrations, or health claims

## Open questions

- Which calendar provider should be supported first, and should the initial integration import events only or also write changes back?
answer: google calendar and apple calendar should be supported first! and import events only would be best.
- Is an account required for the MVP, or should a user be able to try it without signing in?
current prototype: users can continue as a guest; sign-in is not connected to an authentication provider.
- What reward feels motivating without feeling childish, distracting, or punitive?
answer: i think a streak progress would be good and the reward of being able to customize the app more and more would be less childish through every week of tasks being completed
- Sleep routine support is educational only: curated public health resources and general ideas based on optional self-selected routine patterns; it does not provide diagnosis or treatment.
- Sleep logs are optional, self-reported, held in memory only for the open page session, and do not measure or assess health.
- What is the smallest useful way to handle tasks that take longer than expected, missed deadlines, and breaks?
answer: set a seperate toolbar for each of these things so the user can keep track of them while still holding them accountable as well as not shunning them for missed deadlines. also some encouragement and motivational articles/quotes so they know they're not alone
- The current research includes only three peer interviews and a short personal routine audit. Test the assumptions that users will enter tasks and completion status accurately, that a time-based calendar helps more than a list alone, and that calendar connection is valuable enough to justify its setup.
- What success measure should be used in a pilot? Candidate measures include whether users can create and complete tasks without assistance, how often they return to the daily plan, and users' reported sense of control over balancing responsibilities and leisure.
answer: push notifications and a way to do timely reminders would be most beneficial 