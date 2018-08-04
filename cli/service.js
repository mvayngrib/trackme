const path = require('path')
const { Service } = require('node-mac')
const { APP_NAME } = require('../constants')
const { createLogger, getHomedir } = require('../utils')
const logger = createLogger()

module.exports = ({ confPath, command }) => {
  const execCommand = command => {
    if (command === 'install') {
      svc.install()
    } else if (command === 'uninstall') {
      svc.uninstall()
    } else if (command === 'start') {
      svc.start()
    } else if (command === 'stop') {
      svc.stop()
    } else {
      throw new Error(`unknown command "${command}", expected one of: install, uninstall, start, stop`)
    }
  }

  const handleError = err => {
    if (err.code === 'EACCES') {
      logger.error('access denied, you might need sudo')
      process.exit(1)
    }

    if (command === 'uninstall' && err.code === 'ENOENT') {
      logger.error('file not found, seems the service is not installed')
      process.exit(1)
    }

    throw err
  }

  const basePath = path.resolve(__dirname, '../cmd.js')
  const svc = new Service({
    name: APP_NAME,
    description: 'track usage Mac activity for personal development',
    script: `${basePath}`,
    env: [
      {
        name: 'CONF_PATH',
        value: confPath,
      },
      {
        name: 'HOME',
        value: getHomedir(),
      }
    ]
  })

  svc.on('install', () => {
    logger.log('service installed')
    svc.start()
  })

  svc.on('alreadyinstalled', () => {
    logger.log('service already installed')
    svc.start()
  })

  svc.on('uninstall', () => logger.log(`service uninstalled: ${svc.exists}`))
  svc.on('start', () => logger.log('service started'))
  svc.on('stop', () => logger.log('service stopped'))
  svc.on('error', handleError)

  try {
    execCommand(command)
  } catch (err) {
    handleError(err)
  }
}
