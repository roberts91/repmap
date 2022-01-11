import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createMongodbConnectionString } from './connection.js';
import { getRepeaters, getRepeater } from './repeaterModel.js';
import path from 'path';
import assert from 'assert';
import { URL } from 'url'; // in Browser, the URL in native accessible on window

//const __filename = new URL('', import.meta.url).pathname;
const __dirname = new URL('.', import.meta.url).pathname;

await dotenv.config();
await mongoose.connect(createMongodbConnectionString());

const app = express();
const router = express.Router();
const bindings = [
    { param: 'repeater', handler: getRepeater }
];

function handleParam({ param, handler }) {
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

router.get('/api/repeaters/:repeater', function(req, res) {
    return res.status(200).json(req.repeater);
});

router.get('/api/repeaters/', async (req, res) => {
    return res.status(200).send(await getRepeaters());
});

router.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname + '/express/index.html'));
});

app.use('/', router);

app.listen(process.env.WEBSERVER_PORT);
