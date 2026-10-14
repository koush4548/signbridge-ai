const fs = require('fs');
const path = require('path');

const visited = new Set();
const queue = ['/src/main.tsx', '/src/index.css'];

async function crawl() {
  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    try {
      const res = await fetch('http://localhost:3000' + current);
      if (!res.ok) {
        continue;
      }
      const text = await res.text();

      // Check if sourceMappingURL exists
      const smMatch = text.match(/sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)/);
      let originalContent = null;
      if (smMatch) {
        try {
          const json = JSON.parse(Buffer.from(smMatch[1], 'base64').toString('utf8'));
          if (json.sourcesContent && json.sourcesContent[0]) {
            originalContent = json.sourcesContent[0];
          }
        } catch (e) {}
      }

      if (!originalContent) {
        originalContent = text;
      }

      // Save file
      const relativePath = current.startsWith('/') ? current.slice(1) : current;
      const filePath = path.join(process.cwd(), relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, originalContent, 'utf8');
      console.log('Saved:', relativePath, 'size:', originalContent.length);

      // Find imports
      const importRegex = /(?:import|export)\s+(?:[^"'\n]+\s+from\s+)?["']([^"']+)["']/g;
      let m;
      const scanText = originalContent + '\n' + text;
      while ((m = importRegex.exec(scanText)) !== null) {
        let imp = m[1];
        if (imp.startsWith('.')) {
          const dir = path.dirname(current);
          imp = path.posix.normalize(path.posix.join(dir, imp));
        } else if (imp.startsWith('@/')) {
          imp = '/' + imp.slice(2);
        } else if (imp.startsWith('/src/')) {
          // already absolute
        } else {
          continue; // node_module
        }

        const extensions = ['', '.tsx', '.ts', '.jsx', '.js', '.css'];
        for (const ext of extensions) {
          const candidate = imp.endsWith(ext) ? imp : imp + ext;
          if (!visited.has(candidate) && !queue.includes(candidate)) {
            queue.push(candidate);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching', current, err);
    }
  }
  console.log('Crawling complete! Total files restored:', visited.size);
}

crawl();
