const request = require('request')

/* global WIKI */

const webhookConfig = WIKI.config.webhooks

function createContent(title, username, path, type = 'create') {
  const url = `${WIKI.config.host}/${path}`
  if (type === 'create') {
    return `[WIKI] @${username}さんが、「${title}」を作成しました。\n${url}`
  } else if (type === 'update') {
    return `[WIKI] @${username}さんが、「${title}」を更新しました。\n${url}`
  } else if (type === 'delete') {
    return `[WIKI] @${username}さんが、「${title}」を削除しました。\n${url}`
  }
  return `[WIKI] 更新がありました。\n${url}`
}

function pushMastodon(title, username, path, type = 'create') {
  new Promise((resolve, reject) => {
    const payload = `status=${createContent(title, username, path, type)}`
    const url = `${webhookConfig.mastodon.baseurl}/api/v1/statuses`
    request.post({
      url: url,
      headers: {
        authorization: `Bearer ${webhookConfig.mastodon.token}`
      },
      body: payload
    }, (e, r, p) => {
      console.log(e, r, p)
      resolve(r)
    })
  }).then((r) => {
    WIKI.logger.info('Mastodon webhook sent')
    console.log(r)
  })
}

function pushDiscord(discordWebhookURLs = [], title, username, path, type = 'create') {
  console.log(pushDiscord)
  Promise.all(
    discordWebhookURLs.map((url) => {
      return new Promise((resolve, reject) => {
        const payload = {
          username: 'Wiki',
          content: createContent(title, username, path, type),
          avatar_url: 'https://d33wubrfki0l68.cloudfront.net/4f6939b6c203195133907e24da9964fa9afa4a68/3724c/assets/images/tool-icons/wikijs.png'
        }
        WIKI.logger.info('webhook discord payload', JSON.stringify(payload))
        request.post(url, {
          json: payload
        }, () => {
          resolve()
        })
      })
    })
  ).then(() => {
    WIKI.logger.info('All Discord webhooks sent')
  })
}

module.exports = {
  pushWebhook: (title, username, url, type = 'create') => {
    /**
     * @param {string} title - 記事タイトル
     * @param {string} username - 著者名
     * @param {string} type - ("create"|"update"|"delete")
     *
     *
     *
     */
    if (!WIKI.config.webhooks) return

    WIKI.logger.info('Start webhooking...')
    console.log(webhookConfig)

    if (webhookConfig.discord) { pushDiscord(webhookConfig.discord, title, username, url, type) }
    if (webhookConfig.mastodon && webhookConfig.mastodon.token) { pushMastodon(title, username, url, type) }
  }
}
