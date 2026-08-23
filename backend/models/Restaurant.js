import mongoose, { model, Schema } from "mongoose";

const restaurantSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    cuisine: {
      type: [String],
      default: [],
    },
    phone: {
      type: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    menu: [
      {
        type: Schema.Types.ObjectId,
        ref: "Menu",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

restaurantSchema.index({ isOpen: 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ owner: 1 });

export default model("Restaurant", restaurantSchema);
