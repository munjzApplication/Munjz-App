import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook"; 
import dotenv from "dotenv";
import CustomerProfile from "../models/Customer/customerModels/customerModel.js";
import { generateCustomerUniqueId } from "../helper/customer/customerHelper.js";

dotenv.config();

// Google Authentication for Customers
passport.use(
  "customer-google",
  new GoogleStrategy(
    {
      clientID: process.env.CUSTOMER_GOOGLE_CLIENT_ID,
      clientSecret: process.env.CUSTOMER_GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/api/customer/auth/google/callback",
      scope: ["profile", "email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await CustomerProfile.findOne({ googleId: profile.id });

        if (!user) {
          const customerUniqueId = await generateCustomerUniqueId();
          user = new CustomerProfile({
            Name: profile.displayName || "N/A",
            email: profile.emails[0].value,
            googleId: profile.id,
            profilePhoto: profile.photos[0].value,
            customerUniqueId
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error("Error during Google authentication (Customer):", error);
        return done(error);
      }
    }
  )
);



passport.serializeUser((user, done) => {
  if (user.googleId) {
    done(null, { id: user.id, platform: "google", type: "customer" });
  } 
});

passport.deserializeUser(async (obj, done) => {
  if (obj.type === "customer") {
    try {
      const user = await CustomerProfile.findById(obj.id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  }
});

export default passport;
