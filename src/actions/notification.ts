'use server';

import prisma from '@/config/prisma.config';
import { authOptions } from '@/lib/authOptions';
import { getServerSession } from 'next-auth';
import webpush from 'web-push';

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  'mailto:example@yourdomain.org',
  vapidKeys.publicKey as string,
  vapidKeys.privateKey as string
);

//Handling the db add logic for subscription

export async function AddUserSubscription(subscription: string) {
  try {
    const user = await getServerSession(authOptions);
    const userId = user?.user.id;

    if (!userId) throw new Error('User not loggedIn');

    const isUser = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!isUser) throw new Error('No user found');

    await prisma.notifications.create({
      data: {
        subscription: subscription,
        userId: isUser.id,
      },
    });

    return {
      status: 200,
      message: 'Subscription Added',
    };
  } catch (error) {
    return {
      status: 400,
      message: (error as Error).message,
    };
  }
}

//Handling the db remove logic for subscription

export async function DeleteUserSubscription() {
  try {
    const user = await getServerSession(authOptions);
    const userId = user?.user.id;

    if (!userId) throw new Error('User not loggedIn');

    const isUser = await prisma.notifications.findFirst({
      where: {
        userId: userId,
      },
      select: {
        id: true,
      },
    });

    if (!isUser) throw new Error('No user found');

    await prisma.notifications.deleteMany({
      where: {
        id: isUser.id,
      },
    });

    return {
      status: 200,
      message: 'Subscription Delete',
    };
  } catch (error) {
    return {
      status: 400,
      message: (error as Error).message,
    };
  }
}

//Handling the push notification

export async function sendNotificationAction() {
  try {
    const data = await prisma.notifications.findFirst({
      where: {
        userId: '1',
      },
    });

    if (!data) throw new Error('No user found');

    await webpush.sendNotification(
      JSON.parse(data.subscription),
      JSON.stringify({
        message: 'Ankit',
        // icon,
        body: 'hello form 100x devs',
      })
    );

    return {
      status: 200,
      message: 'Notification sent successfully',
    };
  } catch (error) {
    return {
      status: 400,
      message: (error as Error).message,
    };
  }
}
