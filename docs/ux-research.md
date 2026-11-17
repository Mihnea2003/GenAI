# UX Research Status and Interview Plan

## Evidence status

**No real-user interviews have been conducted for this document.** The following is a simulated assumption exercise prepared because interviews are not currently available. It is not interview evidence and must not be submitted as findings from real users. Replace or supplement it with anonymized notes from actual student and organizer interviews before claiming user validation.

## Simulated assumption exercise (not user research)

These are hypotheses for the team to test, not quotes or verified findings:

| Hypothesis to test | Product implication if confirmed |
| --- | --- |
| Organizers may maintain event details and registrations in separate tools. | Provide one organizer view for event details and participant status. |
| Students may decide whether to attend based on date, venue, organization, and available capacity. | Show these details before registration. |
| Organizers may need to save incomplete information before publishing. | Support a draft state distinct from published events. |
| Capacity and duplicate registrations may be common sources of manual errors. | Enforce both rules in the persistence layer and show clear outcomes. |

No product changes are attributed to interviews. The current draft/published workflow and event details are provisional design choices based on the assignment and unverified hypotheses.

## Implementation status (added with the student workflow)

The student workflow (browse, search and filter, details, register and cancel, my registrations) is now implemented against persisted Firebase data. See `docs/student-flow.md`.

- **Real-user validation is still pending.** No interviews or usability sessions with students or organizers have taken place. The design choices in `docs/student-flow.md` follow the simulated hypotheses above and the assignment, not user evidence.
- When interviews happen, record them with the template below. Then update the "changed assumptions" and "product changes" fields, and the usability-issues section of `docs/student-flow.md`.

## Interview plan

### Participants to recruit
- One organizer who has helped plan a student organization event.
- One student who has attended or considered attending student events.

### Short question guide
1. Tell me about the last student event you organized or attended.
2. How did you find the event information and registration link?
3. What information did you need before deciding to register or attend?
4. If you organized it, how did you track registrations and capacity?
5. What went wrong or took more effort than expected?
6. What would you change about the process?
7. (Organizer) When do event details become final, and who is allowed to change them?

Ask open-ended questions, avoid leading participants toward the proposed solution, and request permission before taking notes. Do not collect unnecessary personal or sensitive information. Use role-only identifiers in the report.

## Notes template for real interviews

Complete only after the conversation occurs:

- Participant code and role:
- Date and interview method:
- Relevant experience:
- Observed workflow:
- Directly observed pain points (paraphrase; quote only with permission):
- Needs and workarounds:
- Assumptions supported, contradicted, or still uncertain:
- Specific product change made and reason: