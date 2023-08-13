const express = require('express')
const router = express.Router()
const _ = require('lodash')
const qs = require('querystring')

/* global APPS */


/**
 * Redirect to HTTPS if HTTP Redirection is enabled
 */
router.all('/*', (req, res, next) => {
  if (APPS.config.server.sslRedir && !req.secure && APPS.servers.servers.https) {
    let query = (!_.isEmpty(req.query)) ? `?${qs.stringify(req.query)}` : ``
    return res.redirect(`https://${req.hostname}${req.originalUrl}${query}`)
  } else {
    next()
  }
})

module.exports = router
