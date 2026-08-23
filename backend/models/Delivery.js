import mongoose, { model, Schema } from "mongoose";

const deliverySchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "picked_up", "in_transit", "delivered"],
      default: "pending",
    },
    pickupLocation: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
    dropoffLocation: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
    currentLocation: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

deliverySchema.index({ "pickupLocation": "2dsphere" });
deliverySchema.index({ "dropoffLocation": "2dsphere" });
deliverySchema.index({ "currentLocation": "2dsphere" });

export default model("Delivery", deliverySchema);
