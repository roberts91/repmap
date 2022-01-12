import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { createMongodbConnectionString } from './connection.js';
import { getRepeaters, getRepeater } from './Models/RepeaterModel.js';
import { getMapData } from './MapData.js';
import { getGroups, getGroup } from './Models/GroupModel.js';
import path from 'path';
import assert from 'assert';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

await dotenv.config();
await mongoose.connect(createMongodbConnectionString());

const app = express();
const router = express.Router();
app.use(bodyParser.json());
const bindings = [
    { param: 'repeater', handler: getRepeater },
    { param: 'group', handler: getGroup },
];

function handleParam({ param, handler })
{
    assert(param, 'Binding mush have a param');
    assert(handler, 'Binding must have a handler');
    return function(req, res, next, id) {
        return handler(id)
            .then(model => {
                req[param] = model;
                next();
            })
            .catch(err => {
                next(err);
            });
    };
}

bindings.forEach(function(binding) {
    router.param(binding.param, handleParam(binding));
});

router.get('/api/groups/:group/repeaters', async function(req, res) {
    return res.status(200).send(await getRepeaters({
        group: req.group
    }));
});

router.get('/api/groups/:group', function(req, res) {
    return res.status(200).json(req.group);
});
router.get('/api/groups/', async (req, res) => {
    return res.status(200).send(await getGroups());
});

router.get('/api/repeaters/:repeater', function(req, res) {
    return res.status(200).json(req.repeater);
});
router.get('/api/repeaters/', async (req, res) => {
    return res.status(200).send(await getRepeaters());
});

router.post('/api/map-data/', async (req, res) => {
    return res.status(200).send(await getMapData(req.body));
});

// Display map
router.get('/*', async (req, res) => {
    res.sendFile(path.join(__dirname + '/views' + req._parsedUrl.path));
});

app.use('/', router);

app.listen(process.env.WEBSERVER_PORT, () => {
    console.log('Webserver running on http://localhost:' + process.env.WEBSERVER_PORT);
});
