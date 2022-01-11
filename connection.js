/**
 * Create MongoDB connection string.
 *
 * @returns {string}
 */
export function createMongodbConnectionString()
{
    return 'mongodb://' + process.env.MONGODB_USER + ':' + process.env.MONGODB_PASS + '@' + process.env.MONGODB_IP + ':' + process.env.MONGODB_PORT + '/' + process.env.MONGO_INITDB_DATABASE
}
