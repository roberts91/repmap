import playwright from 'playwright';
import { rename, rm, access } from 'fs';
import CSVToJSON from 'csvtojson';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { storeRepeater, formatRepeater, resolveGroup } from './Models/RepeaterModel.js';
import { shouldUpdate, registerUpdate } from './Models/UpdateLogModel.js';
import { createMongodbConnectionString } from './connection.js';

await dotenv.config();
await mongoose.connect(createMongodbConnectionString());
const filePath = process.cwd() + '/file.csv';
const downloadFile = process.env.DOWNLOAD_FILE === 'true';

const { page, browser } = await startBrowser();

const lastUpdated = await getLastUpdated();
if (!await shouldUpdate(lastUpdated)) {
    console.log('No updates available, aborting.');
    process.exit();
}

if (downloadFile) {
    await downloadFileUsingPlaywright();
} else {
    if (!await exists(filePath)) {
        console.log('File does not exist, aborting.');
        process.exit();
    }
}

await CSVToJSON().fromFile(filePath)
    .then(async repeaters => {
        for (const repeater of repeaters) {
            const formattedRepeater = await formatRepeater(repeater);
            if (formattedRepeater) {
                await storeRepeater(formattedRepeater);
            }
        }
        await registerUpdate(lastUpdated);
    }).catch(err => {
    // log error if any
    console.log(err);
});

if (downloadFile) {
    await rm(filePath, () => {});
}

/**
 * Start browser and navigate to desired URL.
 *
 * @returns {Promise<Page>}
 */
async function startBrowser()
{
    const browser = await playwright.chromium.launch();
    const context = await browser.newContext({
        acceptDownloads: true,
        headless: false,
    });
    const page = await context.newPage();
    await page.goto(process.env.NRRL_LIST_URL);
    return { page, browser };
}

/**
 * Get the last update-value for the repeater-list.
 *
 * @returns {Promise<string|boolean>}
 */
async function getLastUpdated()
{
    const dateModifiedMetaElement = await page.$('meta[property="dateModified"]');
    const dateModifiedValue = await dateModifiedMetaElement.getAttribute('content');
    if (dateModifiedValue) {
        return dateModifiedValue;
    }

    const article = await page.innerText('article');
    const regex = new RegExp('Listen er oppdatert: ([0-9]{1,2})(\\.|)( |)([0-9a-zA-Z]*)(\\.|)( |)([0-9]{2,4})(\\.|)', 'i');
    const matches = article.match(regex);
    if (matches  && matches.length > 6) {
        return matches[1] + '-' + matches[4] + '-' + matches[7];
    }
    return false;
}

/**
 * Download file using Playwright and move it to the working folder.
 *
 * @returns {Promise<void>}
 */
async function downloadFileUsingPlaywright()
{

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
