import mongoose, { model, Schema } from "mongoose";

const menuSchema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ["appetizer", "main", "drink", "dessert"],
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
    },
    prepTime: {
      type: Number,
      default: 20,
      min: 1,
    },
  },
  { timestamps: true }
);

menuSchema.index({ restaurantId: 1, isAvailable: 1 });

export default model("Menu", menuSchema);
