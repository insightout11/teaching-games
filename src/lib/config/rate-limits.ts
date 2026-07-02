export const RATE_LIMITS = {
  TEXT_SUBMISSION_SECONDS: 15,  // Min seconds between text submissions
  POLL_VOTE_SECONDS: 2,         // Min seconds between vote changes
};

export const VALIDATION = {
  DISPLAY_NAME_MAX: 40,
  CONTENT_MAX: 1000,
  QUESTION_MAX: 200,
  EMAIL_MAX: 254,
};

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
