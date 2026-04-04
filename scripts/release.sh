#!/bin/bash
set -e

# Usage: ./scripts/release.sh [patch|minor|major]
# Default: patch (0.3.1 → 0.3.2)

BUMP=${1:-patch}
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

# 1. Ensure clean working tree
if [ -n "$(git status --porcelain)" ]; then
  echo "✗ Working tree is dirty. Commit or stash changes first."
  exit 1
fi

# 2. Version bump
NEW_VERSION=$(npm version "$BUMP" --no-git-tag-version)
NEW_VERSION=${NEW_VERSION#v}
echo "→ Version: $NEW_VERSION"

# 3. Update server.json versions to match
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/g" server.json

# 4. Commit + push
git add package.json server.json
git commit -m "chore: release v${NEW_VERSION}"
git push origin main

# 5. npm publish
npm publish
echo "✓ npm: artscii@${NEW_VERSION}"

# 6. MCP Registry publish
./mcp-publisher publish
echo "✓ MCP Registry: io.github.rxolve/artscii@${NEW_VERSION}"

echo ""
echo "✓ Released v${NEW_VERSION}"
