import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth';

export interface AzureAD_OIDCProfile extends Record<string, any> {
  aud: string
  iss: string
  iat: number
  nbf: number
  exp: number
  aio: string
  name: string,
  oid: string,
  preferred_username: string,
  rh: string,
  sub: string,
  tid: string,
  uti: string,
  ver: string
}

export default function AzureAD_OIDC<P extends AzureAD_OIDCProfile>(
  options: OAuthUserConfig<P> & { tenantId: string, isGovCloud?: boolean }
): OAuthConfig<P> {

  return {
    id: "azure-ad-oidc",
    name: "Microsoft Azure AD",
    type: "oauth",
    wellKnown: options.isGovCloud
      ? `https://login.microsoftonline.us/${options.tenantId}/v2.0/.well-known/openid-configuration`
      : `https://login.microsoftonline.com/${options.tenantId}/v2.0/.well-known/openid-configuration`,
    authorization: {
      params: {
        scope: "openid profile email User.Read",
      },
    },
    async profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        username: profile.preferred_username,
        email: profile.preferred_username
      }
    },
    options
  }
}

/*export default function AzureAD_OIDC<P extends AzureAD_OIDCProfile>(
  options: OAuthUserConfig<P> & { tenantId: string, isGovCloud?: boolean }
): OAuthConfig<P> {

  return {
    id: "azure-ad-oidc",
    name: "Microsoft Azure AD",
    type: "oauth",
    wellKnown: options.isGovCloud
      ? `https://login.microsoftonline.us/${options.tenantId}/v2.0/.well-known/openid-configuration`
      : `https://login.microsoftonline.com/${options.tenantId}/v2.0/.well-known/openid-configuration`,
    authorization: {
      params: {
        scope: "openid profile email User.Read GroupMember.Read.All",
      },
    },
    async profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        username: profile.preferred_username,
        email: profile.preferred_username
      }
    },
    options
  }
}*/
