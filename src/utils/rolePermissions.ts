// Frontend role and permission utilities
export type UserRole = 'super_admin' | 'admin' | 'employer' | 'candidate' | 'moderator';
export type AccountStatus = 'active' | 'suspended' | 'deleted';

export const PERMISSIONS = {
  // Super Admin permissions
  MANAGE_ADMINS: 'manage_admins',
  SYSTEM_SETTINGS: 'system_settings',
  
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_JOBS: 'manage_jobs', 
  MANAGE_COMPANIES: 'manage_companies',
  VIEW_ANALYTICS: 'view_analytics',
  MODERATE_CONTENT: 'moderate_content',
  MANAGE_USER_STATUS: 'manage_user_status',
  
  // Employer permissions
  POST_JOBS: 'post_jobs',
  VIEW_APPLICANTS: 'view_applicants',
  MANAGE_OWN_JOBS: 'manage_own_jobs',
  
  // Candidate permissions
  APPLY_JOBS: 'apply_jobs',
  VIEW_JOBS: 'view_jobs',
  MANAGE_PROFILE: 'manage_profile',
  USE_RESUME_BUILDER: 'use_resume_builder',
  TAKE_SKILL_ASSESSMENT: 'take_skill_assessment',
  USE_RESUME_PARSER: 'use_resume_parser',
  ACCESS_CAREER_COACH: 'access_career_coach'
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: [
    PERMISSIONS.MANAGE_ADMINS,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_JOBS,
    PERMISSIONS.MANAGE_COMPANIES,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.MANAGE_USER_STATUS,
    PERMISSIONS.POST_JOBS,
    PERMISSIONS.VIEW_APPLICANTS,
    PERMISSIONS.APPLY_JOBS,
    PERMISSIONS.VIEW_JOBS,
    PERMISSIONS.MANAGE_PROFILE,
    PERMISSIONS.USE_RESUME_BUILDER,
    PERMISSIONS.TAKE_SKILL_ASSESSMENT,
    PERMISSIONS.USE_RESUME_PARSER,
    PERMISSIONS.ACCESS_CAREER_COACH
  ],
  admin: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_JOBS,
    PERMISSIONS.MANAGE_COMPANIES,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.MANAGE_USER_STATUS,
    PERMISSIONS.POST_JOBS,
    PERMISSIONS.VIEW_APPLICANTS,
    PERMISSIONS.APPLY_JOBS,
    PERMISSIONS.VIEW_JOBS,
    PERMISSIONS.MANAGE_PROFILE,
    PERMISSIONS.USE_RESUME_BUILDER,
    PERMISSIONS.TAKE_SKILL_ASSESSMENT,
    PERMISSIONS.USE_RESUME_PARSER,
    PERMISSIONS.ACCESS_CAREER_COACH
  ],
  employer: [
    PERMISSIONS.POST_JOBS,
    PERMISSIONS.VIEW_APPLICANTS,
    PERMISSIONS.MANAGE_OWN_JOBS,
    PERMISSIONS.VIEW_JOBS,
    PERMISSIONS.MANAGE_PROFILE,
    PERMISSIONS.USE_RESUME_PARSER
  ],
  candidate: [
    PERMISSIONS.APPLY_JOBS,
    PERMISSIONS.VIEW_JOBS,
    PERMISSIONS.MANAGE_PROFILE,
    PERMISSIONS.USE_RESUME_BUILDER,
    PERMISSIONS.TAKE_SKILL_ASSESSMENT,
    PERMISSIONS.USE_RESUME_PARSER,
    PERMISSIONS.ACCESS_CAREER_COACH
  ],
  moderator: [
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.VIEW_JOBS,
    PERMISSIONS.MANAGE_PROFILE
  ]
};

// Check if user has specific permission
export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

// Check if user can access a feature
export const canAccess = (userRole: UserRole, feature: string): boolean => {
  const accessMap: Record<string, string[]> = {
    'admin-panel': [PERMISSIONS.MANAGE_USERS, PERMISSIONS.VIEW_ANALYTICS],
    'admin-management': [PERMISSIONS.MANAGE_ADMINS],
    'job-posting': [PERMISSIONS.POST_JOBS],
    'applicant-management': [PERMISSIONS.VIEW_APPLICANTS],
    'job-application': [PERMISSIONS.APPLY_JOBS],
    'content-moderation': [PERMISSIONS.MODERATE_CONTENT],
    'user-management': [PERMISSIONS.MANAGE_USERS],
    'job-management': [PERMISSIONS.MANAGE_JOBS],
    'company-management': [PERMISSIONS.MANAGE_COMPANIES],
    'analytics': [PERMISSIONS.VIEW_ANALYTICS],
    'ai-scoring-demo': [PERMISSIONS.VIEW_ANALYTICS],
    'settings': [PERMISSIONS.SYSTEM_SETTINGS],
    'resume-builder': [PERMISSIONS.USE_RESUME_BUILDER],
    'skill-assessment': [PERMISSIONS.TAKE_SKILL_ASSESSMENT],
    'resume-parser': [PERMISSIONS.USE_RESUME_PARSER],
    'career-coach': [PERMISSIONS.ACCESS_CAREER_COACH]
  };
  
  const requiredPermissions = accessMap[feature] || [];
  return requiredPermissions.some(permission => hasPermission(userRole, permission));
};

// Get user role display name
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    super_admin: 'Super Administrator',
    admin: 'Administrator',
    employer: 'Employer',
    candidate: 'Job Seeker',
    moderator: 'Content Moderator'
  };
  
  return roleNames[role] || role;
};

// Check if user is super admin
export const isSuperAdmin = (userEmail: string): boolean => {
  return userEmail === 'admin@zyncjobs.com';
};

// Get account status display info
export const getStatusInfo = (status: AccountStatus) => {
  const statusMap = {
    active: { label: 'Active', color: 'green', canLogin: true },
    suspended: { label: 'Suspended', color: 'orange', canLogin: false },
    deleted: { label: 'Deleted', color: 'red', canLogin: false }
  };
  return statusMap[status] || statusMap.active;
};

// Get available actions for user role
export const getAvailableActions = (userRole: UserRole) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  
  return {
    canManageAdmins: permissions.includes(PERMISSIONS.MANAGE_ADMINS),
    canManageUsers: permissions.includes(PERMISSIONS.MANAGE_USERS),
    canPostJobs: permissions.includes(PERMISSIONS.POST_JOBS),
    canViewApplicants: permissions.includes(PERMISSIONS.VIEW_APPLICANTS),
    canApplyJobs: permissions.includes(PERMISSIONS.APPLY_JOBS),
    canModerateContent: permissions.includes(PERMISSIONS.MODERATE_CONTENT),
    canViewAnalytics: permissions.includes(PERMISSIONS.VIEW_ANALYTICS),
    canManageUserStatus: permissions.includes(PERMISSIONS.MANAGE_USER_STATUS),
    canUseResumeBuilder: permissions.includes(PERMISSIONS.USE_RESUME_BUILDER),
    canTakeSkillAssessment: permissions.includes(PERMISSIONS.TAKE_SKILL_ASSESSMENT),
    canUseResumeParser: permissions.includes(PERMISSIONS.USE_RESUME_PARSER),
    canAccessCareerCoach: permissions.includes(PERMISSIONS.ACCESS_CAREER_COACH),
    canAccessSystemSettings: permissions.includes(PERMISSIONS.SYSTEM_SETTINGS)
  };
};
