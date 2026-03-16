import { defineConfig } from 'vite';
import { execSync } from 'child_process';

const commitDate = execSync('git log -1 --format="%cd" --date=format:"%b %d, %Y %H:%M"').toString().trim();
const commitSubject = execSync('git log -1 --format="%s"').toString().trim();
const recentCommits = execSync('git log -8 --format="%cd|||%s" --date=format:"%b %d, %Y %H:%M"')
    .toString().trim().split('\n')
    .map(line => { const [date, subject] = line.split('|||'); return { date, subject }; });

export default defineConfig({
    define: {
        __COMMIT_DATE__: JSON.stringify(commitDate),
        __COMMIT_SUBJECT__: JSON.stringify(commitSubject),
        __RECENT_COMMITS__: JSON.stringify(recentCommits),
    },
});
