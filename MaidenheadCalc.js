/**
 * Decode latitude and longitude from Maidenhead locator string.
 *
 * @param locator
 * @returns {{lon: number, lat: number}}
 */
export function decodeLatLonFromMaidenheadLocator(locator)
{
    return {
        lat: parseFloat(decodeLatitudeFromMaidenheadLocator(locator)),
        lon: parseFloat(decodeLongitudeFromMaidenheadLocator(locator)),
    }
}

/**
 * Check if Maidenhead locator string is valid.
 *
 * @param locator
 * @returns {boolean}
 */
export function locatorIsValid(locator)
{
    const pattern = /^[a-z]{2}[0-9]{2}[a-z]{2}$/i;
    return pattern.test(locator);
}

/**
 * Decode latitude from Maidenhead locator string.
 *
 * @param locator
 * @returns {number}
 */
function decodeLatitudeFromMaidenheadLocator(locator)
{
    const secondChar = locator.substr(1, 1).charCodeAt(0);
    const secondCharResult = (secondChar - 65) * 10;
    const fourthChar = parseInt(locator.substr(3, 1));
    const sixthChar = locator.substr(5, 1).toLowerCase().charCodeAt(0);
    const sixthCharResult = (((sixthChar - 97) / 24) + (1 / 48)) - 90;
    return secondCharResult + fourthChar + sixthCharResult;
}

/**
 * Decode longitude from Maidenhead locator string.
 *
 * @param locator
 * @returns {number}
 */
function decodeLongitudeFromMaidenheadLocator(locator)
{
    const firstChar = locator.substr(0, 1).charCodeAt(0);
    const firstCharResult = (firstChar - 65) * 20;
    const thirdChar = parseInt(locator.substr(2, 1)) * 2;
    const fifthChar = locator.substr(4, 1).toLowerCase().charCodeAt(0);
    const fifthCharResult = (((fifthChar - 97) / 12) + (1 / 24));
    return (firstCharResult + thirdChar + fifthCharResult) - 180;
}
