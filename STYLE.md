# Style review entry point

This file is a navigation aid, not a second style policy.

- Existing repository guidance: [STYLES.md](STYLES.md).
- Review method and draft status: [DESIGN.md](DESIGN.md).
- Full reference: [Default Admin design reference](docs/design/default-admin-design-system.html).
- Canonical proposed rules: [contracts.json](docs/design/contracts.json).
- Conflicting or historical guidance: [conflict register](docs/design/CONFLICTS.md).

## Bold or italics?

Determine meaning and component role before suggesting markup or CSS changes.

| Intent | Starting point | Proposed rule |
| --- | --- | --- |
| Form-control label | Preserve its label relationship and component variant | SEM-03 |
| Section heading | Preserve structural hierarchy | SEM-01 |
| Importance or urgency | Consider strong markup for that meaning | SEM-02 |
| Stress emphasis | Consider em markup for that meaning | SEM-02 |
| Visual hierarchy only | Use the existing component styling and tokens | TOK-01 |
| Authored editor text | Review editor content, allowed format and saved output separately | EDT-01, EDT-02 |

These IDs point to proposed contracts, not accepted scanner failures. Do not
change semantics merely to make text look uniform. Do not interpret historical
Claro token values as Default Admin values. Surface conflicts with governing
repository guidance rather than silently resolving them through this file.

The full reference also covers print, colour semantics, independent preferences,
forced colours, reduced motion, language/direction and theme transitions. Keep
rule statements in contracts.json; do not duplicate their definitions here.
