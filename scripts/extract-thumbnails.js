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
