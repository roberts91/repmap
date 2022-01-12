import {UpdateLog} from '../DatabaseSchema/UpdateLog.js';

/**
 * Check if we should update based on the dateModified-property.
 *
 * @param dateModified
 * @returns {Promise<boolean>}
 */
export async function shouldUpdate(dateModified)
{
    return true;
    return await UpdateLog.findOne({ dateModified: dateModified }) === null;
}

/**
 * Flag that we did an update.
 *
 * @param dateModified
 * @returns {Promise<void>}
 */
export async function registerUpdate(dateModified)
{
    return await UpdateLog.create({
        dateModified: dateModified
    });
}
