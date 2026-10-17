# Design direction plan review — brief for Codex (Astra)

Written 17 October 2026. **Read and report only.** Claude will check each finding; the owner decides what changes.

## What this is for

The owner wrote design direction notes for LessonCaptain (`docs/design-direction-notes-oct-2026.md`). Claude
evaluated them and turned them into a plan (`docs/design-direction-evaluation-oct-2026.md`, v3). The plan will
decide the next three months of work, so before anything is built, it needs a **hard, independent review**.

Your job is to find where the plan is **wrong, risky, missing something, or more expensive than it says**. Don't
summarise it or praise it. A finding counts only if it would change a decision, the schedule or a design.

The product, briefly: live English lessons, **mainly online over Zoom** (`docs/product-direction-lock.md`), for kids,
teens and adults. The teacher shares one screen (the Live Room). Students join with a code, without an account, and
answer on a phone or a second window, or out loud when they have no second screen. Free = 4 lessons a month; Pro
$9/month (`docs/pricing-options-oct-2026.md`). The roadmap is `docs/roadmap-oct-2026.md`; the competitor picture is
`docs/competitive-landscape-oct-2026.md`.

## Read first, in this order
1. `docs/design-direction-notes-oct-2026.md`: the owner's ideas (the source).
2. `docs/design-direction-evaluation-oct-2026.md`: the plan you are reviewing.
3. `docs/roadmap-oct-2026.md`, `docs/product-direction-lock.md`, `docs/competitive-landscape-oct-2026.md`.

## What to review, in this order

### 1. Is every claim about the code true?
The plan says it was checked against the code. Check each claim yourself, especially:
- Section 2's table ("What already exists"): every row.
- The single filtering spot for Junior at `src/components/session/session-view.tsx:842-843`, and whether class
  modes can really plug in there for **every** place a teacher picks a tool in a live lesson (the Live Room
  catalogue, the flight deck, Explore, the launch drawer, Captain's Flight). List any launch path it misses.
- The progression gap in `calculateWorldFlightReward` (`src/lib/world-flight/progression.ts`): when any phone
  joined, are teacher marks on roster students really ignored for Everyone Aboard? Is the plan's fix correct, and
  does it double-count a student who has both a phone and a teacher mark?
- Every `deviceFree` value the plan relies on, the Flash Quiz mode list, the Talk-view vote limit (2 options), the
  analytics events that exist (`trackEvent` calls), and the flight progress model (`routeT` in
  `src/components/session/live-room/flight-deck.tsx`).
- The route analysis in section 8. Re-run it with the script in the appendix and confirm or correct the table.
  Also check what signature routes with **waypoints** would need: the flight deck and `route-terrain.ts` assume a
  single great-circle origin → destination; list everything that would have to change.

For each claim: **true / false / partly**, with file and line.

### 2. Stress-test the online design (section 6)
This is the part most likely to be wrong, because the plan was first written for in-person classes and then
reworked for online.
- Walk through a real 60-minute online lesson in three modes (Conversation, Quiz battle, Party games) for a class of
  8 with this mix: 3 students on two devices, 2 on one computer (two windows), 2 watching Zoom and answering on the
  same phone, and 1 with no second screen. At each step, say what each student can and can't do.
- **One-phone audit:** for every tool tagged `light` or `full` in the plan, check the student screen
  (`src/components/student/dynamic-input.tsx` and the panels it uses). Does the phone show the question and the
  options itself, or does the student have to look at the shared screen while answering? List each tool that fails
  for a student who has to leave Zoom to answer.
- Timers: which phone steps close automatically when the timer ends? Would the plan's "+10 seconds and stay open
  until the teacher closes it" break any game's logic or scoring?
- Is "Where are you watching the class?" on the join page workable? Can screen width and touch support give a
  reliable default? What goes wrong if a student answers it wrongly?
- Team answers with a rotating captain: which existing team games (Flash Quiz Team battle, Sector Strike, Tag-team
  Debate, Taboo Sprint) can support this without a rebuild, and which can't?
- Are the no-screen versions realistic on Zoom (reactions, chat answers, Imposter by private chat)? What does the
  teacher have to do with their hands at each step, and is that too much while sharing a screen?

### 3. Challenge the strategy
- Is "class modes" the right spine of the plan? Make the strongest case **against** it (for example: hiding tools
  hurts discovery, teachers won't set it up, modes overlap too much). Then say which side wins and why.
- Section 5's mode table: tools in the wrong mode, missing tools, tools whose `minStudents` or `idealStudents` make
  them fail in typical online class sizes (1-on-1, 3–6, 10+), retired or vaulted tools listed by mistake.
- "Design your class" (section 4): is it a good English lesson at A2, B1 and for Junior? Would students vote for
  things that don't help them learn, and does the plan handle that? Would it work in a 1-on-1 online lesson?
- The free teacher quiz (section 9): would a teacher share the result? Does it really lead into the product?
- The parked ideas (section 11): should anything parked be brought forward, or anything planned be parked?
- The competitor report says live-lesson orchestration is the open space. Does this plan strengthen that, or drift
  into settings and configuration that competitors could copy in a week?

### 4. Cost and feasibility
- Give your own estimate in working days for each workstream (A to F) and compare it with the 14-week schedule.
  Point out the steps the plan makes look easier than they are.
- The data model (section 5): check migration numbering (there are two `056_` files), the change to the
  `student_device_mode` check constraint, and whether the client-side update in `class-defaults-card.tsx` is allowed
  by the access rules for the new column. Say what breaks for existing classes and saved lessons.
- Anything in the plan that conflicts with the kids' privacy review (`docs/kids-privacy-review.md`), e.g. storing
  the student setup or class votes.

### 5. Sequencing
- Does the order make sense against the roadmap (Phase 0 testing, pricing, Home page rebuild, Junior mode)? Is there
  a cheaper first step than the one proposed?
- Is anything on the critical path that doesn't need to be?

### 6. What's missing
Anything the plan should have covered and didn't: a teacher type, a class type, a failure case, a measure, a risk.

## The bar
- Report only findings that would change a decision, the schedule or a design. Don't report wording, formatting,
  code style, or things the plan already lists as risks (unless its answer to them is wrong).
- **At most 15 findings**, most important first. Fewer, stronger findings are better.
- Prove each claim. Quote file and line for anything about the code. If you couldn't confirm a step, mark it
  "unconfirmed" and say what's missing. A confident wrong finding costs more than an honest unconfirmed one.

## Rules
- Work from `origin/claude/adoring-gauss-7a18kq` in your own worktree. It is `origin/main` plus the three plan
  documents. Don't use an old local checkout.
- Change no application code, data files or migrations. Install nothing. Make no AI calls, no writes to any
  database, and don't use the live site.
- Don't rewrite the plan. For each finding, give the smallest change to the plan in one or two sentences.

## The report
Write `docs/design-direction-review-report.md` on a branch `codex/design-direction-review` off
`origin/claude/adoring-gauss-7a18kq`. Commit locally. No push, no merge.

Structure:
1. **Verdict per workstream** (A to F): keep / change / drop, one line each.
2. **Findings**, most important first. For each:
   - **Title** in plain words.
   - **Plan section** it concerns, and what the plan says.
   - **What's actually true**, or what the problem is.
   - **Evidence**: file and line, or the reasoning step by step.
   - **What it changes**: the decision, schedule or design affected.
   - **Confidence**: confirmed, or unconfirmed with what is missing.
   - **Smallest change to the plan**: one or two sentences.
3. **Claims checked**: a table of every code claim from part 1, with true / false / partly and the file and line.
4. **The one-phone audit**: a table of tools that pass or fail for a student answering on the same phone as Zoom.
5. **Your estimates** per workstream, against the plan's schedule.
6. **Top 3 things the owner should decide differently**, if any.
7. **What you did not check.**

Write in plain English for the owner, who is an English teacher, not an engineer. Short sentences, no jargon.

## Appendix: the route check (section 8 of the plan)
Python, standard library only. Run from the repo root:
`python3 -I route_check.py . "paris>rome" "london>cairo" ...` (save this file outside the repo).
"Near" means within the feature's own radius + 150 km; "OVER" means within the radius itself.

```python
import re, math, sys
root = sys.argv[1]
dest = open(root+'/src/data/world-flight/destinations.ts').read()
coords = {}
for m in re.finditer(r"id: '([a-z-]+)',(.*?)lat: (-?[\d.]+),\s*lng: (-?[\d.]+)", dest, re.S):
    if len(m.group(2)) < 600: coords.setdefault(m.group(1), (float(m.group(3)), float(m.group(4))))
feat = open(root+'/src/data/world/named-features.ts').read()
F = [(n,k,float(a),float(b),float(r)) for n,k,a,b,r in re.findall(r"\['([^']+)', '([a-z]+)', (-?[\d.]+), (-?[\d.]+), ([\d.]+)\]", feat)]
def to3(lat,lng):
    la,lo=math.radians(lat),math.radians(lng); return (math.cos(la)*math.cos(lo),math.cos(la)*math.sin(lo),math.sin(la))
def gc(a,b,t):
    A,B=to3(*a),to3(*b); d=math.acos(max(-1,min(1,sum(x*y for x,y in zip(A,B)))))
    if d<1e-9: return a
    s1,s2=math.sin((1-t)*d)/math.sin(d),math.sin(t*d)/math.sin(d)
    x,y,z=[s1*p+s2*q for p,q in zip(A,B)]
    return (math.degrees(math.atan2(z,math.hypot(x,y))),math.degrees(math.atan2(y,x)))
def km(a,b):
    A,B=to3(*a),to3(*b); return 6371*math.acos(max(-1,min(1,sum(x*y for x,y in zip(A,B)))))
for o,d in [r.split('>') for r in sys.argv[2:]]:
    if o not in coords or d not in coords: print('missing',o,d); continue
    a,b=coords[o],coords[d]; hits={}
    for i in range(401):
        t=i/400; p=gc(a,b,t)
        for n,k,la,lo,r in F:
            dist=km(p,(la,lo))
            if dist<=r+150 and (n not in hits or dist<hits[n][1]): hits[n]=(t,dist,k,dist<=r)
    print(f"{o}>{d} {km(a,b):.0f}km:", '; '.join(f"{n} t={v[0]:.2f}{' OVER' if v[3] else ''}" for n,v in sorted(hits.items(),key=lambda x:x[1][0])))
```

## Codex prompt (paste this)

> You are Astra, reviewing a product plan for LessonCaptain. Fetch `origin/claude/adoring-gauss-7a18kq`, make your
> own worktree from it, and read `docs/design-direction-review-brief.md`. Follow it exactly: read and report only,
> change no code, data or migrations, make no AI calls and don't use the live site. Be hard on the plan: your value
> is finding what is wrong, risky, missing or underestimated, proven from the code. Write
> `docs/design-direction-review-report.md` on a new branch `codex/design-direction-review` and commit locally. No
> push, no merge.
