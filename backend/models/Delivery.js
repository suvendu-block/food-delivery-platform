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
      required: true,
    },
    status: {
      type: String,
      enum: ["assigned", "picked_up", "in_transit", "delivered", "failed"],
      default: "assigned",
    },
    pickupLocation: {
      street: String,
      city: String,
      state: String,
      zip: String,
      coordinates: {
        type: [Number], // [longitude, latitude] — GeoJSON order
        index: "2dsphere",
      },
    },
    dropoffLocation: {
      street: String,
      city: String,
      state: String,
      zip: String,
      coordinates: {
        type: [Number], // [longitude, latitude] — GeoJSON order
        index: "2dsphere",
      },
    },
    currentLocation: {
      type: [Number], // [longitude, latitude] — for real-time tracking
      index: "2dsphere",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    pickedUpAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    estimatedDelivery: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
deliverySchema.index({ driverId: 1, status: 1 });
deliverySchema.index({ orderId: 1 });
deliverySchema.index({ isAvailable: 1, currentLocation: "2dsphere" });

export default model("Delivery", deliverySchema);
