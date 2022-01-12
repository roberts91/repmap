import mongoose from 'mongoose';

const updateLogSchema = new mongoose.Schema({
    dateModified: String,
}, { timestamps: true });

export const UpdateLog = mongoose.model('UpdateLog', updateLogSchema, 'update_logs')
