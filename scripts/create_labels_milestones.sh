#!/usr/bin/env bash
# Script tạo labels và milestones cho repository bằng `gh` (GitHub CLI)
# Cách dùng: chỉnh biến REPO nếu cần, sau đó chạy: ./scripts/create_labels_milestones.sh

set -euo pipefail

REPO="datvt243/nodejs-resume-api-ts"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh cli chưa cài hoặc không tìm thấy. Cài: https://cli.github.com/"
  exit 1
fi

if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  echo "Chưa đăng nhập gh. Chạy: gh auth login"
  exit 1
fi

# Labels to create (name color description)
labels=(
  "security #b60205 Security-related issues"
  "bug #d73a4a Bug"
  "enhancement #a2eeef Enhancement"
  "refactor #c2e0c6 Refactor code"
  "testing #0e8a16 Tests and CI"
  "documentation #0075ca Docs"
  "performance #e99695 Performance improvements"
  "devops #f9d0c4 DevOps tasks"
)

for lbl in "${labels[@]}"; do
  name=$(echo "$lbl" | awk '{print $1}');
  color=$(echo "$lbl" | awk '{print $2}' | tr -d '#');
  desc=$(echo "$lbl" | cut -d' ' -f3-);
  echo "Creating label: $name ($color) - $desc"
  gh label create "$name" --color "$color" --description "$desc" --repo "$REPO" || echo "Label $name exists or failed"
done

# Create a milestone
MILESTONE_TITLE="v1.0.0 - Hardening"
MILESTONE_DUE="2026-06-30"
MILESTONE_DESC="Prepare release v1.0.0: security fixes, tests, docs"

echo "Creating milestone: $MILESTONE_TITLE"
gh milestone create "$MILESTONE_TITLE" --due-date "$MILESTONE_DUE" --description "$MILESTONE_DESC" --repo "$REPO" || echo "Milestone exists or failed"

echo "Completed labels and milestone setup for $REPO"
