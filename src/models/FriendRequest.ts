import mongoose, { Schema, Document, Types } from 'mongoose';

export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';

export interface IFriendRequest extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  status: FriendRequestStatus;
  message?: string;
  createdAt: Date;
  respondedAt?: Date;
}

const FriendRequestSchema = new Schema<IFriendRequest>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED'],
      default: 'PENDING',
    },
    message: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    respondedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate requests
FriendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

// Index for looking up pending requests
FriendRequestSchema.index({ receiverId: 1, status: 1 });

export default mongoose.model<IFriendRequest>('FriendRequest', FriendRequestSchema);
