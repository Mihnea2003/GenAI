# UX Research Status and Interview Plan

## Evidence status

Informal conversations were held with former university colleagues and students to gather initial perspectives on student events, event discovery, registration processes, and participation.

These conversations provided preliminary qualitative input into potential user needs and challenges. They were informal discussions rather than structured usability testing sessions. Therefore, their insights should be treated as preliminary and not as representative or statistically validated research.

The following simulated assumption exercise remains a set of hypotheses for further investigation. 

## Simulated assumption exercise (not user research)

These are hypotheses for the team to test, not quotes or verified findings:

| Hypothesis to test | Product implication if confirmed |
| --- | --- |
| Organizers may maintain event details and registrations in separate tools. | Provide one organizer view for event details and participant status. |
| Students may decide whether to attend based on date, venue, organization, and available capacity. | Show these details before registration. |
| Organizers may need to save incomplete information before publishing. | Support a draft state distinct from published events. |
| Capacity and duplicate registrations may be common sources of manual errors. | Enforce both rules in the persistence layer and show clear outcomes. |

No product changes are attributed directly to the informal conversations. The current draft/published workflow and event details are provisional design choices based on the assignment and the team's initial assumptions.

## Implementation status (added with the student workflow)

The student workflow (browse, search and filter, details, register and cancel, my registrations) is now implemented against persisted Firebase data. See `docs/student-flow.md`.

- Informal conversations with former university colleagues and students have taken place, providing preliminary perspectives on the student event experience.
- Formal usability testing and systematic validation with students and organizers are still pending. The design choices in `docs/student-flow.md` follow the assignment and the team's initial assumptions; they should not be presented as validated product decisions.
- When additional interviews or usability sessions happen, record them with the template below. Then update the "changed assumptions" and "product changes" fields, and the usability-issues section of `docs/student-flow.md`.

## Interview plan

### Short question guide
1. Tell me about the last student event you organized or attended.
2. How did you find the event information and registration link?
3. What information did you need before deciding to register or attend?
4. If you organized it, how did you track registrations and capacity?
5. What went wrong or took more effort than expected?
6. What would you change about the process?
7. (Organizer) When do event details become final, and who is allowed to change them?

Ask open-ended questions, avoid leading participants toward the proposed solution, and request permission before taking notes. Do not collect unnecessary personal or sensitive information. Use role-only identifiers in the report.
