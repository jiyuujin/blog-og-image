import { Hono } from 'hono'

type Bindings = {
  BLOG_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('*', async (c) => {
  return await handleRequest(c)
})

const extractEmoji = (input: string) =>
  input.match(/\p{Emoji_Presentation}|\p{Symbol}/gu)

const cleanEmoji = (emoji: string) =>
  emoji.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const emojiToSvg = (emoji: string) =>
  `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><text x='50%' y='50%' text-anchor='middle' dominant-baseline='central' font-size='6rem'>${emoji}</text></svg>`

async function handleRequest(c: any) {
  let returnEmoji = cleanEmoji('😀')
  const url = new URL(c.req.url)
  const pathParam = decodeURIComponent(url.pathname).replace('/', '')
  const emojiArray = extractEmoji(pathParam)

  const search = c.req.query('slug') ?? ''

  if (emojiArray?.length) {
    returnEmoji = cleanEmoji(emojiArray[0])
  }

  const returnBody = emojiToSvg(returnEmoji)

  await c.env.BLOG_BUCKET.put(`cache/${search}.svg`, returnBody)

  return new Response(returnBody, {
    headers: {
      'content-type': 'image/svg+xml;',
    },
  })
}

export default app
