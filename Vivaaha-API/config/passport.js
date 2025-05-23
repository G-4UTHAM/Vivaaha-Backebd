//config/passport.js
const passport = require('passport');
require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');


const googleStrategy = new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:   `${process.env.BACKEND_URL}/api/auth/google/callback`, 
        scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {

            let user = await User.findOne({ googleId: profile.id });

            if (!user) {
                // Check if user exists with same email
                user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    // Update existing user with Google info
                    user.googleId = profile.id;
                    user.isVerified = true;
                    await user.save();
                } else {
                    // Create new user
                    user = await User.create({
                        googleId: profile.id,
                        email: profile.emails[0].value,
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        profilePicture: profile.photos?.[0]?.value,
                        authType: 'google',
                        isVerified: true
                    });
                }
            }

            return done(null, user);
        } catch (error) {
            console.error('Google Strategy Error:', error);
            return done(error, null);
        }
    }
);

passport.use(googleStrategy);

// Required for sessions
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;