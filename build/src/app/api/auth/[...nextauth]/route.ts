import NextAuth from 'next-auth';
import authOptions from '@/authOptions';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

/*import NextAuth, { NextAuthOptions } from 'next-auth'
import AzureAD_OIDC from '@/providers/azure-ad-oidc'

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
            console.log('TOKEN:')
            console.log(token)
            console.log('ACCOUNT:')
            console.log(account)
            if (account) {
                token.accessToken = account.access_token
            }
            return token
        },
        /*async jwt({ token, account, profile }) {
            if (account?.accessToken) {
                token.accessToken = account.accessToken
            }
            return token
        },*/
        /*async session({ session, token }) {
            console.log('INSIDE SESSION:')
            console.log(session)
            console.log('INSIDE TOKEN:')
            console.log(token)
            session.accessToken = token.accessToken as string
            return session
        }
    },
    session: {
        strategy: 'jwt'
    }
}

const handler = NextAuth(options)

export { handler as GET, handler as POST };*/