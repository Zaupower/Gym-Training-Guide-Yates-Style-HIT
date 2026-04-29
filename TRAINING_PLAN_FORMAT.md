# Training Plan Import Format

Upload a `.txt` file (or paste the content) in the **Plans** tab to schedule sessions across multiple weeks.

---

## Full Example

```
# My Push/Pull/Legs — 4-week block
WEEKS: 4
START: 2026-05-05

DAY: monday
  Bench Press       | chest     | w:2x12@40kg, 3x8@80kg
  Incline DB Press  | chest     | 3x10@30kg
  Cable Fly         | chest     | 2x12@25kg

DAY: wednesday
  Squat             | legs      | w:2x15@60kg, 4x6@100kg
  Leg Press         | legs      | 3x12@150kg
  Leg Curl          | legs      | 3x10@50kg

DAY: friday
  Pull Down         | back      | w:2x15@40kg, 3x10@60kg
  Barbell Row       | back      | 3x8@70kg
  Bicep Curl        | biceps    | 3x12@20kg
```

---

## Header Fields

| Field | Required | Description |
|-------|----------|-------------|
| `WEEKS: N` | Yes | How many weeks to generate (e.g. `WEEKS: 4`) |
| `START: date` | Yes | First day of the block. See formats below. |

### START formats
- `START: 2026-05-05` — specific date (YYYY-MM-DD)
- `START: today` — today's date
- `START: next-monday` — the coming Monday

---

## Day Blocks

```
DAY: <weekday>
TITLE: Session title (optional)
NOTES: Session notes (optional)
  Exercise Name | muscle_group | sets
  Exercise Name | muscle_group | sets
```

- `DAY:` is case-insensitive (`Monday`, `MONDAY`, `monday` all work)
- Valid days: `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`
- Days not listed = rest days (no session created)
- `TITLE:` pre-fills the session title shown in the calendar and session editor
- `NOTES:` pre-fills the session notes; repeat `NOTES:` on multiple lines to append
- Indentation is optional but recommended for readability

---

## Exercise Line Format

```
Exercise Name | muscle_group | set_spec
```

### Muscle Groups
`chest` · `back` · `legs` · `shoulders` · `biceps` · `triceps` · `calves` · `abs` · `cardio` · `other`

### Strength Set Specification — `NxREPS@WEIGHTunit`

| Example | Meaning |
|---------|---------|
| `3x8@80kg` | 3 working sets · 8 reps · 80 kg |
| `4x6@100lb` | 4 working sets · 6 reps · 100 lb |
| `w:2x12@40kg` | 2 **warmup** sets · 12 reps · 40 kg |
| `d:1x15@60kg` | 1 **drop** set · 15 reps · 60 kg |

**Set kinds:**
- No prefix → `working` (default)
- `w:` prefix → `warmup`
- `d:` prefix → `drop`

**Combining kinds** — separate with commas on the same line:
```
Bench Press | chest | w:2x12@40kg, 3x8@80kg, d:1x15@60kg
```
This creates: 2 warmup + 3 working + 1 drop set.

**Unit** — `kg` or `lb`. Defaults to `kg` if omitted.

### Cardio Set Specification — `NxDURATION`

Use muscle group `cardio` and a time-based spec instead of weight:

| Example | Meaning |
|---------|---------|
| `1x20min` | 1 set · 20 minutes |
| `3x45sec` | 3 sets · 45 seconds each |

```
DAY: tuesday
  Stationary Bike | cardio | 1x20min
  Jump Rope       | cardio | 3x45sec

DAY: saturday
  Outdoor Walk    | cardio | 1x30min
```

---

## Comments

Lines starting with `#` are ignored:

```
# This is a comment
DAY: monday  # inline comments also work
```

---

## How Activation Works

1. **Upload** the plan in the Plans tab — it is saved but not yet on the calendar.
2. **Activate** (▶) — sessions are created as drafts on the calendar for every matching day across all weeks.
   - If a date already has a session it is skipped (reported as "skipped").
3. **Deactivate** (⏹) — removes only the draft sessions that haven't been logged yet. Sessions you have already opened and saved are kept.
4. **Delete** (🗑) — removes the plan and all its pending draft sessions permanently.

---

## Tips

- You can activate **multiple plans** at once as long as their dates don't overlap.
- To reuse a plan for a new block, change the `START` date and re-upload it as a new plan.
- Sessions created by a plan are marked as **draft** on the calendar until you open and log them.
