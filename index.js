import playwright from 'playwright';
import { rename, rm } from 'fs';
import CSVToJSON from 'csvtojson';
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { storeRepeater, formatRepeater } from './repeaterModel.js';

await dotenv.config()
await mongoose.connect(createMongodbConnectionString())

const browser = await playwright.chromium.launch();
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();
await page.goto(process.env.NRRL_LIST_URL);

// Load full list
await page.click('.dataTables_length .length_menu button.dropdown-toggle');
await page.click('.dataTables_length .length_menu .dropdown-menu ul.dropdown-menu li:last-child a');

await page.waitForTimeout(3000); // Give the page time to load properly

const [ download ] = await Promise.all([
    page.waitForEvent('download'),
    page.click('.DTTT_button_csv')
]);
const path = await download.path();
const newPath = process.cwd() + '/file.csv';
await rename(path, newPath, () => {});
await browser.close();

CSVToJSON().fromFile(newPath)
    .then(repeaters => {
        repeaters.map(async (repeater) => {
            await storeRepeater(formatRepeater(repeater));
        });
    }).catch(err => {
    // log error if any
    console.log(err);
});

await rm(newPath, () => {});

/**
 * Create MongoDB connection string.
 *
 * @returns {string}
 */
function createMongodbConnectionString()
{
    return 'mongodb://' + process.env.MONGODB_USER + ':' + process.env.MONGODB_PASS + '@' + process.env.MONGODB_IP + ':' + process.env.MONGODB_PORT + '/' + process.env.MONGO_INITDB_DATABASE
}
