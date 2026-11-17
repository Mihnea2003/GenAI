# Event Lifecycle and API Contract

**Owner:** Mihnea Bucur (requirements and event-authoring workflow)  
**Status:** Proposed contract for Sebastian to review before Firebase integration.

## Lifecycle

```text
draft -> published -> completed
  |          |
  +--------> cancelled
```

`completed` and `cancelled` are terminal. Publishing requires valid event data and an authorized organization member. This prototype does not implement authentication or server-side authorization; both must be applied before operations are exposed to real users.

## Event record (logical shape)

```json
{
  "id": "event document id",
  "organizationId": "organization document id",
  "title": "Research Skills Workshop",
  "description": "Workshop details",
  "startDate": "2030-10-12T10:00:00Z",
  "endDate": "2030-10-12T12:00:00Z",
  "location": "Campus venue",
  "capacity": 40,
  "status": "draft",
  "createdBy": "firebase user id",
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp"
}
```

The dashboard currently uses temporary local sample objects. Its `organization` text field must be replaced with a selected organization reference (`organizationId`) when connected to Firestore.

## Proposed operations

These are contracts, not implemented endpoints yet. The team may choose Next.js Route Handlers or Server Actions, but should use one consistent interface and validate authorization on the server for every mutation.

| Operation | Input | Success | Expected rejection |
| --- | --- | --- | --- |
| `GET /api/events?status=published&q=...` | optional status/search filters | `200` with matching public events | `400` invalid filters |
| `POST /api/events` | event fields and requested initial status | `201` with created event | `400` invalid fields; `401` no session; `403` not an organization organizer |
| `GET /api/events/{eventId}` | event id | `200` event details if visible | `404` missing or not visible |
| `PATCH /api/events/{eventId}` | allowed event fields or status transition | `200` updated event | `400` invalid transition/data; `401` no session; `403` not authorized; `404` missing |

Registration operations should be agreed with Sebastian and documented alongside UC-04. The registration write must transactionally check duplicate and capacity conditions in Firestore; checking only in the browser is insufficient.

## Validation and error shape

Use the same validation rules in the UI for fast feedback and repeat them in the trusted server layer. A suggested error response is:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The end date must be after the start date.",
    "field": "endDate"
  }
}
```

Never expose Firebase Admin credentials or private keys in browser code or `NEXT_PUBLIC_*` environment variables.