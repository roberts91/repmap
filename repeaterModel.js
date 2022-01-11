import {Repeater} from "./DatabaseSchema/Repeater.js";
import {decodeLatLonFromMaidenheadLocator, locatorIsValid} from "./maidenheadCalc.js";

export async function getRepeaters()
{
    return Repeater.find({});
}

export async function getRepeater(id)
{
    return Repeater.findById(id);
}

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
    } catch (e) {
        console.log(e);
    }
}

/**
 * Return all CTCSS-options in array-form.
 *
 * @returns {string[]}
 */
function ctcssOptions()
{
    return '67.0,69.3,71.9,74.4,77.0,79.7,82.5,85.4,88.5,91.5,94.8,97.4,100.0,103.5,107.2,110.9,114.8,118.8,123.0,127.3,131.8,136.5,141.3,146.2,151.4,156.7,159.8,162.2,165.5,167.9,171.3,173.8,177.3,179.9,183.5,186.2,189.9,192.8,196.6,199.5,203.5,206.5,210.7,218.1,225.7,229.1,233.6,241.8,250.3,254.1'.split(',');
}

/**
 * Clean string for trailing/leading characters.
 *
 * @param string
 * @returns {*}
 */
function cleanString(string)
{
    string = string.trim();
    ['.', ',', '/', '?'].forEach(function (character, index) {
        string = trim(string, character);
    });
    return string.trim();
}

/**
 * Get array of Hz-values considered as 1750 sub tone.
 *
 * @returns {string[]}
 */
function toneBurst1750()
{
    return ['1750', '1850']; // Added typo
}

/**
 * Extract meta data from repeater.
 *
 * @param repeater
 * @returns {{}|boolean}
 */
function extractMetaData(repeater)
{

    if (typeof repeater.info != 'string') {
        return false;
    }
    let info = (repeater.info).trim();
    if (info == '') {
        return false;
    }
    const meta = {};
    let updatedInfoString = info;

    // Check for 1750Hz tone burst
    const toneBurst1750Matcher = new RegExp('(' + toneBurst1750().join('|') + ')', 'gim');
    if (toneBurst1750Matcher.test(info)) {
        updatedInfoString = cleanString(updatedInfoString.replace(toneBurst1750Matcher, ''));
        meta.toneBurst1750 = true;
    }

    // Check for CTCSS (sub-tone)
    const ctcssMatcher = new RegExp('(' + ctcssOptions().join('|') + ')', 'gim');
    if (ctcssMatcher.test(info)) {
        const ctcssMatches = info.match(ctcssMatcher);
        if (ctcssMatches[0]) {
            meta.ctcss = ctcssMatches[0];
            updatedInfoString = cleanString(updatedInfoString.replace(ctcssMatcher, ''));
        }
    }

    // Check for DMR ID's
    const dmrIdMatcherPattern = 'ID(:|)[ ]{0,}([0-9]{6})';
    const dmrIdMatcher = new RegExp(dmrIdMatcherPattern, 'gim');
    if (dmrIdMatcher.test(info)) {
        const dmrIdMatches = info.match(dmrIdMatcher);
        const dmrIdMatchArray = [];
        dmrIdMatches.forEach((dmrIdMatch) => {
            const dmrIdMatchSingle = (new RegExp(dmrIdMatcherPattern)).exec(dmrIdMatch);
            updatedInfoString = cleanString(updatedInfoString.replace(dmrIdMatchSingle[0], ''));
            dmrIdMatchArray.push(dmrIdMatchSingle[2]);
        });
        meta.dmrId = dmrIdMatchArray.join(',');
    }

    // Check for EchoLink-indicator
    const echoLinkRegexPattern = /(e|echo)(:|)[ ]{0,}([0-9]{6})/i;
    const echoLinkMatch = info.match(echoLinkRegexPattern);
    if (echoLinkMatch && echoLinkMatch[3]) {
        const echoLinkMatcher = new RegExp(echoLinkRegexPattern, 'gim');
        updatedInfoString = cleanString(updatedInfoString.replace(echoLinkMatcher, ''));
        meta.echoLink = echoLinkMatch[3];
    }

    // Check for CCIR-indicator
    const ccirMatcher = new RegExp('ccir', 'gim');
    if (ccirMatcher.test(info)) {
        updatedInfoString = cleanString(updatedInfoString.replace(ccirMatcher, ''));
        meta.ccir = true;
    }

    // Check for Winlink-indicator
    const winlinkMatcher = new RegExp('winlink', 'gim');
    if (winlinkMatcher.test(info)) {
        updatedInfoString = cleanString(updatedInfoString.replace(winlinkMatcher, ''));
        meta.winlink = true;
    }

    // Check for iGate-indication
    const igateMatcher = new RegExp('igate', 'gim');
    if (igateMatcher.test(info)) {
        updatedInfoString = cleanString(updatedInfoString.replace(igateMatcher, ''));
        meta.igate = true;
    }

    // Check for DTMF-values
    const dtmfMatcher = new RegExp('((\\*|\\#)([0-9a-z]{1,}))', 'gim');
    if (dtmfMatcher.test(info)) {
        const dtmfMatches = info.match(dtmfMatcher);
        updatedInfoString = cleanString(updatedInfoString.replace(dtmfMatcher, ''));
        if (dtmfMatches) {
            meta.dtmf = dtmfMatches;
        }
    }

    // Look for remaining dangling values, most likely DTMF-values
    const remaining = updatedInfoString.split('/');
    let stillRemaining = [];
    remaining.forEach((v) => {
        if (v.match(/^[0-9]{1}$/)) {
            if (!meta.dtmf) {
                meta.dtmf = [];
            }
            meta.dtmf.push(v);
        } else {
            stillRemaining.push(v);
        }
    });
    updatedInfoString = stillRemaining.join('/');

    return {
        metaDataObject: Object.keys(meta).length > 0 ? meta : false,
        parsedInfo: updatedInfoString,
    };
}

/**
 * Format repeater-object.
 *
 * @param repeater
 * @returns {{}}
 */
export function formatRepeater(repeater) {
    repeater = setRepeaterObjectKeys(repeater);
    repeater.originalInfo = repeater.info;
    const metaData = extractMetaData(repeater);
    if (metaData) {
        if (metaData.metaDataObject) {
            repeater.metaData = metaData.metaDataObject;
        }
        repeater.parsedInfo = metaData.parsedInfo;
    }
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

/**
 * Trim-function but it works just like PHP's trim-function.
 *
 * @param str
 * @param charlist
 * @returns {string|string}
 */
function trim (str, charlist) {
    let whitespace = [
        ' ',
        '\n',
        '\r',
        '\t',
        '\f',
        '\x0b',
        '\xa0',
        '\u2000',
        '\u2001',
        '\u2002',
        '\u2003',
        '\u2004',
        '\u2005',
        '\u2006',
        '\u2007',
        '\u2008',
        '\u2009',
        '\u200a',
        '\u200b',
        '\u2028',
        '\u2029',
        '\u3000'
    ].join('')
    let l = 0
    let i = 0
    str += ''
    if (charlist) {
        whitespace = (charlist + '').replace(/([[\]().?/*{}+$^:])/g, '$1')
    }
    l = str.length
    for (i = 0; i < l; i++) {
        if (whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(i)
            break
        }
    }
    l = str.length
    for (i = l - 1; i >= 0; i--) {
        if (whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(0, i + 1)
            break
        }
    }
    return whitespace.indexOf(str.charAt(0)) === -1 ? str : ''
}
