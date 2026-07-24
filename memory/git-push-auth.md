---
name: git-push-auth
description: Plain git pushes do not depend on the GitHub CLI session in this repository
metadata:
  type: project
---

When the user asks to push changes in this repository, commit the intended scope and try `git push` directly.

Do not stop just because `gh auth status` reports an invalid token: Git remote credentials are independent and have worked even when the GitHub CLI session was invalid. Use `gh` authentication only when a requested operation specifically needs the GitHub CLI, such as creating or inspecting a pull request.
