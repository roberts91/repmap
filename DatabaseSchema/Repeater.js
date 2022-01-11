import mongoose from 'mongoose';

const repeaterSchema = new mongoose.Schema({
    callsign: { type : String , unique : true },
    qth: String,
    txFreq: String,
    rxFreq: String,
    group: String,
    locator: String,
    type: String,
    info: String,
    parsedInfo: String,
    metaData: {
        type: Object,
        required: false
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            default: [null, null],
        }
    }
}, { timestamps: true });

repeaterSchema.index({loc: '2dsphere'});

export const Repeater = mongoose.model('Repeater', repeaterSchema)
