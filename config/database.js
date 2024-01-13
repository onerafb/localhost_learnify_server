import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect(process.env.MONGO_URI, {
      dbName: "Learnify",
    })
    .then((c) => console.log(`mongo connected`))
    .catch((e) => console.log(e));
};
