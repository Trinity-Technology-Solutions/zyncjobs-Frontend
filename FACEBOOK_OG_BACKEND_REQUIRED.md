# Backend: OG Meta Tags for Facebook Sharing

Facebook's crawler does NOT run JavaScript. It reads `<meta>` tags from the raw HTML response.

## Required Backend Route

Your backend (Node.js/Express) must handle `GET /jobs/:slug` and return HTML with OG tags when the request comes from a social crawler.

```js
// Express example
app.get('/jobs/:slug', async (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const isCrawler = /facebookexternalhit|facebot|linkedinbot|twitterbot|whatsapp|telegrambot/i.test(userAgent);

  if (!isCrawler) {
    // Regular user — let nginx serve the React SPA (this route won't be hit for normal users)
    return res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  // Fetch job from DB by slug or ID
  const job = await Job.findOne({ slug: req.params.slug }) || await Job.findById(req.params.slug);
  if (!job) return res.redirect('/');

  const title = `${job.jobTitle} at ${job.company} | ZyncJobs`;
  const description = (job.jobDescription || job.description || 'Apply now on ZyncJobs')
    .replace(/<[^>]*>/g, '').substring(0, 160);
  const url = `https://www.zyncjobs.com/jobs/${job.slug || job._id}`;
  const image = job.jobHeaderImage || 'https://www.zyncjobs.com/images/zyncjobs-og-image.png';

  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ZyncJobs">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:secure_url" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${title}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  <link rel="canonical" href="${url}">
  <meta http-equiv="refresh" content="0;url=${url}">
</head>
<body><a href="${url}">${title}</a></body>
</html>`);
});
```

## How it works

1. User clicks Facebook Share → Facebook crawler hits `/jobs/some-slug`
2. Nginx detects `facebookexternalhit` user-agent → proxies to backend port 5000
3. Backend returns HTML with proper OG tags
4. Facebook reads the tags and shows job title + image in the post preview

## Test your OG tags

Use Facebook's Sharing Debugger to test:
https://developers.facebook.com/tools/debug/

Enter your job URL and click "Debug" to see what Facebook reads.
After fixing, click "Scrape Again" to refresh Facebook's cache.
