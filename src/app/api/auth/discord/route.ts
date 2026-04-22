import { NextRequest, NextResponse } from 'next/server'

// Discord OAuth2 configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord'
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  
  // Check for OAuth callback (code from Discord)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    // This is the callback - exchange code for token
    return handleOAuthCallback(request)
  }
  
  // Otherwise, redirect to Discord OAuth
  const scope = 'identify email'
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}`
  
  return NextResponse.redirect(discordAuthUrl)
}

async function handleOAuthCallback(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url))
  }
  
  try {
    // Exchange code for access token directly with Discord
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return NextResponse.redirect(new URL('/?error=token_failed', request.url))
    }
    
    const tokenData = await tokenResponse.json()
    
    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })
    
    if (!userResponse.ok) {
      console.error('Failed to get user info')
      return NextResponse.redirect(new URL('/?error=user_info_failed', request.url))
    }
    
    const discordUser = await userResponse.json()
    
    const discordId = discordUser.id
    const username = discordUser.username
    const avatarUrl = discordUser.avatar 
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator || '0') % 5}.png`
    
    // Create or update profile in PocketBase via direct fetch
    const profileResponse = await fetch(`${PB_URL}/api/collections/profiles/records?filter=discord_id="${discordId}"`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    let profileId = null
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      if (profileData.items && profileData.items.length > 0) {
        profileId = profileData.items[0].id
      }
    }
    
    if (!profileId) {
      // Create new profile
      const createResponse = await fetch(`${PB_URL}/api/collections/profiles/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discord_id: discordId,
          username: username,
          avatar_url: avatarUrl,
          balance: 100,
        }),
      })
      
      if (createResponse.ok) {
        const newProfile = await createResponse.json()
        profileId = newProfile.id
      }
    }
    
    // Create a simple auth token (we'll use JWT)
    // For now, let's just redirect to dashboard and the client can handle auth
    // We store the user info in a cookie
    
    const userData = JSON.stringify({
      discordId,
      username,
      avatarUrl,
      profileId,
    })
    
    // Set cookie with user data
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    
    // Encode user data in cookie (use encodeURIComponent to handle special chars)
    const encodedData = encodeURIComponent(userData)
    response.cookies.set('lunaverse_user', encodedData, {
      httpOnly: false, // Allow client to read
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    return response
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?error=unknown', request.url))
  }
}
