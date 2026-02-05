# Publish Flow State Machine

States:
- draft
- validating
- publishing
- published
- rejected
- yanked

```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> validating: publish_request(version, commit_sha)
  validating --> publishing: validation_passed
  validating --> rejected: validation_failed | policy_failed
  publishing --> published: upload_ok & index_ok & signature_ok?
  publishing --> rejected: upload_failed | index_failed | signature_failed
  published --> yanked: yank(version)
  yanked --> published: unyank(version)
```

Invariants:
- version immutable once published
- version maps to exactly one commit sha
- published implies tarball+sha256 retrievable
- yanked remains resolvable via exact version pin
