import { Schema, model } from 'mongoose';
/** Uploaded pictures live in MongoDB. `key` is the path below /uploads (e.g. "products/<uuid>.jpg"), so URLs stay /uploads/<key>. */
const schema = new Schema({ key: { type: String, required: true, unique: true }, contentType: { type: String, required: true }, data: { type: Buffer, required: true }, size: Number }, { timestamps: { createdAt: true, updatedAt: false } });
export const ImageModel = model('StoredImage', schema);
