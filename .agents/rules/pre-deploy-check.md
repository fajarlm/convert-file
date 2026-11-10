# Mandatory Pre-Push & Pre-Deploy Verification

Before executing any `git push` or deployment to platforms like Vercel:
1. **Lint & Static Check**: Execute static analysis / linter (`npm run lint`).
2. **Type Check & Production Build**: Run `npm run build` to verify there are no compilation or bundling errors.
3. **Inspect Output & Logs**: If any errors or warnings occur, resolve and debug them immediately.
4. **Clean Tree Verification**: Ensure all intended changes are staged and no sensitive keys (`.env.local`, credentials) are tracked.
5. **Only Proceed on Green**: Only execute `git push` or deploy to Vercel when the build succeeds with exit code 0.
