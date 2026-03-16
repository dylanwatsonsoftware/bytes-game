import { defineConfig } from 'vite';
import { execSync } from 'child_process';

const commitDate = execSync('git log -1 --format="%cd" --date=format:"%b %d, %Y"').toString().trim();

export default defineConfig({
    define: {
        __COMMIT_DATE__: JSON.stringify(commitDate),
    },
});
