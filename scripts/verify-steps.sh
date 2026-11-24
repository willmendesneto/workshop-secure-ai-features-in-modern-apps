#!/usr/bin/env bash
# Checks every workshop branch from a clean checkout, the way an attendee gets it:
#   npm ci, npm run validate, check:bundle:ci, and the expected check:step result
#   (fails on step-1..4 because the exercise is not solved yet, passes on main).
# Also scans the whole git history for real-looking provider keys.
#
#   scripts/verify-steps.sh            # all branches
#   scripts/verify-steps.sh step-2     # one branch
set -uo pipefail

BRANCHES=("$@")
[[ ${#BRANCHES[@]} -eq 0 ]] && BRANCHES=(step-1 step-2 step-3 step-4 main)

ROOT="$(git rev-parse --show-toplevel)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/verify-steps.XXXXXX")"
FAILED=()

cleanup() {
  for b in "${BRANCHES[@]}"; do git -C "$ROOT" worktree remove --force "$WORK/$b" >/dev/null 2>&1; done
  rm -rf "$WORK"
}
trap cleanup EXIT

run() { # label, command...
  local label="$1"; shift
  if "$@" >"$LOG" 2>&1; then echo "    ok    $label"; return 0; fi
  echo "    FAIL  $label (log: $LOG)"; return 1
}

echo "Secret scan (all history) ..."
# Real provider key formats only. The demo key uses the wsk_demo_ prefix on purpose.
if git -C "$ROOT" log -p --all | grep -nE 'AIza[0-9A-Za-z_-]{35}|sk-(proj-)?[A-Za-z0-9_-]{20,}' \
  | grep -vF '{35}' | grep -vF '{20,}' ; then
  echo "  FAIL  real-looking key found in history"; FAILED+=("secrets")
else
  echo "  ok    no real-looking keys in history"
fi

for b in "${BRANCHES[@]}"; do
  echo "== $b"
  dir="$WORK/$b"
  git -C "$ROOT" worktree add --quiet --detach "$dir" "$b" || { FAILED+=("$b"); continue; }
  LOG="$WORK/$b.log"
  ok=1
  (cd "$dir" && run "npm ci" npm ci --no-audit --no-fund) || ok=0
  [[ $ok -eq 1 ]] && { (cd "$dir" && run "validate" npm run validate) || ok=0; }
  [[ $ok -eq 1 ]] && { (cd "$dir" && run "check:bundle:ci" npm run check:bundle:ci) || ok=0; }
  if [[ $ok -eq 1 ]]; then
    if [[ "$b" == "main" ]]; then
      (cd "$dir" && run "check:step passes" npm run check:step) || ok=0
    else
      if (cd "$dir" && npm run check:step >"$LOG" 2>&1); then
        echo "    FAIL  check:step should fail before the exercise is solved"; ok=0
      else
        echo "    ok    check:step fails (exercise not solved yet, as expected)"
      fi
    fi
  fi
  [[ $ok -eq 1 ]] || FAILED+=("$b")
done

echo
if [[ ${#FAILED[@]} -eq 0 ]]; then
  echo "All branches OK."
else
  echo "Failed: ${FAILED[*]}"
  exit 1
fi
