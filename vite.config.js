import { defineConfig } from 'vite';
import { execSync } from 'child_process';

const commitDate = execSync('git log -1 --format="%cd" --date=format:"%b %d, %Y %H:%M"').toString().trim();
const commitSubject = execSync('git log -1 --format="%s"').toString().trim();
export default defineConfig({
    define: {
        __COMMIT_DATE__: JSON.stringify(commitDate),
        __COMMIT_SUBJECT__: JSON.stringify(commitSubject),
    },
});
