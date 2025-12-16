var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, '__esModule', { value: true }), mod);

// ../lambda/account-workflow/notifier.ts
var notifier_exports = {};
__export(notifier_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(notifier_exports);
var import_client_sns = require('@aws-sdk/client-sns');
var TOPIC_ARN = process.env.SIGNUP_TOPIC_ARN;
var REGION_FROM_ARN = TOPIC_ARN ? TOPIC_ARN.split(':')[3] : void 0;
var sns = new import_client_sns.SNSClient({
  region:
    REGION_FROM_ARN || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-west-1',
});
var handler = async (event) => {
  if (!TOPIC_ARN) {
    console.warn('Signup topic ARN is not configured, skipping notification');
    return { delivered: false };
  }
  try {
    await sns.send(
      new import_client_sns.PublishCommand({
        TopicArn: TOPIC_ARN,
        Subject: `Account provisioning ${event.status}`,
        Message: JSON.stringify(
          {
            timestamp: /* @__PURE__ */ new Date().toISOString(),
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
    return { delivered: false, error: err.message };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    handler,
  });
