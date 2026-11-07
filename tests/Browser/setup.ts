import { execFileSync } from 'node:child_process';
export default function setup() {
    execFileSync('php',['tests/Support/setup-browser.php'],{stdio:'inherit',env:{...process.env,APP_ENV:'testing',DB_CONNECTION:'pgsql',DB_DATABASE:'form_tech_e2e',DB_URL:''}});
}
