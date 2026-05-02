import mongoose from 'mongoose';
declare const connectDB: () => Promise<void>;
export default connectDB;
export declare const disconnectDB: () => Promise<void>;
export declare const getDB: () => mongoose.mongo.Db | undefined;
//# sourceMappingURL=database.d.ts.map