import {Group} from "../DatabaseSchema/Group.js";

/**
 * Get groups.
 *
 * @returns {Promise<Query<Array<HydratedDocument<any, {}, {}>>, any, {}, any>>}
 */
export async function getGroups()
{
    return Group.find({});
}

/**
 * Get group by Id.
 *
 * @param id
 * @returns {Promise<Query<any, any, {}, any>>}
 */
export async function getGroup(id)
{
    return Group.findById(id);
}
