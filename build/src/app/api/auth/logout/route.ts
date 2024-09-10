import { redirect } from 'next/navigation';
import { clearCurrentUser } from '@/services/db.service';

const handler = () => {
    clearCurrentUser();
    redirect(`${process.env.AUTH_ISSUER}/oauth2/v2.0/logout?post_logout_redirect_uri=${process.env.APP_URL}`);
};

export { handler as GET, handler as POST };