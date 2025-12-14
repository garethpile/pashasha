import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({});
const TOPIC_ARN = process.env.SIGNUP_TOPIC_ARN;

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
};
