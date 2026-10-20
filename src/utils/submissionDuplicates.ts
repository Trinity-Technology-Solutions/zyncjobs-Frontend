export interface SubmissionIdentity {
  id?: string;
  talentCandidateId?: string;
  email?: string;
  phone?: string;
  name?: string;
  candidateName?: string;
  clientName?: string;
  skillRole?: string;
}

const normalize = (value?: string) => (value || '').trim().replace(/\s+/g, ' ').toLowerCase();
const phone = (value?: string) => (value || '').replace(/\D/g, '');

export function isSameCandidate(candidate: SubmissionIdentity, submission: SubmissionIdentity) {
  if (candidate.id && candidate.id === submission.talentCandidateId) return true;
  const email = normalize(candidate.email);
  if (email && email === normalize(submission.email)) return true;
  const contact = phone(candidate.phone);
  const name = normalize(candidate.name || candidate.candidateName);
  return Boolean(contact.length >= 7 && name && contact === phone(submission.phone)
    && name === normalize(submission.name || submission.candidateName));
}

export function isDuplicateSubmission(candidate: SubmissionIdentity, submission: SubmissionIdentity, clientName: string, skillRole: string) {
  return normalize(clientName) === normalize(submission.clientName)
    && normalize(skillRole) === normalize(submission.skillRole)
    && isSameCandidate(candidate, submission);
}
