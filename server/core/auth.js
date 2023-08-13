const passport = require('passport')
const passportJWT = require('passport-jwt')
const _ = require('lodash')
const jwt = require('jsonwebtoken')
const { DateTime } = require('luxon')

module.exports = {
  strategies: {},
  guest: {
    cacheExpiration: DateTime.utc().minus({ days: 1 })
  },
  groups: {},
  validApiKeys: [],
  
    /**
   * Initialize the authentication module
   */
  init() {
    this.passport = passport

    passport.serializeUser((user, done) => {
      done(null, user.id)
    })

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await APPS.models.users.query().findById(id).withGraphFetched('groups').modifyGraph('groups', builder => {
          builder.select('groups.id', 'permissions')
        })
        if (user) {
          done(null, user)
        } else {
          done(new Error(APPS.lang.t('auth:errors:usernotfound')), null)
        }
      } catch (err) {
        done(err, null)
      }
    })

    this.reloadGroups()
    this.reloadApiKeys()

    return this
  },

/**
   * Reload Groups from DB
   */
    async reloadGroups (s) {
        const groupsArray = await APPS.models.groups.query()
        this.groups = _.keyBy(groupsArray, 'id')
        APPS.auth.guest.cacheExpiration = DateTime.utc().minus({ days: 1 })
    },
    
    async reloadApiKeys () {
        const keys = await APPS.models.apiKeys.query().select('id').where('isRevoked', false).andWhere('expiration', '>', DateTime.utc().toISO())
        this.validApiKeys = _.map(keys, 'id')
    },

    /**
   * Authenticate current request
   *
   * @param {Express Request} req
   * @param {Express Response} res
   * @param {Express Next Callback} next
   */
  authenticate (req, res, next) {
    APPS.auth.passport.authenticate('jwt', {session: false}, async (err, user, info) => {
      if (err) { return next() }
      let mustRevalidate = false

      // Expired but still valid within N days, just renew
      if (info instanceof Error && info.name === 'TokenExpiredError') {
        const expiredDate = (info.expiredAt instanceof Date) ? info.expiredAt.toISOString() : info.expiredAt
        if (DateTime.utc().minus(ms(APPS.config.auth.tokenRenewal)) < DateTime.fromISO(expiredDate)) {
          mustRevalidate = true
        }
      }

      // Check if user / group is in revocation list
      if (user && !user.api && !mustRevalidate) {
        const uRevalidate = APPS.auth.revocationList.get(`u${_.toString(user.id)}`)
        if (uRevalidate && user.iat < uRevalidate) {
          mustRevalidate = true
        } else if (DateTime.fromSeconds(user.iat) <= APPS.startedAt) { // Prevent new / restarted instance from allowing revoked tokens
          mustRevalidate = true
        } else {
          for (const gid of user.groups) {
            const gRevalidate = APPS.auth.revocationList.get(`g${_.toString(gid)}`)
            if (gRevalidate && user.iat < gRevalidate) {
              mustRevalidate = true
              break
            }
          }
        }
      }

      // Revalidate and renew token
      if (mustRevalidate) {
        const jwtPayload = jwt.decode(securityHelper.extractJWT(req))
        try {
          const newToken = await APPS.models.users.refreshToken(jwtPayload.id)
          user = newToken.user
          user.permissions = user.getGlobalPermissions()
          user.groups = user.getGroups()
          req.user = user

          // Try headers, otherwise cookies for response
          if (req.get('content-type') === 'application/json') {
            res.set('new-jwt', newToken.token)
          } else {
            res.cookie('jwt', newToken.token, { expires: DateTime.utc().plus({ days: 365 }).toJSDate() })
          }
        } catch (errc) {
          APPS.logger.warn(errc)
          return next()
        }
      }

      // JWT is NOT valid, set as guest
      if (!user) {
        if (APPS.auth.guest.cacheExpiration <= DateTime.utc()) {
          APPS.auth.guest = await APPS.models.users.getGuestUser()
          APPS.auth.guest.cacheExpiration = DateTime.utc().plus({ minutes: 1 })
        }
        req.user = APPS.auth.guest
        return next()
      }

      // Process API tokens
      if (_.has(user, 'api')) {
        if (!APPS.config.api.isEnabled) {
          return next(new Error('API is disabled. You must enable it from the Administration Area first.'))
        } else if (_.includes(APPS.auth.validApiKeys, user.api)) {
          req.user = {
            id: 1,
            email: 'api@localhost',
            name: 'API',
            pictureUrl: null,
            timezone: 'America/New_York',
            localeCode: 'en',
            permissions: _.get(APPS.auth.groups, `${user.grp}.permissions`, []),
            groups: [user.grp],
            getGlobalPermissions () {
              return req.user.permissions
            },
            getGroups () {
              return req.user.groups
            }
          }
          return next()
        } else {
          return next(new Error('API Key is invalid or was revoked.'))
        }
      }

      // JWT is valid
      req.logIn(user, { session: false }, (errc) => {
        if (errc) { return next(errc) }
        next()
      })
    })(req, res, next)
  },
}