import {Repeater} from "./DatabaseSchema/Repeater.js";
import {decodeLatLonFromMaidenheadLocator, locatorIsValid} from "./maidenheadCalc.js";

/**
 * Store repeater.
 *
 * @param repeater
 * @returns {Promise<void>}
 */
export async function storeRepeater(repeater)
{
    try {
        const filter = { callsign: repeater.callsign };
        await Repeater.findOneAndUpdate(filter, repeater, {
            new: true,
            upsert: true,
        });
    } catch (e) {}
}

/**
 * Format repeater-object.
 *
 * @param repeater
 * @returns {{}}
 */
export function formatRepeater(repeater) {
    repeater = setRepeaterObjectKeys(repeater);
    if (locatorIsValid(repeater.locator)) {
        const location = decodeLatLonFromMaidenheadLocator(repeater.locator);
        repeater.location = {
            type: 'Point',
            coordinates: [location.lat, location.lon],
        };
    } else {
        repeater.locator = null;
    }
    return repeater;
}

/**
 * Set correct keys for repeater-object.
 *
 * @returns {{}}
 */
function setRepeaterObjectKeys(repeater)
{
    const keys = ['callsign', 'qth', 'txFreq', 'rxFreq', 'group', 'locator', 'type', 'info'];
    const values = Object.values(repeater);
    return keys.reduce((obj, key, index) => ({ ...obj, [key]: values[index] }), {});
}
