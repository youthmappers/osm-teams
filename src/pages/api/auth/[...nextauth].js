import NextAuth from 'next-auth'
import { mergeDeepRight } from 'ramda'
const db = require('../../../lib/db')
const logger = require('../../../lib/logger')

const requiredEnvVars = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  OSM_TEAMS_CLIENT_ID: process.env.OSM_TEAMS_CLIENT_ID,
  OSM_TEAMS_CLIENT_SECRET: process.env.OSM_TEAMS_CLIENT_SECRET,
}

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingEnvVars.length > 0) {
  logger.error(
    `[next-auth] Missing required environment variables: ${missingEnvVars.join(
      ', '
    )}. ` +
      'Authentication will not work until these are set. ' +
      'See .env.local.sample for reference.'
  )
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // Configure one or more authentication providers
  providers: [
    {
      id: 'osm-teams',
      name: 'OSM Teams',
      type: 'oauth',
      wellKnown: `${process.env.HYDRA_URL}/.well-known/openid-configuration`,
      authorization: { params: { scope: 'openid offline' } },
      idToken: true,
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.preferred_username,
          image: profile.picture,
        }
      },
      clientId: process.env.OSM_TEAMS_CLIENT_ID,
      clientSecret: process.env.OSM_TEAMS_CLIENT_SECRET,
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.userId = profile.sub
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      session.accessToken = token.accessToken
      session.user_id = token.userId
      return session
    },
  },

  pages: {
    signIn: '/signin',
    error: '/auth/error',
  },

  events: {
    async signIn({ profile }) {
      // On successful sign in we should persist the user to the database
      let [user] = await db('users').where('id', profile.id)
      if (user) {
        const newProfile = mergeDeepRight(user.profile, profile)
        await db('users')
          .where('id', profile.id)
          .update({
            profile: JSON.stringify(newProfile),
          })
      } else {
        await db('users').insert({
          id: profile.id,
          profile: JSON.stringify(profile),
        })
      }
    },
  },
}

export default NextAuth(authOptions)
