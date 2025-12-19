import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const TOPIC_ARN = process.env.SIGNUP_TOPIC_ARN;
const REGION_FROM_ARN = TOPIC_ARN ? TOPIC_ARN.split(':')[3] : undefined;

const sns = new SNSClient({
  region:
    REGION_FROM_ARN || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-west-1',
});

interface NotificationPayload {
  status: 'success' | 'failure';
  message: string;
  context?: any;
}

export const handler = async (event: NotificationPayload) => {
  if (!TOPIC_ARN) {
    console.warn('Signup topic ARN is not configured, skipping notification');
    return { delivered: false };
  }

  try {
    await sns.send(
      new PublishCommand({
        TopicArn: TOPIC_ARN,
        Subject: `Account provisioning ${event.status}`,
        Message: JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            ...event,
          },
          null,
          2
        ),
      })
    );
    return { delivered: true };
  } catch (err) {
    console.error('Failed to publish signup notification', err);
    return { delivered: false, error: (err as Error).message };
  }
};
