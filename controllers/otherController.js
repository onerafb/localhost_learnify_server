import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { sendEmail } from "../utils/sendEmail.js";
import { Stats } from "../models/Stat.js";
import ErrorHandler from "../utils/errorHandler.js";

export const contact = catchAsyncErrors(async (req, res, next) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return next(new ErrorHandler("Please fill all fields", 400));

  const to = process.env.MY_MAIL;
  const subject = "Contact from Learnify";
  const text = `I am ${name} and my Email is ${email}. \n${message}`;
  await sendEmail(to, subject, text);
  res.status(200).json({
    success: true,
    message: "Your Message has been sent",
  });
});

export const courseRequest = catchAsyncErrors(async (req, res, next) => {
  const { name, email, course } = req.body;
  if (!name || !email || !course)
    return next(new ErrorHandler("Please fill all fields", 400));
  const to = process.env.MY_MAIL;
  const subject = "Request course from Learnify";
  const text = `I am ${name} and my Email is ${email}. \n${course}`;
  await sendEmail(to, subject, text);
  res.status(200).json({
    success: true,
    message: "Your Request has been sent",
  });
});

export const getDashboardStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(12);
  const statsData = [];

  for (let i = 0; i < stats.length; i++) {
    statsData.unshift(stats[i]);
  }

  const requiredSize = 12 - stats.length;

  for (let i = 0; i < requiredSize; i++) {
    statsData.unshift({
      users: 0,
      subscription: 0,
      views: 0,
    });
  }
  const usersCount = statsData[11].users;
  const subscriptioncount = statsData[11].subscription;
  const viewsCount = statsData[11].views;

  let usersProfit = true,
    viewsProfit = true,
    subscriptionProfit = true;

  let usersPercentage = 0,
    viewsPercentage = 0,
    subscriptionPercentage = 0;

  if (statsData[10].users === 0) usersPercentage = usersCount * 100;
  if (statsData[10].views === 0) viewsPercentage = viewsCount * 100;
  if (statsData[10].subscription === 0)
    subscriptionPercentage = subscriptioncount * 100;
  else {
    const difference = {
      users: statsData[11].users - statsData[10].users,
      views: statsData[11].views - statsData[10].views,
      subscription: statsData[11].subscription - statsData[10].subscription,
    };
    
    usersPercentage = (difference.users / statsData[10].users) * 100;
    viewsPercentage = (difference.views / statsData[10].views) * 100;
    subscriptionPercentage =
      (difference.subscription / statsData[10].subscription) * 100;

    if (usersPercentage < 0) usersProfit = false;
    if (viewsPercentage < 0) viewsProfit = false;
    if (subscriptionPercentage < 0) subscriptionProfit = false;
  }

  res.status(200).json({
    success: true,
    stats: statsData,
    usersCount,
    subscriptioncount,
    viewsCount,
    usersPercentage,
    viewsPercentage,
    subscriptionPercentage,
    usersProfit,
    viewsProfit,
    subscriptionProfit,
  });
});
