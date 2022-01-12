import {Repeater} from "./DatabaseSchema/Repeater.js";

/**
 * Get map data.
 * @returns {Promise<void>}
 */
export async function getMapData(args)
{
    try {
        const query = {};
        if (args.map_bounds) {
            const mb = args.map_bounds;
            query.location = {
                $geoWithin: {
                    $geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [mb.northEast.lon, mb.northEast.lat],
                            [mb.southWest.lon, mb.northEast.lat],
                            [mb.southWest.lon, mb.southWest.lat],
                            [mb.northEast.lon, mb.southWest.lat],
                            [mb.northEast.lon, mb.northEast.lat],
                        ]]
                    }
                }
            };
        }
        return Repeater.find(query).populate('group')
    } catch (e) {
        return false;
    }
    //Repeater.find({}, [fields], {'group': 'FIELD'}, function(err, logs) {});
}
