export interface IPermissionRepository {
  /** Permission keys explicitly granted to this user via staff_user_permissions. */
  findAllForUser(userId: string): Promise<string[]>
  /** Atomically replaces the user's full permission set with `permissionKeys`. */
  setForUser(userId: string, permissionKeys: string[]): Promise<void>
  userHasPermission(userId: string, key: string): Promise<boolean>
}
