import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook"; 
import dotenv from "dotenv";
import ConsultantProfile from "../models/Consultant/User.js";
import { generateConsultantUniqueId } from "../helper/consultant/consultantHelper.js";

dotenv.config();

// Google Authentication for Consultants
passport.use(
  "consultant-google",
  new GoogleStrategy(
    {
      clientID: process.env.CONSULTANT_GOOGLE_CLIENT_ID,
      clientSecret: process.env.CONSULTANT_GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/api/consultant/auth/google/callback",
      scope: ["profile", "email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await ConsultantProfile.findOne({ googleId: profile.id });

        if (!user) {
          const consultantUniqueId = await generateConsultantUniqueId();
          user = new ConsultantProfile({
            Name: profile.displayName || "N/A",
            email: profile.emails[0].value,
            googleId: profile.id,
            profilePhoto: profile.photos[0].value,
            consultantUniqueId
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error(
          "Error during Google authentication (Consultant):",
          error
        );
        return done(error);
      }
    }
  )
);

// Facebook Authentication for Consultants
passport.use(
  "consultant-facebook",
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/api/consultant/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "picture.type(large)"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await ConsultantProfile.findOne({ facebookId: profile.id });

        if (!user) {
          const consultantUniqueId = await generateConsultantUniqueId();
          user = new ConsultantProfile({
            Name: `${profile.name.givenName} ${profile.name.familyName}` || "N/A",
            email: profile.emails?.[0]?.value || null,
            facebookId: profile.id,
            profilePhoto: profile.photos?.[0]?.value || null,
            consultantUniqueId
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error(
          "Error during Facebook authentication (Consultant):",
          error
        );
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  if (user.googleId) {
    done(null, { id: user.id, platform: "google", type: "consultant" });
  } else if (user.facebookId) {
    done(null, { id: user.id, platform: "facebook", type: "consultant" });
  }
});

passport.deserializeUser(async (obj, done) => {
  if (obj.type === "consultant") {
    try {
      const user = await ConsultantProfile.findById(obj.id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  }
});

export default passport;
