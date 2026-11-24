export type UserRole = 'developer' | 'creator' | 'recipient';
export type AccountStatus = 'active' | 'suspended';
export type RegistrationMethod = 'email' | 'mobile';

export interface PlatformUser {
  id: string;
  email?: string;
  phone?: string;
  phone_verified?: boolean;
  registration_method: RegistrationMethod;
  country_code?: string;
  display_name?: string;
  role: UserRole;
  account_status: AccountStatus;
  email_verified?: boolean;
  suspended_at?: string;
  suspension_reason?: string;
  created_at: string;
  last_active_at?: string;
  gifts_count?: number;
  published_count?: number;
  draft_count?: number;
  terms_accepted_at?: string;
  terms_version?: string;
  privacy_policy_accepted_at?: string;
  privacy_policy_version?: string;
}

export type AuditActionType =
  | 'developer_login'
  | 'view_user_profile'
  | 'view_gift_metadata'
  | 'inspect_gift_content'
  | 'inspect_photograph_media'
  | 'change_user_status'
  | 'user_suspended'
  | 'user_reactivated'
  | 'otp_sent'
  | 'otp_verified'
  | 'otp_failed'
  | 'gift_paused'
  | 'gift_unpaused'
  | 'gift_unpublished'
  | 'gift_republished'
  | 'gift_duplicated'
  | 'gift_downloaded'
  | 'gift_deleted'
  | 'gift_restored'
  | 'gift_expiry_extended'
  | 'modify_platform_settings'
  | 'export_analytics';

export type ModerationReasonCategory =
  | 'spam_or_abuse'
  | 'inappropriate_content'
  | 'security_concern'
  | 'user_request'
  | 'policy_violation'
  | 'technical_issue'
  | 'other';

export interface DeveloperAuditLog {
  id: string;
  developer_id?: string;
  developer_email: string;
  action_type: AuditActionType;
  target_user_id?: string;
  target_user_name?: string;
  target_gift_id?: string;
  target_gift_title?: string;
  previous_status?: string;
  new_status?: string;
  moderation_reason?: ModerationReasonCategory | string;
  details?: Record<string, any>;
  ip_address?: string;
  action_result: 'success' | 'denied' | 'failed';
  created_at: string;
}

export interface PolicyAcceptanceRecord {
  id: string;
  user_id: string;
  terms_version: string;
  terms_accepted: boolean;
  terms_accepted_at: string;
  privacy_policy_version: string;
  privacy_policy_accepted_at: string;
  created_at: string;
}
