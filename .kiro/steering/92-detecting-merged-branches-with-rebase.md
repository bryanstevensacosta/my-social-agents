# Detecting Merged Branches with Rebase Workflow

## The Problem

When using **rebase merge** (as we do in this project), `git branch --merged` doesn't work correctly because:

1. **Rebase rewrites commits** with new SHAs
2. **Git compares SHAs**, not content
3. **Result**: Merged branches appear as "not merged"

### Example

```bash
# Your local branch
fix/my-feature: abc123

# After rebase merge in GitHub
master: def456  # Same content, different SHA

# Git thinks they're different
git branch --merged origin/master
# Returns: (nothing) ❌
```

## Why This Happens

```
# Before merge (your branch)
A---B---C  (fix/my-feature)

# After rebase merge
A'--B'--C'  (master)
     ↑
  New SHAs, same content
```

Git's `--merged` flag uses `git merge-base --is-ancestor`, which checks if the branch's SHA exists in master's history. With rebase, it doesn't.

## Solutions

### Solution 1: Use GitHub PR Status (Recommended)

The most reliable way is to check if the PR was merged in GitHub:

```bash
# Run the cleanup script
./scripts/cleanup-merged-branches.sh
```

This script:
- ✅ Checks PR status in GitHub using `gh` CLI
- ✅ Detects MERGED, OPEN, and CLOSED PRs
- ✅ Safely deletes only merged branches
- ✅ Prompts for confirmation

### Solution 2: Use Git Aliases

Load the aliases:

```bash
source scripts/git-aliases-merged.sh
```

Available commands:

```bash
# Detect branches with merged PRs
git-merged-pr

# Delete branches with merged PRs
git-delete-merged-pr

# Detect merged branches by comparing patches (slower but works)
git-merged-rebase origin/master
```

### Solution 3: Manual Verification

Check each branch manually:

```bash
# List all PRs
gh pr list --state all --limit 20

# Check specific branch
gh pr list --head fix/my-feature --state all
```

## Recommended Workflow

### After Merging a PR

1. **GitHub auto-deletes the remote branch** (if enabled in settings)
2. **Locally, run the cleanup script**:
   ```bash
   ./scripts/cleanup-merged-branches.sh
   ```

### Periodic Cleanup

Run weekly or monthly:

```bash
# Prune remote tracking branches
git fetch origin --prune

# Clean up local branches
./scripts/cleanup-merged-branches.sh
```

## Why Not Use Squash or Merge Commit?

We use **rebase merge** because:

1. ✅ **Linear history** - Easy to follow
2. ✅ **Clean git log** - No merge commits
3. ✅ **Preserves commits** - Unlike squash
4. ✅ **Bisect-friendly** - Each commit is testable

The trade-off is that `git branch --merged` doesn't work, but the benefits outweigh this inconvenience.

## Alternative: Squash Merge

If you prefer `git branch --merged` to work, you could switch to **squash merge**:

```yaml
# .github/workflows/auto-merge.yml
merge_method: 'squash'  # Instead of 'rebase'
```

**Trade-offs**:
- ✅ `git branch --merged` works
- ❌ Loses individual commit history
- ❌ Single commit per PR (less granular)

We chose **rebase** for better history preservation.

## Automation

### Git Hook (Optional)

Add to `.husky/post-checkout`:

```bash
#!/bin/bash

# Auto-cleanup merged branches when switching to master
if [ "$3" = "1" ] && [ "$(git branch --show-current)" = "master" ]; then
  echo "🧹 Checking for merged branches..."
  ./scripts/cleanup-merged-branches.sh --auto
fi
```

### GitHub Action (Optional)

Create `.github/workflows/cleanup-branches.yml`:

```yaml
name: Cleanup Merged Branches

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Delete merged branches
        run: |
          gh pr list --state merged --json headRefName --jq '.[].headRefName' | \
          xargs -I {} gh api -X DELETE repos/${{ github.repository }}/git/refs/heads/{}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Summary

| Method | Pros | Cons |
|--------|------|------|
| **GitHub PR Status** | ✅ Most reliable<br>✅ Works with rebase | ❌ Requires `gh` CLI |
| **Patch-ID Comparison** | ✅ Pure Git<br>✅ No external deps | ❌ Slow<br>❌ Complex |
| **Manual Check** | ✅ Simple | ❌ Time-consuming |

**Recommendation**: Use `./scripts/cleanup-merged-branches.sh` after merging PRs.

## Related Files

- `scripts/cleanup-merged-branches.sh` - Automated cleanup script
- `scripts/git-aliases-merged.sh` - Git aliases for branch detection
- `.kiro/steering/60-git-workflow.md` - Git workflow documentation
- `.kiro/steering/61-git-hooks.md` - Git hooks documentation
