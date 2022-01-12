import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    name: { type : String, required: true, unique : true },
}, { timestamps: true });

groupSchema.methods.toJSON = function() {
    var obj = this.toObject();
    delete obj.__v;
    return obj;
}

export const Group = mongoose.model('Group', groupSchema)
