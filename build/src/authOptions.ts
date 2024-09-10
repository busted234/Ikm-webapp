import NextAuth, { NextAuthOptions } from "next-auth"
import AzureAD_OIDC from "./providers/azure-ad-oidc"

const authOptions: NextAuthOptions = {
    providers: [
        AzureAD_OIDC({
            issuer: process.env.AUTH_ISSUER as string,
            clientId: process.env.AUTH_CLIENT_ID! as string,
            clientSecret: process.env.AUTH_CLIENT_SECRET! as string,
            tenantId: process.env.AUTH_TENANT_ID! as string,
            isGovCloud: true
        })
    ]
}

export default authOptions


/*import NextAuth, { NextAuthOptions } from "next-auth"
import AzureAD_OIDC from "./providers/azure-ad-oidc"

const options: NextAuthOptions = {
    providers: [
        AzureAD_OIDC({
            issuer: process.env.AUTH_ISSUER as string,
            clientId: process.env.AUTH_CLIENT_ID! as string,
            clientSecret: process.env.AUTH_CLIENT_SECRET! as string,
            tenantId: process.env.AUTH_TENANT_ID! as string,
            isGovCloud: true,
            authorization: {
                params: {
                    scope: 'openid profile email User.Read'
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token
            }
            return token
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string
            return session
        }
    },
    session: {
        strategy: 'jwt'
    }
}

export default NextAuth(options)*/
