# Maintaining the workshop branches

The branches are one linear history: `step-1` → `step-2` → `step-3` → `step-4` → `main`.
Each branch is the previous one plus one exercise solution and the next exercise's materials.

## Fix something

1. Check out the **earliest** branch that needs the fix (usually `step-1`).
2. Commit the fix there.
3. Run `scripts/restack.sh step-1` (use the branch you fixed). It rebases `main` onto it with
   `git rebase --update-refs`, so `step-2`..`step-4` move too. On a conflict: resolve it,
   `git add`, `git rebase --continue`.
4. Run `scripts/verify-steps.sh`. It checks every branch in a clean worktree: `npm ci`,
   `npm run validate`, `check:bundle:ci`, and `check:step` (fails on step-1..4 by design,
   passes on `main`). It also scans the git history for real-looking provider keys.
5. Push all branches: `git push --force-with-lease origin step-1 step-2 step-3 step-4 main`.

## Freeze for the workshop day

```sh
for n in 1 2 3 4; do git tag -f "v-step-$n" "step-$n"; done
git tag -f v-final main
git push --force origin --tags
```

## Rules

- Every intentional flaw carries a `// WORKSHOP(X)` marker on the branches where it is unsolved.
- Never commit a real key. The demo key uses the `wsk_demo_` prefix so secret scanners ignore it.
- `STEP.md` and `workshop.json` change only in the commit that creates each step.
