#!/usr/bin/env bash
# Propagates a fix committed on one step branch to every later branch.
#
# The branches form one linear history: step-1 -> step-2 -> step-3 -> step-4 -> main.
# Commit the fix on the earliest branch that needs it, then run:
#
#   scripts/restack.sh step-1      # or step-2, step-3, step-4
#
# It rebases main onto the fixed branch with --update-refs, so the step branches in between
# move with it. On a conflict, resolve it, run `git rebase --continue`, and you are done
# (the remaining refs are updated by git when the rebase finishes).
# Tags (v-step-N, v-final) are not moved: re-tag on purpose before the workshop.
set -euo pipefail

CHAIN=(step-1 step-2 step-3 step-4 main)
FROM="${1:-}"

if [[ -z "$FROM" || ! " ${CHAIN[*]} " =~ " ${FROM} " || "$FROM" == "main" ]]; then
  echo "Usage: scripts/restack.sh <step-1|step-2|step-3|step-4>" >&2
  exit 2
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash first." >&2
  exit 1
fi

for b in "${CHAIN[@]}"; do
  git rev-parse --verify --quiet "refs/heads/$b" >/dev/null || { echo "Missing branch: $b" >&2; exit 1; }
done

# The commit the next branches were built on: where FROM's old tip still sits in main's history.
OLD_BASE="$(git merge-base "$FROM" main)"
if [[ "$OLD_BASE" == "$(git rev-parse "$FROM")" ]]; then
  echo "Nothing to restack: main already contains $FROM."
  exit 0
fi

ORIGINAL="$(git symbolic-ref --quiet --short HEAD || git rev-parse HEAD)"
echo "Rebasing the chain after $FROM (old base ${OLD_BASE:0:7}) onto $FROM ..."
git rebase --update-refs --onto "$FROM" "$OLD_BASE" main
git checkout --quiet "$ORIGINAL"

echo "Done. Each branch now contains the previous one:"
for ((i = 0; i < ${#CHAIN[@]} - 1; i++)); do
  if git merge-base --is-ancestor "${CHAIN[i]}" "${CHAIN[i+1]}"; then
    echo "  ok  ${CHAIN[i]} -> ${CHAIN[i+1]}"
  else
    echo "  !!  ${CHAIN[i]} is not in ${CHAIN[i+1]}" >&2
    exit 1
  fi
done
echo "Next: scripts/verify-steps.sh"
