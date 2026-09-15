import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isProducerEmail } from "./sheets";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session }) {
      if (session.user?.email) {
        session.user.isProducer = isProducerEmail(session.user.email);
      }
      return session;
    },
  },
};
