# CI Reliability Guide

## Problem: GitHub API Failures

GitHub Actions occasionally experiences infrastructure issues that cause jobs to fail with errors like:

```
fatal: unable to access 'https://github.com/...': The requested URL returned error: 500
error: RPC failed; HTTP 500 curl 22 The requested URL returned error: 500
fatal: expected 'packfile'
```

These are **temporary GitHub infrastructure issues**, not problems with our code.

## Solutions Implemented

### 1. Automatic Retry Workflow

We have an automatic retry workflow (`.github/workflows/auto-retry-failed-jobs.yml`) that:

- ✅ Detects when CI fails due to GitHub API issues
- ✅ Automatically retries failed jobs after 30 seconds
- ✅ Limits retries to 2 attempts to avoid infinite loops
- ✅ Only retries jobs that are sensitive to API failures (Secret Scan, Checkout, Setup)

**How it works:**

1. CI workflow fails due to GitHub API error
2. Auto-retry workflow triggers automatically
3. Waits 30 seconds for GitHub to recover
4. Re-runs only the failed jobs
5. If it fails again, retries one more time
6. After 2 retries, requires manual intervention

### 2. Removed Push Trigger

We removed the `push` trigger from CI, so it only runs on `pull_request` events:

**Before:**

```yaml
on:
  push:
    branches: [master] # ❌ Unnecessary
  pull_request:
    branches: [master] # ✅ Correct
```

**After:**

```yaml
on:
  pull_request:
    branches: [master] # ✅ Only this
```

**Why:**

- CI already runs on PRs before merge
- Running again on push to master after merge is redundant
- Reduces CI load and potential for GitHub API failures

### 3. Manual Retry Option

If automatic retry doesn't work, you can manually retry:

**Option A: Re-run failed jobs (Recommended)**

```bash
gh run rerun <run-id> --failed
```

**Option B: Re-run entire workflow**

```bash
gh run rerun <run-id>
```

**Option C: Via GitHub UI**

1. Go to the failed workflow run
2. Click "Re-run failed jobs" button
3. Wait for GitHub to recover and try again

## Prevention Strategies

### For Future Development

1. **Keep CI jobs lightweight**
   - Minimize checkout depth when possible
   - Use caching effectively
   - Avoid unnecessary submodule fetches

2. **Monitor GitHub Status**
   - Check https://www.githubstatus.com/ if seeing frequent failures
   - Consider delaying merges during GitHub incidents

3. **Use branch protection wisely**
   - Require status checks to pass
   - But allow manual override for GitHub API issues
   - Document when manual override is acceptable

## Troubleshooting

### How to identify GitHub API failures

Look for these patterns in logs:

```
❌ HTTP 500
❌ Internal Server Error
❌ unable to access 'https://github.com/...'
❌ The requested URL returned error: 500
❌ RPC failed
❌ expected 'packfile'
```

### How to identify real failures

Real failures will show:

```
❌ Test failed: Expected X but got Y
❌ Lint error: Missing semicolon
❌ Type error: Property 'foo' does not exist
❌ Build failed: Module not found
```

### When to merge despite failures

**✅ Safe to merge if:**

- All checks passed in previous commits
- Only failure is GitHub API error (HTTP 500)
- Auto-retry workflow confirms it's an API issue
- You've manually verified the code is correct

**❌ Never merge if:**

- Tests are actually failing
- Lint/type errors exist
- Build is broken
- Security vulnerabilities detected

## Monitoring

### Check auto-retry status

```bash
# List recent workflow runs
gh run list --workflow="Auto Retry Failed Jobs"

# View specific retry run
gh run view <run-id>
```

### Check CI reliability

```bash
# See recent CI runs
gh run list --workflow="CI" --limit 20

# Count failures
gh run list --workflow="CI" --limit 50 --json conclusion | \
  jq '[.[] | select(.conclusion == "failure")] | length'
```

## Related Files

- `.github/workflows/ci.yml` - Main CI workflow
- `.github/workflows/auto-retry-failed-jobs.yml` - Auto-retry logic
- `.github/workflows/revert-on-ci-failure.yml` - Auto-revert on persistent failures

## References

- [GitHub Status](https://www.githubstatus.com/)
- [GitHub Actions Reliability Issues](https://www.webpronews.com/developers-ditch-github-actions-over-reliability-and-pricing-issues/)
- [Retry Action](https://github.com/marketplace/actions/retry-action)
