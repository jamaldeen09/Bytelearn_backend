import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        const firstName = profile.name?.givenName;
        const lastName = profile.name?.familyName;
        const avatar = profile.photos?.[0].value;
        const googleId = profile.id;

        const role = req.query.state || "student";
        console.log(req.query.state);

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            fullName: `${firstName} ${lastName}`,
            email,
            googleId,
            avatar,
            role,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
