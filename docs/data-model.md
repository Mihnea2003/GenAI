# Initial Data Model

## Entities

### User
- id: string
- email: string
- displayName: string
- role: string
- organizationId: string | null
- createdAt: timestamp

### Organization
- id: string
- name: string
- description: string
- createdAt: timestamp

### Event
- id: string
- organizationId: string
- title: string
- description: string
- startDate: timestamp
- endDate: timestamp
- location: string
- capacity: number
- status: "draft" | "published" | "completed" | "cancelled"
- createdBy: string
- createdAt: timestamp

### Registration
- id: string
- eventId: string
- userId: string
- status: "pending" | "confirmed" | "cancelled"
- registeredAt: timestamp

### Attendance
- id: string
- eventId: string
- userId: string
- status: "present" | "absent" | "pending"
- markedBy: string
- markedAt: timestamp

## Core relationships
- User belongs to one organization or none
- Organization has many events
- Event has many registrations
- User can have many registrations across events
- Event has many attendance records

## Validation rules
- registration count cannot exceed capacity
- no duplicate registration for the same user and event
- only organizers can edit event details
- only published events accept new registrations
