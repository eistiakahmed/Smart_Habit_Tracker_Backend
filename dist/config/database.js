"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDB = exports.disconnectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const node_dns_1 = __importDefault(require("node:dns"));
node_dns_1.default.setServers(['8.8.8.8', '8.8.4.4']);
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/habit_tracker';
        await mongoose_1.default.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger_1.default.info('MongoDB connected successfully');
        mongoose_1.default.connection.on('error', (error) => {
            logger_1.default.error('MongoDB connection error:', error);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.default.info('MongoDB reconnected');
        });
    }
    catch (error) {
        logger_1.default.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};
exports.default = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.connection.close();
        logger_1.default.info('MongoDB connection closed');
    }
    catch (error) {
        logger_1.default.error('Error closing MongoDB connection:', error);
    }
};
exports.disconnectDB = disconnectDB;
const getDB = () => mongoose_1.default.connection.db;
exports.getDB = getDB;
//# sourceMappingURL=database.js.map