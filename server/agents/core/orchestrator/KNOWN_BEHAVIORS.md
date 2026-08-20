# Existing orchestrator behaviors preserved by the modularization

These behaviors predate the internal refactor and are intentionally unchanged. They require a
separate product decision and an independently validated change if they are adjusted later.

- A `rejected` result from the automated legal-risk review (`legal_council`) is stored as a failed article step and as an unsuccessful
  `legal_council` result, while the containing pipeline currently returns `success: true`.
- If the post-stage article has no English or Spanish body, the automated legal-risk review emits its running
  progress update but does not add a terminal council result before the pipeline returns.
- A queued job moved back to `pending` after an execution failure retains its in-memory
  `completedAt` value until another execution overwrites it; persistence does not write that value
  during the retry transition.
