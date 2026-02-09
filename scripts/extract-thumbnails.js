import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const gamesPath = join(__dirname, '../src/data/games.json');
const games = JSON.parse(readFileSync(gamesPath, 'utf-8'));

// Placeholder gaming icon for games without thumbnails
const PLACEHOLDER_GAMING_ICON = 'https://img.icons8.com/color/480/000000/game-controller.png';

async function extractThumbnail(url) {
  try {
    console.log(`Fetching thumbnail for: ${url}`);
    
    // Try to get the main page URL (not embed URL)
    let fetchUrl = url;
    
    // Convert embed URLs to regular URLs
    if (url.includes('/embed/')) {
      fetchUrl = url.replace('/embed/', '/');
    }
    
    // For some sites, we need to construct the proper URL
    if (url.includes('crazygames.com/embed/')) {
      const gameId = url.split('/embed/')[1];
      fetchUrl = `https://www.crazygames.com/game/${gameId}`;
    }
    
    // For flappybird.io, try the root
    if (url.includes('flappybird.io')) {
      fetchUrl = 'https://flappybird.io/';
      // Flappy Bird doesn't have og:image, try known thumbnail sources
      // After trying HTML extraction, we'll use a known good thumbnail URL
    }
    
    // For 247checkers, try the main page
    if (url.includes('247checkers.com')) {
      fetchUrl = 'https://www.247checkers.com/';
    }
    
    // For sudoku.com, try the main page
    if (url.includes('sudoku.com')) {
      fetchUrl = 'https://sudoku.com/';
    }
    
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`  Failed to fetch: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // Debug: Log first 500 chars of HTML to see structure
    console.log(`  HTML preview: ${html.substring(0, 500)}...`);
    
    // Extract Open Graph image
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    
    if (ogImageMatch && ogImageMatch[1]) {
      let thumbnail = ogImageMatch[1];
      // Decode HTML entities
      thumbnail = thumbnail.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
      // Make absolute URL if relative
      if (thumbnail.startsWith('//')) {
        thumbnail = 'https:' + thumbnail;
      } else if (thumbnail.startsWith('/')) {
        const urlObj = new URL(fetchUrl);
        thumbnail = urlObj.origin + thumbnail;
      }
      console.log(`  Found og:image: ${thumbnail}`);
      return thumbnail;
    }
    
    // Try to find images in <img> tags - look for larger images (screenshots, previews)
    const imgTagMatches = html.matchAll(/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))["'][^>]*>/gi);
    const excludedKeywords = ['icon', 'logo', 'favicon', 'close', 'button', 'arrow', 'menu', 'nav', 'header', 'footer', 'ad', 'banner', 'tournament', 'completed', 'winner', 'prize', 'leaderboard'];
    
    for (const match of imgTagMatches) {
      if (match[1]) {
        let thumbnail = match[1];
        thumbnail = thumbnail.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        
        // Filter out icons, logos, and small UI elements
        const lowerThumbnail = thumbnail.toLowerCase();
        const isExcluded = excludedKeywords.some(keyword => lowerThumbnail.includes(keyword));
        
        if (!isExcluded) {
          // Make absolute URL if relative
          if (thumbnail.startsWith('//')) {
            thumbnail = 'https:' + thumbnail;
          } else if (thumbnail.startsWith('/')) {
            const urlObj = new URL(fetchUrl);
            thumbnail = urlObj.origin + thumbnail;
          } else if (!thumbnail.startsWith('http')) {
            const urlObj = new URL(fetchUrl);
            thumbnail = urlObj.origin + '/' + thumbnail;
          }
          // Normalize URL (remove ./ and //)
          thumbnail = thumbnail.replace(/\/\.\//g, '/').replace(/([^:]\/)\/+/g, '$1');
          
          // Prefer images that look like screenshots/previews (common patterns)
          if (lowerThumbnail.includes('screenshot') || lowerThumbnail.includes('preview') || 
              lowerThumbnail.includes('cover') || lowerThumbnail.includes('thumb') ||
              lowerThumbnail.includes('game') || lowerThumbnail.includes('play')) {
            // Validate the URL before returning
            try {
              const testResponse = await fetch(thumbnail, { method: 'HEAD' });
              if (testResponse.ok) {
                console.log(`  Found validated game image: ${thumbnail}`);
                return thumbnail;
              } else {
                console.log(`  Image URL returned ${testResponse.status}, trying next...`);
              }
            } catch (e) {
              console.log(`  Image URL failed validation: ${e.message}`);
            }
          }
        }
      }
    }
    
    // If no preferred images found, try any non-excluded image
    for (const match of html.matchAll(/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))["'][^>]*>/gi)) {
      if (match[1]) {
        let thumbnail = match[1];
        thumbnail = thumbnail.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        
        const lowerThumbnail = thumbnail.toLowerCase();
        const isExcluded = excludedKeywords.some(keyword => lowerThumbnail.includes(keyword));
        
        if (!isExcluded) {
          if (thumbnail.startsWith('//')) {
            thumbnail = 'https:' + thumbnail;
          } else if (thumbnail.startsWith('/')) {
            const urlObj = new URL(fetchUrl);
            thumbnail = urlObj.origin + thumbnail;
          } else if (!thumbnail.startsWith('http')) {
            const urlObj = new URL(fetchUrl);
            thumbnail = urlObj.origin + '/' + thumbnail;
          }
          
          // Validate the URL before returning
          try {
            const testResponse = await fetch(thumbnail, { method: 'HEAD' });
            if (testResponse.ok) {
              console.log(`  Found validated img tag: ${thumbnail}`);
              return thumbnail;
            } else {
              console.log(`  Image URL returned ${testResponse.status}, trying next...`);
            }
          } catch (e) {
            console.log(`  Image URL failed validation: ${e.message}`);
          }
        }
      }
    }
    
    // Extract Twitter card image
    const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i) ||
                               html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/i);
    
    if (twitterImageMatch && twitterImageMatch[1]) {
      let thumbnail = twitterImageMatch[1];
      // Decode HTML entities
      thumbnail = thumbnail.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
      if (thumbnail.startsWith('//')) {
        thumbnail = 'https:' + thumbnail;
      } else if (thumbnail.startsWith('/')) {
        const urlObj = new URL(fetchUrl);
        thumbnail = urlObj.origin + thumbnail;
      }
      console.log(`  Found twitter:image: ${thumbnail}`);
      return thumbnail;
    }
    
    // Try to find any large image in meta tags
    const imageMatch = html.match(/<meta\s+name=["']image["']\s+content=["']([^"']+)["']/i) ||
                      html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']image["']/i);
    
    if (imageMatch && imageMatch[1]) {
      let thumbnail = imageMatch[1];
      // Decode HTML entities
      thumbnail = thumbnail.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
      if (thumbnail.startsWith('//')) {
        thumbnail = 'https:' + thumbnail;
      } else if (thumbnail.startsWith('/')) {
        const urlObj = new URL(fetchUrl);
        thumbnail = urlObj.origin + thumbnail;
      }
      console.log(`  Found image meta: ${thumbnail}`);
      return thumbnail;
    }
    
    // Try to find link rel="image_src"
    const linkImageMatch = html.match(/<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i) ||
                            html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']image_src["']/i);
    
    if (linkImageMatch && linkImageMatch[1]) {
      let thumbnail = linkImageMatch[1];
      thumbnail = thumbnail.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
      if (thumbnail.startsWith('//')) {
        thumbnail = 'https:' + thumbnail;
      } else if (thumbnail.startsWith('/')) {
        const urlObj = new URL(fetchUrl);
        thumbnail = urlObj.origin + thumbnail;
      }
      console.log(`  Found link image_src: ${thumbnail}`);
      return thumbnail;
    }
    
    // Try to find favicon or apple-touch-icon as fallback
    const faviconMatch = html.match(/<link\s+rel=["'](?:apple-touch-icon|icon)["']\s+href=["']([^"']+)["']/i) ||
                      html.match(/<link\s+href=["']([^"']+)["']\s+rel=["'](?:apple-touch-icon|icon)["']/i);
    
    if (faviconMatch && faviconMatch[1]) {
      let thumbnail = faviconMatch[1];
      thumbnail = thumbnail.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
      if (thumbnail.startsWith('//')) {
        thumbnail = 'https:' + thumbnail;
      } else if (thumbnail.startsWith('/')) {
        const urlObj = new URL(fetchUrl);
        thumbnail = urlObj.origin + thumbnail;
      }
      console.log(`  Found favicon/icon: ${thumbnail}`);
      return thumbnail;
    }
    
    // Special handling for specific games that don't have meta tags
    if (url.includes('flappybird.io')) {
      // Try to find actual game screenshots or proper Flappy Bird images
      // Look for images in the HTML that might be game-related
      const gameImageMatches = html.matchAll(/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))["'][^>]*>/gi);
      const excludedKeywords = ['icon', 'logo', 'favicon', 'close', 'button', 'arrow', 'menu', 'nav', 'header', 'footer', 'ad', 'banner'];
      
      // First, try to find game screenshots or bird-related images from the site
      for (const match of gameImageMatches) {
        if (match[1]) {
          let thumbnail = match[1];
          thumbnail = thumbnail.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
          
          const lowerThumbnail = thumbnail.toLowerCase();
          const isExcluded = excludedKeywords.some(keyword => lowerThumbnail.includes(keyword));
          
          // Look for bird, flappy, game, or screenshot keywords
          if (!isExcluded && (lowerThumbnail.includes('bird') || lowerThumbnail.includes('flappy') || 
              lowerThumbnail.includes('game') || lowerThumbnail.includes('screenshot'))) {
            if (thumbnail.startsWith('//')) {
              thumbnail = 'https:' + thumbnail;
            } else if (thumbnail.startsWith('/')) {
              const urlObj = new URL(fetchUrl);
              thumbnail = urlObj.origin + thumbnail;
            } else if (!thumbnail.startsWith('http')) {
              const urlObj = new URL(fetchUrl);
              thumbnail = urlObj.origin + '/' + thumbnail;
            }
            
            thumbnail = thumbnail.replace(/\/\.\//g, '/').replace(/([^:]\/)\/+/g, '$1');
            
            try {
              const testResponse = await fetch(thumbnail, { method: 'HEAD' });
              if (testResponse.ok) {
                const contentType = testResponse.headers.get('content-type') || '';
                if (contentType.startsWith('image/')) {
                  console.log(`  Found validated Flappy Bird image from site: ${thumbnail}`);
                  return thumbnail;
                }
              }
            } catch (e) {
              // Continue
            }
          }
        }
      }
      
      // Use the official Wikipedia Flappy Bird icon - this is the actual game icon
      const flappyThumbnail = 'https://upload.wikimedia.org/wikipedia/en/c/c5/Flappy_Bird_icon.png';
      
      try {
        const testResponse = await fetch(flappyThumbnail, { method: 'HEAD' });
        if (testResponse.ok) {
          const contentType = testResponse.headers.get('content-type') || '';
          if (contentType.startsWith('image/')) {
            console.log(`  Using Flappy Bird icon from Wikipedia: ${flappyThumbnail}`);
            return flappyThumbnail;
          }
        }
      } catch (e) {
        // Continue to fallback
      }
      
      // Fallback to Fandom wiki logo
      const fallbackUrl = 'https://static.wikia.nocookie.net/flappy-bird/images/4/40/Flappy_Bird_Logo.png/revision/latest/scale-to-width-down/1200?cb=20140205185747';
      try {
        const testResponse = await fetch(fallbackUrl, { method: 'HEAD' });
        if (testResponse.ok) {
          const contentType = testResponse.headers.get('content-type') || '';
          if (contentType.startsWith('image/')) {
            console.log(`  Using Flappy Bird logo from Fandom: ${fallbackUrl}`);
            return fallbackUrl;
          }
        }
      } catch (e) {
        // Continue
      }
      
      console.log(`  No working Flappy Bird thumbnail found`);
    }
    
    // Special handling for Sudoku - find game screenshot, not tournament image
    if (url.includes('sudoku.com')) {
      // Look for images that are actual game screenshots - exclude tournament images
      const sudokuImageMatches = html.matchAll(/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))["'][^>]*>/gi);
      const excludedKeywords = ['icon', 'logo', 'favicon', 'close', 'button', 'arrow', 'menu', 'nav', 'header', 'footer', 'ad', 'banner', 'tournament', 'completed', 'winner', 'prize', 'leaderboard'];
      
      // First pass: look for game-related images
      for (const match of sudokuImageMatches) {
        if (match[1]) {
          let thumbnail = match[1];
          thumbnail = thumbnail.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
          
          const lowerThumbnail = thumbnail.toLowerCase();
          const isExcluded = excludedKeywords.some(keyword => lowerThumbnail.includes(keyword));
          
          // Prefer images that look like game screenshots
          if (!isExcluded && (lowerThumbnail.includes('game') || lowerThumbnail.includes('play') || 
              lowerThumbnail.includes('screenshot') || lowerThumbnail.includes('board') ||
              lowerThumbnail.includes('grid') || lowerThumbnail.includes('puzzle') ||
              lowerThumbnail.includes('sudoku') && !lowerThumbnail.includes('tournament'))) {
            if (thumbnail.startsWith('//')) {
              thumbnail = 'https:' + thumbnail;
            } else if (thumbnail.startsWith('/')) {
              const urlObj = new URL(fetchUrl);
              thumbnail = urlObj.origin + thumbnail;
            } else if (!thumbnail.startsWith('http')) {
              const urlObj = new URL(fetchUrl);
              thumbnail = urlObj.origin + '/' + thumbnail;
            }
            
            // Normalize URL
            thumbnail = thumbnail.replace(/\/\.\//g, '/').replace(/([^:]\/)\/+/g, '$1');
            
            // Validate the URL
            try {
              const testResponse = await fetch(thumbnail, { method: 'HEAD' });
              if (testResponse.ok) {
                console.log(`  Found validated Sudoku game image: ${thumbnail}`);
                return thumbnail;
              }
            } catch (e) {
              // Continue to next
            }
          }
        }
      }
      
      // Fallback to known good Sudoku thumbnail sources
      const sudokuFallbacks = [
        'https://sudoku.com/img/img-game.png',
        'https://sudoku.com/img/game-screenshot.png',
        'https://www.pngmart.com/files/2/Sudoku-PNG-Image.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Sudoku_Puzzle_by_L2G-20050714_standardized_layout.svg/1200px-Sudoku_Puzzle_by_L2G-20050714_standardized_layout.svg.png'
      ];
      
      for (const thumbUrl of sudokuFallbacks) {
        try {
          const testResponse = await fetch(thumbUrl, { method: 'HEAD' });
          if (testResponse.ok) {
            console.log(`  Using validated Sudoku thumbnail: ${thumbUrl}`);
            return thumbUrl;
          }
        } catch (e) {
          // Continue to next URL
        }
      }
    }
    
    console.log(`  No thumbnail found - using placeholder gaming icon`);
    return PLACEHOLDER_GAMING_ICON;
  } catch (error) {
    console.log(`  Error: ${error.message} - using placeholder gaming icon`);
    return PLACEHOLDER_GAMING_ICON;
  }
}

async function main() {
  console.log('Extracting thumbnails from game URLs...\n');
  
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    console.log(`[${i + 1}/${games.length}] ${game.title}`);
    
    if (game.url) {
      const thumbnail = await extractThumbnail(game.url);
      if (thumbnail) {
        games[i].thumbnail = thumbnail;
      } else {
        // Fallback to placeholder if extractThumbnail returns null (shouldn't happen now, but just in case)
        games[i].thumbnail = PLACEHOLDER_GAMING_ICON;
      }
    }
    
    // Add a small delay to avoid overwhelming servers
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('');
  }
  
  // Write updated games.json
  writeFileSync(gamesPath, JSON.stringify(games, null, 2), 'utf-8');
  console.log('Updated games.json with thumbnails!');
}

main().catch(console.error);
