# Submission Tracker interviews

Use **Submission Tracker → Actions → Interviews**. A shortlisted submission's
action is highlighted. Candidate name, email, client, role and recruiter are reused;
candidate name, valid email, client and role must be saved on the submission first.

Each submission supports Screening, Technical, HR, Managerial and Final rounds.
Set the time, timezone, duration, interviewer and mode. Online interviews use an
existing HTTPS meeting link; in-person interviews require a location.

- **Save interview** persists the meeting without sending messages.
- **Save & Send Invite** persists it and emails candidate/interviewer with an ICS
  calendar invitation. SMTP uses the backend's existing SMTP environment settings.
- **Reschedule / edit** updates the same calendar UID and increases its version.
  Save & Send Invite or Send invite sends the update.
- **Cancel** requires confirmation. **Send cancellation** separately emails the
  cancellation. Mark completed is available once the scheduled time has started.
- **Calendar** downloads the ICS file with authenticated access. No public token
  or candidate portal is needed to use the calendar invitation.

Interview records are separate from submission status and the legacy Interview
Date field. The Actions column shows the next future interview, with timezone.
Recruiters can access only their own submissions; admins can manage all. Duplicate
rounds and overlapping candidate/interviewer times are checked across tracker
interviews inside serialized transactions. Employer-dashboard interviews are
stored separately and are not part of this conflict check.

Backend: `models/TrackerInterview.js`, `routes/adminTrackerInterviews.js`,
`services/trackerInterviewValidation.js`, `services/trackerInterviewMail.js`.
The route creates the new `tracker_interviews` table with Sequelize `sync()` on
backend startup (no existing table alteration). The database account needs table
creation permission. Existing employer interviews are untouched.

Run `npm run test:tracker-interviews` and `npm run test:tracker` in the backend.
Tests use isolated storage/email adapters and do not send live invitations.

Restart the backend and deploy the frontend. Verify saving and SMTP delivery in
the target environment. Calendar invitation responses are handled by recipients'
calendar apps; they do not automatically change the tracker interview status.
Automatic Google Meet/Teams/Zoom creation is not included in this version.

## Loading errors and deployment checks

The interview list returns HTTP 200 with `[]` when a valid submission has no
interviews. The UI shows the scheduling action and a neutral empty message.
A failed request shows **Unable to load interviews** with a retry action;
it does not claim the submission has no interviews, and scheduling is disabled
until loading succeeds.

An HTTP 404 with the generic `Not found` message means the request did not reach
the interview route. Deploy the backend files and `server.js` route registration,
then restart the backend serving the frontend's API URL. Restarting only Vite or
deploying only the frontend cannot add the backend endpoint.

Check `GET /api/admin/tracker/rows/<submission-id>/interviews` with the signed-in
user's session in the browser Network tab. `Submission not found.` is a different
404: the submission no longer exists or is not accessible to that recruiter.
The protected endpoint returns 401 when called without authentication; that is
expected and confirms the request reached authentication rather than a generic
missing-route handler.
