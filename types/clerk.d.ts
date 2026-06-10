// Augment Clerk's built-in types so publicMetadata.role is typed everywhere.
// See https://clerk.com/docs/references/nextjs/types#user-object

export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: import('./index').UserRole
    }
  }
}
