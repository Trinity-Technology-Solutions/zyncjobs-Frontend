# Talent Pool submissions API contract

The existing transfer UI calls `POST /api/admin/tracker/rows/from-talent-pool`.
The backend source is in the sibling `zyncjobs-backend` repository. Its transfer
route reuses candidate/resume fields, assigns the logged-in recruiter and current date,
and validates the batch inside a database transaction.

Request example:

```json
{
  "candidateIds": ["talent-candidate-id"],
  "clientName": "Example client / HR",
  "skillRole": "REQ-123",
  "source": "Internal DB",
  "interviewDate": "",
  "status": "Submitted"
}
```

The server must authorize the request, load the selected parsed candidates,
and reuse their stored candidate and resume information. Store the Talent Pool
candidate ID on the tracker record and retain access to its original resume.
Recruiter and submitted date are assigned by the server on all creation paths;
client-supplied values cannot override them. Both fields are read-only in the UI
and protected against subsequent API edits.
Validate the required client, job, source and status,
the optional interview date, and the batch limit of 100 candidates.

Return arrays for every outcome, including partial successes:

```json
{
  "created": [{ "talentCandidateId": "talent-candidate-id" }],
  "duplicates": [{ "candidateId": "duplicate-id", "name": "Candidate name" }],
  "invalid": [{ "candidateId": "invalid-id", "name": "Candidate name", "reason": "Not parsed" }]
}
```

The UI accepts these arrays on successful responses and on HTTP 409/422.
Other errors may return `{ "error": "Message" }`.

The frontend checks existing tracker rows immediately before transferring,
matching candidate ID, normalized email, or normalized name plus phone, and
case/whitespace-normalized client and job. It also removes duplicates inside
the selected batch. A failed duplicate check prevents the transfer.

The backend serializes tracker creation and editing with a PostgreSQL table lock
inside a transaction, checking all existing submissions before writing. This
covers concurrent transfers and records outside a recruiter's visible rows.
Manual records are checked when created or edited; resume uploads start without
a client and are checked when assigned a client/job. A filename alone does not
identify a candidate. Transferred resume references cannot be overwritten through
tracker edits. Recruiter and submitted date remain immutable after creation.

The rows GET endpoint returns accessible records as an array.
`GET /api/admin/tracker/rows/:id/resume` authorizes access to the reused S3 resume.
Talent Pool deletion preserves resume files still referenced by tracker rows.

Validation: run `npm run test:tracker` in the backend. Backend route tests
use an isolated adapter; they do not connect to a live PostgreSQL database or S3.
