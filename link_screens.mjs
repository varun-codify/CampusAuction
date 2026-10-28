import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mapping = {
  'discover': '02-discover-marketplace.html',
  'browse-auctions': '01-live-auction-hero-sprint-bicycle.html',
  'my-bids': '04-my-bids.html',
  'my-watchlist': '05-my-watchlist.html',
  'saved-searches': '06-saved-searches.html',
  'ai-assistant': '07-ai-assistant.html',
  'my-listings': '09-my-listings.html',
  'seller-decisions': '08-seller-decisions.html',
  'questions-and-answers': '10-questions-and-answers.html',
  'notifications': '11-notifications.html',
  'profile-and-trust': '12-profile-and-trust.html',
  'admin-moderation': '13-admin-moderation.html',
  'list-item': '15-create-auction-listing.html'
};

const screensDir = path.join(__dirname, 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.html'));

let totalChanges = 0;

for (const file of files) {
  const filePath = path.join(screensDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let fileUpdated = false;

  for (const [key, target] of Object.entries(mapping)) {
    // Replace any href="#" on links with data-path="key"
    const pattern1 = new RegExp(`(<a[^>]*data-path="${key}"[^>]*href=")#(")`, 'gi');
    const pattern2 = new RegExp(`(<a[^>]*href=")#("[^>]*data-path="${key}")`, 'gi');
    
    if (pattern1.test(content)) {
      content = content.replace(pattern1, `$1${target}$2`);
      fileUpdated = true;
    }
    if (pattern2.test(content)) {
      content = content.replace(pattern2, `$1${target}$2`);
      fileUpdated = true;
    }
  }

  // Also wire cards in discover page that link to auction details or bid confirmation
  if (file === '02-discover-marketplace.html') {
    // link hero cycle card to 01-live-auction-hero-sprint-bicycle.html
    content = content.replace(/href="#" class="([^"]*hover:shadow[^"]*)"/g, 'href="01-live-auction-hero-sprint-bicycle.html" class="$1"');
  }

  if (fileUpdated) {
    fs.writeFileSync(filePath, content, 'utf-8');
    totalChanges++;
  }
}

console.log(`Successfully linked navigation in ${totalChanges} screen files!`);
