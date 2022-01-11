import playwright from 'playwright';
import { rename, rm, access } from 'fs';
import CSVToJSON from 'csvtojson';
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { storeRepeater, formatRepeater } from './repeaterModel.js';

await dotenv.config()
await mongoose.connect(createMongodbConnectionString())
const filePath = process.cwd() + '/file.csv';
const downloadFile = process.env.DOWNLOAD_FILE === 'true';

if (downloadFile) {
    await downloadFileUsingPlaywright();
} else {
    if (!await exists(filePath)) {
        throw Error ('File does not exist');
    }
}

CSVToJSON().fromFile(filePath)
    .then(repeaters => {
        repeaters.map(async (repeater) => {
            await storeRepeater(formatRepeater(repeater));
        });
    }).catch(err => {
    // log error if any
    console.log(err);
});

if (downloadFile) {
    await rm(filePath, () => {});
}

/**
 * Download file using Playwright and move it to the working folder.
 *
 * @returns {Promise<void>}
 */
async function downloadFileUsingPlaywright()
{
    const browser = await playwright.chromium.launch();
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    await page.goto(process.env.NRRL_LIST_URL);

    // Load full list
    await page.click('.dataTables_length .length_menu button.dropdown-toggle');
    await page.click('.dataTables_length .length_menu .dropdown-menu ul.dropdown-menu li:last-child a');

    // Give the page time to load properly
    await page.waitForTimeout(parseInt(process.env.WAIT_FOR_LIST_MS));

    const [ download ] = await Promise.all([
        page.waitForEvent('download'),
        page.click('.DTTT_button_csv')
    ]);
    const path = await download.path();
    await rename(path, filePath, () => {});
    await browser.close();
}

/**
 * Check if file exists.
 *
 * @param path
 * @returns {Promise<boolean>}
 */
async function exists (path) {
    try {
        await access(path);
        return true
    } catch {
        return false
    }
}

/**
 * Create MongoDB connection string.
 *
 * @returns {string}
 */
function createMongodbConnectionString()
{
    return 'mongodb://' + process.env.MONGODB_USER + ':' + process.env.MONGODB_PASS + '@' + process.env.MONGODB_IP + ':' + process.env.MONGODB_PORT + '/' + process.env.MONGO_INITDB_DATABASE
}
