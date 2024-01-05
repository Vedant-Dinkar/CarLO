const passport = require('passport');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

passport.use(new GoogleStrategy({
    clientID:     "167378313952-md9ph7ssp5hikfqe275pcmaqvr0v1b4v.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:2000/google/callback",
    passReqToCallback: true
}, function (request, accessToken, refreshToken, profile, done) {
    const profileImage = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

    const user = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.email,
        profileImage: profileImage,
    };

    return done(null, user);
}));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});
