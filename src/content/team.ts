export interface TeamMember {
  readonly id: string;
  readonly name: string;
  /** Publish only after the name, ES/EN copy and any portrait are approved. */
  readonly approved: boolean;
  /** Authorized local portrait stored under public/team/. */
  readonly photo?: `/team/${string}`;
  readonly links?: readonly { readonly label: string; readonly href: string }[];
}

// Add approved members here and their role/bio under about.members in each dictionary.
export const teamMembers: readonly TeamMember[] = [];
