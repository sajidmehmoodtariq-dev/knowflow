import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { connectDB } from "./src/lib/mongodb.js"
import User from "./src/models/User.js"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await connectDB();

        // Check if user already exists
        let existingUser = await User.findByEmail(user.email);

        if (!existingUser) {
          // Create new user for OAuth
          existingUser = new User({
            name: user.name || profile?.name || 'Unknown',
            email: user.email,
            password: 'oauth-user', // Placeholder password for OAuth users
            verified: true, // OAuth users are automatically verified
            approved: false,
            role: 'user',
            skills: [],
          });
          await existingUser.save();
        }

        return true;
      } catch (error) {
        console.error('OAuth sign-in error:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        // First time login, save user info to token
        await connectDB();
        const dbUser = await User.findByEmail(user.email);
        if (dbUser) {
          token.userId = dbUser._id.toString();
          token.role = dbUser.role;
          token.verified = dbUser.verified;
          token.approved = dbUser.approved;
          token.skills = dbUser.skills;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to client
      if (token) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.verified = token.verified;
        session.user.approved = token.approved;
        session.user.skills = token.skills;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/signup',
  },
  session: {
    strategy: 'jwt',
  },
})