# Reverse Proxy Setup Guide

This guide explains how to configure the reverse proxy feature for routing game URLs through a Raspberry Pi proxy server.

## Overview

When `PUBLIC_GAME_PROXY_URL` is set, all game URLs are automatically transformed to route through your reverse proxy server. This allows you to bypass network restrictions on gaming sites.

## Configuration

### Environment Variable

Set the `PUBLIC_GAME_PROXY_URL` environment variable to your proxy domain:

```bash
PUBLIC_GAME_PROXY_URL=https://games-proxy.local
```

**Important:** The variable must be prefixed with `PUBLIC_` for Astro to expose it to the client-side code.

### Setting the Variable

#### Local Development

Create a `.env` file in the project root:

```bash
PUBLIC_GAME_PROXY_URL=https://games-proxy.local
```

#### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new variable:
   - **Name:** `PUBLIC_GAME_PROXY_URL`
   - **Value:** Your proxy domain (e.g., `https://games-proxy.local`)
   - **Environment:** Production, Preview, and/or Development
4. Redeploy your application

## URL Transformation

The proxy transforms game URLs using the following format:

**Original URL:**
```
https://www.crazygames.com/embed/2048
```

**Proxied URL:**
```
https://games-proxy.local/proxy/www.crazygames.com/embed/2048
```

The transformation preserves:
- Query parameters (`?param=value`)
- Hash fragments (`#section`)
- Full pathname

## Raspberry Pi Reverse Proxy Configuration

Your Raspberry Pi needs to be configured to handle the `/proxy/{host}{path}` format. Here are example configurations:

### nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name games-proxy.local;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /proxy/ {
        # Extract host and path from /proxy/{host}{path}
        # Example: /proxy/www.crazygames.com/embed/2048
        rewrite ^/proxy/([^/]+)(/.*)?$ /$2 break;
        
        # Proxy to the extracted host (first capture group)
        proxy_pass https://$1;
        
        # Set proper headers
        proxy_set_header Host $1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle WebSocket upgrades (for games like Agar.io, Slither.io)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # CORS headers (if needed)
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type";
    }
}
```

### Caddy Configuration

```caddyfile
games-proxy.local {
    reverse_proxy /proxy/* {
        # Extract host from path and rewrite
        rewrite /proxy/{host}{path} /{path}
        to https://{host}
        
        # Headers
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        
        # WebSocket support
        header_up Connection "upgrade"
        header_up Upgrade {http.upgrade}
    }
}
```

### Important Notes

1. **SSL Certificate:** Your proxy domain needs a valid SSL certificate. Use Let's Encrypt for free certificates.

2. **WebSocket Support:** Some games (Agar.io, Slither.io) require WebSocket connections. Ensure your proxy configuration supports WebSocket upgrades.

3. **CORS Headers:** Some games may require CORS headers. Add them if you encounter cross-origin issues.

4. **DNS Configuration:** 
   - For local use: Add `games-proxy.local` to your `/etc/hosts` file pointing to your Pi's IP
   - For remote use: Set up a DNS A record pointing to your Pi's public IP

5. **Firewall:** Ensure ports 80 and 443 are open on your Raspberry Pi.

## Testing

1. **Without Proxy:** Leave `PUBLIC_GAME_PROXY_URL` unset. Games should work with original URLs.

2. **With Proxy:** Set `PUBLIC_GAME_PROXY_URL` and rebuild. Game URLs should be transformed to use your proxy domain.

3. **Verify:** Check the browser's Network tab to confirm requests are going through your proxy.

## Troubleshooting

### Games Not Loading

- Verify the proxy is accessible: `curl https://games-proxy.local/proxy/www.crazygames.com/embed/2048`
- Check proxy logs for errors
- Ensure WebSocket support is enabled for real-time games

### CORS Errors

- Add CORS headers to your proxy configuration
- Some games may not work through a proxy due to strict origin policies

### SSL Certificate Issues

- Ensure your certificate is valid and not expired
- For local development, you may need to add a self-signed certificate exception

## Security Considerations

- The proxy bypasses network restrictions. Use responsibly and in accordance with your network's policies.
- Consider adding authentication to your proxy if it's publicly accessible.
- Monitor proxy usage to detect any abuse.
