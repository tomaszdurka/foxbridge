import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello World</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
    }
    h1 {
      font-size: 4rem;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    p {
      font-size: 1.5rem;
      color: #666;
      margin: 1rem 0 0 0;
    }
    .timestamp {
      font-size: 0.9rem;
      color: #999;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello World! 👋</h1>
    <p>Welcome to my Vercel deployment</p>
    <div class="timestamp">
      Generated at: ${new Date().toISOString()}
    </div>
  </div>
</body>
</html>
  `;

  res.status(200).setHeader('Content-Type', 'text/html').send(html);
}
