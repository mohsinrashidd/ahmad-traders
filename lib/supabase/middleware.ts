import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Setup Required | Ahmad Traders</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --background: 224 71% 4%;
      --foreground: 213 31% 91%;
      --card: 224 71% 7%;
      --card-foreground: 213 31% 91%;
      --primary: 263.4 70% 50.4%;
      --primary-foreground: 210 40% 98%;
      --muted-foreground: 215.4 16.3% 56.9%;
      --border: 216 34% 17%;
      --radius: 0.75rem;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: hsl(var(--background));
      color: hsl(var(--foreground));
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 1.5rem;
      box-sizing: border-box;
      background-image: 
        radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
        radial-gradient(at 50% 0%, hsla(263,70%,20%,0.15) 0, transparent 50%),
        radial-gradient(at 100% 0%, hsla(240,15%,9%,1) 0, transparent 50%);
    }

    .container {
      max-width: 600px;
      width: 100%;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid hsl(var(--border));
      border-radius: var(--radius);
      padding: 2.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 4rem;
      height: 4rem;
      background: linear-gradient(135deg, hsl(var(--primary)) 0%, #4f46e5 100%);
      border-radius: 1rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.3);
    }

    .logo-icon {
      font-size: 1.75rem;
      color: white;
      font-weight: bold;
      font-family: 'Space Grotesk', sans-serif;
    }

    h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(to right, #ffffff, hsl(var(--foreground)));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: hsl(var(--muted-foreground));
      font-size: 0.95rem;
      margin: 0;
      line-height: 1.5;
    }

    .info-card {
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 0.5rem;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .info-card p {
      margin: 0 0 0.75rem 0;
      line-height: 1.6;
      font-size: 0.9rem;
      color: #94a3b8;
    }

    .alert {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      padding: 1rem;
      border-radius: 0.5rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #fca5a5;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    .alert-icon {
      font-weight: bold;
      color: #ef4444;
    }

    pre {
      background: #020617;
      padding: 1.25rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      border: 1px solid hsl(var(--border));
      font-family: 'SFMono-Regular', Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 0.85rem;
      line-height: 1.6;
      color: #38bdf8;
      margin: 0;
    }

    .highlight {
      color: #a78bfa;
    }

    .steps {
      margin: 1rem 0;
      padding-left: 1.25rem;
      color: #cbd5e1;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .steps li {
      margin-bottom: 0.75rem;
    }

    .footer {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.8rem;
      color: hsl(var(--muted-foreground));
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <span class="logo-icon">AT</span>
      </div>
      <h1>Configuration Required</h1>
      <p class="subtitle">Ahmad Traders Management System</p>
    </div>

    <div class="alert">
      <span class="alert-icon">⚠️</span>
      <div>
        <strong>Supabase Credentials Missing:</strong> The application is unable to connect to the database because the environment variables are not configured.
      </div>
    </div>

    <div class="info-card">
      <p>We've created a template <code>.env.local</code> file in your project root. To get started:</p>
      
      <ol class="steps">
        <li>Open the <code class="highlight">.env.local</code> file in the project root directory.</li>
        <li>Go to your <strong>Supabase Dashboard</strong> &rarr; Project Settings &rarr; API.</li>
        <li>Copy your <strong class="highlight">Project URL</strong> and <strong class="highlight">Anon Key</strong>.</li>
        <li>Paste them into your <code>.env.local</code> file.</li>
        <li><strong>Restart</strong> the Next.js development server (run <code>npm run dev</code> again).</li>
      </ol>
    </div>

    <pre># .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here</pre>

    <div class="footer">
      Ahmad Traders &bull; Powered by Next.js & Supabase
    </div>
  </div>
</body>
</html>`,
      {
        status: 500,
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      }
    );
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users to login (except /login itself)
  if (!user && pathname !== '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from /login
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
