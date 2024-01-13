import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { instance } from "../server.js";
import crypto from "crypto";




export const buySubscription = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user.role === "admin") {
    return next(new ErrorHandler("Admin cant buy subscription", 400));
  }

  const plan_id = process.env.PLAN_ID || "plan_MiW6rSZHoWrR2M";

  const subscription = await instance.subscriptions.create({
    plan_id: plan_id,
    customer_notify: 1,
    total_count: 12,
  });

  user.subscription.id = subscription.id;

  user.subscription.status = subscription.status;

  await user.save();
  res.status(201).json({
    success: true,
    subscriptionId: subscription.id,
  });
});




export const paymentVerification = catchAsyncErrors(async (req, res, next) => {
  const {
    razorpay_payment_id,
    // razorpay_order_id,
    razorpay_subscription_id,
    razorpay_signature,
  } = req.body;
  //order id or subscription id errro vid 17
  const user = await User.findById(req.user._id);

  const subscription_id = user.subscription.id;

  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
    .digest(hex);

  const isAuthentic = generated_signature === razorpay_signature;

  if (!isAuthentic) {
    return res.redirect(`${process.env.FRONTEND_URL}/paymentfail`);
  }
  //database

  await Payment.create({
    razorpay_payment_id,
    razorpay_signature,
    // razorpay_order_id,
    razorpay_subscription_id,
  });

  user.subscription.status = "active";
  await user.save();

  res.redirect(
    `${process.env.FRONTEND_URL}/paymentsuccess?=${razorpay_payment_id}`
  );
});




export const getRazorPayKey = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_API_KEY,
  });
});




export const cancelSubscription = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const subscriptionId = user.subscription.id;
  let refund = false;

  await instance.subscriptions.cancel(subscriptionId);
  const payment = await Payment.findOne({
    razorpay_subscription_id: subscriptionId,
  });

  const gap = Date.now() - payment.createdAt;

  const refundTime = process.env.REFUND_DAYS * 24 * 60 * 60 * 1000;

  if (refundTime > gap) {
    instance.payments.refund(payment.razorpay_payment_id);
    refund = true;
  }

  await payment.deleteOne();
  user.subscription.id=undefined;
  user.subscription.status=undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: refund
      ? "Subscription cancelled,money refunded"
      : "Subscription cancelled,money wont be refunded",
  });
});
