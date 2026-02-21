# Member removal flows (intended behavior)

Admin **cannot** delete a member directly. Removal is only allowed via one of these flows:

## 1. Member requests to leave → Admin accepts

- **Member:** Has an option (e.g. in Profile/Settings) like "Request to leave" / "Leave group".
- **Backend:** Creates a "leave request" (pending) for that member.
- **Admin:** Sees pending leave requests (e.g. in Members tab or a dedicated section) and can **Accept** or **Reject**.
- **On Accept:** Member is then removed (e.g. account deleted or deactivated).

## 2. Admin requests removal → Member accepts

- **Admin:** Can trigger "Request removal" for a member (instead of Delete).
- **Backend:** Creates a "removal request" and notifies the member (e.g. in-app or email).
- **Member:** Sees the request (e.g. in Profile/Settings) and can **Accept** or **Decline**.
- **On Accept by member:** That person is then removed.

## Current state (implemented)

- **Admin UI:** No Delete on Members list or in Member view modal. Admin uses "Request removal" in the member detail modal; removal happens only when the member accepts.
- **Backend:** `RemovalRequest` model; `POST/GET /api/removal-requests`, `POST .../accept`, `POST .../reject`. On accept (leave or removal), the backend deletes the user.
- **Member (Profile):** "Request to leave" and, if admin requested removal, "Accept" / "Decline".
- **Admin (Members tab):** "Pending requests" section with Accept/Reject for leave requests; "Request removal" in the member view modal.
